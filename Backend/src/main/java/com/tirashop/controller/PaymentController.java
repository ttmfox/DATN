package com.tirashop.controller;

import com.tirashop.configuration.VNPayUtil;
import com.tirashop.service.PaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;
    private final VNPayUtil vnPayUtil;

    @PostMapping("/vnpay/create/{orderId}")
    public ResponseEntity<Map<String, String>> createPayment(
            @PathVariable Long orderId,
            HttpServletRequest request) throws Exception {

        String paymentUrl = paymentService.createVNPayPayment(orderId, request);
        return ResponseEntity.ok(Map.of("paymentUrl", paymentUrl));
    }

    @GetMapping("/vnpay/return")
    public void vnpayReturn(HttpServletRequest request,
                            HttpServletResponse response) throws Exception {
        try {
            boolean validSig = vnPayUtil.validateSignatureFromFields(request);
            String responseCode = request.getParameter("vnp_ResponseCode");
            String txnRef = request.getParameter("vnp_TxnRef");
            Long orderId = Long.parseLong(txnRef.split("_")[0]);

            System.out.println(">>> Valid signature: " + validSig);
            System.out.println(">>> Response code  : " + responseCode);

            if (validSig && "00".equals(responseCode)) {
                paymentService.updatePaymentSuccess(orderId);
                response.sendRedirect(
                        "http://localhost:5173/order-success?orderId=" + orderId);
            } else {
                paymentService.updatePaymentFailed(orderId);
                response.sendRedirect(
                        "http://localhost:5173/order-failed?orderId=" + orderId);
            }
        } catch (Exception e) {
            System.out.println("VNPay return error: " + e.getMessage());
            response.sendRedirect("http://localhost:5173/order-failed");
        }
    }
}