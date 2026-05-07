import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";
import Footer from "../Footer/Footer";
import { useAppContext } from "../../Context/AppContext";

// Helper function to format price with commas
const formatPrice = (price) => {
  if (!price) return "N/A";
  return Math.floor(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VND";
};

// Helper function to render star rating
const renderStars = (rating) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5 ? 1 : 0;
  const emptyStars = 5 - fullStars - halfStar;
  return (
    <>
      {[...Array(fullStars)].map((_, i) => (
        <span key={`full-${i}`} className={styles.star}>★</span>
      ))}
      {halfStar ? <span className={styles.starHalf}>☆</span> : null}
      {[...Array(emptyStars)].map((_, i) => (
        <span key={`empty-${i}`} className={styles.starEmpty}>☆</span>
      ))}
    </>
  );
};

function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, fetchCart } = useAppContext();
  const [category, setCategory] = useState(null);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [elementsPerPage] = useState(12);
  const [sortBy, setSortBy] = useState("default");
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8080/tirashop/category/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
      const data = await response.json();
      if (data.status === "success" && data.data?.elementList) {
        setCategories(data.data.elementList);
      }
    } catch (err) {
      console.error("Lỗi khi lấy danh mục:", err);
    }
  }, []);

  const fetchBrands = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8080/tirashop/brand/list", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      if (!response.ok) throw new Error(`Lỗi HTTP! Trạng thái: ${response.status}`);
      const data = await response.json();
      if (data.status === "success" && data.data) {
        setBrands(data.data);
      } else {
        toast.error(data.message || "Không thể lấy danh sách thương hiệu");
      }
    } catch (err) {
      console.error("Lỗi khi lấy thương hiệu:", err);
    }
  }, []);

  const fetchAllProducts = useCallback(async () => {
    setLoading(true);
    try {
      const headers = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      setCategory({
        name: "Tất Cả Sản Phẩm",
        description: "Khám phá bộ sưu tập thời trang cao cấp với những thiết kế độc đáo và chất lượng tuyệt vời.",
      });

      const queryParams = new URLSearchParams({
        pageNo: currentPage,
        elementPerPage: elementsPerPage,
        ...(selectedSizes.length > 0 && { size: selectedSizes.join(",") }),
        ...(selectedBrands.length > 0 && { brand: selectedBrands.join(",") }),
      }).toString();

      const productResponse = await fetch(
        `http://localhost:8080/tirashop/product?${queryParams}`,
        { method: "GET", headers }
      );
      if (!productResponse.ok)
        throw new Error(`Lỗi HTTP! Trạng thái: ${productResponse.status}`);
      const productData = await productResponse.json();
      if (productData.status === "success") {
        let productsList = productData.data.elementList || [];
        
        // Sắp xếp sản phẩm
        if (sortBy === "price-asc") {
          productsList.sort((a, b) => a.price - b.price);
        } else if (sortBy === "price-desc") {
          productsList.sort((a, b) => b.price - a.price);
        } else if (sortBy === "rating") {
          productsList.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        }
        
        setProducts(productsList);
        setTotalPages(productData.data.totalPages || 0);
      } else {
        throw new Error(productData.message || "Không thể lấy danh sách sản phẩm");
      }
    } catch (err) {
      setError(err.message);
      console.error("Lỗi khi lấy sản phẩm:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedSizes, selectedBrands, sortBy]);

  useEffect(() => {
    fetchCategories();
    fetchBrands();
    fetchAllProducts();
  }, [fetchCategories, fetchBrands, fetchAllProducts]);

  useEffect(() => {
    if (location.state?.searchResults) {
      setSearchResults(location.state.searchResults);
      setSearchQuery(location.state.query || "");
      setCurrentPage(0);
      setTotalPages(1);
    } else {
      setSearchResults([]);
      setSearchQuery("");
      fetchAllProducts();
    }
  }, [location.state, fetchAllProducts]);

  useEffect(() => {
    if (location.state?.resetFilters) {
      resetFilters();
    }
  }, [location.state]);

  const mapCategoryDisplay = (categoryName) => {
    const categoryMap = {
      "Tre Em": "Thời Trang Trẻ Em",
      Gucci: "Gucci",
      Mens: "Thời Trang Nam",
      Womens: "Thời Trang Nữ",
      "Both Male and Female": "Thời Trang Unisex",
      "Nam": "Thời Trang Nam",
      "Nữ": "Thời Trang Nữ", 
      "Unisex": "Thời Trang Unisex",
      Versace: "Versace",
      Zara: "Zara",
      Calvin: "Calvin Klein",
    };
    return categoryMap[categoryName] || categoryName;
  };

  const sizes = ["S", "M", "L", "XL"];

  const handleBrandChange = (brand) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
    setCurrentPage(0);
    setShowBrandDropdown(false);
  };

  const handleSizeChange = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]
    );
    setCurrentPage(0);
  };

  const handleAddToCart = async (product) => {
    if (!isAuthenticated) {
      toast.error("Vui lòng đăng nhập để thêm vào giỏ hàng");
      navigate("/auth");
      return;
    }
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
      navigate("/auth");
      return;
    }
    try {
      const response = await fetch("http://localhost:8080/tirashop/cart/add", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
          quantity: 1,
          productSize: product.size, // Sử dụng size cố định từ sản phẩm
        }),
      });
      const data = await response.json();
      if (response.ok && data.status === "success") {
        await fetchCart();
        toast.success("Đã thêm vào giỏ hàng thành công!");
      } else {
        toast.error(
          `Không thể thêm vào giỏ hàng: ${data.message || "Lỗi không xác định"}`
        );
      }
    } catch (error) {
      toast.error("Lỗi khi thêm vào giỏ hàng. Vui lòng thử lại.");
    }
  };

  const resetFilters = () => {
    setSelectedBrands([]);
    setSelectedSizes([]);
    setSortBy("default");
    setCurrentPage(0);
  };

  const viewAllProducts = () => {
    resetFilters();
    navigate("/category/all", { state: { resetFilters: true } });
  };

  const handlePageChange = (page) => {
    if (page >= 0 && page < totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const maxButtons = 5;
    const buttons = [];
    let startPage = Math.max(0, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages - 1, startPage + maxButtons - 1);

    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(0, endPage - maxButtons + 1);
    }

    buttons.push(
      <button
        key="prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 0}
        className={styles.pageButton}
      >
        ‹ Trước
      </button>
    );

    if (startPage > 0) {
      buttons.push(
        <button
          key={0}
          onClick={() => handlePageChange(0)}
          className={styles.pageButton}
        >
          1
        </button>
      );
      if (startPage > 1) {
        buttons.push(<span key="start-ellipsis" className={styles.ellipsis}>...</span>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`${styles.pageButton} ${
            currentPage === i ? styles.active : ""
          }`}
        >
          {i + 1}
        </button>
      );
    }

    if (endPage < totalPages - 1) {
      if (endPage < totalPages - 2) {
        buttons.push(<span key="end-ellipsis" className={styles.ellipsis}>...</span>);
      }
      buttons.push(
        <button
          key={totalPages - 1}
          onClick={() => handlePageChange(totalPages - 1)}
          className={styles.pageButton}
        >
          {totalPages}
        </button>
      );
    }

    buttons.push(
      <button
        key="next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages - 1}
        className={styles.pageButton}
      >
        Tiếp ›
      </button>
    );

    return <div className={styles.pagination}>{buttons}</div>;
  };

  if (loading) return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <p>Đang tải sản phẩm...</p>
    </div>
  );
  
  if (error)
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>⚠️</div>
        <h3>Oops! Có lỗi xảy ra</h3>
        <p>{error}</p>
        <button className={styles.errorButton} onClick={() => navigate("/category/all")}>
          Xem Tất Cả Sản Phẩm
        </button>
      </div>
    );
  
  if (!category)
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>🔍</div>
        <h3>Không tìm thấy danh mục</h3>
        <p>Danh mục bạn tìm kiếm không tồn tại hoặc đã được di chuyển.</p>
        <button className={styles.errorButton} onClick={() => navigate("/category/all")}>
          Xem Tất Cả Sản Phẩm
        </button>
      </div>
    );

  const currentProducts = searchResults.length > 0 ? searchResults : products;

  return (
    <>
      <div className={styles.categoryPage}>
        <div className={styles.container}>
          {/* Hero Section */}
          <div className={styles.heroSection}>
            <div className={styles.heroContent}>
              <h1 className={styles.heroTitle}>{mapCategoryDisplay(category.name)}</h1>
              <p className={styles.heroDescription}>{category.description}</p>
              <div className={styles.heroStats}>
                <span className={styles.statItem}>
                  <strong>{currentProducts.length}</strong> sản phẩm
                </span>
                <span className={styles.statItem}>
                  <strong>{brands.length}</strong> thương hiệu
                </span>
              </div>
            </div>
          </div>

          <div className={styles.contentWrapper}>
            {/* Sidebar Filters */}
            <div className={styles.sidebar}>
              <div className={styles.filterHeader}>
                <h3>
                  <span className={styles.filterIcon}>🎯</span>
                  Bộ Lọc Thông Minh
                </h3>
                <button className={styles.resetFilterBtn} onClick={resetFilters}>
                  <span className={styles.resetIcon}>↻</span>
                  Reset
                </button>
              </div>

              {/* Brand Filter */}
              <div className={styles.filterSection}>
                <h4>
                  <span className={styles.sectionIcon}>🏷️</span>
                  Thương Hiệu
                </h4>
                <div className={styles.brandDropdown}>
                  <button 
                    className={styles.brandDropdownToggle}
                    onMouseEnter={() => setShowBrandDropdown(true)}
                    onMouseLeave={() => setShowBrandDropdown(false)}
                  >
                    {selectedBrands.length > 0 
                      ? `Đã chọn ${selectedBrands.length} thương hiệu` 
                      : "Chọn thương hiệu"
                    }
                    <span className={styles.dropdownArrow}>▼</span>
                  </button>
                  {showBrandDropdown && (
                    <div 
                      className={styles.brandDropdownMenu}
                      onMouseEnter={() => setShowBrandDropdown(true)}
                      onMouseLeave={() => setShowBrandDropdown(false)}
                    >
                      {brands.map((brand) => (
                        <label key={brand.id} className={styles.brandOption}>
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand.name)}
                            onChange={() => handleBrandChange(brand.name)}
                          />
                          <span className={styles.brandName}>{brand.name}</span>
                          <span className={styles.brandCheckmark}>✓</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Selected Brands Display */}
                {selectedBrands.length > 0 && (
                  <div className={styles.selectedBrands}>
                    {selectedBrands.map((brand) => (
                      <span key={brand} className={styles.selectedBrandTag}>
                        {brand}
                        <button 
                          onClick={() => handleBrandChange(brand)}
                          className={styles.removeBrandBtn}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Size Filter */}
              <div className={styles.filterSection}>
                <h4>
                  <span className={styles.sectionIcon}>📏</span>
                  Kích Cỡ
                </h4>
                <div className={styles.sizeGrid}>
                  {sizes.map((size) => (
                    <button
                      key={size}
                      className={`${styles.sizeCard} ${
                        selectedSizes.includes(size) ? styles.active : ""
                      }`}
                      onClick={() => handleSizeChange(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <button className={styles.applyFiltersBtn} onClick={fetchAllProducts}>
                <span className={styles.applyIcon}>✨</span>
                Áp Dụng Bộ Lọc
              </button>
            </div>

            {/* Main Content */}
            <div className={styles.mainContent}>
              {/* Search Results Header */}
              {searchQuery && (
                <div className={styles.searchResultsHeader}>
                  <h3>Kết quả tìm kiếm cho: "<span className={styles.searchQuery}>{searchQuery}</span>"</h3>
                  <p>{searchResults.length} sản phẩm được tìm thấy</p>
                </div>
              )}

              {/* Toolbar */}
              <div className={styles.toolbar}>
                <div className={styles.productCount}>
                  Hiển thị <strong>{currentProducts.length}</strong> sản phẩm
                </div>
                <div className={styles.sortSection}>
                  <label htmlFor="sort" className={styles.sortLabel}>Sắp xếp theo:</label>
                  <select
                    id="sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={styles.sortSelect}
                  >
                    <option value="default">Mặc định</option>
                    <option value="price-asc">Giá thấp → cao</option>
                    <option value="price-desc">Giá cao → thấp</option>
                    <option value="rating">Đánh giá cao nhất</option>
                  </select>
                </div>
              </div>

              {/* Products Grid */}
              <div className={styles.productGrid}>
                {currentProducts.length === 0 ? (
                  <div className={styles.noProductsFound}>
                    <div className={styles.noProductsIcon}>🛍️</div>
                    <h3>Không tìm thấy sản phẩm</h3>
                    <p>Thử điều chỉnh bộ lọc hoặc xem tất cả sản phẩm của chúng tôi.</p>
                    <button className={styles.viewAllBtn} onClick={viewAllProducts}>
                      <span className={styles.viewAllIcon}>👀</span>
                      Xem Tất Cả Sản Phẩm
                    </button>
                  </div>
                ) : (
                  currentProducts.map((product) => (
                    <div key={product.id} className={styles.productCard}>
                      <div className={styles.productImageWrapper}>
                        {product.isBestSeller && (
                          <div className={styles.bestSellerBadge}>
                            <span className={styles.badgeIcon}>🔥</span>
                            Best Seller
                          </div>
                        )}
                        <div className={styles.productImageContainer}>
                          <img
                            src={
                              product.imageUrls?.[0]
                                ? `http://localhost:8080${product.imageUrls[0]}`
                                : "https://via.placeholder.com/300x300?text=No+Image"
                            }
                            alt={product.name || "Sản phẩm"}
                            className={styles.productImage}
                            onClick={() => navigate(`/product/${product.id}`)}
                          />
                        </div>
                        <div className={styles.quickActions}>
                          <button
                            className={styles.quickViewBtn}
                            onClick={() => navigate(`/product/${product.id}`)}
                            title="Xem nhanh"
                          >
                            👁️
                          </button>
                        </div>
                      </div>

                      <div className={styles.productInfo}>
                        <div className={styles.brandCategory}>
                          <span className={styles.brand}>{product.brandName || "Brand"}</span>
                          <span className={styles.categoryDivider}>•</span>
                          <span className={styles.categoryName}>
                            {mapCategoryDisplay(product.categoryName || "Category")}
                          </span>
                        </div>

                        <h3 className={styles.productTitle}>
                          {product.name || "Sản phẩm không tên"}
                        </h3>

                        <div className={styles.ratingSection}>
                          <div className={styles.stars}>
                            {renderStars(product.averageRating || 0)}
                          </div>
                          <span className={styles.ratingText}>
                            ({product.averageRating?.toFixed(1) || "0.0"})
                          </span>
                        </div>

                        <div className={styles.priceSection}>
                          <span className={styles.currentPrice}>
                            {formatPrice(product.price)}
                          </span>
                          {product.originalPrice && product.originalPrice > product.price && (
                            <>
                              <span className={styles.originalPrice}>
                                {formatPrice(product.originalPrice)}
                              </span>
                              <span className={styles.discount}>
                                -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                              </span>
                            </>
                          )}
                        </div>

                        <div className={styles.productSize}>
                          <span className={styles.sizeLabel}>Size: </span>
                          <span className={styles.sizeValue}>{product.size}</span>
                        </div>

                        <button
                          className={styles.addToCartBtn}
                          onClick={() => handleAddToCart(product)}
                        >
                          <span className={styles.cartIcon}>🛒</span>
                          Thêm Vào Giỏ Hàng
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Pagination */}
              {renderPagination()}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default CategoryPage;