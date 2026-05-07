import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Footer from "../Footer/Footer";
import styles from "./detailStyles.module.scss";
import { marked } from "marked";
import DOMPurify from "dompurify";

function DetailPostList() {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const { postId } = useParams();
  const navigate = useNavigate();

  const fetchPostDetail = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const url = `http://localhost:8080/tirashop/posts/${postId}`;
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        localStorage.removeItem("token");
        navigate("/auth");
        return;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch post: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "success" && data.data) {
        setPost(data.data);
      } else {
        throw new Error("Post not found");
      }
    } catch (err) {
      console.error("Error fetching post:", err);
      toast.error(err.message);
      navigate("/posts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetail();
  }, [postId]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading post details...</p>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <>
      <div className={styles.detailContainer}>
        <button
          className={styles.backButton}
          onClick={() => navigate("/posts")}
        >
          ← Quay lại
        </button>

        <div className={styles.postHeader}>
          <h1 className={styles.postTitle}>{post.name || "Untitled"}</h1>
          <div className={styles.postMeta}>
            <div className={styles.authorInfo}>
              <div className={styles.authorAvatar}>
                {(post.authorName || "A")[0].toUpperCase()}
              </div>
              <span className={styles.authorName}>
                {post.authorName || "Anonymous"}
              </span>
            </div>
            <span className={styles.postDate}>{post.createdAt}</span>
          </div>
        </div>

        <div className={styles.postContent}>
          <img
            src={
              post.imageUrl
                ? `http://localhost:8080${post.imageUrl}`
                : "https://via.placeholder.com/800x400"
            }
            alt={post.name || "Post Image"}
            className={styles.postImage}
          />
          {post.topic && <div className={styles.postTopic}>{post.topic}</div>}
          {post.content && (
            <div className={styles.postFullContent}>
              <div
                className={styles.markdownContent}
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(marked.parse(post.content)),
                }}
              />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default DetailPostList;