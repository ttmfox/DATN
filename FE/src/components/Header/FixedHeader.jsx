import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";
import userIcon from "../../assets/icons/svgs/userIcon.svg";
import cartIcon from "../../assets/icons/svgs/cartIcon.svg";
import searchIcon from "../../assets/icons/svgs/searchIcon.svg";
import barIcon from "../../assets/icons/svgs/bar.svg";
import closeIcon from "../../assets/icons/svgs/close.svg";
import Search from "../Search/Search";
import logo from "../../assets/images/logo.png";
import { useAppContext } from "../../context/AppContext";

function FixedHeader() {
  const {
    isAuthenticated,
    cart,
    setIsSidebarOpen,
    isMenuOpen,
    setIsMenuOpen,
    isSearchOpen,
    setIsSearchOpen,
    handleLogout,
  } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    setIsScrolled(false);
    if (location.pathname === "/") {
      const handleScroll = () => {
        setIsScrolled(window.scrollY > 100);
      };
      setIsScrolled(window.scrollY > 100);
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    } else {
      setIsScrolled(true);
    }
  }, [location.pathname]);

  const handleCartClick = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to view your cart");
      navigate("/auth");
      return;
    }
    setIsSidebarOpen(true);
  };

  const handleUserClick = () => {
    navigate("/auth");
  };

  const toggleSearch = () => {
    setIsSearchOpen((prev) => !prev);
  };

  if (location.pathname === "/" && !isScrolled) {
    return null;
  }

  return (
    <>
      <header
        className={`${styles.header} ${
          isScrolled || location.pathname !== "/" ? styles.fixedHeader : ""
        }`}
      >
        <h1
          className={`${styles.headerTitle} ${
            isScrolled || location.pathname !== "/"
              ? styles.showHeaderTitle
              : ""
          }`}
          onClick={() => navigate("/")}
        >
          <img src={logo} alt="TIRA Logo" className={styles.logo} />
        </h1>

        <div
          className={`${styles.navMenu} ${
            isScrolled || location.pathname !== "/" ? styles.showNav : ""
          }`}
        >
          <div
            className={styles.navItem}
            onClick={() => navigate("/category/all")}
          >
            Cửa Hàng
          </div>
          <div className={styles.navItem} onClick={() => navigate("/stores")}>
            Hệ Thống Cửa Hàng
          </div>
          <div className={styles.navItem} onClick={() => navigate("/vouchers")}>
            Mã Giảm Giá
          </div>
          <div className={styles.navItem} onClick={() => navigate("/news")}>
            Tin Tức
          </div>
        </div>

        <div
          className={`${styles.iconBox} ${
            isScrolled || location.pathname !== "/" ? styles.flyUp : ""
          }`}
        >
          {isAuthenticated ? (
            <span className={styles.headerIcon} onClick={handleLogout}></span>
          ) : (
            <img
              src={userIcon}
              alt="User Icon"
              className={styles.headerIcon}
              onClick={handleUserClick}
            />
          )}
          <div className={styles.cartContainer} onClick={handleCartClick}>
            <img src={cartIcon} alt="Cart Icon" className={styles.headerIcon} />
            {cart.length > 0 && (
              <span className={styles.cartCount}>{cart.length}</span>
            )}
          </div>
          <img
            src={searchIcon}
            alt="Search Icon"
            className={styles.headerIcon}
            onClick={toggleSearch}
          />
          {isSearchOpen && (
            <Search
              isSearchOpen={isSearchOpen}
              setIsSearchOpen={setIsSearchOpen}
            />
          )}
          <img
            src={barIcon}
            alt="Menu Icon"
            className={styles.headerIcon}
            onClick={() => setIsMenuOpen(true)}
          />
        </div>
      </header>

      <div className={`${styles.sidebarMenu} ${isMenuOpen ? styles.open : ""}`}>
        <button
          className={styles.closeBtn}
          onClick={() => setIsMenuOpen(false)}
        >
          <img src={closeIcon} alt="Close" />
        </button>
        <ul className={styles.menuList}>
          <li onClick={() => navigate("/category/all")}>Cửa Hàng</li>
          <li onClick={() => navigate("/stores")}>Hệ Thống Cửa Hàng</li>
          <li onClick={() => navigate("/vouchers")}>Mã Giảm Giá</li>
          {!isAuthenticated ? (
            <li onClick={() => navigate("/auth")}>Đăng Nhập</li>
          ) : (
            <li onClick={handleLogout}>Đăng Xuất</li>
          )}
          <li
            onClick={() => {
              if (isAuthenticated) {
                navigate("/profile");
              } else {
                toast.error("Please log in to view your profile");
                navigate("/auth");
              }
              setIsMenuOpen(false);
            }}
          >
            Tài Khoản Của Tôi
          </li>
          <li onClick={() => navigate("/orders")}>Đơn Hàng Của Tôi</li>
        </ul>
      </div>
    </>
  );
}

export default FixedHeader;