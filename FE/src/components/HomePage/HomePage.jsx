
import { useEffect } from "react";
import MyHeader from "../Header/Header";
import Footer from "../Footer/Footer";
import Brand from "../Brand/Brand";
import Men from "../Men/BannerGucciMen";
import Women from "../Women/BannerGucciWomen";
import PostList from "../PostList/PostList";
import ProductList from "../ProductItem/ProductList";
import { useAppContext } from "../../context/AppContext";
import BestSellerProductList from "../BestSellerProductList/BestSellerProductList";

function HomePage() {
  const { isAuthenticated, addToCart, setIsMenuOpen } = useAppContext();

  useEffect(() => {
    console.log("isAuthenticated changed:", isAuthenticated);
    if (!isAuthenticated) {
      setIsMenuOpen(false);
    }
  }, [isAuthenticated, setIsMenuOpen]);

  const handleContainerClick = (e) => {
    if (e.target.closest("header") || e.target.closest("button") || e.target.closest("li")) {
      return;
    }
    console.log("HomePage container clicked, closing menu");
    setIsMenuOpen(false);
  };

  return (
    <div
      className="homepage-container"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      onClick={handleContainerClick}
    >
      <MyHeader />
      <div style={{ flex: "1 0 auto" }}>
        <Brand />
        <Men />
        <BestSellerProductList />
        <Women />
        <ProductList handleAddToCart={addToCart} isAuthenticated={isAuthenticated} />
        <PostList />
      </div>
      <Footer />
    </div>
  );
}

export default HomePage;
