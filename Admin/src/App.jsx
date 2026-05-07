import { useState, useEffect } from "react";
import { Route, Routes, useNavigate } from "react-router-dom";
import Sidebar from "./components/common/Sidebar";
import OverviewPage from "./pages/OverviewPage";
import ProductsPage from "./pages/ProductsPage";
import UsersPage from "./pages/UsersPage";
import OrdersPage from "./pages/OrdersPage";
import BrandPage from "./pages/BrandsPage";
import SettingsPage from "./pages/SettingsPage";
import LoginPage from "./pages/LoginPage";
import CategoryPage from "./pages/CategoryPage";
import VouchersPage from "./pages/VouchersPage";
import ReviewPage from "./pages/ReviewPage";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import ToastProvider from "./components/ToastProvider";
import PostsPage from "./pages/PostsPage";
import POSPage from "./pages/POSPage";


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {

    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token); // Cập nhật trạng thái đăng nhập dựa trên token
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
    navigate("/"); // Chuyển đến dashboard sau khi đăng nhập thành công
  };

  return (
    <div className="flex h-screen text-gray-100 overflow-hidden bg-gray-100">
      <ToastContainer />
      <ToastProvider />
      {/* bg-gray-900  */}
      {!isAuthenticated ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <>
          <Sidebar />
          <Routes>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/users" element={<UsersPage />} />
            <Route path="/reviews" element={<ReviewPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/brands" element={<BrandPage />} />
            <Route path="/categories" element={<CategoryPage />} />
            <Route path="/vouchers" element={<VouchersPage />} />
            <Route path="/posts" element={<PostsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/pos" element={<POSPage />} />
          </Routes>
        </>
      )}
    </div>
  );
}
export default App;
