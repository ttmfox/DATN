
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";
import { useAppContext } from "../../context/AppContext";
import Footer from "../Footer/Footer";
import VoucherForm from "../Voucher/VoucherForm";
import vnpayLogo from "../../assets/images/vnpay.png";

function ConfirmModal({ paymentMethod, shippingMethod, total, onConfirm, onCancel, loading }) {
  const shippingLabel = shippingMethod === "express" ? "⚡ Hỏa Tốc" : "📦 Tiêu Chuẩn";
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(3px)",
    }}>
      <div style={{
        background: "white", borderRadius: "16px",
        padding: "40px 36px", maxWidth: "420px", width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
        textAlign: "center",
        animation: "slideUp 0.25s ease"
      }}>
        <div style={{ fontSize: "52px", marginBottom: "16px" }}>
          {paymentMethod === "vnpay" ? "💳" : "🚚"}
        </div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1a1a2e", marginBottom: "10px" }}>
          Xác Nhận Đặt Hàng
        </h2>
        <p style={{ color: "#666", fontSize: "13px", marginBottom: "6px" }}>
          Vận chuyển: <strong>{shippingLabel}</strong>
        </p>
        <p style={{ color: "#666", fontSize: "14px", marginBottom: "8px" }}>Tổng thanh toán:</p>
        <p style={{ fontSize: "24px", fontWeight: 700, color: "#2a41e8", marginBottom: "16px" }}>
          {total.toLocaleString("en-US")} VND
        </p>
        <p style={{
          background: paymentMethod === "vnpay" ? "rgba(232,25,44,0.07)" : "rgba(42,65,232,0.07)",
          borderRadius: "8px", padding: "10px 16px",
          fontSize: "13px", color: "#555", marginBottom: "28px"
        }}>
          {paymentMethod === "vnpay"
            ? "🔒 Bạn sẽ được chuyển đến cổng thanh toán VNPay an toàn"
            : "📦 Thanh toán khi nhận hàng (COD)"}
        </p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={onCancel} disabled={loading} style={{
            flex: 1, padding: "13px", borderRadius: "10px",
            border: "1.5px solid #ddd", background: "white",
            color: "#666", fontSize: "15px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer"
          }}>Hủy</button>
          <button onClick={onConfirm} disabled={loading} style={{
            flex: 1, padding: "13px", borderRadius: "10px", border: "none",
            background: paymentMethod === "vnpay"
              ? "linear-gradient(135deg, #e8192c, #ff4455)"
              : "linear-gradient(135deg, #2a41e8, #4a61ff)",
            color: "white", fontSize: "15px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1
          }}>
            {loading ? "Đang xử lý..." : "Xác Nhận"}
          </button>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function CheckoutPage() {
  const { cart, fetchCart, setCart } = useAppContext();
  const navigate = useNavigate();
  const [shippingAddress, setShippingAddress] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [shippingMethod, setShippingMethod] = useState("standard"); // ✅ mới
  const [step, setStep] = useState(1);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ✅ Data phương thức vận chuyển
  const shippingMethods = [
    {
      id: "standard",
      name: "Tiêu Chuẩn",
      desc: "Giao hàng 2 - 3 ngày",
      fee: 25000,
      icon: "📦",
      color: "#2a41e8",
    },
    {
      id: "express",
      name: "Hỏa Tốc",
      desc: "Giao hàng trong ngày",
      fee: 90000,
      icon: "⚡",
      color: "#e8192c",
    },
  ];

  const selectedShipping = shippingMethods.find((m) => m.id === shippingMethod);
  const shippingFee = selectedShipping ? selectedShipping.fee : 25000;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để tiếp tục thanh toán");
      navigate("/auth");
      return;
    }
    fetchCart();
  }, [navigate, fetchCart]);

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.productPrice || 0) * (item.quantity || 0), 0
  );
  const total = subtotal + shippingFee - voucherDiscount;

  const handleNextStep = () => {
    if (!phone) { toast.error("Vui lòng nhập số điện thoại"); return; }
    if (!phone.startsWith("0")) { toast.error("Số điện thoại phải bắt đầu bằng số 0"); return; }
    if (!email) { toast.error("Vui lòng nhập email"); return; }
    if (!email.endsWith(".com")) { toast.error("Email phải có đuôi .com"); return; }
    if (!shippingAddress.trim()) { toast.error("Vui lòng nhập địa chỉ giao hàng"); return; }
    setStep(2);
  };

  const handleClickOrder = (e) => {
    e.preventDefault();
    if (!paymentMethod) { toast.error("Vui lòng chọn phương thức thanh toán"); return; }
    setShowConfirmModal(true);
  };

  // ✅ Payload chung - có thêm shippingMethod
  const buildPayload = (method) => ({
    shippingAddress,
    phone,
    email,
    voucherCode: voucherCode || null,
    paymentMethod: method,
    shippingMethod, // "standard" hoặc "express"
  });

  const handleCODCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8080/tirashop/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildPayload("cod")),
      });
      const data = await response.json();
      if (data.status === "success") {
        toast.success("Đặt hàng thành công!");
        setCart([]);
        setShowConfirmModal(false);
        navigate("/order-success");
      } else {
        setError(data.message || "Thanh toán thất bại");
        toast.error(data.message || "Thanh toán thất bại");
        setShowConfirmModal(false);
      }
    } catch (err) {
      setError(err.message);
      toast.error("Thanh toán thất bại: " + err.message);
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleVNPayCheckout = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");

      const orderResponse = await fetch("http://localhost:8080/tirashop/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildPayload("vnpay")),
      });
      const orderData = await orderResponse.json();
      if (orderData.status !== "success") {
        throw new Error(orderData.message || "Tạo đơn hàng thất bại");
      }

      const orderId = orderData.data?.id || orderData.data?.orderId;
      if (!orderId) throw new Error("Không lấy được mã đơn hàng");

      const vnpayResponse = await fetch(
        `https://nondispersive-annamaria-baetylic.ngrok-free.dev/api/payment/vnpay/create/${orderId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            "ngrok-skip-browser-warning": "true",
          },
        }
      );
      const vnpayData = await vnpayResponse.json();
      if (!vnpayData.paymentUrl) throw new Error("Không nhận được link thanh toán");

      setCart([]);
      setShowConfirmModal(false);
      window.location.href = vnpayData.paymentUrl;

    } catch (err) {
      setError(err.message);
      toast.error("Lỗi VNPay: " + err.message);
      setShowConfirmModal(false);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (paymentMethod === "cod") handleCODCheckout();
    else if (paymentMethod === "vnpay") handleVNPayCheckout();
  };

  const paymentMethods = [
    { id: "cod", name: "Thanh Toán Khi Nhận Hàng (COD)", icon: "🚚" },
    { id: "vnpay", name: "Thanh Toán Qua VNPay", icon: "💳" },
  ];

  return (
    <div className={styles.checkoutPageWrapper}>
      {showConfirmModal && (
        <ConfirmModal
          paymentMethod={paymentMethod}
          shippingMethod={shippingMethod}
          total={total}
          onConfirm={handleConfirm}
          onCancel={() => !loading && setShowConfirmModal(false)}
          loading={loading}
        />
      )}

      <div className={styles.checkoutPage}>
        <div className={styles.checkoutHeader}>
          <h1>Thanh Toán</h1>
          <div className={styles.checkoutSteps}>
            <div className={`${styles.step} ${step >= 1 ? styles.active : ""}`}>
              <div className={styles.stepNumber}>1</div>
              <span>Thông tin vận chuyển</span>
            </div>
            <div className={styles.stepDivider}></div>
            <div className={`${styles.step} ${step >= 2 ? styles.active : ""}`}>
              <div className={styles.stepNumber}>2</div>
              <span>Phương thức thanh toán</span>
            </div>
          </div>
        </div>

        <div className={styles.checkoutContainer}>
          <div className={styles.checkoutContent}>

            {/* ── STEP 1: Thông tin + chọn phương thức ship ── */}
            {step === 1 && (
              <div className={styles.shippingStep}>
                <div className={styles.formSection}>
                  <h2>Địa Chỉ Vận Chuyển</h2>
                  <div className={styles.formGroup}>
                    <label htmlFor="fullname">Họ Tên</label>
                    <input type="text" id="fullname" placeholder="Họ và tên" className={styles.formInput} />
                  </div>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="phone">Số Điện Thoại</label>
                      <input type="tel" id="phone" placeholder="0xxxxxxxxx"
                        value={phone} onChange={(e) => setPhone(e.target.value)}
                        className={styles.formInput} />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="email">Email</label>
                      <input type="email" id="email" placeholder="example@gmail.com"
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        className={styles.formInput} />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="address">Địa Chỉ Chi Tiết</label>
                    <textarea id="address" value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      placeholder="Số nhà, số ngách, số ngõ, tên đường,..."
                      rows="3" className={styles.addressInput} />
                  </div>
                  <div className={styles.formGroup}>
                    <label htmlFor="note">Ghi Chú Đơn Hàng (không bắt buộc)</label>
                    <textarea id="note" placeholder="Ghi chú về đơn hàng của bạn..."
                      rows="2" className={styles.noteInput} />
                  </div>

                  {/* ✅ Chọn phương thức vận chuyển */}
                  <div className={styles.formGroup}>
                    <label>Phương Thức Vận Chuyển</label>
                    <div className={styles.shippingMethods}>
                      {shippingMethods.map((method) => (
                        <div
                          key={method.id}
                          className={`${styles.shippingMethodCard} ${shippingMethod === method.id ? styles.shippingSelected : ""}`}
                          onClick={() => setShippingMethod(method.id)}
                        >
                          <div className={styles.shippingRadio}>
                            <input
                              type="radio"
                              name="shippingMethod"
                              value={method.id}
                              checked={shippingMethod === method.id}
                              onChange={() => setShippingMethod(method.id)}
                            />
                            <span className={styles.shippingRadioMark}></span>
                          </div>
                          <span className={styles.shippingIcon}>{method.icon}</span>
                          <div className={styles.shippingInfo}>
                            <span className={styles.shippingName}>{method.name}</span>
                            <span className={styles.shippingDesc}>{method.desc}</span>
                          </div>
                          <span
                            className={styles.shippingFeeTag}
                            style={{
                              background: shippingMethod === method.id
                                ? method.color
                                : "#f0f0f0",
                              color: shippingMethod === method.id ? "white" : "#555",
                            }}
                          >
                            +{method.fee.toLocaleString("en-US")} VND
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className={styles.formActions}>
                  <button type="button" className={styles.backBtn} onClick={() => navigate("/cart")}>
                    Giỏ Hàng
                  </button>
                  <button type="button" className={styles.continueBtn} onClick={handleNextStep}>
                    Tiếp Tục
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP 2: Phương thức thanh toán ── */}
            {step === 2 && (
              <div className={styles.paymentStep}>
                <h2>Phương Thức Thanh Toán</h2>
                <div className={styles.paymentMethods}>
                  {paymentMethods.map((method) => (
                    <div key={method.id}
                      className={`${styles.paymentMethod} ${paymentMethod === method.id ? styles.selected : ""}`}
                      onClick={() => setPaymentMethod(method.id)}
                    >
                      <div className={styles.paymentMethodRadio}>
                        <input type="radio" id={method.id} name="paymentMethod"
                          value={method.id} checked={paymentMethod === method.id}
                          onChange={() => setPaymentMethod(method.id)} />
                        <span className={styles.radioCheckmark}></span>
                      </div>
                      <div className={styles.paymentMethodIcon}>
                        {method.id === "vnpay" ? (
                          <img src={vnpayLogo} alt="VNPay"
                            style={{ width: "40px", height: "40px", objectFit: "contain" }} />
                        ) : (
                          <span style={{ fontSize: "24px" }}>{method.icon}</span>
                        )}
                      </div>
                      <label htmlFor={method.id}>{method.name}</label>
                      {method.id === "vnpay" && (
                        <span className={styles.vnpayBadge}>Nhanh & Bảo mật</span>
                      )}
                    </div>
                  ))}
                </div>

                {paymentMethod === "vnpay" && (
                  <div className={styles.vnpayNote}>
                    <span>🔒</span>
                    <p>Bạn sẽ được chuyển hướng đến cổng thanh toán VNPay để hoàn tất giao dịch an toàn.</p>
                  </div>
                )}

                <div className={styles.voucherSection}>
                  <h3>Mã Giảm Giá</h3>
                  <VoucherForm subtotal={subtotal} setVoucherDiscount={setVoucherDiscount}
                    voucherCode={voucherCode} setVoucherCode={setVoucherCode}
                    setDiscountPercentage={setDiscountPercentage} />
                </div>

                {error && <p className={styles.errorMessage}>{error}</p>}

                <div className={styles.formActions}>
                  <button type="button" className={styles.backBtn} onClick={() => setStep(1)}>
                    Quay Lại
                  </button>
                  <button
                    type="button"
                    disabled={loading || !paymentMethod}
                    className={`${styles.placeOrderBtn} ${paymentMethod === "vnpay" ? styles.vnpayBtn : ""}`}
                    onClick={handleClickOrder}
                  >
                    {loading ? "Đang Xử Lý..." : paymentMethod === "vnpay" ? "💳 Thanh Toán VNPay" : "Đặt Hàng"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── ORDER SUMMARY ── */}
          <div className={styles.orderSummary}>
            <h2>Tóm Tắt Đơn Hàng</h2>
            <div className={styles.cartItems}>
              {cart.map((item) => (
                <div key={item.cartId} className={styles.cartItem}>
                  <div className={styles.itemImageContainer}>
                    <img src={item.productImage || "https://via.placeholder.com/60"}
                      alt={item.productName || "Sản phẩm"} className={styles.itemImage} />
                    <span className={styles.itemQuantity}>{item.quantity}</span>
                  </div>
                  <div className={styles.itemDetails}>
                    <h3>{item.productName || "Sản phẩm không xác định"}</h3>
                    <p className={styles.itemSize}>Kích thước: {item.size || "N/A"}</p>
                  </div>
                  <p className={styles.itemPrice}>
                    {(item.productPrice * item.quantity).toLocaleString("en-US")} VND
                  </p>
                </div>
              ))}
            </div>
            <div className={styles.divider}></div>
            <div className={styles.summaryDetails}>
              <div className={styles.summaryRow}>
                <span>Tổng phụ:</span>
                <span>{subtotal.toLocaleString("en-US")} VND</span>
              </div>

              {/* ✅ Phí ship động theo lựa chọn */}
              <div className={styles.summaryRow}>
                <span>
                  Phí Ship{" "}
                  <span style={{
                    fontSize: "11px",
                    background: shippingMethod === "express" ? "#e8192c" : "#2a41e8",
                    color: "white",
                    borderRadius: "4px",
                    padding: "1px 6px",
                    marginLeft: "4px",
                    fontWeight: 600,
                  }}>
                    {shippingMethod === "express" ? "⚡ Hỏa Tốc" : "📦 Tiêu Chuẩn"}
                  </span>
                </span>
                <span>+{shippingFee.toLocaleString("en-US")} VND</span>
              </div>

              {voucherDiscount > 0 && (
                <div className={styles.summaryRow}>
                  <span>
                    Mã Giảm Giá ({voucherCode}
                    {discountPercentage > 0 ? ` - ${discountPercentage}%` : ""}):
                  </span>
                  <span className={styles.discountValue}>
                    -{voucherDiscount.toLocaleString("en-US")} VND
                  </span>
                </div>
              )}
              <div className={styles.divider}></div>
              <div className={`${styles.summaryRow} ${styles.totalRow}`}>
                <span>Tổng:</span>
                <span className={styles.totalAmount}>{total.toLocaleString("en-US")} VND</span>
              </div>
              <div className={styles.taxNote}><p>Đã bao gồm VAT (nếu có)</p></div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default CheckoutPage;

