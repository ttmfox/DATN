import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "./ForgotPassword.css";

function ForgotPasswordPage() {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailOrPhone)) {
      setError("Vui lòng nhập địa chỉ email hợp lệ.");
      toast.error("Vui lòng nhập địa chỉ email hợp lệ.", {
        position: "top-right",
        autoClose: 3000,
      });
      setIsLoading(false);
      return;
    }

    console.log("Sending forgot password request for:", emailOrPhone);

    try {
      // FIXED: Use query parameter instead of request body
      const response = await fetch(
        `http://localhost:8080/api/email/forgot-password?toEmail=${encodeURIComponent(emailOrPhone)}`,
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          }
        }
      );

      // Parse response
      const data = await response.json();
      console.log("Forgot Password Response:", data);

      if (response.ok && data.status === "success") {
        toast.success("Mã OTP đã được gửi đến email của bạn!", {
          position: "top-right",
          autoClose: 3000,
        });
        navigate("/verify-code", { state: { emailOrPhone } });
      } else {
        const errorMsg = data.message || "Không thể gửi mã OTP. Vui lòng thử lại.";
        setError(errorMsg);
        toast.error(errorMsg, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error sending password reset email:", err);
      const errorMsg = "Không thể kết nối với máy chủ. Vui lòng thử lại sau.";
      setError(errorMsg);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-box">
        <h2 className="forgot-password-title">
          <span className="lock-icon">🔑</span> Đặt lại mật khẩu của bạn
        </h2>
        <p className="forgot-password-desc">
          Nhập email của bạn để nhận mã OTP để đặt lại mật khẩu.
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Nhập email của bạn"
            value={emailOrPhone}
            onChange={(e) => setEmailOrPhone(e.target.value)}
            required
            className="forgot-password-input"
          />
          {error && <p className="error-message">{error}</p>}
          <button
            type="submit"
            className="forgot-password-btn"
            disabled={isLoading}
          >
            {isLoading ? "Đang gửi..." : "Gửi"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;