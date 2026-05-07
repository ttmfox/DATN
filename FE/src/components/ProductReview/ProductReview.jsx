import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";

function ProductReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch user profile để lấy avatar
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setReviews([]);
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/tirashop/user/my-profile",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("token");
          navigate("/auth");
          return;
        }

        const data = await response.json();
        if (data.status === "success" && data.data) {
          setUserProfile(data.data);
        }
      } catch (err) {
        console.error("Error fetching user profile:", err);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  // Fetch reviews
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/tirashop/reviews/product/${id}`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        const data = await response.json();

        if (data.status === "success") {
          setReviews(data.data.elementList || []);
        } else {
          setError(data.message || "Failed to fetch reviews");
          toast.error(data.message || "Failed to fetch reviews", {
            position: "top-right",
            autoClose: 3000,
          });
        }
      } catch (err) {
        setError(err.message);
        toast.error(err.message, {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [id, navigate]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (rating < 1 || rating > 5) {
      toast.error("Xếp hạng phải nằm trong khoảng từ 1 đến 5", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to submit a review", {
        position: "top-right",
        autoClose: 3000,
      });
      navigate("/auth");
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("rating", rating);
      if (reviewText) formData.append("reviewText", reviewText);
      if (image) formData.append("image", image);

      const response = await fetch(
        `http://localhost:8080/tirashop/reviews/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/auth");
        setSubmitting(false);
        return;
      }

      const data = await response.json();

      if (data.status === "success") {
        toast.success("Review added successfully", {
          position: "top-right",
          autoClose: 3000,
        });

        const newReview = {
          ...data.data,
          username: userProfile?.username || "Anonymous",
          avatar: userProfile?.avatar || null,
        };

        setReviews((prevReviews) => [newReview, ...prevReviews]);
        setRating(0);
        setReviewText("");
        setImage(null);
      } else {
        toast.error(data.message || "Failed to add review", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } catch (err) {
      toast.error(
        err.message || "An error occurred while submitting the review",
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={i <= rating ? styles.filledStar : styles.emptyStar}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const handleStarClick = (selectedRating) => {
    setRating(selectedRating);
  };

  const renderStarInput = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          onClick={() => handleStarClick(i)}
          className={i <= rating ? styles.filledStar : styles.emptyStar}
          style={{ cursor: "pointer" }}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return dateString;
  };

  if (loading) return <p>Loading reviews...</p>;

  return (
    <div className={styles.reviewsContainer}>
      {/* Danh sách review */}
      {reviews.length === 0 ? (
        <p className={styles.noReviews}>Chưa có đánh giá nào cho sản phẩm này.</p>
      ) : (
        <div className={styles.reviewsList}>
          {reviews.map((review) => (
            <div key={review.id} className={styles.reviewItem}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewUser}>{review.username}</div>
                <div className={styles.reviewDate}>
                  {formatDate(review.createdAt)}
                </div>
              </div>

              <div className={styles.reviewRating}>
                {renderStars(review.rating)}
              </div>

              <div className={styles.reviewText}>{review.reviewText}</div>

              {review.image && (
                <div className={styles.reviewImage}>
                  <img
                    src={`http://localhost:8080${review.image}`}
                    alt="Review"
                    className={styles.reviewImg}
                  />
                </div>
              )}

              <div className={styles.reviewUserInfo}>
                {review.username === userProfile?.username && userProfile?.avatar ? (
                  <img
                    src={`http://localhost:8080${userProfile.avatar}`}
                    alt={review.username}
                    className={styles.reviewUserAvatar}
                  />
                ) : (
                  <div className={styles.avatarPlaceholder}>
                    {review.username?.charAt(0) || "U"}
                  </div>
                )}
                <div className={styles.reviewUserDetails}>
                  <span className={styles.reviewUser}>{review.username}</span>
                  <span className={styles.reviewUserRole}>Khách Hàng</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tiêu đề */}
      <h3 className={styles.reviewsTitle}>Đánh giá của bạn</h3>

      {/* Form thêm review */}
      <div className={styles.reviewForm}>
        <h4>Viết đánh giá</h4>
        <form onSubmit={handleSubmitReview}>
          <div className={styles.fiormGroup}>
            <label>Đánh giá (bắt buộc):</label>
            <div>{renderStarInput()}</div>
          </div>

          <div className={styles.formGroup}>
            <label>Đánh giá (tùy chọn):</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder="Viết đánh giá của bạn ở đây..."
              rows="4"
              className={styles.reviewTextArea}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Tải lên hình ảnh (tùy chọn):</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files[0])}
              className={styles.imageInput}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={styles.submitButton}
          >
            {submitting ? "Submitting..." : "Gửi đánh giá"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProductReview;