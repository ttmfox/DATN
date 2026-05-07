package com.tirashop.configuration;

import com.tirashop.dto.request.IntrospectRequest;
import com.tirashop.service.AuthenticationService;
import com.nimbusds.jose.JOSEException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.text.ParseException;


@Component
public class CustomJwtDecoder implements JwtDecoder {

    private final AuthenticationService authenticationService;
    private final NimbusJwtDecoder nimbusJwtDecoder;

    public CustomJwtDecoder(@Value("${jwt.signerKey}") String signerKey,
            AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;

        if (signerKey == null || signerKey.trim().isEmpty()) {
            throw new IllegalArgumentException("JWT Signer Key must not be null or empty");
        }

        SecretKeySpec secretKeySpec = new SecretKeySpec(signerKey.getBytes(), "HmacSHA512");
        this.nimbusJwtDecoder = NimbusJwtDecoder
                .withSecretKey(secretKeySpec)
                .macAlgorithm(MacAlgorithm.HS512)
                .build();
    }

    @Override
    public Jwt decode(String token) throws JwtException {
        try {
            // Kiểm tra token qua introspect
            var response = authenticationService.introspect(
                    IntrospectRequest.builder().token(token).build()
            );

            if (!response.isValid()) {
                throw new JwtException("Token has been invalidated or expired");
            }
        } catch (ParseException | JOSEException e) {
            throw new JwtException("Error while validating token: " + e.getMessage());
        }


        Jwt jwt = nimbusJwtDecoder.decode(token);

        String jwtId = jwt.getId();
        if (authenticationService.isTokenBlacklisted(jwtId)) {
            throw new JwtException("Token has been invalidated");
        }

        String tokenType = jwt.getClaim("type");
        if ("refresh".equals(tokenType)) {
            throw new JwtException("Refresh Token cannot be used to access protected resources");
        }

        return jwt;
    }
}
