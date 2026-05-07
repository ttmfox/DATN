package com.tirashop.controller;


import com.nimbusds.jose.JOSEException;
import com.tirashop.dto.request.AuthenticationRequest;
import com.tirashop.dto.request.IntrospectRequest;
import com.tirashop.dto.request.RefreshRequest;
import com.tirashop.dto.request.UserRegisterRequest;
import com.tirashop.dto.response.ApiResponse;
import com.tirashop.dto.response.AuthenticationResponse;
import com.tirashop.dto.response.IntrospectResponse;
import com.tirashop.dto.response.UserRegisterResponse;
import com.tirashop.service.AuthenticationService;
import com.tirashop.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.text.ParseException;

@Slf4j
@RestController
@RequestMapping("/tirashop/auth")
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "APIs for user authentication")
public class AuthenticationController {

    AuthenticationService authenticationService;
    UserService userService;

    @PostMapping("/login")
    @Operation(summary = "Authenticate user", description = "Authenticate user with username and password")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Login successful")
    public ApiResponse<AuthenticationResponse> authenticate(
            @RequestBody AuthenticationRequest request) {
        return new ApiResponse<>
                ("success", 200, "Login Successful", authenticationService.authenticated(request));
    }

    @PostMapping("/register-new-user")
    public ApiResponse<UserRegisterResponse> registerAcc(@RequestBody UserRegisterRequest request) {
        UserRegisterResponse response = userService.register(request);
        return new ApiResponse<>
                ("success", 200, "Register Successful", response);
    }

    @PostMapping("/introspect")
    @Operation(summary = "Introspect token", description = "Check and validate token")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "True")
    public ApiResponse<IntrospectResponse> introspect(@RequestBody IntrospectRequest request)
            throws ParseException, JOSEException {
        var result = authenticationService.introspect(request);
        return new ApiResponse<>("success", 200, "Introspect Done!", result);
    }


    @PostMapping("/logout")
    @Operation(summary = "Logout user", description = "Invalidate Access Token")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Logout successful")
    public ApiResponse<Void> logout(@RequestBody IntrospectRequest request)
            throws ParseException, JOSEException {
        authenticationService.logoutToken(request);
        return new ApiResponse<>("success", 200, "Logout successful", null);
    }


    @PostMapping("/refresh")
    @Operation(summary = "Refresh Access Token", description = "Refresh Access Token using a valid Refresh Token")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Token refreshed successfully")
    public ApiResponse<AuthenticationResponse> refreshToken(
            @RequestBody RefreshRequest refreshRequest) throws ParseException, JOSEException {
        AuthenticationResponse response = authenticationService.refreshToken(refreshRequest);
        return new ApiResponse<>("success", 200, "Token refreshed successfully", response);
    }

    @RequestMapping(value = "/**", method = RequestMethod.OPTIONS)
    public ResponseEntity<?> handleOptions() {
        log.info("Received Preflight OPTIONS request");
        return ResponseEntity.ok().build();
    }


}
