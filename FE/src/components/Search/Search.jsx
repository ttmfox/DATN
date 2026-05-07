import { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";
import micIcon from "../../assets/images/mic.png";

const Search = ({ isSearchOpen, setIsSearchOpen }) => {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const timeoutRef = useRef(null);
  const searchRef = useRef(null); 



  // Xử lý khi nhấn ra bên ngoài form tìm kiếm
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };

    if (isSearchOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isSearchOpen, setIsSearchOpen]);



  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleKeyPressSearch = async (event) => {
    if (event.key === "Enter") {
      const query = event.target.value;
      await searchProducts(query);
      setIsSearchOpen(false); // Ẩn form sau khi tìm kiếm bằng Enter
    }
  };

  const searchProducts = async (query) => {
    try {
      if (!query || query.trim() === "") {
        toast.error("Vui lòng nhập từ khóa tìm kiếm.");
        return;
      }

      const response = await fetch(
        `http://localhost:8080/tirashop/product?name=${encodeURIComponent(query)}&language=vi`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      const data = await response.json();
      if (response.ok && data.status === "success") {
        const products = data.data.elementList || [];
        if (products.length === 0) {
          toast.info("Không tìm thấy sản phẩm phù hợp.");
          navigate("/category/all", { state: { searchResults: [], query } });
        } else {
          navigate("/category/all", { state: { searchResults: products, query } });
        }
      } else {
        console.log("Lỗi phản hồi:", data);
        toast.error(data.message || "Không thể tìm kiếm sản phẩm. Vui lòng thử lại.");
      }
    } catch (err) {
      toast.error(`Lỗi tìm kiếm: ${err.message}`);
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div className={styles.searchBar} ref={searchRef}>
      <input
        type="text"
        placeholder="Bạn đang tìm gì?"
        className={styles.searchInput}
        onKeyPress={handleKeyPressSearch}
      />

      <div className={styles.searchIcons}>


        <button
          className={styles.closeSearch}
          onClick={() => setIsSearchOpen(false)}
        >
          ✖
        </button>
      </div>

      {isRecording && (
        <div className={styles.recordingOverlay}>
          <div className={styles.recordingIndicator}>
            <div className={styles.micContainer}>
              <img src={micIcon} alt="Microphone" className={styles.micIcon} />
              <div className={styles.wave1}></div>
              <div className={styles.wave2}></div>
              <div className={styles.wave3}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;