package com.tirashop.controller;

import com.tirashop.dto.RoleDTO;
import com.tirashop.dto.UserDTO;
import com.tirashop.dto.UserProfileDTO;
import com.tirashop.dto.response.ApiResponse;
import com.tirashop.model.PagedData;
import com.tirashop.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/tirashop/user")
@Tag(name = "User", description = "APIs for user management")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserController {

    UserService userService;

    @PatchMapping("/status/{userId}")
    @Operation(summary = "Update user status")
    public ApiResponse<String> updateUserStatus(@PathVariable Long userId, @RequestParam String status) {
        userService.updateUserStatus(userId, status);
        return new ApiResponse<>("success", 200, "Status updated", status);
    }


    @GetMapping()
    @Operation(summary = "Filter users with pagination", description = "Filter users by username, address, and status with pagination support")
    public ApiResponse<PagedData<UserDTO>> filterUsers(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String address,
            @RequestParam(required = false) String status,
            @PageableDefault(page = 0, size = 25, sort = "createdAt", direction = Direction.DESC) Pageable pageable
    ) {
        PagedData<UserDTO> pagedData = userService.filterUser(username, address, status, pageable);
        return new ApiResponse<>("success", 200, "Filtered users retrieved successfully",
                pagedData);
    }


    @GetMapping("/list")
    @Operation(summary = "Get user list", description = "Retrieve the list of users")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User list retrieved successfully")
    public ApiResponse<List<UserDTO>> getListUser() {
        List<UserDTO> list = userService.getListUser();
        return new ApiResponse<>("success", 200, "Operation successful", list);
    }

    @GetMapping("/my-profile")
    @Operation(summary = "Get user profile", description = "Retrieve the profile information of the authenticated user")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User profile retrieved successfully")
    public ApiResponse<UserProfileDTO> getMyProfile() {
        log.info("Received request for /my-profile");
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        log.info("Username from token: {}", username);

        UserProfileDTO response = userService.getProfile(username);
        return new ApiResponse<>("success", 200, "User profile retrieved successfully", response);
    }


    @PutMapping(value = "/update-profile",consumes = "multipart/form-data")
    @Operation(summary = "Update user profile", description = "Update the profile information of the authenticated user")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "User profile updated successfully")
    public ApiResponse<UserProfileDTO> updateProfileUser(
            @RequestParam(value = "newUsername", required = false) String newUsername,
            @RequestParam(value = "firstname", required = false) String firstname,
            @RequestParam(value = "lastname", required = false) String lastname,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "birthday", required = false) String birthday,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar) {

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = authentication.getName();

        UserDTO updatedUser = userService.updateUserProfile(currentUsername, newUsername, firstname,
                lastname, phone, address, gender, birthday, avatar);

        UserProfileDTO updatedProfile = UserProfileDTO.builder()
                .username(updatedUser.getUsername())
                .firstname(updatedUser.getFirstname())
                .lastname(updatedUser.getLastname())
                .email(updatedUser.getEmail())
                .phone(updatedUser.getPhone())
                .address(updatedUser.getAddress())
                .gender(updatedUser.getGender())
                .avatar(updatedUser.getAvatar())
                .birthday(updatedUser.getBirthday())
                .build();

        return new ApiResponse<>("success", 200, "User profile updated successfully",
                updatedProfile);
    }


    @PostMapping("/create-new-user")
    @Operation(summary = "Create user", description = "Create a new user")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "User created successfully")
    public ApiResponse<UserDTO> createUser(
            @RequestParam("username") String username,
            @RequestParam("firstname") String firstname,
            @RequestParam("lastname") String lastname,
            @RequestParam("password") String password,
            @RequestParam("email") String email,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "birthday", required = false) String birthday,
            @RequestParam(value = "role", required = false) List<String> roles,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar) {

        LocalDate parsedBirthday = null;
        if (birthday != null && !birthday.isEmpty()) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
                parsedBirthday = LocalDate.parse(birthday, formatter);
            } catch (DateTimeParseException e) {
                return new ApiResponse<>("error", 400,
                        "Invalid date format for birthday. Expected format: dd-MM-yyyy", null);
            }
        }

        UserDTO userDTO = UserDTO.builder()
                .username(username)
                .firstname(firstname)
                .lastname(lastname)
                .password(password)
                .email(email)
                .phone(phone)
                .address(address)
                .gender(gender)
                .status(status)
                .provider("local")
                .birthday(parsedBirthday)
                .role(roles != null ? roles.stream()
                        .map(roleName -> RoleDTO.builder().name(roleName).build())
                        .collect(Collectors.toSet()) : null)
                .build();

        UserDTO savedUser = userService.createUser(userDTO, avatar);
        return new ApiResponse<>("success", 201, "User created successfully", savedUser);
    }


    @PutMapping("/update/{id}")
    public ApiResponse<UserDTO> updateUser(
            @PathVariable Long id,
            @RequestParam("username") String username,
            @RequestParam("firstname") String firstname,
            @RequestParam("lastname") String lastname,
            @RequestParam("password") String password,
            @RequestParam("email") String email,
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "address", required = false) String address,
            @RequestParam(value = "gender", required = false) String gender,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "birthday", required = false) String birthday,
            @RequestParam(value = "role", required = false) List<String> roles,
            @RequestPart(value = "avatar", required = false) MultipartFile avatar) {

        LocalDate parsedBirthday = null;
        if (birthday != null && !birthday.isEmpty()) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
                parsedBirthday = LocalDate.parse(birthday, formatter);
            } catch (DateTimeParseException e) {
                return new ApiResponse<>("error", 400,
                        "Invalid date format for birthday. Expected format: dd-MM-yyyy", null);
            }
        }

        UserDTO userDTO = UserDTO.builder()
                .username(username)
                .firstname(firstname)
                .lastname(lastname)
                .password(password)
                .email(email)
                .phone(phone)
                .address(address)
                .gender(gender)
                .status(status)
                .birthday(parsedBirthday)
                .role(roles != null ? roles.stream()
                        .map(roleName -> RoleDTO.builder().name(roleName).build())
                        .collect(Collectors.toSet()) : null)
                .build();

        return new ApiResponse<>("success", 200, "User updated successfully",
                userService.updateUser(id, userDTO, avatar));
    }


}
