package com.tirashop.persitence.repository;

import com.tirashop.persitence.entity.InvalidatedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Date;
import java.util.Optional;

@Repository
public interface InvalidatedTokenRepository extends JpaRepository<InvalidatedToken, Long> {
    Optional<InvalidatedToken> findByToken(String token);
    int deleteAllByExpiryTimeBefore(Date expiryTime); // Trả về số bản ghi bị xóa
}
