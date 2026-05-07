
import { useState, useEffect, useCallback } from "react";

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    Search, ShoppingCart, Trash2, Plus, Minus,
    ChevronLeft, ChevronRight, Tag, User,
    Banknote, CreditCard, Smartphone, CheckCircle,
    X, Package, RefreshCw
} from "lucide-react";

const BASE_URL = "http://localhost:8080/tirashop";
const PAGE_SIZE = 9;

const showToast = (msg, type = "info") => {

    toast[type]?.(msg) ?? toast(msg);

};

const PAYMENT_METHODS = [
    { key: "CASH", label: "Tiền mặt", Icon: Banknote },
    { key: "CARD", label: "Thẻ", Icon: CreditCard },
    { key: "TRANSFER", label: "Chuyển khoản", Icon: Smartphone },
];

const fmt = (price) => {
    if (!price && price !== 0) return "N/A";
    return Math.floor(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") + "₫";
};

const Stars = ({ rating = 0 }) => {
    const full = Math.floor(rating);
    const empty = 5 - full;
    return (
        <span style={{ fontSize: 10, letterSpacing: 0.5 }}>
            <span style={{ color: "#f59e0b" }}>{"★".repeat(full)}</span>
            <span style={{ color: "#374151" }}>{"★".repeat(empty)}</span>
        </span>
    );
};

function SuccessModal({ order, paymentLabel, onClose }) {
    return (
        <div style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.82)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            animation: "fadeIn 0.2s ease"
        }}>
            <div style={{
                background: "#0f1923",
                border: "1px solid #1e3a2f",
                borderRadius: 22, padding: "2.25rem 2rem", width: 440,
                textAlign: "center", animation: "slideUp 0.28s ease",
                boxShadow: "0 0 80px rgba(16,185,129,0.18)"
            }}>
                <div style={{
                    width: 76, height: 76, borderRadius: "50%",
                    background: "radial-gradient(circle, rgba(16,185,129,0.22) 0%, rgba(16,185,129,0.04) 100%)",
                    border: "1.5px solid rgba(16,185,129,0.35)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 1.5rem"
                }}>
                    <CheckCircle size={38} style={{ color: "#10b981" }} />
                </div>

                <h2 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, color: "#f0fdf4", letterSpacing: -0.5 }}>
                    Thanh toán thành công
                </h2>
                <p style={{ color: "#6b7280", fontSize: 13, margin: "0 0 1.75rem" }}>
                    Đơn hàng <span style={{ color: "#10b981", fontWeight: 700 }}>#{order.id}</span> đã được ghi nhận
                </p>

                <div style={{
                    background: "#070d14", borderRadius: 13, padding: "1rem 1.25rem",
                    marginBottom: "1.5rem", textAlign: "left",
                    border: "1px solid #1a2332"
                }}>
                    {[
                        ["Tổng tiền", fmt(order.totalPrice)],
                        ["Thanh toán", paymentLabel],
                        ["Trạng thái", "Hoàn tất ✓"],
                    ].map(([k, v], i) => (
                        <div key={k} style={{
                            display: "flex", justifyContent: "space-between", alignItems: "center",
                            padding: "8px 0",
                            borderBottom: i < 2 ? "1px solid #1a2332" : "none",
                            fontSize: 13
                        }}>
                            <span style={{ color: "#6b7280" }}>{k}</span>
                            <span style={{
                                color: k === "Tổng tiền" ? "#10b981" : k === "Trạng thái" ? "#34d399" : "#e5e7eb",
                                fontWeight: 700
                            }}>{v}</span>
                        </div>
                    ))}
                </div>

                <button onClick={onClose} style={{
                    width: "100%", padding: "13px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    color: "#fff", border: "none", borderRadius: 13,
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                    letterSpacing: 0.3, transition: "opacity 0.2s"
                }}>
                    Tạo đơn mới
                </button>
            </div>
        </div>
    );
}

function ProductCard({ product, onAdd, cartQty }) {
    const [hovered, setHovered] = useState(false);
    const outOfStock = product.inventory <= 0;
    const imgSrc = product.imageUrls?.[0]
        ? `http://localhost:8080${product.imageUrls[0]}`
        : null;
    const lowStock = !outOfStock && product.inventory <= 5;

    return (
        <div
            onClick={() => !outOfStock && onAdd(product)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                background: cartQty > 0 ? "#0d1f17" : "#0f1923",
                border: cartQty > 0
                    ? "1.5px solid #10b981"
                    : hovered ? "1px solid #2d3f4f" : "1px solid #1a2535",
                borderRadius: 14,
                overflow: "hidden",
                cursor: outOfStock ? "not-allowed" : "pointer",
                opacity: outOfStock ? 0.4 : 1,
                transform: hovered && !outOfStock ? "translateY(-3px) scale(1.01)" : "none",
                transition: "all 0.22s cubic-bezier(0.34, 1.56, 0.64, 1)",
                position: "relative",
                display: "flex", flexDirection: "column",
                boxShadow: cartQty > 0 ? "0 0 20px rgba(16,185,129,0.12)" : "none",
            }}
        >
            {cartQty > 0 && (
                <div style={{
                    position: "absolute", top: 8, right: 8, zIndex: 3,
                    background: "#10b981", color: "#fff",
                    borderRadius: "50%", width: 24, height: 24,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800,
                    boxShadow: "0 2px 10px rgba(16,185,129,0.5)"
                }}>
                    {cartQty}
                </div>
            )}

            {product.isBestSeller && (
                <div style={{
                    position: "absolute", top: 8, left: 8, zIndex: 3,
                    background: "#dc2626", color: "#fff",
                    fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                    padding: "2px 7px", borderRadius: 20, textTransform: "uppercase"
                }}>
                    Hot
                </div>
            )}

            <div style={{
                width: "100%", aspectRatio: "4/3",
                background: "linear-gradient(135deg, #0a1520 0%, #111f2e 100%)",
                overflow: "hidden", position: "relative"
            }}>
                {imgSrc ? (
                    <img
                        src={imgSrc} alt={product.name}
                        style={{
                            width: "100%", height: "100%", objectFit: "cover",
                            transform: hovered ? "scale(1.08)" : "scale(1)",
                            transition: "transform 0.4s ease"
                        }}
                    />
                ) : (
                    <div style={{
                        width: "100%", height: "100%",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <Package size={28} style={{ color: "#1e3a4a" }} />
                    </div>
                )}
                {outOfStock && (
                    <div style={{
                        position: "absolute", inset: 0,
                        background: "rgba(0,0,0,0.6)",
                        display: "flex", alignItems: "center", justifyContent: "center"
                    }}>
                        <span style={{
                            color: "#ef4444", fontSize: 11, fontWeight: 800,
                            letterSpacing: 1, textTransform: "uppercase",
                            border: "1px solid #ef4444", padding: "3px 10px", borderRadius: 4
                        }}>Hết hàng</span>
                    </div>
                )}
            </div>

            <div style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", minHeight: 18 }}>
                    {product.brandName && (
                        <span style={{
                            fontSize: 9, fontWeight: 700, color: "#6366f1",
                            background: "rgba(99,102,241,0.1)", padding: "1px 6px",
                            borderRadius: 20, letterSpacing: 0.3, textTransform: "uppercase"
                        }}>
                            {product.brandName}
                        </span>
                    )}
                    {product.size && (
                        <span style={{
                            fontSize: 9, color: "#4b6070",
                            background: "#0f1e2d", padding: "1px 6px", borderRadius: 20,
                        }}>
                            {product.size}
                        </span>
                    )}
                </div>

                <p style={{
                    margin: 0, fontSize: 12, fontWeight: 600, color: "#e2e8f0",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                    {product.name}
                </p>

                {product.averageRating > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Stars rating={product.averageRating} />
                        <span style={{ fontSize: 10, color: "#4b6070" }}>{product.averageRating.toFixed(1)}</span>
                    </div>
                )}

                <div style={{
                    display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginTop: "auto", paddingTop: 4
                }}>
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#10b981", letterSpacing: -0.3 }}>
                        {fmt(product.price)}
                    </span>
                    {!outOfStock && (
                        <span style={{
                            fontSize: 9, fontWeight: 600, padding: "2px 7px", borderRadius: 20,
                            background: lowStock ? "rgba(245,158,11,0.1)" : "rgba(30,58,74,0.5)",
                            color: lowStock ? "#f59e0b" : "#4b6070",
                            border: `1px solid ${lowStock ? "rgba(245,158,11,0.2)" : "transparent"}`
                        }}>
                            {lowStock ? `⚠ Còn ${product.inventory}` : `Còn ${product.inventory}`}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

function CartItem({ product, quantity, onInc, onDec, onRemove }) {
    const imgSrc = product.imageUrls?.[0]
        ? `http://localhost:8080${product.imageUrls[0]}`
        : null;

    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "#070d14", borderRadius: 11,
            padding: "9px 11px", border: "1px solid #1a2535",
        }}>
            <div style={{
                width: 46, height: 46, borderRadius: 9,
                background: "#0f1923", overflow: "hidden", flexShrink: 0,
                border: "1px solid #1a2535"
            }}>
                {imgSrc
                    ? <img src={imgSrc} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Package size={16} style={{ color: "#1e3a4a" }} />
                    </div>
                }
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                    margin: 0, fontSize: 12, fontWeight: 600, color: "#cbd5e1",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>
                    {product.name}
                </p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: "#10b981", fontWeight: 700 }}>
                    {fmt(product.price * quantity)}
                </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
                <button onClick={onDec} style={qBtn}><Minus size={10} /></button>
                <span style={{ fontSize: 13, fontWeight: 700, minWidth: 22, textAlign: "center", color: "#e2e8f0" }}>
                    {quantity}
                </span>
                <button onClick={onInc} style={qBtn}><Plus size={10} /></button>
                <button onClick={onRemove} style={{ ...qBtn, color: "#ef4444", marginLeft: 2, borderColor: "rgba(239,68,68,0.2)" }}>
                    <Trash2 size={10} />
                </button>
            </div>
        </div>
    );
}

const qBtn = {
    width: 26, height: 26, borderRadius: 7,
    border: "1px solid #1e3a4a", background: "#0f1923",
    cursor: "pointer", color: "#4b6070",
    display: "flex", alignItems: "center", justifyContent: "center",
    transition: "all 0.15s"
};

function Pagination({ currentPage, totalPages, onChange }) {
    if (totalPages <= 1) return null;
    const maxBtn = 5;
    let start = Math.max(0, currentPage - Math.floor(maxBtn / 2));
    let end = Math.min(totalPages - 1, start + maxBtn - 1);
    if (end - start + 1 < maxBtn) start = Math.max(0, end - maxBtn + 1);
    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);

    const base = {
        width: 32, height: 32, borderRadius: 8,
        border: "1px solid #1a2535", background: "#0f1923",
        color: "#4b6070", cursor: "pointer", fontSize: 12,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s"
    };

    return (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 5, paddingTop: "0.85rem" }}>
            <button onClick={() => onChange(currentPage - 1)} disabled={currentPage === 0}
                style={{ ...base, opacity: currentPage === 0 ? 0.3 : 1, cursor: currentPage === 0 ? "not-allowed" : "pointer" }}>
                <ChevronLeft size={14} />
            </button>

            {start > 0 && (
                <>
                    <button onClick={() => onChange(0)} style={base}>1</button>
                    {start > 1 && <span style={{ color: "#2d3f4f", fontSize: 12 }}>…</span>}
                </>
            )}

            {pages.map(i => (
                <button key={i} onClick={() => onChange(i)} style={
                    i === currentPage
                        ? { ...base, background: "#10b981", border: "1px solid #10b981", color: "#fff", fontWeight: 700 }
                        : base
                }>
                    {i + 1}
                </button>
            ))}

            {end < totalPages - 1 && (
                <>
                    {end < totalPages - 2 && <span style={{ color: "#2d3f4f", fontSize: 12 }}>…</span>}
                    <button onClick={() => onChange(totalPages - 1)} style={base}>{totalPages}</button>
                </>
            )}

            <button onClick={() => onChange(currentPage + 1)} disabled={currentPage === totalPages - 1}
                style={{ ...base, opacity: currentPage === totalPages - 1 ? 0.3 : 1, cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer" }}>
                <ChevronRight size={14} />
            </button>
        </div>
    );
}

export default function POSPage() {
    const [products, setProducts] = useState([]);
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [pageNo, setPageNo] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const [loading, setLoading] = useState(false);

    const [cart, setCart] = useState([]);
    const [customerName, setCustomerName] = useState("");
    const [voucherCode, setVoucherCode] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("CASH");
    const [loadingCheckout, setLoadingCheckout] = useState(false);
    const [successOrder, setSuccessOrder] = useState(null);

    const token = localStorage.getItem("token");
    const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
    };


    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                pageNo, elementPerPage: PAGE_SIZE,
                ...(search ? { name: search } : {}),
            });
            const res = await fetch(`${BASE_URL}/product?${params}`, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (json.status === "success") {
                setProducts(json.data.elementList || []);
                setTotalPages(json.data.totalPages || 0);
                setTotalElements(json.data.totalElements || 0);
            }
        } catch {
            showToast("Không tải được danh sách sản phẩm", "error");
        } finally {
            setLoading(false);
        }
    }, [pageNo, search]);

    useEffect(() => { fetchProducts(); }, [fetchProducts]);
    useEffect(() => { setPageNo(0); }, [search]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput.trim());
    };


    const addToCart = (product) => {
        if (product.inventory <= 0) { showToast("Sản phẩm hết hàng!", "warning"); return; }
        setCart(prev => {
            const ex = prev.find(i => i.product.id === product.id);
            if (ex) {
                if (ex.quantity >= product.inventory) { showToast("Không đủ hàng trong kho!", "warning"); return prev; }
                return prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
            }
            showToast(`Đã thêm "${product.name}"`, "success");
            return [...prev, { product, quantity: 1 }];
        });
    };

    const updateQty = (productId, delta) =>
        setCart(prev =>
            prev.map(i => i.product.id === productId ? { ...i, quantity: i.quantity + delta } : i)
                .filter(i => i.quantity > 0)
        );

    const removeItem = (id) => setCart(prev => prev.filter(i => i.product.id !== id));

    const cartTotal = cart.reduce((s, i) => s + i.product.price * i.quantity, 0);
    const cartCount = cart.reduce((s, i) => s + i.quantity, 0);


    const handleCheckout = async () => {
        if (!cart.length) { showToast("Giỏ hàng đang trống!", "error"); return; }
        if (!customerName.trim()) {
            showToast("Vui lòng nhập tên khách hàng!", "error");
            return;
        }
        setLoadingCheckout(true);
        try {
            const res = await fetch(`${BASE_URL}/pos/checkout`, {
                method: "POST", headers,
                body: JSON.stringify({
                    guestName: customerName.trim(),
                    customerUsername: null,
                    items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity })),
                    voucherCode: voucherCode.trim() || null,
                    paymentMethod,
                }),
            });

            const json = await res.json();
            if (!res.ok) {
                const msg = json?.message || json?.error || json?.data || "Lỗi thanh toán";
                showToast(msg, "error");
                return;
            }

            setSuccessOrder(json.data ?? json);
            fetchProducts();
        } catch {
            showToast("Lỗi kết nối server", "error");
        } finally {
            setLoadingCheckout(false);
        }
    };

    const handleCloseSuccess = () => {
        setSuccessOrder(null);
        setCart([]);
        setVoucherCode("");
        setCustomerName("");
    };

    const paymentLabel = PAYMENT_METHODS.find(m => m.key === paymentMethod)?.label ?? paymentMethod;


    const Skeleton = () => (
        <div style={{ background: "#0f1923", borderRadius: 14, overflow: "hidden", border: "1px solid #1a2535" }}>
            <div style={{ height: 140, background: "#070d14", animation: "pulse 1.6s ease-in-out infinite" }} />
            <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 8 }}>
                {[35, 75, 50].map((w, i) => (
                    <div key={i} style={{
                        height: i === 1 ? 12 : 9, width: `${w}%`,
                        background: "#1a2535", borderRadius: 4,
                        animation: "pulse 1.6s ease-in-out infinite",
                        animationDelay: `${i * 0.1}s`
                    }} />
                ))}
            </div>
        </div>
    );

    return (
        <div style={{
            display: "flex",
            width: "100vw",
            height: "100vh",
            overflow: "hidden",
            background: "#070d14",
            fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
            color: "#e2e8f0",
            boxSizing: "border-box",
            margin: 0,
            padding: 0,
        }}>
            {successOrder && (
                <SuccessModal order={successOrder} paymentLabel={paymentLabel} onClose={handleCloseSuccess} />
            )}
            <ToastContainer position="top-right" autoClose={2500}
                theme="dark" toastStyle={{ fontSize: 13 }} />


            <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
                padding: "1.25rem 0.85rem 1.25rem 1.25rem",
                minWidth: 0,
            }}>

                {/* Header */}
                <div style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", marginBottom: "0.9rem"
                }}>
                    <div>
                        <h1 style={{
                            margin: 0, fontSize: 19, fontWeight: 800, color: "#f0f9ff", letterSpacing: -0.5
                        }}>
                            Bán tại quầy
                        </h1>
                        <p style={{ margin: "2px 0 0", fontSize: 11, color: "#2d4a5a" }}>
                            {totalElements > 0 ? `${totalElements.toLocaleString()} sản phẩm` : "Đang tải..."}
                        </p>
                    </div>
                    <button
                        onClick={fetchProducts}
                        style={{
                            display: "flex", alignItems: "center", gap: 5, padding: "7px 13px",
                            borderRadius: 9, border: "1px solid #1a2535", background: "#0f1923",
                            color: "#4b6070", cursor: "pointer", fontSize: 11, fontWeight: 600,
                            transition: "all 0.15s"
                        }}
                    >
                        <RefreshCw size={12} style={{ color: "#4b6070" }} />
                        Làm mới
                    </button>
                </div>

                {/* Search */}
                <form onSubmit={handleSearch} style={{ display: "flex", gap: 8, marginBottom: "0.9rem" }}>
                    <div style={{
                        flex: 1, display: "flex", alignItems: "center", gap: 10,
                        background: "#0f1923", border: "1px solid #1a2535",
                        borderRadius: 10, padding: "9px 14px"
                    }}>
                        <Search size={14} style={{ color: "#2d4a5a", flexShrink: 0 }} />
                        <input
                            value={searchInput}
                            onChange={e => setSearchInput(e.target.value)}
                            placeholder="Tìm tên sản phẩm..."
                            style={{
                                border: "none", outline: "none", flex: 1,
                                fontSize: 13, background: "transparent", color: "#cbd5e1"
                            }}
                        />
                        {searchInput && (
                            <button type="button" onClick={() => { setSearchInput(""); setSearch(""); }}
                                style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                                <X size={12} style={{ color: "#2d4a5a" }} />
                            </button>
                        )}
                    </div>
                    <button type="submit" style={{
                        padding: "9px 20px", borderRadius: 10,
                        background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                        border: "none", color: "#fff",
                        fontWeight: 700, fontSize: 13, cursor: "pointer",
                        letterSpacing: 0.2
                    }}>
                        Tìm
                    </button>
                </form>

                {/* Grid */}
                <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
                    {loading ? (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                            {Array(9).fill(0).map((_, i) => <Skeleton key={i} />)}
                        </div>
                    ) : products.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "5rem 0" }}>
                            <Package size={42} style={{ color: "#1a2535", marginBottom: 12 }} />
                            <p style={{ fontSize: 13, color: "#2d4a5a", margin: 0 }}>Không tìm thấy sản phẩm</p>
                            {search && (
                                <button onClick={() => { setSearch(""); setSearchInput(""); }} style={{
                                    marginTop: 12, padding: "6px 16px", borderRadius: 8,
                                    border: "1px solid #1a2535", background: "transparent",
                                    color: "#4b6070", cursor: "pointer", fontSize: 12
                                }}>
                                    Xoá bộ lọc
                                </button>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem" }}>
                            {products.map(p => (
                                <ProductCard
                                    key={p.id} product={p} onAdd={addToCart}
                                    cartQty={cart.find(i => i.product.id === p.id)?.quantity || 0}
                                />
                            ))}
                        </div>
                    )}
                </div>

                <Pagination currentPage={pageNo} totalPages={totalPages} onChange={p => setPageNo(p)} />
            </div>

            <div style={{
                width: 360,
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                background: "#0a1118",
                borderLeft: "1px solid #1a2535",
                height: "100vh",
                overflow: "hidden",
            }}>

                {/* Panel Header */}
                <div style={{
                    padding: "1rem 1.25rem",
                    borderBottom: "1px solid #1a2535",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    flexShrink: 0
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 9,
                            background: "rgba(16,185,129,0.1)",
                            border: "1px solid rgba(16,185,129,0.22)",
                            display: "flex", alignItems: "center", justifyContent: "center"
                        }}>
                            <ShoppingCart size={15} style={{ color: "#10b981" }} />
                        </div>
                        <span style={{ fontWeight: 700, fontSize: 14, color: "#f0f9ff" }}>Đơn hàng</span>
                        {cartCount > 0 && (
                            <span style={{
                                background: "#10b981", color: "#fff", borderRadius: 999,
                                fontSize: 10, fontWeight: 800, padding: "1px 8px", letterSpacing: 0.3
                            }}>
                                {cartCount}
                            </span>
                        )}
                    </div>
                    {cart.length > 0 && (
                        <button onClick={() => setCart([])} style={{
                            border: "none", background: "none", cursor: "pointer",
                            fontSize: 11, color: "#ef4444",
                            display: "flex", alignItems: "center", gap: 3,
                            opacity: 0.75, transition: "opacity 0.15s"
                        }}>
                            <Trash2 size={11} /> Xoá tất cả
                        </button>
                    )}
                </div>

                {/* Cart list */}
                <div style={{ flex: 1, overflowY: "auto", padding: "0.85rem 1.1rem" }}>
                    {cart.length === 0 ? (
                        <div style={{ textAlign: "center", paddingTop: "4rem" }}>
                            <div style={{
                                width: 58, height: 58, borderRadius: "50%",
                                background: "#0f1923", border: "1px solid #1a2535",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                margin: "0 auto 1rem"
                            }}>
                                <ShoppingCart size={24} style={{ color: "#1e3a4a" }} />
                            </div>
                            <p style={{ fontSize: 13, margin: 0, color: "#2d4a5a", fontWeight: 600 }}>Chưa có sản phẩm</p>
                            <p style={{ fontSize: 11, margin: "5px 0 0", color: "#1e3a4a" }}>Bấm vào sản phẩm để thêm vào đơn</p>
                        </div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                            {cart.map(({ product, quantity }) => (
                                <CartItem
                                    key={product.id} product={product} quantity={quantity}
                                    onInc={() => updateQty(product.id, 1)}
                                    onDec={() => updateQty(product.id, -1)}
                                    onRemove={() => removeItem(product.id)}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* ─── Bottom Form ─── */}
                <div style={{
                    padding: "1rem 1.1rem",
                    borderTop: "1px solid #1a2535",
                    display: "flex", flexDirection: "column", gap: 10,
                    background: "#070d14",
                    flexShrink: 0
                }}>

                    {/* Section label */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 7
                    }}>
                        <div style={{
                            width: 3, height: 14, borderRadius: 2,
                            background: "linear-gradient(180deg, #10b981, #059669)"
                        }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#4b6070", letterSpacing: 0.5, textTransform: "uppercase" }}>
                            Khách hàng
                        </span>
                    </div>

                    {/* Customer name – required */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 9,
                        background: "#0f1923", borderRadius: 10,
                        padding: "10px 13px", border: "1px solid #1a2535",
                        transition: "border-color 0.2s"
                    }}>
                        <User size={14} style={{ color: "#2d4a5a", flexShrink: 0 }} />
                        <input
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="Tên khách hàng *"
                            style={{
                                border: "none", outline: "none", background: "transparent",
                                flex: 1, fontSize: 13, color: "#cbd5e1"
                            }}
                        />
                        {customerName && (
                            <button onClick={() => setCustomerName("")}
                                style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                                <X size={11} style={{ color: "#2d4a5a" }} />
                            </button>
                        )}
                    </div>

                    {/* Voucher */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: 9,
                        background: "#0f1923", borderRadius: 10,
                        padding: "10px 13px", border: "1px solid #1a2535",
                    }}>
                        <Tag size={14} style={{ color: "#2d4a5a", flexShrink: 0 }} />
                        <input
                            value={voucherCode}
                            onChange={e => setVoucherCode(e.target.value)}
                            placeholder="Mã voucher (tùy chọn)"
                            style={{
                                border: "none", outline: "none", background: "transparent",
                                flex: 1, fontSize: 13, color: "#cbd5e1"
                            }}
                        />
                        {voucherCode && (
                            <button onClick={() => setVoucherCode("")}
                                style={{ border: "none", background: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                                <X size={11} style={{ color: "#2d4a5a" }} />
                            </button>
                        )}
                    </div>

                    {/* Section label */}
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{
                            width: 3, height: 14, borderRadius: 2,
                            background: "linear-gradient(180deg, #6366f1, #4f46e5)"
                        }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#4b6070", letterSpacing: 0.5, textTransform: "uppercase" }}>
                            Phương thức thanh toán
                        </span>
                    </div>

                    {/* Payment method */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 7 }}>
                        {PAYMENT_METHODS.map(({ key, label, Icon }) => {
                            const active = paymentMethod === key;
                            return (
                                <button key={key} onClick={() => setPaymentMethod(key)} style={{
                                    display: "flex", flexDirection: "column", alignItems: "center",
                                    gap: 5, padding: "10px 4px",
                                    border: active ? "1px solid rgba(16,185,129,0.45)" : "1px solid #1a2535",
                                    borderRadius: 11,
                                    background: active ? "rgba(16,185,129,0.09)" : "#0f1923",
                                    cursor: "pointer", transition: "all 0.15s"
                                }}>
                                    <Icon size={16} style={{ color: active ? "#10b981" : "#2d4a5a" }} />
                                    <span style={{
                                        fontSize: 10, fontWeight: active ? 700 : 500,
                                        color: active ? "#10b981" : "#2d4a5a"
                                    }}>
                                        {label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Divider + Total */}
                    <div style={{ borderTop: "1px dashed #1a2535", paddingTop: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span style={{ fontSize: 12, color: "#4b6070", fontWeight: 600 }}>Tổng cộng</span>
                            <span style={{ fontSize: 24, fontWeight: 900, color: "#10b981", letterSpacing: -1 }}>
                                {fmt(cartTotal)}
                            </span>
                        </div>
                        {cart.length > 0 && (
                            <p style={{ margin: "3px 0 0", fontSize: 10, color: "#1e3a4a", textAlign: "right" }}>
                                {cart.length} loại · {cartCount} sản phẩm
                            </p>
                        )}
                    </div>

                    {/* Checkout button */}
                    <button
                        onClick={handleCheckout}
                        disabled={loadingCheckout || cart.length === 0}
                        style={{
                            width: "100%", padding: "14px",
                            background: cart.length === 0
                                ? "#0f1923"
                                : "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                            color: cart.length === 0 ? "#1e3a4a" : "#fff",
                            border: cart.length === 0 ? "1px solid #1a2535" : "none",
                            borderRadius: 13,
                            fontWeight: 800, fontSize: 14, letterSpacing: 0.4,
                            cursor: cart.length === 0 ? "not-allowed" : "pointer",
                            transition: "all 0.2s",
                            boxShadow: cart.length > 0 ? "0 4px 24px rgba(16,185,129,0.22)" : "none"
                        }}
                    >
                        {loadingCheckout ? (
                            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                                <span style={{
                                    width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)",
                                    borderTopColor: "#fff", borderRadius: "50%",
                                    animation: "spin 0.7s linear infinite", display: "inline-block"
                                }} />
                                Đang xử lý...
                            </span>
                        ) : "Thanh toán"}
                    </button>
                </div>
            </div>

            <style>{`
        * { box-sizing: border-box; }
        body, html { margin: 0; padding: 0; overflow: hidden; }
        @keyframes pulse {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.35 }
        }
        @keyframes fadeIn {
          from { opacity: 0 } to { opacity: 1 }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(24px) }
          to { opacity: 1; transform: translateY(0) }
        }
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
        ::-webkit-scrollbar { width: 3px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: #1a2535; border-radius: 4px }
        input::placeholder { color: #1e3a4a }
        button:hover { filter: brightness(1.08) }
        button:disabled:hover { filter: none }
      `}</style>
        </div>
    );
}