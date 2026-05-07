package com.tirashop.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import lombok.extern.slf4j.Slf4j;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class WebhookService {

    @PostConstruct
    public void init() {
        log.info("Webhook URL = {}", chatbotWebhookUrl);
        log.info("Webhook enabled = {}", webhookEnabled);
    }


    @Value("${chatbot.webhook.url:http://localhost:8000/webhook/product-update}")
    private String chatbotWebhookUrl;

    @Value("${chatbot.webhook.enabled:true}")
    private boolean webhookEnabled;

    private final RestTemplate restTemplate;

    public WebhookService() {
        this.restTemplate = new RestTemplate();
    }
    @Async
    public void notifyProductChange(String action, Long productId) {
        if (!webhookEnabled) {
            log.debug("Webhook disabled, skipping notification");
            return;
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("event", "product_change");
            payload.put("action", action);
            payload.put("productId", productId);
            payload.put("timestamp", System.currentTimeMillis());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            restTemplate.postForEntity(chatbotWebhookUrl, request, String.class);

            log.info("✅ Webhook sent: {} product {}", action, productId);

        } catch (Exception e) {
            log.warn("⚠️ Failed to send webhook: {}", e.getMessage());
        }
    }


    @Async
    public void notifyVoucherChange(String action, Long voucherId) {
        if (!webhookEnabled) {
            return;
        }

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("event", "voucher_change");
            payload.put("action", action);
            payload.put("voucherId", voucherId);
            payload.put("timestamp", System.currentTimeMillis());

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

            restTemplate.postForEntity(chatbotWebhookUrl, request, String.class);
            log.info("✅ Webhook sent: {} voucher {}", action, voucherId);

        } catch (Exception e) {
            log.warn("⚠️ Failed to send webhook: {}", e.getMessage());
        }
    }
}