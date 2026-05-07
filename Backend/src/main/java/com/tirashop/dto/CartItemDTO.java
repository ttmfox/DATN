package com.tirashop.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CartItemDTO {

    private Long id;  // Mã sản phẩm trong giỏ hàng

    private Long cartId;  // Mã giỏ hàng

    private Long productId;  // Mã sản phẩm

    private String productName;  // Tên sản phẩm

    private String productCategory;  // Tên danh mục sản phẩm

    private String productSize;  // Kích thước sản phẩm

    private double productPrice;  // Giá sản phẩm

    private String productImage;  // URL ảnh sản phẩm

    private int quantity;  // Số lượng sản phẩm

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy HH:mm:ss")
    private LocalDateTime createdAt;  // Thời gian thêm vào giỏ hàng
}
