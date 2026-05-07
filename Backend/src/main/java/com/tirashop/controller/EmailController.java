package com.tirashop.controller;

import com.tirashop.dto.request.SendEmailRequest;
import com.tirashop.dto.response.ApiResponse;
import com.tirashop.model.RegistrationEmail;
import com.tirashop.model.ResetPassword;
import com.tirashop.service.EmailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/email")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Email Controller", description = "API for sending emails")
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send")
    @Operation(summary = "Send a generic email", description = "Sends a generic email with custom content.")
    public ApiResponse<String> sendEmail(@RequestBody SendEmailRequest request) {
        emailService.sendEmail(request);
        return new ApiResponse<>("success", HttpStatus.OK.value(), "Email sent successfully.",
                request.getTo());
    }

    @PostMapping("/send-order-confirmation")
    @Operation(summary = "Send order confirmation email",
            description = "Sends a confirmation email after a successful order.")
    public ApiResponse<String> sendOrderConfirmationEmail(
            @RequestParam String toEmail,
            @RequestParam Long orderId) {
        emailService.sendOrderConfirmationEmail(toEmail, orderId);
        return new ApiResponse<>("success", HttpStatus.OK.value(),
                "Order confirmation email sent successfully.", toEmail);
    }

    @PostMapping("/send-registration")
    @Operation(summary = "Send registration email", description = "Sends a welcome email after user registration.")
    public ApiResponse<String> sendRegistrationEmail(@RequestBody RegistrationEmail registrationEmail) {
        log.info("In controller: To Email: {}, Username: {}", registrationEmail.getToEmail(), registrationEmail.getUsername());
        emailService.sendRegistrationEmail(registrationEmail);
        return new ApiResponse<>("success", HttpStatus.OK.value(),
                "Registration email sent successfully.", registrationEmail.getToEmail());
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Send forgot password email", description = "Sends a reset password verification code.")
    public ApiResponse<String> forgotPassword(@RequestParam String toEmail) {
        emailService.sendForgotPasswordEmail(toEmail);
        return new ApiResponse<>("success", HttpStatus.OK.value(), "Reset code sent to email.",
                toEmail);
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password", description = "Resets the user password after verifying the reset code.")
    public ApiResponse<String> resetPassword(@RequestBody ResetPassword resetPassword) {
        emailService.resetPassword(resetPassword);
        return new ApiResponse<>("success", HttpStatus.OK.value(),
                "Password has been reset successfully.", resetPassword.getToEmail());
    }
}
