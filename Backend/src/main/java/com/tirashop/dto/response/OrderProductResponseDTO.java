package com.tirashop.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class OrderProductResponseDTO {
    private String productName;
    private String productImage;
    private String brand;
    private String category;
    private String size;
    private double totalPrice;
    private int quantity;
    private String shipmentAddress;
    private String paymentMethod;
    private String voucherCode;
    private String orderStatus;
}
