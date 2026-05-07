import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import * as Components from "../Auth/Component.js";
import { FaGoogle, FaFacebookF } from "react-icons/fa";
import { useAppContext } from "../../context/AppContext";
import { useState, useEffect, useRef } from "react";
import backg from "../../assets/images/backg.jpg";
import "../../assets/style/auth.css";

const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

function AuthPage() {
  const { setIsAuthenticated, isAuthenticated, setIsMenuOpen } = useAppContext();
  const [signIn, setSignIn] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
    email: "",
    phoneNumber: "",
    firstName: "",
    lastName: "",
    gender: "",
    dateOfBirth: "",
    address: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const popupRef = useRef(null);
  const currentProviderRef = useRef(null);

  // Chuyển hướng khi isAuthenticated thay đổi
  useEffect(() => {
    if (isAuthenticated) {
      console.log("isAuthenticated is true, navigating to /");
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  // Xử lý postMessage từ popup (OAuth login)
  useEffect(() => {
    const handleMessage = (event) => {
      console.log("Received message from popup:", event.data, "Origin:", event.origin);

      let data = event.data;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (err) {
          console.error("Failed to parse message data:", err);
          return;
        }
      }

      if (data && data.token) {
        console.log("Token received:", data.token);
        const decodedToken = decodeJWT(data.token);
        localStorage.setItem("token", data.token);
        localStorage.setItem("userId", decodedToken?.userId || "unknown");
        localStorage.setItem("username", data.username || "social-user");
        setIsAuthenticated(true);
        setIsMenuOpen(false);

        const provider = currentProviderRef.current || "social";
        toast.success(`Login with ${provider} successful!`, {
          position: "top-right",
          autoClose: 3000,
        });

        if (popupRef.current) {
          popupRef.current.close();
          popupRef.current = null;
        }
      } else {
        console.error("No token found in message data:", data);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [setIsAuthenticated, setIsMenuOpen]);

  // Kiểm tra token khi tải trang
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (token && userId) {
      console.log("Found token in localStorage, validating...");
      validateToken(token).then((isValid) => {
        if (isValid) {
          console.log("Token is valid, setting isAuthenticated to true");
          setIsAuthenticated(true);
          setIsMenuOpen(false);
          toast.info("You are already logged in", {
            position: "top-right",
            autoClose: 3000,
          });
        } else {
          console.log("Token is invalid, clearing localStorage");
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          localStorage.removeItem("username");
          setIsAuthenticated(false);
        }
      });
    }
  }, [setIsAuthenticated, setIsMenuOpen]);

  const validateToken = async (token) => {
    try {
      console.log("Validating token with /introspect:", token);
      const response = await fetch("http://localhost:8080/tirashop/auth/introspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      console.log("Introspect token response:", response.status, data);
      return response.status === 200 && data.status === "success" && data.data?.valid;
    } catch (err) {
      console.error("Token introspection error:", err);
      return false;
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContainerClick = (e) => {
    if (e.target.closest("form") || e.target.closest("button")) {
      return;
    }
    console.log("Container clicked, closing menu");
    setIsMenuOpen(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (signIn) {
      if (!formData.username || !formData.password) {
        setError("Vui lòng điền vào tất cả các trường bắt buộc.");
        setIsLoading(false);
        return;
      }
    } else {
      if (
        !formData.username ||
        !formData.password ||
        !formData.confirmPassword ||
        !formData.email ||
        !formData.phoneNumber ||
        !formData.firstName ||
        !formData.lastName ||
        !formData.gender ||
        !formData.dateOfBirth ||
        !formData.address
      ) {
        setError("Vui lòng điền vào tất cả các trường bắt buộc.");
        setIsLoading(false);
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Mật khẩu không khớp.");
        setIsLoading(false);
        return;
      }
    }

    if (signIn) {
      const url = "http://localhost:8080/tirashop/auth/login";
      try {
        const payload = {
          username: formData.username,
          password: formData.password,
        };
        console.log("Sending login request to:", url, "with payload:", payload);

        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();

        console.log("Login response:", response.status, data);

        if (response.status === 200 && data.status === "success") {
          if (data.data?.token) {
            const decodedToken = decodeJWT(data.data.token);
            localStorage.setItem("token", data.data.token);
            localStorage.setItem("userId", decodedToken?.userId || "unknown");
            localStorage.setItem("username", formData.username);
            setIsAuthenticated(true);
            setIsMenuOpen(false);
            toast.success("Đăng nhập thành công!", {
              position: "top-right",
              autoClose: 3000,
            });
          } else {
            setError("Đăng nhập thành công nhưng không nhận được token.");
          }
        } else {
          setError(data.message || "Đăng nhập thất bại. Vui lòng thử lại.");
          toast.error(data.message || "Đăng nhập thất bại", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      } catch (err) {
        console.error("Lỗi server:", err);
        setError("Không thể kết nối đến server. Vui lòng thử lại sau.");
        toast.error("Lỗi kết nối server: " + err.message, {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    } else {
      const url = "http://localhost:8080/tirashop/user/create-new-user";
      try {
        const formPayload = new FormData();
        formPayload.append("username", formData.username);
        formPayload.append("password", formData.password);
        formPayload.append("firstname", formData.firstName);
        formPayload.append("lastname", formData.lastName);
        formPayload.append("email", formData.email);
        formPayload.append("phone", formData.phoneNumber);
        formPayload.append("address", formData.address);
        formPayload.append("gender", formData.gender);
        formPayload.append("status", "ACTIVE");
        formPayload.append("role", "ROLE_USER");
        formPayload.append("birthday", formData.dateOfBirth.split("-").reverse().join("-"));

        console.log("Sending register request to:", url, "with payload:", formPayload);

        const response = await fetch(url, {
          method: "POST",
          body: formPayload,
        });
        const data = await response.json();

        console.log("Register response:", response.status, data);

        if (response.status === 200 && data.status === "success") {
          try {
            const emailPayload = {
              toEmail: formData.email,
              username: formData.username,
            };
            console.log("Sending email request with payload:", emailPayload);

            const emailResponse = await fetch(
              "http://localhost:8080/api/email/send-registration",
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(emailPayload),
              }
            );
            const emailData = await emailResponse.json();

            console.log("Email response:", emailResponse.status, emailData);

            if (emailResponse.status === 200 && emailData.status === "success") {
              toast.success("Đăng ký thành công!", {
                position: "top-right",
                autoClose: 3000,
              });
            } else {
              throw new Error(
                emailData.message || "Không thể gửi email đăng ký"
              );
            }
          } catch (emailError) {
            console.error("Lỗi gửi email:", emailError);
            toast.warn("Đăng ký thành công nhưng gửi email thất bại.", {
              position: "top-right",
              autoClose: 3000,
            });
          }

          const loginResponse = await fetch(
            "http://localhost:8080/tirashop/auth/login",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                username: formData.username,
                password: formData.password,
              }),
            }
          );
          const loginData = await loginResponse.json();

          console.log("Login response after registration:", loginData);

          if (
            loginResponse.status === 200 &&
            loginData.status === "success" &&
            loginData.data?.token
          ) {
            const decodedToken = decodeJWT(loginData.data.token);
            localStorage.setItem("token", loginData.data.token);
            localStorage.setItem("userId", decodedToken?.userId || "unknown");
            localStorage.setItem("username", formData.username);
            setIsAuthenticated(true);
            setIsMenuOpen(false);
          }
        } else {
          setError(data.message || "Đăng ký thất bại. Vui lòng thử lại.");
          toast.error(data.message || "Đăng ký thất bại", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      } catch (err) {
        console.error("Lỗi server:", err);
        setError("Không thể kết nối đến server. Vui lòng thử lại sau.");
        toast.error("Lỗi kết nối server: " + err.message, {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleSocialLogin = (provider) => {
    if (isAuthenticated) {
      toast.info("Bạn đã đăng nhập!", {
        position: "top-right",
        autoClose: 3000,
      });
      navigate("/");
      return;
    }

    currentProviderRef.current = provider;

    const authUrl =
      provider === "google"
        ? "http://localhost:8080/oauth2/authorization/google"
        : "http://localhost:8080/oauth2/authorization/facebook";

    const width = 600;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      authUrl,
      "Social Login",
      `width=${width},height=${height},top=${top},left=${left}`
    );

    popupRef.current = popup;
  };

  return (
    <div
    className="auth-container"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundImage: `url(${backg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
      onClick={handleContainerClick}
    >
      <Components.Container>
        <Components.SignUpContainer signinIn={signIn}>
          <Components.Form onSubmit={handleAuth}>
            <Components.Title>Tạo tài khoản</Components.Title>
            <Components.Row>
              <Components.HalfInput
                type="text"
                name="firstName"
                placeholder="Họ"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <Components.HalfInput
                type="text"
                name="lastName"
                placeholder="Tên"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Components.Row>
            <Components.Input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <Components.Input
              type="tel"
              name="phoneNumber"
              placeholder="Số Điện Thoại"
              value={formData.phoneNumber}
              onChange={handleChange}
              required
            />
            <Components.Input
              type="text"
              name="address"
              placeholder="Địa chỉ"
              value={formData.address}
              onChange={handleChange}
              required
            />
            <Components.Row>
              <Components.HalfInput
                as="select"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Giới Tính</option>
                <option value="Nam">Nam</option>
                <option value="Nữ">Nữ</option>
              </Components.HalfInput>
              <Components.HalfInput
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                required
              />
            </Components.Row>
            <Components.Input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <Components.Input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <Components.Input
              type="password"
              name="confirmPassword"
              placeholder="Xác nhận mật khẩu"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
            {error && <Components.ErrorMessage>{error}</Components.ErrorMessage>}
            <Components.Button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Đăng ký"}
            </Components.Button>
          </Components.Form>
        </Components.SignUpContainer>

        <Components.SignInContainer signinIn={signIn}>
          <Components.Form onSubmit={handleAuth}>
            <Components.Title>Đăng Nhập</Components.Title>
            <Components.Input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
            <Components.Input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            {error && <Components.ErrorMessage>{error}</Components.ErrorMessage>}
            <Components.Anchor
              href="#"
              onClick={() => navigate("/forgot-password")}
            >
              Quên mật khẩu?
            </Components.Anchor>
            <Components.Button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Đăng Nhập"}
            </Components.Button>
            <Components.SocialDivider>Hoặc</Components.SocialDivider>
            <Components.SocialButton onClick={() => handleSocialLogin("google")}>
              <FaGoogle style={{ marginRight: "10px" }} />
              Đăng nhập bằng Google
            </Components.SocialButton>
           
          </Components.Form>
        </Components.SignInContainer>

        <Components.OverlayContainer signinIn={signIn}>
          <Components.Overlay signinIn={signIn}>
            <Components.LeftOverlayPanel signinIn={signIn}>
              <Components.Title>Tira Shop</Components.Title>
              <Components.Paragraph>
                Bạn đã có tài khoản!
              </Components.Paragraph>
              <Components.GhostButton onClick={() => setSignIn(true)}>
                Đăng Nhập
              </Components.GhostButton>
            </Components.LeftOverlayPanel>
            <Components.RightOverlayPanel signinIn={signIn}>
              <Components.Title>Tira Shop</Components.Title>
              <Components.Paragraph>
                Bạn chưa có tài khoản?
              </Components.Paragraph>
              <Components.GhostButton onClick={() => setSignIn(false)}>
                Đăng Kí
              </Components.GhostButton>
            </Components.RightOverlayPanel>
          </Components.Overlay>
        </Components.OverlayContainer>
      </Components.Container>
    </div>
  );
}

export default AuthPage;