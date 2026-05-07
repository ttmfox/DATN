package com.tirashop.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RevenueResponse {
    private double totalRevenue;
    private List<ProductPerformance> productPerformances;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProductPerformance {
        private Long productId;
        private String productName;
        private String productCode; // Optional, based on your need
        private int totalQuantitySold;
        private double totalRevenue;
    }
}