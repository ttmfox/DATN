import styles from "./styles.module.scss";
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";
import { useEffect, useRef } from 'react';
import goongjs from '@goongmaps/goong-js';
import '@goongmaps/goong-js/dist/goong-js.css';

function Footer() {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);

  // Khởi tạo bản đồ đơn giản
  useEffect(() => {
    goongjs.accessToken = 'qM35eQ7w1or6MWNEoAXQPUQDZwIdeljIPEGaxdkF';

    mapInstance.current = new goongjs.Map({
      container: mapRef.current,
      style: 'https://tiles.goong.io/assets/goong_map_web.json',
      center: [105.7478, 21.0381], // Tọa độ BTEC FPT, Trịnh Văn Bô
      zoom: 15,
    });

    // Thêm điểm đánh dấu tại BTEC FPT
    new goongjs.Marker()
      .setLngLat([105.7478, 21.0381])
      .addTo(mapInstance.current);

    return () => {
      if (mapInstance.current) mapInstance.current.remove();
    };
  }, []);

  return (
    <>
      {/* Khối màu đỏ phía trên footer */}
      <div className={styles.preFooter}>
        <div className={styles.preFooterContainer}>
          <div className={styles.preFooterIntro}>
            <h2 className={styles.preFooterLogo}>TIRA SHOP</h2>
            <p className={styles.preFooterText}>
              Tira Shop tự hào là nhà phân phối thời trang cao cấp hàng đầu Việt Nam, mang đến cho khách hàng những sản phẩm chất lượng từ các thương hiệu nổi tiếng như Playboy, True Religion, CPTN Apparel, Jungles, ALLSAINTS,... Với sứ mệnh mang đến phong cách thời trang hiện đại và tinh tế, Tira Shop cam kết mang đến dịch vụ tốt nhất, từ tư vấn đến giao hàng nhanh chóng. Chúng tôi luôn trân trọng khách hàng và không ngừng nỗ lực mang đến trải nghiệm mua sắm tuyệt vời nhất.
            </p>
          </div>
        </div>
      </div>

      {/* Footer hiện tại */}
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>
          {/* Cột 1 - Hỗ trợ khách hàng */}
          <div className={styles.footerColumn}>
            <h2 className={styles.footerTitle}>Hỗ trợ khách hàng</h2>
            <ul className={styles.footerList}>
              <li><a href="/contact" className={styles.footerLink}>Liên hệ với chúng tôi</a></li>
              <li><a href="/orders" className={styles.footerLink}>Theo dõi đơn hàng</a></li>
              <li><a href="/faqs" className={styles.footerLink}>Câu hỏi thường gặp</a></li>
              <li><a href="/shipping" className={styles.footerLink}>Vận chuyển & Trả hàng</a></li>
              <li><a href="/sitemap" className={styles.footerLink}>Sơ đồ trang web</a></li>
            </ul>
          </div>

          {/* Cột 2 - Thông tin công ty */}
          <div className={styles.footerColumn}>
            <h2 className={styles.footerTitle}>Về Tira Shop</h2>
            <ul className={styles.footerList}>
              <li><a href="/about" className={styles.footerLink}>Câu chuyện của chúng tôi</a></li>
              <li><a href="/careers" className={styles.footerLink}>Cơ hội việc làm</a></li>
              <li><a href="/sustainability" className={styles.footerLink}>Bền vững</a></li>
              <li><a href="/terms" className={styles.footerLink}>Điều khoản & Điều kiện</a></li>
              <li><a href="/privacy" className={styles.footerLink}>Chính sách bảo mật</a></li>
            </ul>
          </div>

          {/* Cột 3 - Kết nối */}
          <div className={styles.footerColumn}>
            <h2 className={styles.footerTitle}>Kết nối với chúng tôi</h2>
            <div className={styles.socialIcons}>
              <a href="https://facebook.com" className={styles.socialLink}><FaFacebookF /></a>
              <a href="https://twitter.com" className={styles.socialLink}><FaTwitter /></a>
              <a href="https://instagram.com" className={styles.socialLink}><FaInstagram /></a>
              <a href="https://youtube.com" className={styles.socialLink}><FaYoutube /></a>
            </div>
          </div>

          {/* Cột 4 - Bản đồ */}
          <div className={styles.footerColumn}>
            <h2 className={styles.footerTitle}>Vị trí của chúng tôi</h2>
            <div ref={mapRef} className={styles.footerMap} />
            <p className={styles.footerText}>
              BTEC FPT, Đường Trịnh Văn Bô, Xuân Phương, Nam Từ Liêm, Hà Nội, Việt Nam
            </p>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.footerBottomContainer}>
            <p className={styles.footerCopyright}>
              © {new Date().getFullYear()} Tira Shop. Mọi quyền được bảo lưu.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}

export default Footer;