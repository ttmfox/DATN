package com.tirashop.dto;


import lombok.Builder;
import lombok.Getter;

@Builder
@Getter
public class PaymentResultDTO {
    private Long orderId;
    private boolean success;
    private String message;
    private String transactionId;
}