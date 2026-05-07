import { useState } from "react";
import { login } from "../utils/authService";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEye, FiEyeOff } from "react-icons/fi";

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      toast.success("Đăng nhập thành công!", { position: "top-right" });
      setTimeout(() => {
        onLogin();
      }, 500);
    } catch (err) {
      setError("Incorrect username or password!");
      toast.error("Tên người dùng hoặc mật khẩu không đúng!", { position: "top-right" });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen w-full bg-gray-100 p-6">
      <div className="bg-white p-10 rounded-xl shadow-md w-full max-w-md text-center flex flex-col items-center border border-gray-300">
        <h2 className="text-2xl font-semibold text-gray-700 mb-5">Đăng Nhập</h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 text-gray-900 placeholder-gray-600"
          />
          <div className="relative w-full">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-400 text-gray-900 placeholder-gray-600 pr-12"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 bg-transparent p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-400 transition-all"
            >
              {showPassword ? <FiEyeOff size={22} /> : <FiEye size={22} />}
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-gray-700 text-white py-3 rounded-md font-medium text-sm hover:bg-gray-800 transition duration-200"
          >
            Login
          </button>
        </form>
      </div>
      <ToastContainer position="top-right" autoClose={1500} hideProgressBar={false} closeOnClick pauseOnHover draggable theme="colored" />
    </div>
  );
};

export default LoginPage;
