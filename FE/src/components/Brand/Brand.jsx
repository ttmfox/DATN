import { useNavigate } from "react-router-dom";
import styles from "./styles.module.scss";
import bag from "../../assets/icons/images/Bag.jpg";
import shose from "../../assets/icons/images/Shose.webp";
import sneaker from "../../assets/icons/images/Sneaker.jpg";
import handleBag from "../../assets/icons/images/HandleBag.webp";

export default function Brand() {
  const navigate = useNavigate();

  // Ánh xạ thủ công giữa thương hiệu và categoryId (thay đổi theo dữ liệu thực tế)
  const brandToCategoryMap = {
    Versace: 1, // Giả sử categoryId = 1 cho Versace
    Zara: 2, // Giả sử categoryId = 2 cho Zara
    Calvin: 3, // Giả sử categoryId = 3 cho Calvin
    Gucci: 4, // Giả sử categoryId = 4 cho Gucci
  };

  const handleBrandClick = (brandName) => {
    const categoryId = brandToCategoryMap[brandName];
    if (categoryId) {
      navigate(``);
    } else {
      console.warn(`No category mapped for brand: ${brandName}`);
    }
  };

  return (
    <div className={styles.brandContainer}>
      <h1 className={styles.brandTitle}>Selected with Care</h1>
      <div className={styles.brandList}>
        <div
          className={styles.brandItem}
          onClick={() => handleBrandClick("Versace")}
        >
          <img src={bag} alt="Versace" className={styles.brandImage} />
          <p className={styles.brandName}>Versace</p>
        </div>
        <div
          className={styles.brandItem}
          onClick={() => handleBrandClick("Zara")}
        >
          <img src={shose} alt="Zara" className={styles.brandImage} />
          <p className={styles.brandName}>Zara</p>
        </div>
        <div
          className={styles.brandItem}
          onClick={() => handleBrandClick("Calvin")}
        >
          <img src={sneaker} alt="Calvin" className={styles.brandImage} />
          <p className={styles.brandName}>Calvin</p>
        </div>
        <div
          className={styles.brandItem}
          onClick={() => handleBrandClick("Gucci")}
        >
          <img src={handleBag} alt="Gucci" className={styles.brandImage} />
          <p className={styles.brandName}>Gucci</p>
        </div>
      </div>
    </div>
  );
}
