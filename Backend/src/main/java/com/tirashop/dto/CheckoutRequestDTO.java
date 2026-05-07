package com.tirashop.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CheckoutRequestDTO {
    private String shippingAddress;
    private String paymentMethod;
    private String voucherCode;
    private String shippingMethod;
}

