import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../Context/AppContext";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";

function CategoryList() {
  const { setSelectedCategory } = useAppContext();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const mapCategoryDisplay = (category) => {
    const categoryMap = {
      "Tre Em": {
        name: "Thời Trang Trẻ Em",
        description: "Sản phẩm thiết kế cho trẻ em.",
      },
      Gucci: { name: "Gucci", description: "Thời trang cao cấp của Gucci." },
      Mens: {
        name: "Thời Trang Nam",
        description: "Sản phẩm thiết kế cho nam giới.",
      },
      Womens: {
        name: "Thời Trang Nữ",
        description: "Sản phẩm thiết kế cho nữ giới.",
      },
      "Both Male and Female": {
        name: "Thời Trang Unisex",
        description: "Sản phẩm phù hợp cho cả nam và nữ.",
      },
      Versace: {
        name: "Versace",
        description: "Thời trang cao cấp của Versace.",
      },
      Zara: { name: "Zara", description: "Thời trang của Zara." },
      Calvin: {
        name: "Calvin Klein",
        description: "Thời trang của Calvin Klein.",
      },
    };
    return (
      categoryMap[category.name] || {
        name: category.name,
        description: category.description,
      }
    );
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Vui lòng đăng nhập để xem danh mục");
        navigate("/auth");
        return;
      }
      const response = await fetch(
        "http://localhost:8080/tirashop/category/list",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok)
        throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
      const data = await response.json();
      if (data.status === "success" && data.data) {
        setCategories(data.data.elementList || []);
      } else {
        setError(data.message || "Không thể lấy danh sách danh mục");
      }
    } catch (err) {
      setError(err.message);
      toast.error(`Lỗi khi lấy danh mục: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    if (category?.id) {
      const parsedId = parseInt(category.id);
      if (!isNaN(parsedId) && parsedId > 0) {
        navigate(`/category/${parsedId}`);
      } else {
        toast.error("ID danh mục không hợp lệ. Chuyển hướng về trang chủ...");
        navigate("/");
      }
    } else {
      navigate("/category/all");
    }
  };

  if (loading) return <p>Đang tải danh mục...</p>;
  if (error) return <p>Lỗi: {error}</p>;

  return (
    <div className={styles.categoryListContainer}>
      <h3>Danh Mục</h3>
      <div className={styles.categoryButtons}>
        <button
          className={styles.categoryBtn}
          onClick={() => handleCategorySelect(null)}
        >
          Tất Cả
        </button>
        {categories.map((category) => {
          const display = mapCategoryDisplay(category);
          return (
            <button
              key={category.id}
              className={styles.categoryBtn}
              onClick={() => handleCategorySelect(category)}
            >
              {display.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CategoryList;
