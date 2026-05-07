package com.tirashop.configuration;

import com.tirashop.persitence.repository.InvalidatedTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Date;

@Slf4j
@Component
@RequiredArgsConstructor
public class TokenCleanupConfig {
    private final InvalidatedTokenRepository invalidatedTokenRepository;

    @Scheduled(cron = "0 0 0 */3 * ?")
    public void cleanExpiredTokens() {
        Date now = new Date();
        int deletedTokensCount = invalidatedTokenRepository.deleteAllByExpiryTimeBefore(now);
        log.info("Deleted {} expired tokens from invalidated token list.", deletedTokensCount);
    }



}
