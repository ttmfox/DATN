import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";
import Footer from "../Footer/Footer";

function OrderHistoryPage() {
  const navigate = useNavigate();
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const pageSize = 10;

  // Function to construct image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) {
      return "https://via.placeholder.com/150";
    }
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }
    return `http://localhost:8080${imageUrl}`;
  };

  // Function to format price (e.g., 6437 -> 6,437 $)
  const formatPrice = (price) => {
    if (!price) return "0 $";
    return `${Math.round(price).toLocaleString("en-US")} VND`;
  };

  // Fetch order history on component mount or page change
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to view your order history");
      navigate("/auth");
      return;
    }
    fetchOrderHistory(page);
  }, [navigate, page]);

  // Fetch order history from the API with pagination
  const fetchOrderHistory = async (pageNumber) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found in localStorage");
      }

      const url = `http://localhost:8080/tirashop/orders/orders/products?page=${pageNumber}&size=${pageSize}`;
      console.log("Fetching orders from:", url);
      console.log("Using token:", token);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "*/*",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/auth");
          toast.error("Session expired. Please log in again.");
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log("Order history response:", data);

      if (data.status === "success") {
        setOrderItems(data.data.elementList || []);
        setTotalPages(data.data.totalPages || 1);
      } else {
        throw new Error(data.message || "Failed to fetch order history");
      }
    } catch (err) {
      console.error("Error fetching order history:", err);
      toast.error(`Error fetching order history: ${err.message}`);
      setOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle page navigation
  const handlePageChange = (newPage) => {
    if (newPage >= 0 && newPage < totalPages) {
      setPage(newPage);
    }
  };

  // Render the list of orders
  const renderOrderItems = () => (
    <div className={styles.orderSection}>
      <h2>Đơn Hàng Của Bạn</h2>
      {orderItems.length === 0 ? (
        <p>Không tìm thấy.</p>
      ) : (
        <div className={styles.orderItems}>
          {orderItems.map((item, index) => (
            <div
              key={`${item.productName}-${index}`}
              className={styles.orderItem}
            >
              <div className={styles.itemImageContainer}>
                <img
                  src={getImageUrl(item.productImage)}
                  alt={item.productName || "Product"}
                  className={styles.itemImage}
                  onError={(e) => {
                    e.target.src = "https://via.placeholder.com/150";
                    console.error("Image load error:", item.productImage);
                  }}
                />
                <span className={styles.itemQuantity}>{item.quantity}</span>
              </div>
              <div className={styles.itemDetails}>
                <h3>{item.productName || "Unknown Product"}</h3>
                <p>Thương hiệu: {item.brand || "N/A"}</p>
                <p>Phân loại: {item.category || "N/A"}</p>
                <p>Size: {item.size || "N/A"}</p>
                <p className={styles.price}>
                  Giá: {formatPrice(item.totalPrice)}
                </p>
                <p>Số lượng: {item.quantity || 0}</p>
                <p>Địa chỉ: {item.shipmentAddress || "N/A"}</p>
                <p>Thanh toán: {item.paymentMethod || "N/A"}</p>
                <p>Mã giảm giá: {item.voucherCode || "Không có"}</p>
                <p>Trạng thái: {item.orderStatus || "N/A"}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.orderHistoryPageWrapper}>
      <div className={styles.orderHistoryPage}>
        <h1>Lịch Sử Đặt Hàng</h1>

        {loading ? (
          <p>Loading your order history...</p>
        ) : (
          <>
            {renderOrderItems()}
            <div className={styles.pagination}>
              <button
                className={styles.pageBtn}
                disabled={page === 0}
                onClick={() => handlePageChange(page - 1)}
              >
                Trước
              </button>
              <span className={styles.pageInfo}>
                Trang {page + 1} trong tổng số {totalPages}
              </span>
              <button
                className={styles.pageBtn}
                disabled={page >= totalPages - 1}
                onClick={() => handlePageChange(page + 1)}
              >
                Sau
              </button>
            </div>
          </>
        )}

        <div className={styles.backToShop}>
          <button
            className={styles.backBtn}
            onClick={() => navigate("/products")}
          >
            Tiếp Tục Mua Sắm
          </button>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default OrderHistoryPage;