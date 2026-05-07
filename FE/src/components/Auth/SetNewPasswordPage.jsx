import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-toastify";
import "./SetNewPassword.css";

function SetNewPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const emailOrPhone = location.state?.emailOrPhone || "";
  const resetCode = location.state?.resetCode || "";

  // Redirect if no email or resetCode provided
  if (!emailOrPhone || !resetCode) {
    navigate("/forgot-password");
    return null;
  }

  const validatePassword = (password) => {
    return (
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      password.length >= 8 &&
      password.length <= 16 &&
      /^[A-Za-z0-9!@#$%^&*()_+]*$/.test(password)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Client-side validation
    if (!validatePassword(password)) {
      const errorMsg = "Mật khẩu phải dài từ 8-16 ký tự, bao gồm ít nhất một chữ cái viết hoa và một chữ cái viết thường và chỉ chứa các ký tự chuẩn.";
      setError(errorMsg);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
      });
      setIsLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      const errorMsg = "Mật khẩu xác nhận không khớp!";
      setError(errorMsg);
      toast.error(errorMsg, {
        position: "top-right",
        autoClose: 3000,
      });
      setIsLoading(false);
      return;
    }

    console.log("Resetting password for:", emailOrPhone);
    console.log("Reset code:", resetCode);

    try {
      // FIXED: Send correct JSON body matching ResetPassword model
      const response = await fetch(
        "http://localhost:8080/api/email/reset-password",
        {
          method: "POST",
          headers: { 
            "Content-Type": "application/json" 
          },
          body: JSON.stringify({
            toEmail: emailOrPhone,
            resetCode: resetCode,
            newPassword: password,
          }),
        }
      );

      // Parse response
      const data = await response.json();
      console.log("Reset Password Response:", data);

      if (response.ok && data.status === "success") {
        toast.success("Đặt lại mật khẩu thành công!", {
          position: "top-right",
          autoClose: 3000,
        });
        // Redirect to login page after 1 second
        setTimeout(() => {
          navigate("/auth");
        }, 1000);
      } else {
        const errorMsg = data.message || "Không thể đặt lại mật khẩu.";
        setError(errorMsg);
        toast.error(errorMsg, {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error resetting password:", err);
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
    <div className="set-new-password-container">
      <div className="set-new-password-box">
        <h2 className="set-new-password-title">
          <span className="lock-icon">🔑</span> Đặt mật khẩu mới
        </h2>
        <p className="set-new-password-desc">
          Tạo mật khẩu mới cho{" "}
          <span className="highlight">{emailOrPhone}</span>
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            className="password-input"
            placeholder="Mật khẩu mới"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <input
            type="password"
            className="password-input"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {error && <p className="error-message">{error}</p>}

          <ul className="password-requirements">
            <li>Ít nhất 1 chữ cái viết hoa</li>
            <li>Ít nhất 1 chữ cái viết thường</li>
            <li>8-16 ký tự</li>
            <li>Chỉ chữ cái, số và các ký hiệu thông dụng</li>
          </ul>

          <button
            type="submit"
            className="confirm-button"
            disabled={isLoading}
          >
            {isLoading ? "Đang xử lý..." : "Xác Nhận"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SetNewPasswordPage;