import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import styles from "./VoucherPage.module.scss";
import Footer from "../Footer/Footer";

const VoucherPage = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const parseDate = (dateStr) => {
    try {
      const [day, month, year] = dateStr.split("-");
      const date = new Date(`${year}-${month}-${day}`);
      if (isNaN(date.getTime())) {
        return "Invalid Date";
      }

      const formattedDay = String(date.getDate()).padStart(2, "0");
      const formattedMonth = String(date.getMonth() + 1).padStart(2, "0");
      const formattedYear = date.getFullYear();

      return `${formattedDay}/${formattedMonth}/${formattedYear}`;
    } catch {
      return "Invalid Date";
    }
  };


  const fetchVouchers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:8080/tirashop/voucher", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.status === "success" && data.data?.elementList) {
        setVouchers(data.data.elementList);
      } else {
        setError(data.message || "Failed to fetch vouchers");
        toast.error(data.message || "Failed to fetch vouchers");
      }
    } catch (err) {
      setError("Error fetching vouchers");
      toast.error("Error fetching vouchers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentVouchers = vouchers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(vouchers.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <div className={styles.voucherPage}>
        <h1>Mã Giảm Giá</h1>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : vouchers.length === 0 ? (
          <p>No vouchers found.</p>
        ) : (
          <>
            <div className={styles.voucherList}>
              {currentVouchers.map((voucher) => (
                <div key={voucher.id} className={styles.voucherCard}>
                  <h3>{voucher.code}</h3>
                  <p>
                    <strong>Giảm Giá: </strong>
                    {voucher.discountType === "PERCENTAGE"
                      ? `${voucher.discountValue}%`
                      : `$${voucher.discountValue}`}
                  </p>
                  <p>
                    <strong>Bắt Đầu: </strong>
                    {parseDate(voucher.startDate)}
                  </p>
                  <p>
                    <strong>Kết Thúc: </strong>
                    {parseDate(voucher.endDate)}
                  </p>
                  <p>
                    <strong>Trạng Thái: </strong>
                    <span
                      className={
                        voucher.status === "ACTIVE"
                          ? styles.statusActive
                          : styles.statusInactive
                      }
                    >
                      {voucher.status}
                    </span>
                  </p>
                </div>
              ))}
            </div>

            {/* Phân trang */}
            <div className={styles.pagination}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    onClick={() => paginate(number)}
                    className={styles.pageButton}
                    style={
                      currentPage === number
                        ? { backgroundColor: "#007bff", color: "white" }
                        : {}
                    }
                  >
                    {number}
                  </button>
                )
              )}
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default VoucherPage;