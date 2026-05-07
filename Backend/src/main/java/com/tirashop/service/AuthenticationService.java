package com.tirashop.service;

import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import com.tirashop.dto.request.AuthenticationRequest;
import com.tirashop.dto.request.IntrospectRequest;
import com.tirashop.dto.request.RefreshRequest;
import com.tirashop.dto.response.AuthenticationResponse;
import com.nimbusds.jose.*;
import com.tirashop.dto.response.IntrospectResponse;
import com.tirashop.persitence.entity.InvalidatedToken;
import com.tirashop.persitence.entity.User;
import com.tirashop.persitence.repository.InvalidatedTokenRepository;
import com.tirashop.persitence.repository.UserRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.CollectionUtils;

import java.text.ParseException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.StringJoiner;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class AuthenticationService {
    UserRepository userRepository;
    InvalidatedTokenRepository invalidatedTokenRepository;

    PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);

    @Value("${jwt.signerKey}")
    @NonFinal
    private String SIGNER_KEY;

    public AuthenticationResponse authenticatedGoogleUser(User user) {
        var token = generateToken(user);
        var refreshToken = generateRefreshToken(user);

        return AuthenticationResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .authenticated(true)
                .build();
    }

    public AuthenticationResponse authenticated(AuthenticationRequest request) {

        var userLogin = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Không tìm thấy người dùng!"));

        if (userLogin.getStatus() == null || !userLogin.getStatus().equalsIgnoreCase("Active")) {
            throw new RuntimeException("Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên!");
        }

        boolean authenticated = passwordEncoder.matches(request.getPassword(), userLogin.getPassword());

        if (!authenticated) throw new RuntimeException("Tên người dùng hoặc mật khẩu sai!");

        var token = generateToken(userLogin);
        var refreshToken = generateRefreshToken(userLogin);

        return AuthenticationResponse.builder()
                .token(token)
                .refreshToken(refreshToken)
                .authenticated(true)
                .build();

    }


    String generateToken(User user) {
        // token duoc cau tao nhu sau:
        // 3 phan: JWT- json web token
        // header: chua thuat toan de gen ra mot chuoi token
        // payload: giong nhu body, chua nhung thong tin chi tiet cua nguoi dung\
        // signature: được tạo từ header và payload của JWT cùng với một khóa bí mật

        JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
        //Cần body cho token: subject, issuer, issueTime, expirationTime, claim( tu build), id.
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .issuer("duonghoang")
                .issueTime(new Date())
                .expirationTime(new Date(
                        Instant.now().plus(5, ChronoUnit.HOURS).toEpochMilli()
                ))
                .jwtID(UUID.randomUUID().toString())
                .claim("type", "access")
                .claim("scope", buildScope(user))
                .claim("userId", user.getId()) // Thêm userId vào claims
                .build();
        //Tao payload cho token
        Payload payload = new Payload(jwtClaimsSet.toJSONObject());
        //Tao obj chua token
        JWSObject jwsObject = new JWSObject(header, payload);
        //Kí và trả về một chuỗi String
        try {
            jwsObject.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return jwsObject.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
    }

    // build scope
    private String buildScope(User user) {
        StringJoiner stringJoiner = new StringJoiner(" ");
        // add role vao scope
        if (!CollectionUtils.isEmpty(user.getRole()))
            user.getRole()
                    .forEach(
                            role -> {
                                stringJoiner.add(role.getName());
                            });
        return stringJoiner.toString();
    }

    public IntrospectResponse introspect(IntrospectRequest request) throws ParseException, JOSEException {
        String token = request.getToken();

        // Xác thực token (bao gồm cả hết hạn)
        SignedJWT signedJWT = verifyToken(token, true);

        // Kiểm tra token có nằm trong danh sách đã logout không
        boolean isBlacklisted = isTokenBlacklisted(signedJWT.getJWTClaimsSet().getJWTID());

        boolean active = !isBlacklisted;
        return new IntrospectResponse(active);
    }


    public void logoutToken(IntrospectRequest request) throws ParseException, JOSEException {
        String token = request.getToken();

        // Xác thực token (không cần kiểm tra hết hạn)
        SignedJWT signedJWT = verifyToken(token, false);

        // Lấy thông tin từ token
        String jwtId = signedJWT.getJWTClaimsSet().getJWTID();
        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();

        // Lưu token vào danh sách đã vô hiệu hóa
        InvalidatedToken invalidatedToken =
                InvalidatedToken.builder()
                        .token(jwtId)
                        .expiryTime(expiryTime)
                        .build();
        invalidatedTokenRepository.save(invalidatedToken);
    }


    public boolean isTokenBlacklisted(String token) {
        return invalidatedTokenRepository.findByToken(token).isPresent();
    }

    public AuthenticationResponse refreshToken(RefreshRequest refreshRequest) throws ParseException, JOSEException {
        // Xác thực Refresh Token được gửi lên
        SignedJWT signedJWT = verifyToken(refreshRequest.getToken(), true);

        // Lấy thông tin từ Refresh Token
        Date expiryTime = signedJWT.getJWTClaimsSet().getExpirationTime();
        String jwtId = signedJWT.getJWTClaimsSet().getJWTID();

        // Lưu Refresh Token cũ vào danh sách đã vô hiệu hóa
        if (!isTokenBlacklisted(jwtId)) {
            InvalidatedToken invalidatedToken =
                    InvalidatedToken.builder()
                            .token(jwtId)
                            .expiryTime(expiryTime)
                            .build();
            invalidatedTokenRepository.save(invalidatedToken);
        }

        // Lấy username từ Refresh Token
        String username = signedJWT.getJWTClaimsSet().getSubject();

        // Tìm User dựa trên username
        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() -> new RuntimeException("Cannot find username: " + username));

        // Tạo Access Token mới
        String newToken = generateToken(user);

        // Tạo Refresh Token mới
        String newRefreshToken = generateRefreshToken(user);

        // Trả về AuthenticationResponse với Access Token và Refresh Token mới
        return AuthenticationResponse.builder()
                .token(newToken)
                .refreshToken(newRefreshToken)
                .authenticated(true)
                .build();
    }

    // xác nhận hết hạn: validate expiration
    private SignedJWT verifyToken(String token, boolean validateExpiration) throws ParseException, JOSEException {
        // Phân tích token
        SignedJWT signedJWT = SignedJWT.parse(token);

        // Xác minh chữ ký
        JWSVerifier verifier = new MACVerifier(SIGNER_KEY.getBytes());
        if (!signedJWT.verify(verifier)) {
            throw new RuntimeException("Invalid token signature");
        }

        // Kiểm tra thời gian hết hạn nếu cần
        if (validateExpiration) {
            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
            if (new Date().after(expirationTime)) {
                throw new RuntimeException("Token has expired");
            }
        }

        return signedJWT; // Trả về SignedJWT nếu hợp lệ
    }

    public String generateRefreshToken(User user) {
        try {
            JWSHeader header = new JWSHeader(JWSAlgorithm.HS512);
            JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                    .subject(user.getUsername())
                    .issuer("duonghoang")
                    .issueTime(new Date())
                    .expirationTime(Date.from(Instant.now().plus(5, ChronoUnit.DAYS)))
                    .jwtID(UUID.randomUUID().toString())
                    .claim("type", "refresh")
                    .build();
            SignedJWT signedJWT = new SignedJWT(header, jwtClaimsSet);
            signedJWT.sign(new MACSigner(SIGNER_KEY.getBytes()));
            return signedJWT.serialize();
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
    }


}
