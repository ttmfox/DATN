package com.tirashop.service;

import com.tirashop.dto.OrderItemDTO;
import com.tirashop.dto.ShipmentDetailDTO;
import com.tirashop.dto.response.OrderProductResponseDTO;
import com.tirashop.dto.response.RevenueResponse;
import com.tirashop.dto.response.RevenueResponse.ProductPerformance;
import com.tirashop.dto.response.SearchOrderItem;
import com.tirashop.model.PagedData;
import com.tirashop.persitence.entity.*;
import com.tirashop.persitence.repository.OrderRepository;
import com.tirashop.persitence.repository.ProductRepository;
import com.tirashop.persitence.repository.ShipmentRepository;
import com.tirashop.persitence.specification.OrderSpecification;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;

import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class OrderService {


    ShipmentRepository shipmentRepository;
    OrderRepository orderRepository;
    ProductRepository productRepository;

    @Transactional
    public void adminUpdateOrderStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        Order.OrderStatus newStatus;
        try {
            newStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Trạng thái không hợp lệ: " + status);
        }

        if (order.getStatus() == newStatus) {
            log.info("[ADMIN] Đơn #{} đã ở trạng thái {}, bỏ qua.", orderId, newStatus);
            return;
        }

        Order.OrderStatus oldStatus = order.getStatus();
        if (oldStatus == Order.OrderStatus.CANCELLED
                && (newStatus == Order.OrderStatus.COMPLETED
                || newStatus == Order.OrderStatus.PENDING)) {

            for (OrderItem item : order.getOrderItems()) {
                Product product = productRepository.findByIdWithLock(item.getProduct().getId())
                        .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProduct().getId()));

                if (product.getInventory() < item.getQuantity()) {
                    throw new RuntimeException(
                            "Sản phẩm \"" + product.getName() + "\" không đủ tồn kho để khôi phục đơn hàng. " +
                                    "Tồn kho: " + product.getInventory() + ", Cần: " + item.getQuantity()
                    );
                }

                int before = product.getInventory();
                product.setInventory(before - item.getQuantity());
                productRepository.save(product);

                log.info("[ADMIN-REOPEN] Trừ lại tồn kho - SP: '{}' | {} → {}",
                        product.getName(), before, product.getInventory());
            }
            log.info("[ADMIN-REOPEN] Đơn #{} mở lại | Trừ kho {} sản phẩm", orderId, order.getOrderItems().size());
        }

        if (newStatus == Order.OrderStatus.CANCELLED
                && oldStatus != Order.OrderStatus.CANCELLED) {

            for (OrderItem item : order.getOrderItems()) {
                Product product = productRepository.findByIdWithLock(item.getProduct().getId())
                        .orElseThrow(() -> new RuntimeException("Product not found: " + item.getProduct().getId()));

                int before = product.getInventory();
                product.setInventory(before + item.getQuantity());
                productRepository.save(product);

                log.info("[ADMIN-CANCEL] Hoàn tồn kho - SP: '{}' | {} → {}",
                        product.getName(), before, product.getInventory());
            }
            log.info("[ADMIN-CANCEL] Đơn #{} huỷ | Hoàn kho {} sản phẩm", orderId, order.getOrderItems().size());
        }

        order.setStatus(newStatus);
        orderRepository.save(order);
        log.info("[ADMIN] Đơn #{} | {} → {}", orderId, oldStatus, newStatus);
    }


    public List<Map<String, Object>> getMonthlyRevenue(Integer year, Integer month) {
        return convertToList(orderRepository.getMonthlyRevenue(year, month), "month", "revenue");
    }

    public List<Map<String, Object>> getMonthlyCost(Integer year, Integer month) {
        return convertToList(orderRepository.getMonthlyCost(year, month), "month", "cost");
    }

    public List<Map<String, Object>> getMonthlyProfit(Integer year, Integer month) {
        return convertToList(orderRepository.getMonthlyProfit(year, month), "month", "profit");
    }

    private List<Map<String, Object>> convertToList(List<Object[]> rawData, String monthKey, String valueKey) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : rawData) {
            Map<String, Object> map = new HashMap<>();
            map.put(monthKey, row[0]);
            map.put(valueKey, row[1]);
            result.add(map);
        }
        return result;
    }


    public boolean hasUserPurchasedProduct(String username, Long productId) {
        return orderRepository.existsByUserUsernameAndProductIdAndStatus(username, productId, Order.OrderStatus.COMPLETED);
    }


    public PagedData<OrderProductResponseDTO> getPurchasedProductsWithPagination(String username, Pageable pageable) {
        Page<Order> ordersPage = orderRepository.findByUser_UsernameAndStatus(username, Order.OrderStatus.COMPLETED, pageable);

        List<OrderProductResponseDTO> orderProductResponseList = ordersPage.stream()
                .flatMap(order -> order.getOrderItems().stream().map(orderItem -> {
                    double totalPrice = orderItem.getPrice() * orderItem.getQuantity();


                    double discount = 0;
                    if (order.getVoucher() != null) {
                        if (order.getVoucher().getDiscountType() == Voucher.DiscountType.PERCENTAGE) {
                            discount = totalPrice * (order.getVoucher().getDiscountValue() / 100);
                        } else if (order.getVoucher().getDiscountType() == Voucher.DiscountType.FIXED) {
                            discount = order.getVoucher().getDiscountValue();
                        }
                    }

                    double priceAfterDiscount = totalPrice - discount;

                    String voucherCode = order.getVoucher() != null ? order.getVoucher().getCode() : "No voucher";

                    return new OrderProductResponseDTO(
                            orderItem.getProduct().getName(),
                            orderItem.getProduct().getImages() != null && !orderItem.getProduct().getImages().isEmpty()
                                    ? orderItem.getProduct().getImages().get(0).getUrl() : null,
                            orderItem.getProduct().getBrand() != null ? orderItem.getProduct().getBrand().getName() : null,
                            orderItem.getProduct().getCategory() != null ? orderItem.getProduct().getCategory().getName() : null,
                            orderItem.getProduct().getSize(),
                            priceAfterDiscount, // Hiển thị giá sau khi trừ voucher
                            orderItem.getQuantity(),
                            order.getShippingAddress(), // Assuming `getShippingAddress()` is a method in `Order` entity
                            order.getPayments() != null && !order.getPayments().isEmpty() ? order.getPayments().get(0).getPaymentMethod().name() : null,
                            voucherCode, // Sử dụng voucherCode đã kiểm tra null
                            order.getStatus().name()
                    );
                }))
                .collect(Collectors.toList());

        // Trả về PagedData với các thông tin phân trang
        return new PagedData<>(
                ordersPage.getNumber(),                  // pageNo
                ordersPage.getSize(),                    // elementPerPage
                ordersPage.getTotalElements(),           // totalElements
                ordersPage.getTotalPages(),              // totalPages
                orderProductResponseList                 // elementList
        );
    }



    public RevenueResponse getRevenueAndProductPerformance() {
        // Fetch all completed orders
        List<Order> completedOrders = orderRepository.findByStatus(Order.OrderStatus.COMPLETED);

        // Calculate total revenue and product performance
        double totalRevenue = 0.0;
        Map<Long, ProductPerformance> productPerformanceMap = new HashMap<>();

        for (Order order : completedOrders) {
            for (OrderItem orderItem : order.getOrderItems()) {
                Product product = orderItem.getProduct();
                double itemRevenue = orderItem.getPrice() * orderItem.getQuantity();
                totalRevenue += itemRevenue;

                // Update product performance
                productPerformanceMap.compute(product.getId(), (key, existing) -> {
                    if (existing == null) {
                        return new RevenueResponse.ProductPerformance(
                                product.getId(),
                                product.getName(),
                                product.getCode(),
                                orderItem.getQuantity(),
                                itemRevenue
                        );
                    } else {
                        existing.setTotalQuantitySold(
                                existing.getTotalQuantitySold() + orderItem.getQuantity());
                        existing.setTotalRevenue(existing.getTotalRevenue() + itemRevenue);
                        return existing;
                    }
                });
            }
        }

        // Convert map to list
        List<RevenueResponse.ProductPerformance> productPerformances = productPerformanceMap.values()
                .stream()
                .collect(Collectors.toList());

        return new RevenueResponse(totalRevenue, productPerformances);
    }


    public PagedData<SearchOrderItem> searchOrders(String keyword, Pageable pageable) {
        var orderSpec = OrderSpecification.searchOrders(keyword);
        var orderPage = orderRepository.findAll(orderSpec, pageable);

        List<SearchOrderItem> orderItems = orderPage.getContent().stream().flatMap(order ->
                order.getOrderItems().stream().map(orderItem -> {
                    Shipment shipment = order.getShipments().stream()
                            .filter(s -> s.getOrderItem() != null && s.getOrderItem().getId().equals(orderItem.getId()))
                            .findFirst()
                            .orElse(null);

                    String paymentMethod = order.getPayments().isEmpty()
                            ? null
                            : order.getPayments().get(0).getPaymentMethod().name();

                    return new SearchOrderItem(
                            order.getId(),
                            order.getUser().getUsername(),
                            orderItem.getProduct().getName(),
                            orderItem.getProduct().getBrand() != null ? orderItem.getProduct().getBrand().getName() : null,
                            orderItem.getProduct().getCategory() != null ? orderItem.getProduct().getCategory().getName() : null,
                            orderItem.getProduct().getSize(),
                            orderItem.getQuantity(),
                            orderItem.getPrice(),
                            orderItem.getProduct().getImages() != null && !orderItem.getProduct().getImages().isEmpty()
                                    ? orderItem.getProduct().getImages().get(0).getUrl()
                                    : null,
                            order.getStatus().name(),
                            paymentMethod,
                            shipment != null ? shipment.getId() : null,
                            shipment != null ? shipment.getStatus().name() : null,
                            order.getCreatedAt()
                    );
                })
        ).collect(Collectors.toList());

        return new PagedData<>(
                orderPage.getNumber(),
                orderPage.getSize(),
                orderPage.getTotalElements(),
                orderPage.getTotalPages(),
                orderItems
        );
    }


    public List<OrderItemDTO> getProductsByStatus(String username, String status) {
        if (username == null) {
            throw new RuntimeException("User must be logged in");
        }

        Order.OrderStatus orderStatus;
        try {
            orderStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid order status: " + status);
        }

        List<Order> orders = orderRepository.findByUser_UsernameAndStatus(username, orderStatus);

        return orders.stream()
                .flatMap(order -> order.getOrderItems().stream())
                .map(orderItem -> {
                    Product product = orderItem.getProduct();
                    String productImage =
                            product.getImages() != null && !product.getImages().isEmpty()
                                    ? product.getImages().get(0).getUrl()
                                    : null;

                    return new OrderItemDTO(
                            product.getId(),
                            product.getName(),
                            product.getBrand() != null ? product.getBrand().getName() : null,
                            product.getCategory() != null ? product.getCategory().getName() : null,
                            product.getSize(),
                            product.getInventory(),
                            orderItem.getQuantity(),
                            orderItem.getPrice(),
                            productImage,
                            orderItem.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());
    }

    public List<ShipmentDetailDTO> getShipmentDetails(Long orderId, String username) {
        List<Shipment> shipments = shipmentRepository.findByOrder_Id(orderId);

        return shipments.stream()
                .map(shipment -> toShipmentDetailDTO(shipment))
                .collect(Collectors.toList());
    }

    public void updateOrderStatus(Long orderId, String username, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (!order.getUser().getUsername().equals(username)) {
            throw new RuntimeException("You are not authorized to update this order status.");
        }

        Order.OrderStatus newStatus;
        try {
            newStatus = Order.OrderStatus.valueOf(status.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid order status provided.");
        }

        order.setStatus(newStatus);
        orderRepository.save(order);
    }


    public List<OrderItemDTO> getPurchasedProducts(String username) {
        if (username == null) {
            throw new RuntimeException("User must be logged in");
        }

        List<Order> completedOrders = orderRepository.findByUser_UsernameAndStatus(username,
                Order.OrderStatus.COMPLETED);

        return completedOrders.stream()
                .flatMap(order -> order.getOrderItems()
                        .stream())
                .map(orderItem -> {
                    Product product = orderItem.getProduct();
                    String productImage =
                            product.getImages() != null && !product.getImages().isEmpty()
                                    ? product.getImages().get(0).getUrl()
                                    : null;

                    return new OrderItemDTO(
                            product.getId(),
                            product.getName(),
                            product.getBrand() != null ? product.getBrand().getName() : null,
                            product.getCategory() != null ? product.getCategory().getName() : null,
                            product.getSize(),
                            product.getInventory(),
                            orderItem.getQuantity(),
                            orderItem.getPrice(),
                            productImage,
                            orderItem.getCreatedAt()
                    );
                })
                .collect(Collectors.toList());
    }

    public void confirmDelivery(Long shipmentId, String username) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));

        if (!shipment.getOrder().getUser().getUsername().equals(username)) {
            throw new RuntimeException("You are not authorized to confirm this shipment.");
        }

        if (shipment.getStatus() != Shipment.ShipmentStatus.DELIVERED) {
            throw new RuntimeException("Shipment must be in DELIVERED status to confirm.");
        }

        shipment.setStatus(Shipment.ShipmentStatus.DELIVERED);
        shipmentRepository.save(shipment);
    }

    public void updateShipmentStatus(Long shipmentId, Shipment.ShipmentStatus status) {
        Shipment shipment = shipmentRepository.findById(shipmentId)
                .orElseThrow(() -> new RuntimeException("Shipment not found"));

        shipment.setStatus(status);
        shipmentRepository.save(shipment);
    }

    private ShipmentDetailDTO toShipmentDetailDTO(Shipment shipment) {
        OrderItem orderItem = shipment.getOrderItem();
        String productImage = orderItem != null && orderItem.getProduct().getImages() != null
                && !orderItem.getProduct().getImages().isEmpty()
                ? orderItem.getProduct().getImages().get(0).getUrl()
                : null;

        return new ShipmentDetailDTO(
                shipment.getId(),
                shipment.getTrackingNumber(),
                shipment.getShippingMethod(),
                shipment.getStatus().name(),
                orderItem != null ? orderItem.getProduct().getId() : null,
                orderItem != null ? orderItem.getProduct().getName() : null,
                productImage,
                orderItem != null ? orderItem.getQuantity() : 0,
                shipment.getCreatedAt()
        );
    }
}
