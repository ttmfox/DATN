package com.tirashop.service;

import com.tirashop.configuration.VNPayUtil;
import com.tirashop.persitence.entity.Order;
import com.tirashop.persitence.entity.Payment;
import com.tirashop.persitence.repository.OrderRepository;
import com.tirashop.persitence.repository.PaymentRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;


@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final VNPayUtil vnPayUtil;



    @Transactional
    public void updatePaymentSuccess(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        Payment payment = paymentRepository.findFirstByOrderIdOrderByCreatedAtDesc(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        payment.setStatus(Payment.PaymentStatus.COMPLETED);
        order.setPaymentStatus(Order.PaymentStatus.PAID);
        order.setStatus(Order.OrderStatus.COMPLETED);
        order.setUpdatedAt(LocalDateTime.now());

        paymentRepository.save(payment);
        orderRepository.save(order);
        System.out.println("Payment SUCCESS - orderId: " + orderId);
    }

    @Transactional
    public void updatePaymentFailed(Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found: " + orderId));

        Payment payment = paymentRepository.findFirstByOrderIdOrderByCreatedAtDesc(orderId)
                .orElseThrow(() -> new RuntimeException("Payment not found for order: " + orderId));

        payment.setStatus(Payment.PaymentStatus.FAILED);
        order.setPaymentStatus(Order.PaymentStatus.FAILED);
        order.setStatus(Order.OrderStatus.CANCELLED);
        order.setUpdatedAt(LocalDateTime.now());

        paymentRepository.save(payment);
        orderRepository.save(order);
        System.out.println("Payment FAILED - orderId: " + orderId);
    }

    public String createVNPayPayment(Long orderId, HttpServletRequest request) throws Exception {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));


        Payment payment = new Payment();
        payment.setOrder(order);
        payment.setPaymentMethod(Payment.PaymentMethod.VNPAY);
        payment.setAmount(order.getTotalPrice());
        payment.setStatus(Payment.PaymentStatus.PENDING);
        paymentRepository.save(payment);


        String ipAddress = getClientIpAddress(request);
        String orderInfo = "Thanh toan don hang " + orderId;

        return vnPayUtil.generatePaymentUrl(orderId, order.getTotalPrice(), orderInfo, ipAddress);
    }


    private String getClientIpAddress(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        return (xfHeader == null) ? request.getRemoteAddr() : xfHeader.split(",")[0];
    }
}
