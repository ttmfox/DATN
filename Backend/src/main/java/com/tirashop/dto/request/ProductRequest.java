package com.tirashop.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProductRequest {

    private String name;

    private String code;

    private String description;

    private String material;

    private double price;

    private Double OriginalPrice;

    private int quantity;

    private String status;

    private String size;

    private Long categoryId; // Thay đổi thành CategoryDTO

    private Long brandId; // Thay đổi thành BrandDTO

    private int inventory;

    private String tagName;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private LocalDate createdAt;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private LocalDate updatedAt;

}
