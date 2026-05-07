import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./styles.module.scss";

function PostList() {
  const [posts, setPosts] = useState([]);
  const [currentPosts, setCurrentPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const postsPerPage = 3;
  const navigate = useNavigate();

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const url = "http://localhost:8080/tirashop/posts?author=";
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch posts: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "success" && data.data?.elementList?.length > 0) {
        setPosts(data.data.elementList);
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (posts.length > 0) {
      const indexOfLastPost = (currentPage + 1) * postsPerPage;
      const indexOfFirstPost = indexOfLastPost - postsPerPage;
      setCurrentPosts(posts.slice(indexOfFirstPost, indexOfLastPost));
    }
  }, [posts, currentPage]);

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostClick = (postId) => {
    navigate(`/post/${postId}`);
  };

  const totalPages = Math.ceil(posts.length / postsPerPage);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading news...</p>
      </div>
    );
  }

  return (
    <div className={styles.postListContainer}>
      <div className={styles.postHeader}>
        <h1 className={styles.postTitle}>Tin Tức</h1>
      </div>

      {currentPosts.length > 0 ? (
        <>
          <div className={styles.postGrid}>
            {currentPosts.map((post) => {
              const imageUrl = post.imageUrl
                ? `http://localhost:8080${post.imageUrl}`
                : "https://via.placeholder.com/250";

              return (
                <div
                  key={post.id}
                  className={styles.postCard}
                  onClick={() => handlePostClick(post.id)}
                >
                  <div className={styles.postImageWrapper}>
                    <img
                      src={imageUrl}
                      alt={post.name || "News Image"}
                      className={styles.postImage}
                    />
                    <div className={styles.postTopic}>
                      {post.topic || "General"}
                    </div>
                  </div>
                  <div className={styles.postDetails}>
                    <h3 className={styles.postName}>
                      {post.name || "Untitled"}
                    </h3>
                    <p className={styles.postShortDescription}>
                      {post.short_description || "No description available"}
                    </p>
                    <div className={styles.postMeta}>
                      <div className={styles.postAuthorInfo}>
                        <div className={styles.postAuthorAvatar}>
                          {(post.authorName || "A")[0].toUpperCase()}
                        </div>
                        <span className={styles.postAuthorName}>
                          {post.authorName || "Anonymous"}
                        </span>
                      </div>
                      <span className={styles.postDate}>{post.createdAt}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className={styles.pagination}>
            <button
              className={styles.pageButton}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 0))}
              disabled={currentPage === 0}
            >
              Trước
            </button>
            <span className={styles.pageNumber}>
              Trang {currentPage + 1} trong tổng số {totalPages}
            </span>
            <button
              className={styles.pageButton}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages - 1))
              }
              disabled={currentPage === totalPages - 1}
            >
              Sau
            </button>
          </div>
        </>
      ) : (
        <div className={styles.emptyPostContainer}>
          <div className={styles.emptyPostIcon}>📭</div>
          <p>No news available at the moment</p>
          <button className={styles.refreshButton} onClick={fetchPosts}>
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}

export default PostList;