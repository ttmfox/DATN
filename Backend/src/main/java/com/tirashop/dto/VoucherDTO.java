package com.tirashop.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.tirashop.persitence.entity.Voucher.DiscountType;
import com.tirashop.persitence.entity.Voucher.VoucherStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VoucherDTO {

    private Long id; // Mã giảm giá

    private String code; // Mã voucher

    private DiscountType discountType; // Loại giảm giá

    private double discountValue; // Giá trị giảm giá

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private LocalDate startDate; // Ngày bắt đầu áp dụng voucher

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private LocalDate endDate; // Ngày kết thúc áp dụng voucher

    private VoucherStatus status; // Trạng thái của voucher

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private LocalDate createdAt; // Thời gian tạo voucher

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private LocalDate updatedAt; // Thời gian cập nhật voucher
}
