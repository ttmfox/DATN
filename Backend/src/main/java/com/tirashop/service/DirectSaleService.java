
package com.tirashop.service;
import com.tirashop.dto.DirectSaleItemDTO;
import com.tirashop.dto.DirectSaleRequestDTO;
import com.tirashop.dto.OrderDTO;
import com.tirashop.persitence.entity.*;
import com.tirashop.persitence.repository.*;
import com.tirashop.persitence.repository.OrderItemRepository;
import com.tirashop.persitence.repository.OrderRepository;
import com.tirashop.persitence.repository.PaymentRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class DirectSaleService {

    OrderRepository orderRepository;
    OrderItemRepository orderItemRepository;
    PaymentRepository paymentRepository;
    ProductRepository productRepository;
    UserRepository userRepository;
    VoucherRepository voucherRepository;
    CheckoutService checkoutService;
    PasswordEncoder passwordEncoder;
    RoleRepository roleRepository;
    private static final String GUEST_USERNAME = "guest";


    @PostConstruct
    public void ensureGuestUserExists() {
        if (userRepository.findByUsername(GUEST_USERNAME).isPresent()) return;


        Role role = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new IllegalArgumentException("Default role not found!"));

        User guest = new User();
        guest.setUsername(GUEST_USERNAME);
        guest.setEmail("guest@system.local");
        guest.setPassword(passwordEncoder.encode("guest_no_login_" + System.currentTimeMillis()));
        guest.setFirstname("Khách");
        guest.setLastname("Vãng lai");
        guest.setRole(Collections.singleton(role));
        guest.setStatus("Active");

        userRepository.save(guest);
        log.info("Đã tạo guest user mặc định cho bán trực tiếp.");
    }

    public OrderDTO createDirectOrder(DirectSaleRequestDTO request) {

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new RuntimeException("Danh sách sản phẩm không được rỗng.");
        }

        Order order = new Order();
        order.setShippingAddress("Mua trực tiếp tại cửa hàng");
        order.setStatus(Order.OrderStatus.COMPLETED);
        order.setPaymentStatus(Order.PaymentStatus.PAID);
        order.setOrderItems(new ArrayList<>());

        User customer;
        if (request.getCustomerUsername() != null && !request.getCustomerUsername().isBlank()) {
            customer = userRepository.findByUsername(request.getCustomerUsername())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy khách hàng: " + request.getCustomerUsername()));
        } else {
            customer = userRepository.findByUsername(GUEST_USERNAME)
                    .orElseThrow(() -> new RuntimeException("Guest user không tồn tại — lỗi hệ thống."));
        }
        order.setUser(customer);

        if (request.getGuestName() != null && !request.getGuestName().isBlank()) {
            order.setNote("Khách vãng lai: " + request.getGuestName());
        }

        orderRepository.save(order);

        double subtotal = 0;
        for (DirectSaleItemDTO item : request.getItems()) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại: " + item.getProductId()));

            if (product.getInventory() < item.getQuantity()) {
                throw new RuntimeException("Sản phẩm \"" + product.getName() + "\" không đủ hàng.");
            }

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(item.getQuantity());
            orderItem.setPrice(product.getPrice());
            orderItem.setCreatedAt(LocalDateTime.now());
            orderItemRepository.save(orderItem);
            order.getOrderItems().add(orderItem);

            product.setInventory(product.getInventory() - item.getQuantity());
            productRepository.save(product);

            subtotal += product.getPrice() * item.getQuantity();
        }

        double discountAmount = 0;
        if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
            Voucher voucher = voucherRepository.findByCode(request.getVoucherCode())
                    .orElseThrow(() -> new RuntimeException("Voucher không tồn tại."));
            if (voucher.getStatus() != Voucher.VoucherStatus.ACTIVE ||
                    voucher.getEndDate().isBefore(LocalDate.now())) {
                throw new RuntimeException("Voucher không hợp lệ hoặc đã hết hạn.");
            }
            discountAmount = voucher.getDiscountType() == Voucher.DiscountType.PERCENTAGE
                    ? subtotal * (voucher.getDiscountValue() / 100)
                    : voucher.getDiscountValue();
            discountAmount = Math.min(discountAmount, subtotal);
            order.setVoucher(voucher);
        }

        double totalPrice = Math.max(subtotal - discountAmount, 0);
        order.setTotalPrice(totalPrice);
        orderRepository.save(order);

        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setAmount(totalPrice);
        payment.setStatus(Payment.PaymentStatus.COMPLETED);
        payment.setCreatedAt(LocalDateTime.now());
        try {
            payment.setPaymentMethod(
                    Payment.PaymentMethod.valueOf(request.getPaymentMethod().toUpperCase())
            );
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Phương thức thanh toán không hợp lệ: " + request.getPaymentMethod());
        }
        paymentRepository.save(payment);

        log.info("Bán trực tiếp thành công | Items: {} | Tổng: {}", request.getItems().size(), totalPrice);
        return checkoutService.toOrderDTO(order);
    }

}