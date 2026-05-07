import { motion } from "framer-motion";
import { HiOutlineLogout } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { logout } from "../../utils/authService";

const Logout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    window.location.href = "/login"; // Chuyển hướng về trang login
  };

  return (
    <motion.div
      className="bg-white shadow-lg rounded-xl p-6 border border-red-300 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center mb-4">
        <HiOutlineLogout className="text-red-600 mr-3" size={24} />
        <h2 className="text-xl font-semibold text-gray-900">Đăng Xuất</h2>
      </div>
      <p className="text-gray-700 mb-4">
        Đăng xuất khỏi tài khoản của bạn một cách an toàn. Bạn sẽ cần đăng nhập lại để truy cập dữ liệu của mình.
      </p>
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition duration-200"
      >
        Đăng Xuất
      </button>
    </motion.div>
  );
};

export default Logout;
