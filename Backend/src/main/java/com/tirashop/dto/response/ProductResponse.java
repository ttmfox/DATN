package com.tirashop.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductResponse {
    private Long id;

    private String name;

    private String code;

    private String description;

    private String material;

    private double price;

    private Double OriginalPrice;

    private int quantity;

    private String status;

    private String size;

    private Long categoryId;

    private Long brandId;

    private int inventory;

    private String tagName;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private LocalDate createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private LocalDate updatedAt;

    private Double averageRating;

    private Boolean isBestSeller;


}
