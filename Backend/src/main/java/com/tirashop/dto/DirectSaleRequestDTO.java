package com.tirashop.dto;

import lombok.Data;

import java.util.List;


@Data
public class DirectSaleRequestDTO {
    private String customerUsername;
    private List<DirectSaleItemDTO> items;
    private String voucherCode;
    private String paymentMethod;
    private String guestName;
}
