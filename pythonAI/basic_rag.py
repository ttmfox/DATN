import os
import hashlib
import time
import re
from collections import defaultdict
from datetime import datetime, timedelta
from difflib import SequenceMatcher

from openai import OpenAI
import requests
import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse, StreamingResponse
from urllib.parse import quote
import asyncio
from dotenv import load_dotenv

load_dotenv()

# ================== CONFIG ==================
OPENAI_API_KEY   = os.getenv("OPENAI_API_KEY", os.getenv("HF_TOKEN"))
OPENAI_BASE_URL  = os.getenv("OPENAI_BASE_URL")
BACKEND_URL      = os.getenv("BACKEND_URL")

AI_MODEL         = os.getenv("AI_MODEL")
ENABLE_STREAMING = os.getenv("ENABLE_STREAMING").lower() == "true"
ENABLE_CACHING   = os.getenv("ENABLE_CACHING").lower() == "true"
CACHE_TTL        = int(os.getenv("CACHE_TTL", "3600"))

# ================== CACHE ==================
RESPONSE_CACHE = {}
CACHE_STATS    = {"hits": 0, "misses": 0, "total": 0}

def normalize_text(text: str) -> str:
    text = text.lower().strip()
    text = " ".join(text.split())
    text = re.sub(r'[^\w\s]', '', text)
    return text

def get_cache_key(messages: list) -> str:
    relevant_msgs = messages[-2:] if len(messages) > 1 else messages
    normalized = [{"role": m["role"], "content": normalize_text(m.get("content", ""))} for m in relevant_msgs]
    content = json.dumps(normalized, sort_keys=True)
    return hashlib.md5(content.encode()).hexdigest()

def check_cache(cache_key: str):
    CACHE_STATS["total"] += 1
    if not ENABLE_CACHING:
        CACHE_STATS["misses"] += 1
        return None
    if cache_key in RESPONSE_CACHE:
        cached = RESPONSE_CACHE[cache_key]
        if time.time() - cached["timestamp"] < CACHE_TTL:
            CACHE_STATS["hits"] += 1
            print(f"⚡ CACHE HIT | Hit rate: {get_cache_hit_rate():.1f}%")
            return cached["response"]
    CACHE_STATS["misses"] += 1
    return None

def save_cache(cache_key: str, response: str):
    if ENABLE_CACHING:
        RESPONSE_CACHE[cache_key] = {"response": response, "timestamp": time.time()}
        if len(RESPONSE_CACHE) > 100:
            oldest = sorted(RESPONSE_CACHE.items(), key=lambda x: x[1]["timestamp"])[:20]
            for key, _ in oldest:
                del RESPONSE_CACHE[key]

def get_cache_hit_rate():
    if CACHE_STATS["total"] == 0:
        return 0
    return (CACHE_STATS["hits"] / CACHE_STATS["total"]) * 100

# ================== RATE LIMIT ==================
RATE_LIMIT   = defaultdict(list)
MAX_REQUESTS = 30
WINDOW       = 60

def check_rate_limit(ip: str) -> bool:
    now    = datetime.now()
    cutoff = now - timedelta(seconds=WINDOW)
    RATE_LIMIT[ip] = [t for t in RATE_LIMIT[ip] if t > cutoff]
    if len(RATE_LIMIT[ip]) >= MAX_REQUESTS:
        return False
    RATE_LIMIT[ip].append(now)
    return True

# ================== PRODUCT DATA ==================
PRODUCTS_LIST  = []
VOUCHERS_LIST  = []
CATEGORIES_LIST = []
BRANDS_LIST    = []
USER_PROFILES  = {}

def parse_date(date_str: str) -> datetime:
    if not date_str:
        return None
    try:
        return datetime.strptime(date_str, "%d-%m-%Y")
    except ValueError:
        try:
            if "T" in date_str:
                return datetime.fromisoformat(date_str.replace("Z", "+00:00"))
            return datetime.strptime(date_str, "%Y-%m-%d")
        except:
            return None

def analyze_new_products():
    current_date = datetime.now()
    new_products    = []
    recent_products = []
    for p in PRODUCTS_LIST:
        created_date = parse_date(p.get("createdAt", ""))
        if not created_date:
            continue
        days_ago = (current_date - created_date).days
        product_with_date = {**p, "days_ago": days_ago}
        if days_ago <= 10:
            new_products.append(product_with_date)
        recent_products.append(product_with_date)
    new_products.sort(key=lambda x: x["days_ago"])
    recent_products.sort(key=lambda x: x["days_ago"])
    return {
        "has_new": len(new_products) > 0,
        "new_products": new_products[:6],
        "recent_products": recent_products[:6],
        "count": len(new_products)
    }

def get_bestseller_products():
    bestsellers = [p for p in PRODUCTS_LIST if p.get("isBestSeller", False)]
    bestsellers.sort(key=lambda x: (x.get("averageRating", 0), x.get("inventory", 0)), reverse=True)
    return bestsellers[:6]

def search_products(query: str, limit: int = 5) -> list:
    query = query.lower().strip()
    if not query or len(query) < 2:
        return PRODUCTS_LIST[:limit]
    scored = []
    for p in PRODUCTS_LIST:
        score  = 0
        p_name = p["name"].lower()
        p_cat  = p.get("category", "").lower()
        p_text = f"{p_name} {p_cat}"
        if query == p_name:
            score += 100
        elif query in p_name:
            score += 50
        if query in p_cat:
            score += 30
        score += SequenceMatcher(None, query, p_name).ratio() * 20
        overlap = len(set(query.split()) & set(p_text.split()))
        score += overlap * 10
        if p.get("inventory", 0) > 0:
            score += 5
        if score > 0:
            scored.append((score, p))
    scored.sort(reverse=True, key=lambda x: x[0])
    return [p for _, p in scored[:limit]]

def find_product_by_name(product_name: str, threshold: float = 0.6):
    product_name = product_name.lower().strip()
    best_match = None
    best_score = 0
    for p in PRODUCTS_LIST:
        p_name = p["name"].lower()
        if p_name == product_name or product_name in p_name or p_name in product_name:
            return p["id"]
        ratio = SequenceMatcher(None, product_name, p_name).ratio()
        if ratio > best_score and ratio >= threshold:
            best_score = ratio
            best_match = p["id"]
    return best_match

def parse_vnd_price(price_str: str) -> int:
    try:
        return int(price_str.replace(" VND", "").replace(".", ""))
    except:
        return 0

def get_highest_price_product() -> dict:
    if not PRODUCTS_LIST:
        return None
    highest, highest_price = None, 0
    for p in PRODUCTS_LIST:
        price_int = parse_vnd_price(p.get("price", "0 VND"))
        if price_int > highest_price:
            highest_price = price_int
            highest = {**p, "price_int": price_int}
    return highest

def get_lowest_price_product() -> dict:
    if not PRODUCTS_LIST:
        return None
    lowest, lowest_price = None, float('inf')
    for p in PRODUCTS_LIST:
        price_int = parse_vnd_price(p.get("price", "0 VND"))
        if 0 < price_int < lowest_price:
            lowest_price = price_int
            lowest = {**p, "price_int": price_int}
    return lowest

def get_products_by_price_filter(threshold: int, filter_type: str, limit: int = 3) -> list:
    filtered = []
    for p in PRODUCTS_LIST:
        if p.get("inventory", 0) == 0:
            continue
        price_int = parse_vnd_price(p.get("price", "0 VND"))
        if price_int <= 0:
            continue
        if filter_type == "under" and price_int < threshold:
            filtered.append((price_int, p))
        elif filter_type == "over" and price_int > threshold:
            filtered.append((price_int, p))
    filtered.sort(reverse=(filter_type == "under"), key=lambda x: x[0])
    return [p for _, p in filtered[:limit]]

def detect_price_filter_intent(text: str) -> dict | None:
    text_lower = text.lower().strip()

    under_keywords = ["dưới", "under", "below", "less than", "cheaper than", "không quá", "tối đa", "max", "rẻ hơn"]
    over_keywords  = ["trên", "over", "above", "more than", "greater than", "tối thiểu", "min", "đắt hơn", "từ"]

    filter_type = None
    for kw in under_keywords:
        if kw in text_lower:
            filter_type = "under"
            break
    if not filter_type:
        for kw in over_keywords:
            if kw in text_lower:
                filter_type = "over"
                break
    if not filter_type:
        return None

    tr_match = re.search(r'(\d+(?:[.,]\d+)?)\s*tr(?:iệu)?(?:\s*(\d+)k?)?', text_lower)
    if tr_match:
        main  = float(tr_match.group(1).replace(',', '.'))
        extra = int(tr_match.group(2)) * 1000 if tr_match.group(2) else 0
        return {"type": filter_type, "threshold": int(main * 1_000_000) + extra}

    k_match = re.search(r'(\d+(?:[.,]\d+)?)\s*k\b', text_lower)
    if k_match:
        return {"type": filter_type, "threshold": int(float(k_match.group(1).replace(',', '.')) * 1000)}

    num_match = re.search(r'(\d{1,3}(?:[.,]\d{3})+|\d{5,})', text_lower)
    if num_match:
        return {"type": filter_type, "threshold": int(num_match.group(1).replace('.', '').replace(',', ''))}

    return None

# ================== USER PROFILE ==================
def detect_language(text: str) -> str:
    vietnamese_chars = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ"
    viet_keywords = [
        "sản phẩm", "giá", "mua", "bán", "áo", "quần", "giày", "mới", "cũ",
        "rẻ", "đắt", "tìm", "xem", "cho", "tôi", "mình", "gì", "nào", "thế",
        "như", "có", "không", "được", "là", "của", "trong", "với", "và",
        "voucher", "mã", "giảm", "khuyến mãi", "ưu đãi", "bán chạy",
        "tư vấn", "gợi ý", "phù hợp", "nam", "nữ", "cao", "nặng"
    ]
    text_lower = text.lower()
    viet_count = sum(1 for c in text_lower if c in vietnamese_chars)
    viet_kw    = sum(1 for kw in viet_keywords if kw in text_lower)
    return "vi" if viet_count > 0 or viet_kw >= 2 else "en"

def extract_user_info(text: str, current_profile: dict) -> dict:
    text_lower = text.lower()
    profile = current_profile.copy()
    if any(w in text_lower for w in ["nam", "male", "men", "boy", "trai"]):
        profile["gender"] = "male"
    elif any(w in text_lower for w in ["nữ", "female", "women", "girl", "gái"]):
        profile["gender"] = "female"
    h = re.search(r'(\d{2,3})\s*(?:cm|m)', text_lower)
    if h:
        val = int(h.group(1))
        if val > 10:
            profile["height"] = val
    w = re.search(r'(\d{2,3})\s*(?:kg|kí|ký)', text_lower)
    if w:
        val = int(w.group(1))
        if val > 20:
            profile["weight"] = val
    return profile

def is_consultation_request(text: str) -> bool:
    keywords = [
        "tư vấn", "gợi ý", "recommend", "suggest", "advice",
        "phù hợp", "suitable", "nên mua", "should buy",
        "chọn", "choose", "pick", "giúp tôi", "help me",
        "cho tôi", "for me", "dành cho", "for"
    ]
    return any(kw in text.lower() for kw in keywords)

def needs_more_info(profile: dict) -> dict:
    missing = [k for k in ("gender", "height", "weight") if not profile.get(k)]
    return {"needs_info": len(missing) > 0, "missing": missing}

def get_size_recommendation(height: int, weight: int, gender: str) -> str:
    if gender == "male":
        if height < 160: return "S" if weight < 55 else "M"
        elif height < 170: return "M" if weight < 65 else "L"
        elif height < 180: return "L" if weight < 75 else "XL"
        else: return "XL" if weight < 85 else "XXL"
    else:
        if height < 155: return "S" if weight < 45 else "M"
        elif height < 165: return "M" if weight < 55 else "L"
        else: return "L" if weight < 65 else "XL"

def recommend_products_by_profile(profile: dict, query: str = "", limit: int = 3) -> list:
    gender = profile.get("gender")
    height = profile.get("height", 0)
    weight = profile.get("weight", 0)
    recommended_size = get_size_recommendation(height, weight, gender) if height and weight else None
    scored = []
    for p in PRODUCTS_LIST:
        if p.get("inventory", 0) == 0:
            continue
        score  = 0
        p_name = p["name"].lower()
        p_cat  = p.get("category", "").lower()
        if gender == "male" and any(w in p_name or w in p_cat for w in ["nam", "men", "man"]):
            score += 30
        elif gender == "female" and any(w in p_name or w in p_cat for w in ["nữ", "women", "woman", "lady"]):
            score += 30
        if recommended_size and recommended_size.lower() in p.get("size", "").lower():
            score += 40
        if query:
            q_lower = query.lower()
            if q_lower in p_name or q_lower in p_cat:
                score += 50
            score += len(set(q_lower.split()) & set(f"{p_name} {p_cat}".split())) * 10
        if p.get("isBestSeller"):
            score += 15
        score += p.get("averageRating", 0) * 5
        if score > 0:
            scored.append((score, p))
    scored.sort(reverse=True, key=lambda x: x[0])
    return [p for _, p in scored[:limit]]

# ================== FETCH DATA ==================
def get_products():
    global PRODUCTS_LIST, CATEGORIES_LIST, BRANDS_LIST
    try:
        res = requests.get(f"{BACKEND_URL}/tirashop/product", timeout=15)
        res.raise_for_status()
        data = res.json()["data"]["elementList"]

        def fmt(price):
            return f"{int(price):,}".replace(",", ".") + " VND"

        products, categories, brands = [], set(), set()
        for p in data:
            img_url = f"{BACKEND_URL}/uploads/product/image/no-image.jpg"
            if p.get("imageUrls"):
                filename = p["imageUrls"][0].split("/")[-1]
                img_url  = f"{BACKEND_URL}/uploads/product/image/{quote(filename, safe='')}"
            category = p.get("categoryName", "")
            brand    = p.get("brand", "")
            if category: categories.add(category)
            if brand:    brands.add(brand)
            products.append({
                "id": p["id"], "name": p["name"].strip(), "image": img_url,
                "price": fmt(p["price"]), "size": p.get("size") or "Free size",
                "bestseller": p.get("isBestSeller", False), "category": category,
                "brand": brand, "inventory": p.get("inventory", 0),
                "status": p.get("status", "Available"), "createdAt": p.get("createdAt", ""),
                "averageRating": p.get("averageRating", 0), "isBestSeller": p.get("isBestSeller", False),
                "description": p.get("description", "")
            })
        PRODUCTS_LIST   = products
        CATEGORIES_LIST = sorted(categories)
        BRANDS_LIST     = sorted(brands)
        return len(products)
    except Exception as e:
        print(f"❌ Error fetching products: {e}")
        return 0

def get_vouchers():
    global VOUCHERS_LIST
    try:
        res = requests.get(f"{BACKEND_URL}/tirashop/voucher", timeout=15)
        res.raise_for_status()
        data = res.json()["data"]["elementList"]
        VOUCHERS_LIST = [{
            "id": v["id"], "code": v["code"], "discountType": v["discountType"],
            "discountValue": v["discountValue"], "startDate": v["startDate"],
            "endDate": v["endDate"], "status": v["status"]
        } for v in data]
        return len(VOUCHERS_LIST)
    except Exception as e:
        print(f"❌ Error fetching vouchers: {e}")
        return 0

def refresh_data():
    p = get_products()
    v = get_vouchers()
    RESPONSE_CACHE.clear()
    print(f"🔄 Refreshed | Products: {p} | Vouchers: {v} | Categories: {len(CATEGORIES_LIST)} | Brands: {len(BRANDS_LIST)}")

# ================== QUICK RESPONSES ==================
QUICK_RESPONSES = {
    "greetings": {
        "vi": "Chào bạn! Mình là TiraAI – trợ lý ảo của Tira Shop. Bạn cần tìm sản phẩm gì ạ? 😊",
        "en": "Hello! I'm TiraAI – Tira Shop's assistant. How can I help you? 😊"
    }
}

def get_quick_response(query: str):
    q = query.lower().strip()
    greetings    = ["xin chào", "chào", "hello", "hi", "hey"]
    request_words = ["mới", "new", "sản phẩm", "product", "tìm", "find", "voucher", "giá", "price", "tư vấn", "advice", "gợi ý", "recommend"]
    is_pure_greeting = any(q == g or q.startswith(g + " ") for g in greetings)
    has_request      = any(w in q for w in request_words)
    if is_pure_greeting and not has_request:
        is_vi = any(c in q for c in "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễđ") or "chào" in q
        return QUICK_RESPONSES["greetings"]["vi" if is_vi else "en"]
    return None

# ================== CART ==================
def detect_add_to_cart_intent(text: str):
    text_lower = text.lower().strip()
    patterns   = ["thêm vào giỏ", "thêm giỏ", "cho vào giỏ", "bỏ vào giỏ", "add to cart", "add cart", "mua", "đặt mua", "buy"]
    for pattern in patterns:
        if pattern in text_lower:
            parts        = text_lower.split(pattern)
            product_name = parts[1].strip().replace("sản phẩm", "").replace("product", "").strip() if len(parts) > 1 else ""
            if product_name:
                pid = find_product_by_name(product_name)
                if pid:
                    return pid
    return None

def check_stock_realtime(product_id: int):
    try:
        res = requests.get(f"{BACKEND_URL}/tirashop/product/{product_id}", timeout=10)
        if res.status_code == 200:
            data = res.json()
            if data.get("status") == "success":
                p = data.get("data", {})
                return {"id": p.get("id"), "name": p.get("name"), "inventory": p.get("inventory", 0), "available": p.get("inventory", 0) > 0}
    except:
        pass
    return None

def add_to_cart(product_id: int, token: str | None):
    if not token:
        return "🔐 Bạn cần đăng nhập để thêm vào giỏ hàng nhé!"
    stock = check_stock_realtime(product_id)
    if stock and stock["inventory"] == 0:
        return f"❌ Xin lỗi, sản phẩm '{stock['name']}' hiện đã hết hàng!"
    try:
        resp = requests.post(
            f"{BACKEND_URL}/tirashop/cart/add",
            json={"productId": product_id, "quantity": 1},
            headers={"Authorization": f"Bearer {token}"},
            timeout=10
        )
        if resp.status_code == 200:
            data = resp.json()
            return "✅ Đã thêm sản phẩm vào giỏ hàng thành công!" if data.get("status") == "success" else f"❌ {data.get('message', 'Không thể thêm vào giỏ hàng')}"
        return "❌ Không thể thêm vào giỏ hàng. Vui lòng thử lại!"
    except:
        return "❌ Có lỗi khi thêm vào giỏ. Vui lòng thử lại sau!"

# ================== SYSTEM PROMPT ==================
def build_system_prompt(query: str = "", user_profile: dict = None) -> str:
    current_date  = datetime.now().strftime("%Y-%m-%d")
    user_language = detect_language(query)
    q_lower       = query.lower()
    is_consultation = is_consultation_request(query)

    if is_consultation and user_profile:
        info_check = needs_more_info(user_profile)
        if info_check["needs_info"]:
            missing = info_check["missing"]
            if user_language == "vi":
                questions = []
                if "gender" in missing:  questions.append("bạn là nam hay nữ")
                if "height" in missing:  questions.append("chiều cao của bạn (cm)")
                if "weight" in missing:  questions.append("cân nặng của bạn (kg)")
                prompt = "Để tư vấn chính xác, mình cần biết thêm thông tin:\n"
                for i, q in enumerate(questions, 1):
                    prompt += f"\n{i}. {q.capitalize()}?"
                return prompt + "\n\nBạn vui lòng cho mình biết nhé! 😊"
            else:
                questions = []
                if "gender" in missing:  questions.append("your gender (male/female)")
                if "height" in missing:  questions.append("your height (cm)")
                if "weight" in missing:  questions.append("your weight (kg)")
                prompt = "To give you the best recommendations, I need to know:\n"
                for i, q in enumerate(questions, 1):
                    prompt += f"\n{i}. {q.capitalize()}"
                return prompt + "\n\nPlease share these details with me! 😊"

    is_voucher_query  = any(w in q_lower for w in ["voucher", "mã giảm giá", "mã khuyến mãi", "discount code", "promo code", "giảm giá", "ưu đãi", "khuyến mãi"])
    is_highest_price  = any(w in q_lower for w in ["giá cao nhất", "highest price", "most expensive", "đắt nhất", "giá đắt"])
    is_lowest_price   = any(w in q_lower for w in ["giá thấp nhất", "lowest price", "cheapest", "rẻ nhất", "giá rẻ"])
    is_bestseller     = any(w in q_lower for w in ["bán chạy", "bestseller", "best seller", "phổ biến", "popular", "nổi bật"])
    is_new_query      = any(w in q_lower for w in ["mới", "new", "latest", "recent", "hôm nay", "today"])
    price_filter      = detect_price_filter_intent(query)

    recommended_size = None
    if is_consultation and user_profile and not needs_more_info(user_profile)["needs_info"]:
        relevant_products = recommend_products_by_profile(user_profile, query, limit=3)
        context_hint      = f"CONSULTATION (Gender: {user_profile.get('gender')}, Height: {user_profile.get('height')}cm, Weight: {user_profile.get('weight')}kg)"
        recommended_size  = get_size_recommendation(user_profile.get("height", 0), user_profile.get("weight", 0), user_profile.get("gender", ""))
    elif is_highest_price:
        product           = get_highest_price_product()
        relevant_products = [product] if product else []
        context_hint      = "HIGHEST_PRICE_PRODUCT"
    elif is_lowest_price:
        product           = get_lowest_price_product()
        relevant_products = [product] if product else []
        context_hint      = "LOWEST_PRICE_PRODUCT"
    elif is_bestseller:
        relevant_products = get_bestseller_products()[:3]
        context_hint      = "BESTSELLERS"
    elif is_new_query:
        new_analysis      = analyze_new_products()
        relevant_products = new_analysis["new_products"][:3]
        context_hint      = f"NEW_PRODUCTS (last 10 days, total: {new_analysis['count']})"
    elif price_filter:
        threshold         = price_filter["threshold"]
        filter_type       = price_filter["type"]
        relevant_products = get_products_by_price_filter(threshold, filter_type, limit=3)
        fmt_threshold     = f"{threshold:,}".replace(",", ".") + " VND"
        direction         = "dưới" if filter_type == "under" else "trên"
        context_hint      = f"PRICE_FILTER ({direction} {fmt_threshold}, found: {len(relevant_products)})"
    else:
        relevant_products = search_products(query, limit=3) if query else PRODUCTS_LIST[:3]
        context_hint      = "SEARCH_RESULTS"

    products_compact = []
    for p in relevant_products:
        pd = {
            "id": p["id"], "name": p["name"], "price": p["price"],
            "size": p["size"], "stock": p["inventory"], "category": p["category"],
            "brand": p.get("brand", ""), "image": p["image"],
            "isBestSeller": p.get("isBestSeller", False), "rating": p.get("averageRating", 0)
        }
        if "days_ago" in p:
            pd["days_ago"] = p["days_ago"]
        products_compact.append(pd)

    vouchers_compact = [
        {"code": v["code"], "discount": f"{v['discountValue']}%", "endDate": v["endDate"]}
        for v in VOUCHERS_LIST if v.get("status") == "ACTIVE"
    ][:3]

    profile_info = ""
    if user_profile and not needs_more_info(user_profile)["needs_info"]:
        if user_language == "vi":
            profile_info = f"\n**THÔNG TIN KHÁCH HÀNG:**\n- Giới tính: {'Nam' if user_profile.get('gender') == 'male' else 'Nữ'}\n- Chiều cao: {user_profile.get('height')}cm\n- Cân nặng: {user_profile.get('weight')}kg\n- Size gợi ý: {recommended_size}\n"
        else:
            profile_info = f"\n**CUSTOMER PROFILE:**\n- Gender: {'Male' if user_profile.get('gender') == 'male' else 'Female'}\n- Height: {user_profile.get('height')}cm\n- Weight: {user_profile.get('weight')}kg\n- Recommended size: {recommended_size}\n"

    vi = user_language == "vi"
    return f"""You are TiraAI, Tira Shop's assistant. Date: {current_date}

**DETECTED USER LANGUAGE: {user_language.upper()}**
**CRITICAL LANGUAGE RULE:** Respond ONLY in {'VIETNAMESE' if vi else 'ENGLISH'}. NEVER mix languages.

{profile_info}
**CONSULTATION MODE:** {'ACTIVE' if is_consultation and user_profile and not needs_more_info(user_profile)["needs_info"] else 'INACTIVE'}

**SHOP DATA:** Categories: {', '.join(CATEGORIES_LIST[:5])} | Brands: {', '.join(BRANDS_LIST[:5])}

**PRODUCT DISPLAY FORMAT ({'Vietnamese' if vi else 'English'}):**
```
## {'Tên Sản Phẩm' if vi else 'Product Name'}

![name](full_image_url)

**{'Giá' if vi else 'Price'}:** X.XXX.XXX VND
**Size:** size_value
**{'Tồn kho' if vi else 'Stock'}:** X {'sản phẩm' if vi else 'items'}
**{'Thương hiệu' if vi else 'Brand'}:** brand_name
**{'Danh mục' if vi else 'Category'}:** category_name

🔥 **{'Sản phẩm bán chạy' if vi else 'Bestseller'}** (only if isBestSeller = true)
✨ **{'Phù hợp với bạn' if vi else 'Perfect for you'}** (only in consultation mode)

[{'Xem chi tiết' if vi else 'View Details'}](#product-ID)
[{'Thêm vào giỏ' if vi else 'Add to Cart'}](#add-to-cart-ID)

---
```

**RULES:** Max 3 products | Use `---` between products | Two links on separate lines | Format prices exactly as provided

**QUERY CONTEXT:** {context_hint}

**DATA:**
Products: {json.dumps(products_compact, ensure_ascii=False)}
Vouchers: {json.dumps(vouchers_compact, ensure_ascii=False)}"""

# ================== UTILS ==================
def clean_output(text: str) -> str:
    if not text:
        return ""
    text = text.strip()
    text = re.sub(r'^```[\w]*\n?', '', text)
    text = re.sub(r'\n?```$', '', text)
    return text.strip()

def get_client():
    return OpenAI(api_key=OPENAI_API_KEY, base_url=OPENAI_BASE_URL)

# ================== FASTAPI APP ==================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

refresh_data()

@app.on_event("startup")
async def startup_event():
    new_analysis = analyze_new_products()
    bestsellers  = get_bestseller_products()
    print("=" * 60)
    print("🚀 TIRA CHATBOT")
    print(f"🤖 Model: {AI_MODEL}")
    print(f"💾 Cache: {ENABLE_CACHING} | Streaming: {ENABLE_STREAMING}")
    print(f"📦 Products: {len(PRODUCTS_LIST)} | Vouchers: {len(VOUCHERS_LIST)}")
    print(f"🆕 New Products: {new_analysis['count']} | ⭐ Bestsellers: {len(bestsellers)}")
    print("=" * 60)

# ── Webhook: called by backend when product data changes ──────────────────────
@app.post("/webhook/product-update")
async def webhook_product_update(request: Request):
    try:
        body = await request.json()
        print(f"🔔 Webhook: {body.get('action')} product {body.get('productId')}")
        refresh_data()
        return {"status": "success", "products": len(PRODUCTS_LIST)}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# ── Manual refresh (admin use) ────────────────────────────────────────────────
@app.post("/refresh-data")
async def manual_refresh():
    refresh_data()
    return {"status": "success", "products": len(PRODUCTS_LIST), "vouchers": len(VOUCHERS_LIST)}

# ================== MAIN CHAT ENDPOINT ==================
@app.post("/chat")
async def chat(request: Request):
    start_time = time.time()

    client_ip = request.client.host
    if not check_rate_limit(client_ip):
        return PlainTextResponse("⚠️ Too many requests. Please wait.", status_code=429)

    try:
        body      = await request.json()
        messages  = body.get("messages", [])
        user_token = body.get("userToken")
        last_msg  = messages[-1]["content"].strip() if messages else ""

        # ADD_TO_CART command
        if last_msg.startswith("ADD_TO_CART|"):
            parts = last_msg.split("|")
            if len(parts) == 2:
                try:
                    result = add_to_cart(int(parts[1]), user_token)
                    print(f"🛒 Cart | {time.time() - start_time:.2f}s")
                    return PlainTextResponse(result)
                except ValueError:
                    return PlainTextResponse("❌ Invalid product")

        # Auto-detect add to cart intent
        cart_pid = detect_add_to_cart_intent(last_msg)
        if cart_pid:
            result = add_to_cart(cart_pid, user_token)
            print(f"🛒 Auto-cart | {time.time() - start_time:.2f}s")
            return PlainTextResponse(result)

        # Quick response (greetings etc.)
        quick_resp = get_quick_response(last_msg)
        if quick_resp:
            print(f"⚡ QUICK | {time.time() - start_time:.3f}s")
            return PlainTextResponse(quick_resp)

        # Cache check
        cache_key      = get_cache_key(messages)
        cached_response = check_cache(cache_key)
        if cached_response:
            print(f"💾 CACHED | {time.time() - start_time:.3f}s")
            return PlainTextResponse(cached_response)

        # Build prompt
        system_prompt = build_system_prompt(last_msg)
       
        ai_messages   = [{"role": "system", "content": system_prompt}] + [{"role": m["role"], "content": m["content"]} for m in messages]

        client = get_client()

        if ENABLE_STREAMING:
            resp = client.chat.completions.create(
                model=AI_MODEL, messages=ai_messages,
                temperature=0.5, max_tokens=2000, stream=True
            )

            async def generate():
                full_response = ""
                try:
                    for chunk in resp:
                        if not chunk.choices:
                            continue
                        delta = chunk.choices[0].delta
                        if hasattr(delta, 'content') and delta.content:
                            full_response += delta.content
                            yield delta.content
                    if full_response:
                        save_cache(cache_key, clean_output(full_response))
                    print(f"💬 STREAM | {time.time() - start_time:.2f}s | {len(full_response)} chars")
                except Exception as e:
                    print(f"❌ Stream error: {e}")
                    yield "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!"

            return StreamingResponse(generate(), media_type="text/plain")

        else:
            resp   = client.chat.completions.create(
                model=AI_MODEL, messages=ai_messages,
                temperature=0.5, max_tokens=2000, stream=False
            )
            result = clean_output(resp.choices[0].message.content) or "Xin lỗi, mình đang xử lý. Bạn thử lại nhé? 😊"

            if result.startswith("ADD_TO_CART|"):
                parts = result.split("|")
                if len(parts) == 2:
                    try:
                        result = add_to_cart(int(parts[1]), user_token)
                    except ValueError:
                        result = "❌ Không tìm thấy sản phẩm"

            save_cache(cache_key, result)
            print(f"💬 NORMAL | {time.time() - start_time:.2f}s")
            return PlainTextResponse(result)

    except Exception as e:
        print(f"❌ Error: {e}")
        return PlainTextResponse("Xin lỗi, có lỗi xảy ra!")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)