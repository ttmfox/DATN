import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";
import { useAppContext } from "../../context/AppContext";

function Cart() {
  const { isSidebarOpen, setIsSidebarOpen, cart, fetchCart } = useAppContext();
  
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const navigate = useNavigate();

  const total = cart.reduce(
    (sum, item) => sum + item.productPrice * item.quantity,
    0
  );

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleQuantityChange = async (cartItem, newQuantity) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to update your cart");
      closeSidebar();
      navigate("/auth");
      return;
    }

    if (newQuantity < 1) {
      handleRemoveItem(cartItem.cartId);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8080/tirashop/cart/update",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: cartItem.id,
            cartId: cartItem.cartId,
            quantity: newQuantity,
            productSize: cartItem.size || cartItem.productSize,
          }),
        }
      );

      const data = await response.json();
      if (response.status === 401) {
        localStorage.removeItem("token");
        toast.error("Your session has expired. Please log in again.");
        navigate("/auth");
        return;
      }

      if (data.status === "success") {
        toast.success("Sửa giỏ hàng thành công!");
        await fetchCart();
      } else {
        toast.error(`Failed to update cart: ${data.message}`);
      }
    } catch (error) {
      console.error("Error updating cart:", error);
      toast.error("Error updating cart. Please try again.");
    }
  };

  const handleRemoveItem = async (itemId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to remove items from cart");
      navigate("/auth");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:8080/tirashop/cart/remove/${itemId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (response.status === 401) {
        localStorage.removeItem("token");
        toast.error("Your session has expired. Please log in again.");
        navigate("/auth");
        return;
      }

      if (data.status === "success") {
        toast.success("Item removed from cart!");
        await fetchCart();
      } else {
        toast.error(`Failed to remove item: ${data.message}`);
      }
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Error removing item. Please try again.");
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to clear your cart");
      closeSidebar();
      navigate("/auth");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8080/tirashop/cart/clear",
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      console.log("Clear cart response:", data); // Debug

      if (response.status === 401) {
        localStorage.removeItem("token");
        toast.error("Your session has expired. Please log in again.");
        navigate("/auth");
        return;
      }

      if (data.status === "success") {
        toast.success("Cart cleared successfully!");
        await fetchCart(); // Cập nhật giỏ hàng từ server
        console.log("Cart after clear:", cart); // Debug
      } else {
        toast.error(`Failed to clear cart: ${data.message}`);
        setCart([]); // Đặt lại cart về rỗng nếu API không cập nhật đúng
      }
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Error clearing cart. Please try again.");
      setCart([]); // Đặt lại cart về rỗng trong trường hợp lỗi
    }
  };

  const handleCheckout = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to checkout");
      closeSidebar();
      navigate("/auth");
      return;
    }

    setIsCheckingOut(true);
    try {
      if (cart.length === 0) {
        toast.error("Your cart is empty");
        setIsCheckingOut(false);
        return;
      }
      closeSidebar();
      navigate("/checkout");
    } catch (error) {
      console.error("Error during checkout:", error);
      toast.error("Error occurred. Please try again.");
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div
      className={`${styles.cartSidebar} ${isSidebarOpen ? styles.open : ""}`}
    >
      <div className={styles.cartHeader}>
        <h2>Giỏ Hàng ({cart.length})</h2>
        <button className={styles.closeButton} onClick={closeSidebar}>
          ×
        </button>
      </div>

      <div className={styles.cartItems}>
        {cart.length === 0 ? (
          <p className={styles.emptyMessage}>Giỏ hàng trống.</p>
        ) : (
          cart.map((item) => (
            <div key={item.id} className={styles.cartItem}>
              <img
                src={item.productImage || "https://via.placeholder.com/80"}
                alt={item.productName}
                className={styles.productImage}
              />
              <div className={styles.itemDetails}>
                <h4>{item.productName}</h4>
                <p className={styles.price}>
                {item.productPrice.toLocaleString()} VND × {item.quantity}
                </p>
                <div className={styles.quantityControls}>
                  <button
                    onClick={() =>
                      handleQuantityChange(item, item.quantity - 1)
                    }
                    disabled={item.quantity <= 1}
                  ></button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      handleQuantityChange(item, item.quantity + 1)
                    }
                  ></button>
                </div>
                <button
                  className={styles.removeButton}
                  onClick={() => handleRemoveItem(item.id)}
                >
                  Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className={styles.cartFooter}>
          <div className={styles.total}>
            <span>Tổng:</span>
            <h3>{total.toLocaleString()} VND</h3> 
          </div>
          <div className={styles.footerButtons}>
            <button onClick={clearCart} className={styles.clearCartButton}>
              Dọn Dẹp Giỏ Hàng           </button>
            <button
              onClick={handleCheckout}
              className={styles.checkoutButton}
              disabled={isCheckingOut || cart.length === 0}
            >
              {isCheckingOut ? "Processing..." : "Thanh Toán"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
