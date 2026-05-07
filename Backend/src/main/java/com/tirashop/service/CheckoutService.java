package com.tirashop.service;

import com.tirashop.dto.CheckoutRequestDTO;
import com.tirashop.dto.OrderDTO;
import com.tirashop.dto.OrderItemDTO;
import com.tirashop.persitence.entity.*;
import com.tirashop.persitence.repository.*;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CheckoutService {

    CartRepository cartRepository;
    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;
    PaymentRepository paymentRepository;
    ShipmentRepository shipmentRepository;
    ProductRepository productRepository;
    UserRepository userRepository;
    VoucherRepository voucherRepository;

    private static final double STANDARD_SHIPPING_FEE = 25000;
    private static final double EXPRESS_SHIPPING_FEE = 90000;

    public OrderDTO checkout(String username, CheckoutRequestDTO request) {

        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        Cart cart = cartRepository.findByUserIdAndStatus(user.getId(), Cart.CartStatus.ACTIVE)
                .orElseThrow(() -> new RuntimeException("No active cart found for user: " + username));

        if (cart.getCartItems().isEmpty()) {
            throw new RuntimeException("Cart is empty, cannot proceed to checkout.");
        }

        double subtotal = 0;
        for (CartItem cartItem : cart.getCartItems()) {
            Product product = cartItem.getProduct();
            if (product.getInventory() < cartItem.getQuantity()) {
                throw new RuntimeException("Sản phẩm \"" + product.getName() + "\" không đủ hàng trong kho.");
            }
            subtotal += cartItem.getQuantity() * product.getPrice();
        }

        double shippingFee = resolveShippingFee(request.getShippingMethod());
        String shippingMethodLabel = resolveShippingMethodLabel(request.getShippingMethod());

        Voucher voucher = null;
        double discountAmount = 0;
        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            voucher = voucherRepository.findByCode(request.getVoucherCode())
                    .orElseThrow(() -> new RuntimeException("Voucher không tồn tại."));

            if (voucher.getStatus() != Voucher.VoucherStatus.ACTIVE) {
                throw new RuntimeException("Voucher không còn hoạt động.");
            }
            if (voucher.getEndDate().isBefore(LocalDate.now())) {
                throw new RuntimeException("Voucher đã hết hạn.");
            }

            if (voucher.getDiscountType() == Voucher.DiscountType.PERCENTAGE) {
                discountAmount = subtotal * (voucher.getDiscountValue() / 100);
            } else if (voucher.getDiscountType() == Voucher.DiscountType.FIXED) {
                discountAmount = voucher.getDiscountValue();
            }
            discountAmount = Math.min(discountAmount, subtotal);
        }

        double totalPrice = Math.max(subtotal - discountAmount, 0) + shippingFee;

        Order order = new Order();
        order.setUser(user);
        order.setShippingAddress(request.getShippingAddress());
        order.setTotalPrice(totalPrice);
        order.setStatus(Order.OrderStatus.COMPLETED);
        order.setPaymentStatus(Order.PaymentStatus.PENDING);
        order.setVoucher(voucher);
        order.setOrderItems(new ArrayList<>());
        orderRepository.save(order);

        for (CartItem cartItem : cart.getCartItems()) {
            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(cartItem.getProduct());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setPrice(cartItem.getProduct().getPrice());
            orderItem.setCreatedAt(LocalDateTime.now());
            order.getOrderItems().add(orderItem);
            orderItemRepository.save(orderItem);

            Product product = cartItem.getProduct();
            product.setInventory(product.getInventory() - cartItem.getQuantity());
            productRepository.save(product);
        }

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(totalPrice);
        payment.setStatus(Payment.PaymentStatus.PENDING);
        payment.setCreatedAt(LocalDateTime.now());
        try {
            payment.setPaymentMethod(
                    Payment.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase())
            );
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Phương thức thanh toán không hợp lệ: " + request.getPaymentMethod());
        }
        paymentRepository.save(payment);

        for (OrderItem orderItem : order.getOrderItems()) {
            Shipment shipment = new Shipment();
            shipment.setOrder(order);
            shipment.setOrderItem(orderItem);
            shipment.setTrackingNumber(UUID.randomUUID().toString());
            shipment.setShippingMethod(shippingMethodLabel);
            shipment.setStatus(Shipment.ShipmentStatus.SHIPPED);
            shipment.setCreatedAt(LocalDateTime.now());
            shipmentRepository.save(shipment);
        }

        cart.getCartItems().clear();
        cart.setStatus(Cart.CartStatus.CHECKED_OUT);
        cartRepository.save(cart);

        log.info("Checkout thành công cho user: {} | Phương thức ship: {} | Phí ship: {} | Tổng: {}",
                username, shippingMethodLabel, shippingFee, totalPrice);

        return toOrderDTO(order);
    }



    private double resolveShippingFee(String shippingMethod) {
        if ("express".equalsIgnoreCase(shippingMethod)) {
            return EXPRESS_SHIPPING_FEE;
        }
        return STANDARD_SHIPPING_FEE;
    }

    private String resolveShippingMethodLabel(String shippingMethod) {
        if ("express".equalsIgnoreCase(shippingMethod)) {
            return "Hỏa Tốc (Express Shipping)";
        }
        return "Tiêu Chuẩn (Standard Shipping)";
    }


    public OrderDTO toOrderDTO(Order order) {
        return new OrderDTO(
                order.getId(),
                order.getUser().getId(),
                order.getUser().getUsername(),
                order.getTotalPrice(),
                order.getStatus().name(),
                order.getPaymentStatus().name(),
                order.getShippingAddress(),
                order.getCreatedAt(),
                order.getUpdatedAt(),
                order.getOrderItems() != null
                        ? order.getOrderItems().stream()
                        .map(this::toOrderItemDTO)
                        .collect(Collectors.toList())
                        : new ArrayList<>()
        );
    }

    private OrderItemDTO toOrderItemDTO(OrderItem orderItem) {
        Product product = orderItem.getProduct();
        String productImage = (product.getImages() != null && !product.getImages().isEmpty())
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
    }
}
