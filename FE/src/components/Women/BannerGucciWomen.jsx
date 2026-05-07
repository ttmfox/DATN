import { useNavigate } from "react-router-dom";
import styles from "./styles.module.scss";

export default function BannerGucciWomen() {  
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate("/category/all")
  }
  return (
    <div className={styles.bannerContainer}>
      <div className={styles.imgBanner}>
        <div className={styles.title}>
          <button className={styles.categoryButton} onClick={handleNavigate}>Nữ Tính</button>
          <h1>Sản Phẩm Mềm mại bền lâu</h1>
          <h2>Versace</h2>
          <button className={styles.discoverButton} onClick={handleNavigate}>khám phá thêm</button>
        </div>
      </div>
    </div>
  );
}
