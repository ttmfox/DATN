package com.tirashop.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SearchOrderItem {
    private Long orderId;
    private String username;
    private String productName;
    private String brandName;
    private String categoryName;
    private String size;
    private int quantity;
    private double price;
    private String productImage;

    private String orderStatus;
    private String paymentMethod;
    private Long shipmentId; 
    private String shipmentStatus;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy HH:mm:ss")
    private LocalDateTime createdAt;

}
