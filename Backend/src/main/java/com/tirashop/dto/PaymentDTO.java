package com.tirashop.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PaymentDTO {
    private String paymentMethod;   // Phương thức thanh toán (COD, PAYPAL, VNPay)
    private double amount;          // Số tiền đã thanh toán
    private String status;          // Trạng thái thanh toán (PENDING, COMPLETED, FAILED)

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy HH:mm:ss")
    private LocalDateTime createdAt; // Thời gian thực hiện thanh toán
}
