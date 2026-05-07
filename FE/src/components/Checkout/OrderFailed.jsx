import { useSearchParams, useNavigate } from "react-router-dom";

function OrderFailed() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#f8f9fa",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
    }}>
      <div style={{
        background: "white",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        padding: "60px 40px",
        maxWidth: "480px",
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{ fontSize: "64px", marginBottom: "24px" }}>❌</div>

        <h1 style={{ color: "#e34c4c", marginTop: "20px", fontSize: "26px", fontWeight: 700 }}>
          Thanh Toán Thất Bại
        </h1>

        <p style={{ color: "#666", fontSize: "16px", marginTop: "12px" }}>
          {orderId
            ? `Đơn hàng #${orderId} chưa được thanh toán.`
            : "Giao dịch không thành công."}
        </p>

        <p style={{ color: "#999", fontSize: "14px", marginTop: "8px", marginBottom: "36px" }}>
          Vui lòng thử lại hoặc chọn phương thức thanh toán khác.
        </p>

        <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
          <button
            onClick={() => navigate("/checkout")}
            style={{
              padding: "14px 28px",
              backgroundColor: "#e8192c",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Thử Lại
          </button>
          <button
            onClick={() => navigate("/products")}
            style={{
              padding: "14px 28px",
              backgroundColor: "#f5f5f5",
              color: "#555",
              border: "none",
              borderRadius: "8px",
              fontSize: "15px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Về Trang Chủ
          </button>
        </div>
      </div>
    </div>
  );
}

export default OrderFailed;