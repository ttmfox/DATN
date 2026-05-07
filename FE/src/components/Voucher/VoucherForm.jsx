import { useState } from "react";
import { toast } from "react-toastify";
import styles from "./VoucherForm.module.scss";

const VoucherForm = ({
  subtotal,
  setVoucherDiscount,
  voucherCode,
  setVoucherCode,
  setDiscountPercentage, // Nhận từ props
}) => {
  const [loading, setLoading] = useState(false);
  const [isVoucherValid, setIsVoucherValid] = useState(false);
  const [discountPercentage, setLocalDiscountPercentage] = useState(0); // Đổi tên để tránh xung đột

  // Hàm parse ngày từ định dạng dd-MM-yyyy
  const parseDate = (dateString) => {
    const [day, month, year] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const applyVoucher = async () => {
    if (!voucherCode) {
      toast.error("Please enter a voucher code");
      setIsVoucherValid(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/tirashop/voucher/validate?code=${voucherCode}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.status === "success" && data.data) {
        const voucher = data.data;
        const currentDate = new Date();
        const startDate = parseDate(voucher.startDate);
        const endDate = parseDate(voucher.endDate);

        if (
          voucher.status === "ACTIVE" &&
          startDate <= currentDate &&
          endDate >= currentDate
        ) {
          let discount = 0;
          if (voucher.discountType === "PERCENTAGE") {
            discount = (subtotal * voucher.discountValue) / 100;
            discount = Math.min(discount, subtotal);
            setDiscountPercentage(voucher.discountValue); // Sử dụng setDiscountPercentage từ props
            setLocalDiscountPercentage(voucher.discountValue); // Cập nhật state nội bộ để hiển thị
          } else {
            discount = voucher.discountValue || 0;
            setDiscountPercentage(0); // Sử dụng từ props
            setLocalDiscountPercentage(0);
          }
          setVoucherDiscount(discount);
          setIsVoucherValid(true);
          toast.success("Voucher applied successfully!");
        } else {
          throw new Error("Invalid or expired voucher");
        }
      } else {
        throw new Error(data.message || "Invalid voucher code");
      }
    } catch (err) {
      setVoucherDiscount(0);
      setIsVoucherValid(false);
      setDiscountPercentage(0); // Sử dụng từ props
      setLocalDiscountPercentage(0);
      setVoucherCode("");
      toast.error(err.message || "Error applying voucher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.formSection}>
      <h3>Mã Giảm Giá (Optional)</h3>
      <div className={styles.voucherInput}>
        <input
          type="text"
          value={voucherCode}
          onChange={(e) => {
            setVoucherCode(e.target.value);
            setIsVoucherValid(false);
            setDiscountPercentage(0); // Sử dụng từ props
            setLocalDiscountPercentage(0);
          }}
          placeholder="Nhập mã giảm giá"
          className={styles.voucherField}
        />
        <button
          type="button"
          onClick={applyVoucher}
          disabled={loading || !voucherCode}
          className={styles.applyVoucherBtn}
        >
          {loading ? "Applying..." : "Nhập"}
        </button>
      </div>
      {isVoucherValid && discountPercentage > 0 && (
        <p className={styles.discountInfo}>
          Applied {discountPercentage}% discount
        </p>
      )}
    </div>
  );
};

export default VoucherForm;