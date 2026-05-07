package com.tirashop.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AddToCartRequest {

    private Long productId;  // Mã sản phẩm cần thêm vào giỏ hàng

    private int quantity;  // Số lượng sản phẩm cần thêm
}
