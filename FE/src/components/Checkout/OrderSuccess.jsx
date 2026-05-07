import { useSearchParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";

function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get("orderId");

  return (
    <div style={{ textAlign: "center", padding: "80px 20px", marginTop: "250px" }}>
      <div style={{ fontSize: "64px" }}>✅</div>
      <h1 style={{ color: "#2a41e8", marginTop: "20px" }}>
        Thanh Toán Thành Công!
      </h1>
      <p style={{ color: "#666", fontSize: "16px" }}>
        Đơn hàng của bạn đã được xác nhận.
      </p>
      <button
        onClick={() => navigate("/products")}
        style={{
          marginTop: "30px",
          padding: "14px 30px",
          backgroundColor: "#2a41e8",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          cursor: "pointer",
        }}
      >
        Tiếp Tục Mua Sắm
      </button>
    </div>
  );
}

export default OrderSuccess;