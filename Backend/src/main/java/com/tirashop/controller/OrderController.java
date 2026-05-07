package com.tirashop.controller;

import com.tirashop.dto.OrderItemDTO;
import com.tirashop.dto.ShipmentDetailDTO;
import com.tirashop.dto.response.ApiResponse;
import com.tirashop.dto.response.OrderProductResponseDTO;
import com.tirashop.dto.response.RevenueResponse;
import com.tirashop.dto.response.SearchOrderItem;
import com.tirashop.model.PagedData;
import com.tirashop.persitence.entity.Shipment;
import com.tirashop.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/tirashop/orders")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderController {

    OrderService orderService;

    @GetMapping("/revenue/monthly")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyRevenue(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(orderService.getMonthlyRevenue(year, month));
    }

    @GetMapping("/cost/monthly")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyCost(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(orderService.getMonthlyCost(year, month));
    }

    @GetMapping("/profit/monthly")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyProfit(
            @RequestParam(required = false) Integer year,
            @RequestParam(required = false) Integer month) {
        return ResponseEntity.ok(orderService.getMonthlyProfit(year, month));
    }

    @GetMapping("/orders/products")
    @Operation(summary = "Get all purchased products by user with pagination", description = "Retrieve all purchased products by the user with pagination")
    public ApiResponse<PagedData<OrderProductResponseDTO>> getPurchasedProductsWithPagination(
            Authentication authentication,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "10") int size) {
        String username = authentication != null ? authentication.getName() : null;

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt")));

        PagedData<OrderProductResponseDTO> response = orderService.getPurchasedProductsWithPagination(username, pageable);

        return new ApiResponse<>("success", 200, "Purchased products retrieved", response);
    }


    @GetMapping("/revenue")
    @Operation(summary = "Get all revenue", description = "Retrieve all revenue in orders")
    public ApiResponse<RevenueResponse> getRevenueAndProductPerformance() {
        RevenueResponse response = orderService.getRevenueAndProductPerformance();
        return new ApiResponse<>("success", 200, "Get revenue", response);
    }

    @GetMapping("")
    @Operation(summary = "Get all orders", description = "Retrieve all products in orders")
    public ApiResponse<PagedData<SearchOrderItem>> getAllOrder(
            @RequestParam(required = false) String keyword,
            @PageableDefault(page = 0, size = 25, sort = "createdAt", direction = Direction.DESC) Pageable pageable
    ) {
        var items = orderService.searchOrders(keyword, pageable);
        return new ApiResponse<>("success", 200, "All product in order", items);
    }

    @PutMapping("/{orderId}/status")
    @Operation(summary = "Update order status", description = "Update the status of an order (PENDING, COMPLETED, CANCELLED)")
    public ApiResponse<String> updateOrderStatus(
            @PathVariable Long orderId,
            @RequestParam String status,
            Authentication authentication) {

        String username = authentication != null ? authentication.getName() : null;
        orderService.updateOrderStatus(orderId, username, status);
        return new ApiResponse<>("success", 200, "Order status updated to " + status, null);
    }

    @GetMapping("/pending")
    @Operation(summary = "Get pending products", description = "Retrieve all products in PENDING orders by the user")
    public ApiResponse<List<OrderItemDTO>> getPendingProducts(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        List<OrderItemDTO> pendingProducts = orderService.getProductsByStatus(username, "PENDING");
        return new ApiResponse<>("success", 200, "Pending products retrieved", pendingProducts);
    }


    @GetMapping("/cancelled")
    @Operation(summary = "Get cancelled products", description = "Retrieve all products in CANCELLED orders by the user")
    public ApiResponse<List<OrderItemDTO>> getCancelledProducts(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        List<OrderItemDTO> cancelledProducts = orderService.getProductsByStatus(username,
                "CANCELLED");
        return new ApiResponse<>("success", 200, "Cancelled products retrieved", cancelledProducts);
    }


    @GetMapping("/{orderId}/shipments")
    @Operation(summary = "Get shipment details", description = "Retrieve shipment details for an order")
    public ApiResponse<List<ShipmentDetailDTO>> getShipmentDetails(
            @PathVariable Long orderId,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        List<ShipmentDetailDTO> shipmentDetails = orderService.getShipmentDetails(orderId,
                username);
        return new ApiResponse<>("success", 200, "Shipment details retrieved", shipmentDetails);
    }

    @GetMapping("/purchased")
    @Operation(summary = "Get purchased products", description = "Retrieve all purchased products by the user")
    public ApiResponse<List<OrderItemDTO>> getPurchasedProducts(Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        List<OrderItemDTO> purchasedProducts = orderService.getPurchasedProducts(username);
        return new ApiResponse<>("success", 200, "Purchased products retrieved", purchasedProducts);
    }

    @PutMapping("/shipments/{shipmentId}/confirm")
    @Operation(summary = "Confirm delivery", description = "Confirm delivery for a shipment by the user")
    public ApiResponse<String> confirmDelivery(
            @PathVariable Long shipmentId,
            Authentication authentication) {
        String username = authentication != null ? authentication.getName() : null;
        orderService.confirmDelivery(shipmentId, username);
        return new ApiResponse<>("success", 200, "Delivery confirmed", null);
    }

    @PutMapping("/shipments/{shipmentId}/status")
    @Operation(summary = "Update shipment status", description = "Update the status of a shipment (Admin only)")
    public ApiResponse<String> updateShipmentStatus(
            @PathVariable Long shipmentId,
            @RequestParam String status) {
        Shipment.ShipmentStatus shipmentStatus = Shipment.ShipmentStatus.valueOf(
                status.toUpperCase());
        orderService.updateShipmentStatus(shipmentId, shipmentStatus);
        return new ApiResponse<>("success", 200, "Shipment status updated", null);
    }
}
