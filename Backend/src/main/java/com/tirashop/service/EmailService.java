package com.tirashop.service;

import com.tirashop.dto.OrderDTO;
import com.tirashop.dto.OrderItemDTO;
import com.tirashop.dto.request.EmailRequest;
import com.tirashop.dto.request.SendEmailRequest;
import com.tirashop.dto.response.EmailResponse;
import com.tirashop.model.RegistrationEmail;
import com.tirashop.model.ResetPassword;
import com.tirashop.persitence.entity.Order;
import com.tirashop.persitence.entity.User;
import com.tirashop.persitence.repository.OrderRepository;
import com.tirashop.persitence.repository.UserRepository;
import com.tirashop.persitence.repository.httpclient.EmailClient;
import feign.FeignException;

import java.text.DecimalFormat;
import java.util.Optional;
import java.util.Random;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final EmailClient emailClient;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PasswordEncoder passwordEncoder;
    private final CheckoutService checkoutService;

    @Value("${email.brevo.key}")
    private String apiKey;

    @Value("${email.brevo.sender}")
    private String senderEmail;

    @Value("${email.brevo.name}")
    private String senderName;

    public EmailResponse sendEmail(SendEmailRequest request) {
        EmailRequest emailRequest = EmailRequest.builder()
                .sender(EmailRequest.Sender.builder()
                        .name(senderName)
                        .email(senderEmail)
                        .build())
                .to(List.of(new EmailRequest.Recipient(request.getTo())))
                .subject(request.getSubject())
                .htmlContent(request.getHtmlContent())
                .build();
        try {
            return emailClient.sendEmail(apiKey, emailRequest);
        } catch (FeignException e) {
            log.error("Error sending email: {}", e.getMessage());
            throw new RuntimeException("Failed to send email");
        }
    }

    public void sendOrderConfirmationEmail(String toEmail, Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));
        OrderDTO orderDTO = checkoutService.toOrderDTO(order);

        if (!order.getUser().getEmail().equalsIgnoreCase(toEmail)) {
            log.error(
                    "Email mismatch: provided email ({}) does not match user's email ({}) for order ID: {}",
                    toEmail, order.getUser().getEmail(), orderId);
            throw new RuntimeException("Provided email does not match user's email.");
        }

        if (orderDTO.getItems() == null || orderDTO.getItems().isEmpty()) {
            log.error("Order ID: {} has no items. Cannot send confirmation email.", orderId);
            throw new RuntimeException("Order has no items, cannot send confirmation email.");
        }

        String subject = "🛍️ XÁC NHẬN ĐƠN HÀNG";
        StringBuilder content = new StringBuilder();

        content.append(
                "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; padding: 20px; ");
        content.append(
                "border: 1px solid #d6d6d6; border-radius: 10px; background-color: #fdf3f3; text-align: center;'>");

        content.append(
                "<img src='https://distinct-spider-cheaply.ngrok-free.app/uploads/logo/LogoBTEC.png' alt='TiraShop Logo' ");
        content.append("style='width: 120px; margin-bottom: 20px;'>");

        content.append("<h2 style='color: #e57373; text-transform: uppercase;'>🎉 CẢM ƠN "
                + orderDTO.getUserName()
                + " ĐÃ ĐẶT HÀNG!</h2>");
        content.append(
                "<p style='font-size: 16px; color: #555;'>Đơn hàng của bạn đã được đặt thành công. Dưới đây là chi tiết:</p>");

        content.append(
                "<p style='font-size: 16px; color: #444;'><strong>Trạng thái đơn hàng:</strong> <span style='color: #e57373;'>"
                        + orderDTO.getStatus() + "</span></p>");
        content.append(
                "<p style='font-size: 16px; color: #444;'><strong>Địa chỉ giao hàng:</strong> "
                        + orderDTO.getShippingAddress() + "</p>");

        content.append("<table style='width: 100%; border-collapse: collapse; margin-top: 15px;'>");
        content.append("<tr style='background-color: #e57373; color: white;'>");
        content.append("<th style='padding: 12px; border: 1px solid #ddd;'>Sản phẩm</th>");
        content.append("<th style='padding: 12px; border: 1px solid #ddd;'>Số lượng</th>");
        content.append("<th style='padding: 12px; border: 1px solid #ddd;'>Giá</th>");
        content.append("</tr>");

        DecimalFormat vndFormat = new DecimalFormat("#,###");

        for (OrderItemDTO item : orderDTO.getItems()) {
            content.append("<tr style='background-color: #ffefef;'>");
            content.append("<td style='padding: 12px; border: 1px solid #ddd; text-align: left;'>");
            content.append(
                    "<img src='https://distinct-spider-cheaply.ngrok-free.app"
                            + item.getProductImage() + "' ");
            content.append("alt='" + item.getProductName()
                    + "' style='width: 95px; height: 95px; margin-right: 10px; vertical-align: middle;'>");
            content.append(item.getProductName() + "</td>");
            content.append(
                    "<td style='padding: 12px; border: 1px solid #ddd;'>" + item.getQuantity()
                            + "</td>");
            content.append("<td style='padding: 12px; border: 1px solid #ddd;'>"
                    + vndFormat.format(item.getPrice()) + " VND</td>");
            content.append("</tr>");
        }
        content.append("</table>");

        content.append(
                "<p style='font-size: 18px; font-weight: bold; margin-top: 20px; color: #e57373;'>Tổng cộng: "
                        + vndFormat.format(orderDTO.getTotalPrice()) + " VND</p>");

        content.append("</div>");

        sendEmail(new SendEmailRequest(toEmail,subject, content.toString()));
    }


    public void sendRegistrationEmail(RegistrationEmail registrationEmail) {
        String subject = "🎉 Chào mừng bạn đến với TIRA SHOP!";
        String content = "<p>Xin chào " + registrationEmail.getUsername() + ",</p>"
                + "<p>Bạn đã đăng ký thành công tại TiraShop.!</p>"
                + "<p>Chúc bạn có trải nghiệm mua sắm thú vị!.</p>";
        sendEmail(new SendEmailRequest(registrationEmail.getToEmail(), subject, content));
    }

    public void resetPassword(ResetPassword resetPassword) {
        log.info("Attempting to reset password for email: {}", resetPassword.getToEmail());

        // Validate input
        if (resetPassword.getToEmail() == null || resetPassword.getToEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email không được để trống.");
        }
        if (resetPassword.getResetCode() == null || resetPassword.getResetCode().trim().isEmpty()) {
            throw new IllegalArgumentException("Mã xác minh không được để trống.");
        }
        if (resetPassword.getNewPassword() == null || resetPassword.getNewPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Mật khẩu mới không được để trống.");
        }

        // Find user
        User user = userRepository.findByEmail(resetPassword.getToEmail())
                .orElseThrow(() -> {
                    log.error("Email not found: {}", resetPassword.getToEmail());
                    return new RuntimeException("Email không tồn tại.");
                });

        // Check if reset code exists
        if (user.getResetCode() == null || user.getResetCode().trim().isEmpty()) {
            log.error("No reset code found for email: {}", resetPassword.getToEmail());
            throw new RuntimeException("Mã xác minh không tồn tại hoặc đã hết hạn. Vui lòng yêu cầu mã mới.");
        }

        // Verify reset code - FIXED: Check null first, then compare
        if (!user.getResetCode().equals(resetPassword.getResetCode().trim())) {
            log.error("Invalid reset code for email: {}. Expected: {}, Got: {}",
                    resetPassword.getToEmail(), user.getResetCode(), resetPassword.getResetCode());
            throw new RuntimeException("Mã xác minh không hợp lệ.");
        }

        // Reset password
        user.setPassword(passwordEncoder.encode(resetPassword.getNewPassword()));
        user.setResetCode(null);
        userRepository.save(user);

        log.info("Password reset successfully for email: {}", resetPassword.getToEmail());
    }

    public void sendForgotPasswordEmail(String toEmail) {
        log.info("Sending forgot password email to: {}", toEmail);

        if (toEmail == null || toEmail.trim().isEmpty()) {
            throw new IllegalArgumentException("Email không được để trống.");
        }

        User user = userRepository.findByEmail(toEmail)
                .orElseThrow(() -> {
                    log.error("Email not found in system: {}", toEmail);
                    return new RuntimeException("Email không tồn tại trong hệ thống.");
                });

        // Generate 6-digit code
        String resetCode = String.format("%06d", new Random().nextInt(1000000));
        user.setResetCode(resetCode);
        userRepository.save(user);

        log.info("Reset code generated for email: {}", toEmail);

        String subject = "🔑 Yêu cầu đặt lại mật khẩu";
        String content = "<div style='font-family: Arial, sans-serif; text-align: center; padding: 20px;'>"
                + "<h2 style='color: #2E86C1;'>Mã xác minh của bạn</h2>"
                + "<p style='font-size: 22px; font-weight: bold; color: #2E86C1; border: 2px solid #2E86C1; padding: 15px; display: inline-block; border-radius: 8px; letter-spacing: 3px;'>"
                + resetCode + "</p>"
                + "<p style='margin-top: 20px; color: #555;'>Nhập mã này để đặt lại mật khẩu của bạn.</p>"
                + "<p style='color: #999; font-size: 12px;'>Mã này chỉ có hiệu lực cho lần đặt lại mật khẩu tiếp theo.</p>"
                + "</div>";

        sendEmail(new SendEmailRequest(toEmail, subject, content));
        log.info("Forgot password email sent successfully to: {}", toEmail);
    }

}
