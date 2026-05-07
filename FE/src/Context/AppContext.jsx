
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [cart, setCart] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFetchingCart, setIsFetchingCart] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false); // Thêm trạng thái isScrolled

  // Theo dõi trạng thái cuộn
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    setIsScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const validateToken = async (token) => {
    try {
      const response = await fetch("http://localhost:8080/tirashop/auth/introspect", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });
      const data = await response.json();
      return response.status === 200 && data.status === "success" && data.data.valid;
    } catch (err) {
      console.error("Token validation error:", err);
      return false;
    }
  };

  const refreshAccessToken = async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch("http://localhost:8080/tirashop/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();
      if (response.status === 200 && data.status === "success") {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("refreshToken", data.data.refreshToken);
        return data.data.token;
      } else {
        throw new Error("Failed to refresh token");
      }
    } catch (err) {
      console.error("Refresh token error:", err);
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      setIsAuthenticated(false);
      return null;
    }
  };

  const fetchCart = useCallback(async () => {
    if (isFetchingCart || !isAuthenticated) return;
    setIsFetchingCart(true);
    try {
      let token = localStorage.getItem("token");
      if (!token) {
        setCart([]);
        setIsAuthenticated(false);
        return;
      }

      let response = await fetch("http://localhost:8080/tirashop/cart/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        const newToken = await refreshAccessToken();
        if (newToken) {
          response = await fetch("http://localhost:8080/tirashop/cart/list", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newToken}`,
            },
          });
        } else {
          setCart([]);
          setIsAuthenticated(false);
          return;
        }
      }

      const data = await response.json();
      if (data.status === "success" && data.data && data.data.items) {
        const validSizes = ["S", "M", "L"];
        const parsedCart = data.data.items.map((item) => ({
          id: item.id,
          cartId: parseInt(item.cartId),
          productId: parseInt(item.productId),
          productName: item.productName,
          productPrice: parseFloat(item.productPrice) || 0,
          quantity: parseInt(item.quantity) || 0,
          size: validSizes.includes(item.size) ? item.size : "M",
          productImage: item.productImage
            ? `http://localhost:8080${item.productImage}`
            : null,
        }));
        setCart(parsedCart);
      } else {
        setCart([]);
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setCart([]);
      toast.error("Failed to fetch cart. Please try again.");
    } finally {
      setIsFetchingCart(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    const validateAndSetAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        let isValid = await validateToken(token);
        if (!isValid) {
          const newToken = await refreshAccessToken();
          isValid = !!newToken;
        }
        if (isValid) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setCart([]);
        }
      } else {
        setIsAuthenticated(false);
        setCart([]);
      }
    };
    validateAndSetAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [isAuthenticated, fetchCart]);

  const handleLogout = async () => {
    console.log("handleLogout called");
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await fetch("http://localhost:8080/tirashop/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      const userId = localStorage.getItem("userId");
      // Xóa lịch sử chatbot của user hiện tại (nếu có)
      if (userId) {
        localStorage.removeItem(`chatMessages_${userId}`);
      }
      // Xóa lịch sử chatbot của guest
      localStorage.removeItem("chatMessages_guest");
      // Xóa các thông tin người dùng khác
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("username");
      // Reset trạng thái trong context
      setIsAuthenticated(false);
      setCart([]);
      setIsSidebarOpen(false);
      setIsMenuOpen(false);
      toast.success("Logged out successfully!");
    }
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        setIsAuthenticated,
        cart,
        setCart,
        isSidebarOpen,
        setIsSidebarOpen,
        isMenuOpen,
        setIsMenuOpen,
        isSearchOpen,
        setIsSearchOpen,
        fetchCart,
        handleLogout,
        selectedCategory,
        setSelectedCategory,
        isScrolled, // Thêm isScrolled vào context
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => useContext(AppContext);
