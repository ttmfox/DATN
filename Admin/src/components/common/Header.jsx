import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../utils/authService";
import { FaUserCircle } from "react-icons/fa";


const Header = ({ title }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();


  const handleGoToSettings = () => {
    navigate("/settings"); // Chuyển hướng đến trang Settings
    setIsDropdownOpen(false); // Đóng dropdown
  };

  return (
    <header className="bg-gray-800 shadow-lg border-b border-gray-900">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        {/* Tiêu đề */}
        <h1 className="text-2xl font-semibold text-white">{title}</h1>

        {/* Avatar + Dropdown */}
        <div className="relative">
          {/* Avatar icon */}
          <button
            className="text-white text-3xl focus:outline-none"
            onClick={handleGoToSettings} // Gọi trực tiếp hàm điều hướng
          >
            <FaUserCircle />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
