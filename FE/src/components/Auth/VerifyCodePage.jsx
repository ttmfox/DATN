import { useLocation, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { toast } from "react-toastify";
import "./VerifyCode.css";

function VerifyCodePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const emailOrPhone = location.state?.emailOrPhone || "your email/phone";

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow numbers
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move focus to the next input if a digit is entered
    if (value && index < otp.length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      // Move focus to the previous input if backspace is pressed on an empty field
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "Enter" && otp.every((digit) => digit)) {
      // Submit form if Enter is pressed and all 6 digits are filled
      handleSubmit(e);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpCode = otp.join("");
    console.log("Entered OTP:", otpCode);
    if (otpCode.length === 6) {
      navigate("/set-new-password", {
        state: { emailOrPhone, resetCode: otpCode },
      });
    } else {
      toast.error("Please enter a 6-digit OTP.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const handleResend = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/email/forgot-password",
        {
          method: "POST",
          headers: { "Content-Type": "text/plain" }, // Match ForgotPasswordPage
          body: emailOrPhone, // Use emailOrPhone from location.state
        }
      );

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.message || "Failed to resend OTP.", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      const data = await response.json();
      if (response.status === 200 && data.status === "success") {
        toast.success("OTP has been resent successfully!", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error(data.message || "Failed to resend OTP.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      console.error("Error resending OTP:", err);
      toast.error("Server connection error: " + err.message, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  return (
    <div className="verify-code-container">
      <div className="verify-code-box">
        <h2 className="verify-code-title">
          <span className="lock-icon">🔑</span> Xác minh mã của bạn
        </h2>
        <p className="verify-code-desc">
          Một mã xác minh đã được gửi đến {emailOrPhone}.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="otp-inputs">
            {otp.map((num, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={num}
                ref={(el) => (inputRefs.current[index] = el)}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="otp-input"
              />
            ))}
          </div>

          <p className="verify-code-desc">Không nhận được mã?</p>
          <p
            className="verify-code-resend"
            onClick={handleResend}
            style={{ cursor: "pointer" }}
          >
            Gửi lại
          </p>

          <button
            type="submit"
            className="verify-code-btn"
            disabled={otp.includes("")}
          >
            Tiếp
          </button>
        </form>
      </div>
    </div>
  );
}

export default VerifyCodePage;