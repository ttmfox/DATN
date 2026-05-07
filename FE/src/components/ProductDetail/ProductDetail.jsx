import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";
import ProductReview from "../ProductReview/ProductReview";
import Footer from "../Footer/Footer";
import FixedHeader from "../Header/FixedHeader";
import Cart from "../Cart/Cart";
import { useAppContext } from "../../Context/AppContext";
import Carousel from "react-multi-carousel";
import "react-multi-carousel/lib/styles.css";
import heart from "../../assets/icons/images/heart.png";
import ProductList from "../ProductItem/ProductList";

const responsiveMain = {
  desktop: { breakpoint: { max: 3000, min: 1024 }, items: 1 },
  tablet: { breakpoint: { max: 1024, min: 464 }, items: 1 },
  mobile: { breakpoint: { max: 464, min: 0 }, items: 1 },
};

const responsiveThumbnails = {
  desktop: { breakpoint: { max: 3000, min: 1024 }, items: 5 },
  tablet: { breakpoint: { max: 1024, min: 464 }, items: 4 },
  mobile: { breakpoint: { max: 464, min: 0 }, items: 3 },
};

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, setIsAuthenticated, setIsSidebarOpen, fetchCart } =
    useAppContext();
  const [product, setProduct] = useState(null);
  const [imageUrls, setImageUrls] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSize, setSelectedSize] = useState("M");
  const [isAdding, setIsAdding] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [ratingDistribution, setRatingDistribution] = useState([]);
  const [totalReviews, setTotalReviews] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const productResponse = await fetch(
          `http://localhost:8080/tirashop/product/get/${id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );
        const productData = await productResponse.json();
        console.log("Product data:", productData);
        if (productData.status === "success" && productData.data) {
          setProduct(productData.data);
          setSelectedSize(productData.data.size || "M");
        } else {
          setError(productData.message || "Failed to fetch product");
          toast.error(productData.message || "Failed to fetch product", {
            position: "top-right",
            autoClose: 3000,
          });
          return;
        }

        const imagesResponse = await fetch(
          `http://localhost:8080/tirashop/product/${id}/images`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );
        const imagesData = await imagesResponse.json();
        console.log("Images data:", imagesData);
        if (imagesData.status === "success" && imagesData.data) {
          setImageUrls(imagesData.data.map((img) => img.url));
        } else {
          setImageUrls(productData.data.imageUrls || []);
          console.warn("No images found for this product:", imagesData.message);
        }
      } catch (err) {
        setError(err.message);
        toast.error(`Error fetching data: ${err.message}`, {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    const fetchReviews = async () => {
      try {
        const reviewsResponse = await fetch(
          `http://localhost:8080/tirashop/reviews/product/${id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );
        const reviewsData = await reviewsResponse.json();
        console.log("Reviews data:", reviewsData);
        if (reviewsData.status === "success" && reviewsData.data) {
          const reviewList = reviewsData.data.elementList || [];
          setReviews(reviewList);
          setTotalReviews(reviewsData.data.totalElements || 0);

          // Tính phân bố sao
          const distribution = Array(5).fill(0); // [0, 0, 0, 0, 0] cho 1 đến 5 sao
          reviewList.forEach((review) => {
            if (review.rating >= 1 && review.rating <= 5) {
              distribution[5 - review.rating]++; // 5 sao ở index 0, 1 sao ở index 4
            }
          });
          const formattedDistribution = distribution.map((count, index) => ({
            stars: 5 - index,
            count,
          }));
          setRatingDistribution(formattedDistribution);
        } else {
          setReviews([]);
          setTotalReviews(0);
          setRatingDistribution([]);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
        setReviews([]);
        setTotalReviews(0);
        setRatingDistribution([]);
      }
    };

    fetchProduct();
    fetchReviews();
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to add items to cart", {
        position: "top-right",
        autoClose: 3000,
      });
      navigate("/auth");
      return;
    }

    setIsAdding(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setIsAuthenticated(false);
        toast.error("Please log in to add items to cart", {
          position: "top-right",
          autoClose: 3000,
        });
        navigate("/auth");
        return;
      }

      const parsedProductId = parseInt(product.id);
      if (isNaN(parsedProductId)) {
        toast.error("Invalid product ID", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      const validSizes = ["S", "M", "L", "XL"];
      if (!validSizes.includes(selectedSize)) {
        toast.error("Invalid size. Please select S, M, L, or XL.", {
          position: "top-right",
          autoClose: 3000,
        });
        return;
      }

      const response = await fetch("http://localhost:8080/tirashop/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: parsedProductId,
          quantity: 1,
          productSize: selectedSize,
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        toast.error("Session expired. Please log in again.", {
          position: "top-right",
          autoClose: 3000,
        });
        navigate("/auth");
        return;
      }

      const data = await response.json();
      if (data.status === "success") {
        toast.success("Đã thêm sản phẩm vào giỏ hàng!", {
          position: "top-right",
          autoClose: 3000,
        });
        await fetchCart();
        setIsSidebarOpen(true);
      } else {
        setError(data.message || "Failed to add to cart");
        toast.error(data.message || "Failed to add to cart", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (error) {
      setError(error.message);
      toast.error(error.message, {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleThumbnailClick = (index) => {
    setSelectedImageIndex(index);
  };

  const formatPrice = (price) => {
    if (!price) return "N/A";
    return Math.floor(price).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " VND";
  };

  const renderStars = (rating) => {
    const fullStars = Math.floor(rating); // Số sao đầy
    const decimalPart = rating % 1; // Phần thập phân
    const hasHalfStar = decimalPart >= 0.3 && decimalPart < 0.8; // Hiển thị sao nửa nếu phần thập phân từ 0.3 đến dưới 0.8
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0); // Số sao rỗng
  
    const stars = [];
  
    // Thêm sao đầy
    for (let i = 1; i <= fullStars; i++) {
      stars.push(
        <span key={`full-${i}`} className={styles.filledStar}>
          ★
        </span>
      );
    }
  
    // Thêm sao nửa nếu có
    if (hasHalfStar) {
      stars.push(
        <span key="half" className={styles.halfStar}>
          ★
        </span>
      );
    }
  
    // Thêm sao rỗng
    for (let i = 1; i <= emptyStars; i++) {
      stars.push(
        <span key={`empty-${i}`} className={styles.emptyStar}>
          ★
        </span>
      );
    }
  
    return stars;
  };

  if (loading)
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading product details...</p>
      </div>
    );

  if (error)
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>!</div>
        <h3>Something went wrong</h3>
        <p>Error: {error}</p>
        <button
          className={styles.retryBtn}
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );

  if (!product)
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>?</div>
        <h3>Product Not Found</h3>
        <p>We couldn`t find the product you`re looking for.</p>
        <button
          className={styles.retryBtn}
          onClick={() => navigate("/products")}
        >
          Browse Products
        </button>
      </div>
    );

  return (
    <>
      <FixedHeader />
      <Cart />
      <div className={styles.productDetailPage}>
        <div className={styles.breadcrumbs}>
          <span onClick={() => navigate("/")}>Trang Chủ</span>
          <span className={styles.separator}>/</span>
          <span onClick={() => navigate("/products")}>Sản Phẩm</span>
          <span className={styles.separator}>/</span>
          <span className={styles.current}>{product.name}</span>
        </div>

        <div className={styles.productDetailContainer}>
          <div className={styles.productDetail}>
            <div className={styles.imageGallery}>
              <div className={styles.mainImage}>
                <Carousel
                  responsive={responsiveMain}
                  infinite={true}
                  autoPlay={false}
                  autoPlaySpeed={5000}
                  className={styles.mainCarousel}
                  selectedItem={selectedImageIndex}
                  onSlideChange={(nextSlide) =>
                    setSelectedImageIndex(nextSlide)
                  }
                  arrows
                  showDots
                >
                  {imageUrls.length > 0 ? (
                    imageUrls.map((url, index) => (
                      <div className={styles.mainImageWrapper} key={index}>
                        {product.isBestSeller && (
                          <span className={styles.bestSellerBadge}>Bán Chạy</span>
                        )}
                        <img
                          src={`http://localhost:8080${url}`}
                          alt={`${product.name} ${index + 1}`}
                          className={styles.productImage}
                          onError={(e) => {
                            console.error(`Image load failed for ${url}`, e);
                            e.target.src =
                              "https://via.placeholder.com/500?text=Product+Image";
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div className={styles.mainImageWrapper}>
                      <img
                        src="https://via.placeholder.com/500?text=No+Image+Available"
                        alt="No image available"
                        className={styles.productImage}
                      />
                    </div>
                  )}
                </Carousel>
              </div>

              {imageUrls.length > 1 && (
                <div className={styles.thumbnailGallery}>
                  <Carousel
                    responsive={responsiveThumbnails}
                    infinite={false}
                    draggable={true}
                    swipeable={true}
                    className={styles.thumbnailCarousel}
                    centerMode={false}
                  >
                    {imageUrls.map((url, index) => (
                      <div
                        key={index}
                        className={`${styles.thumbnailItem} ${
                          selectedImageIndex === index ? styles.active : ""
                        }`}
                        onClick={() => handleThumbnailClick(index)}
                      >
                        <img
                          src={`http://localhost:8080${url}`}
                          alt={`${product.name} thumbnail ${index + 1}`}
                          className={styles.thumbnailImage}
                          onError={(e) => {
                            console.error(
                              `Thumbnail load failed for ${url}`,
                              e
                            );
                            e.target.src =
                              "https://via.placeholder.com/100?text=Thumbnail";
                          }}
                        />
                      </div>
                    ))}
                  </Carousel>
                </div>
              )}
            </div>

            <div className={styles.productInfo}>
              <div className={styles.productHeader}>
                <h2>{product.name}</h2>
                <p className={styles.brandCategory}>
                  <span className={styles.brand}>{product.brandName}</span>
                  <span className={styles.divider}></span>
                  <span className={styles.category}>
                    {product.categoryName}
                  </span>
                </p>
                <div className={styles.priceContainer}>
                  <span className={styles.price}>
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className={styles.originalPrice}>
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
                <div className={styles.rating}>
                  {renderStars(product.averageRating || 0)}
                </div>
              </div>

              <div className={styles.productMeta}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>SKU:</span>
                  <span className={styles.metaValue}>{product.code}</span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Trạng Thái:</span>
                  <span className={styles.metaValue}>
                    {product.status || "In Stock"}
                  </span>
                </div>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Trong Kho:</span>
                  <span className={styles.metaValue}>{product.inventory}</span>
                </div>
              </div>

              <div className={styles.divider}></div>

              <div className={styles.description}>
                <h3>Mô Tả</h3>
                <p>
                  {product.description ||
                    "No description available for this product."}
                </p>
                {product.material && (
                  <p>
                    <strong>Chất Liệu:</strong> {product.material}
                  </p>
                )}
              </div>

              <div className={styles.productOptions}>
                <div className={styles.sizeSelector}>
                  <label>Kích Thước:</label>
                  <div className={styles.sizeOptions}>
                    {["S", "M", "L", "XL"].map((size) => (
                      <button
                        key={size}
                        className={`${styles.sizeBtn} ${
                          selectedSize === size ? styles.active : ""
                        }`}
                        onClick={() => setSelectedSize(size)}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className={styles.actionWrapper}>
                {isAuthenticated ? (
                  <button
                    onClick={handleAddToCart}
                    className={styles.addToCartBtn}
                    disabled={isAdding}
                  >
                    {isAdding ? (
                      <span className={styles.addingText}>
                        <span className={styles.loadingDot}></span>
                        <span className={styles.loadingDot}></span>
                        <span className={styles.loadingDot}></span>
                      </span>
                    ) : (
                      "Thêm Vào Giỏ Hàng"
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => navigate("/auth")}
                    className={styles.addToCartBtn}
                  >
                    Add To Cart
                  </button>
                )}

                <button className={styles.wishlistBtn}>
                  <img
                    src={heart}
                    alt="Wishlist"
                    className={styles.heartIcon}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className={styles.customerReviews}>
            <h3>Đánh giá của khách hàng</h3>
            {totalReviews > 0 ? (
              <div className={styles.reviewSummary}>
              <div className={styles.ratingAverage}>
  <span className={styles.ratingValue}>
    {(product.averageRating || 0).toFixed(1)}/5
  </span>
  <div className={styles.ratingStars}>
    {renderStars(product.averageRating || 0)}
  </div>
  <span className={styles.reviewCount}>{totalReviews} đánh giá</span>
</div>
                <div className={styles.ratingDistribution}>
                  {ratingDistribution.map((dist) => (
                    <div key={dist.stars} className={styles.ratingBar}>
                      <span className={styles.starLabel}>{dist.stars} sao</span>
                      <div className={styles.barContainer}>
                        <div
                          className={styles.barFill}
                          style={{ width: `${(dist.count / totalReviews) * 100}%` }}
                        ></div>
                      </div>
                      <span className={styles.barCount}>{dist.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p>No reviews yet for this product.</p>
            )}
          </div>
        </div>
        <ProductReview />
        <ProductList />
      </div>
      <Footer />
    </>
  );
}

export default ProductDetail;