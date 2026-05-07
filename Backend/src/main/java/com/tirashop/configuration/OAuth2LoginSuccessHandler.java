package com.tirashop.configuration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tirashop.dto.response.AuthenticationResponse;
import com.tirashop.persitence.entity.Role;
import com.tirashop.persitence.entity.User;
import com.tirashop.persitence.repository.RoleRepository;
import com.tirashop.persitence.repository.UserRepository;
import com.tirashop.service.AuthenticationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuthenticationService authenticationService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        OAuth2AuthenticationToken oauthToken = (OAuth2AuthenticationToken) authentication;
        OAuth2User oauthUser = oauthToken.getPrincipal();

        log.info("OAuth2 User Info: {}", oauthUser.getAttributes());

        String email = oauthUser.getAttribute("email");
        String username = oauthUser.getAttribute("name");
        String provider = oauthToken.getAuthorizedClientRegistrationId();

        Optional<User> existingUser = userRepository.findByEmail(email);

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            user.getRole().size();
            log.info("Existing user logged in: ID={}, Username={}, Email={}", user.getId(),
                    user.getUsername(), user.getEmail());
        } else {
            user = new User();
            user.setEmail(email);
            user.setUsername(username);
            user.setStatus("Active");
            user.setProvider(provider);

            Role roleUser = roleRepository.findByName("ROLE_USER")
                    .orElseThrow(() -> new RuntimeException("Default role ROLE_USER not found!"));
            user.setRole(Collections.singleton(roleUser));

            userRepository.save(user);
            log.info("New user created: ID={}, Username={}, Email={}", user.getId(),
                    user.getUsername(), user.getEmail());
        }

        AuthenticationResponse authResponse = authenticationService.authenticatedGoogleUser(user);

        response.setContentType("text/html");
        response.setCharacterEncoding("UTF-8");
        String script = "<script>" +
                "window.opener.postMessage(" + objectMapper.writeValueAsString(authResponse) + ", 'http://localhost:5173');" +
                "window.close();" +
                "</script>";
        response.getWriter().write(script);
    }
}
