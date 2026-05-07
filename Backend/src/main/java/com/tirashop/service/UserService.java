package com.tirashop.service;

import com.tirashop.dto.RoleDTO;
import com.tirashop.dto.UserDTO;
import com.tirashop.dto.UserProfileDTO;
import com.tirashop.dto.request.UserRegisterRequest;
import com.tirashop.dto.response.UserRegisterResponse;
import com.tirashop.model.PagedData;
import com.tirashop.persitence.entity.Product;
import com.tirashop.persitence.entity.Role;
import com.tirashop.persitence.entity.User;
import com.tirashop.persitence.repository.RoleRepository;
import com.tirashop.persitence.repository.UserRepository;
import com.tirashop.persitence.specification.UserSpecification;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UserService {

    UserRepository userRepository;
    RoleRepository roleRepository;

    PasswordEncoder passwordEncoder = new BCryptPasswordEncoder(10);





    public void updateUserStatus(Long userId, String status) {
        User user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(status);
        userRepository.save(user);
    }


    public UserDTO updateUserProfile(String currentUsername, String newUsername, String firstname,
            String lastname,
            String phone, String address, String gender, String birthday, MultipartFile avatar) {
        // Tìm user hiện tại trong cơ sở dữ liệu
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found: " + currentUsername));

        // Kiểm tra nếu username mới bị trùng lặp (ngoại trừ user hiện tại)
        if (newUsername != null && !newUsername.equals(user.getUsername())
                && userRepository.existsByUsername(newUsername)) {
            throw new RuntimeException("Username already exists!");
        }

        // Xử lý format ngày tháng
        LocalDate parsedBirthday = null;
        if (birthday != null && !birthday.isEmpty()) {
            try {
                DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
                parsedBirthday = LocalDate.parse(birthday, formatter);
            } catch (DateTimeParseException e) {
                throw new RuntimeException(
                        "Invalid date format for birthday. Expected format: dd-MM-yyyy");
            }
        }

        // Cập nhật thông tin user
        if (newUsername != null) {
            user.setUsername(newUsername);
        }
        if (firstname != null) {
            user.setFirstname(firstname);
        }
        if (lastname != null) {
            user.setLastname(lastname);
        }
        if (phone != null) {
            user.setPhone(phone);
        }
        if (address != null) {
            user.setAddress(address);
        }
        if (gender != null) {
            user.setGender(gender);
        }
        if (parsedBirthday != null) {
            user.setBirthday(parsedBirthday);
        }

        // Xử lý avatar nếu có
        if (avatar != null && !avatar.isEmpty()) {
            String avatarUrl = handleImageUpload(avatar);
            user.setAvatar(avatarUrl);
        }

        // Lưu user
        userRepository.save(user);

        // Chuyển đổi User sang UserDTO và trả về
        return toDTO(user);
    }


    public UserProfileDTO getProfile(String username) {

        // Tìm user trong cơ sở dữ liệu
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        // Chuyển đổi User entity thành UserProfileDTO
        UserProfileDTO userProfileDTO = UserProfileDTO.builder()
                .username(user.getUsername())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .gender(user.getGender())
                .avatar(user.getAvatar())
                .birthday(user.getBirthday())
                .build();
        return userProfileDTO;
    }


    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public List<UserDTO> getListUser() {
        return userRepository.findAll().stream().map(this::toDTO).toList();
    }


    public PagedData<UserDTO> filterUser(String username, String address, String status,
            Pageable pageable) {

        // Tạo Specification từ các tiêu chí lọc
        Specification<User> spec = UserSpecification.filterUsers(username, address, status);

        // Truy vấn dữ liệu với phân trang
        Page<User> userPage = userRepository.findAll(spec, pageable);

        // Chuyển đổi danh sách User entity sang UserDTO
        List<UserDTO> userDTOs = userPage.getContent()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        // Trả về PagedData
        return PagedData.<UserDTO>builder()
                .pageNo(userPage.getNumber()) // Chuyển pageNo từ 0-based về 1-based
                .elementPerPage(userPage.getSize())
                .totalElements(userPage.getTotalElements())
                .totalPages(userPage.getTotalPages())
                .elementList(userDTOs)
                .build();
    }


    public UserDTO createUser(UserDTO userDTO, MultipartFile avatar) {
        log.info("In method create user");

        User user = toEntity(userDTO);

        // Xử lý upload avatar
        if (avatar != null && !avatar.isEmpty()) {
            String avatarUrl = handleImageUpload(avatar);
            user.setAvatar(avatarUrl);
        }

        user.setCreatedAt(LocalDate.now());
        userRepository.save(user);
        return toDTO(user);
    }

    public UserRegisterResponse register(UserRegisterRequest request) {
        log.info("In method register user");
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists!");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists!");
        }
        if (!StringUtils.hasText(request.getPassword()) || !request.getPassword()
                .equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Passwords do not match or are invalid!");
        }

        Role role = roleRepository.findByName("ROLE_USER")
                .orElseThrow(() -> new IllegalArgumentException("Default role not found!"));

        User user = new User();
        user.setUsername(request.getUsername());
        user.setFirstname(request.getFirstname());
        user.setLastname(request.getLastname());
        user.setPhone(request.getPhone());
        user.setGender(request.getGender());
        user.setEmail(request.getEmail());
        user.setBirthday(request.getBirthday());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setStatus("Active");
        user.setRole(Collections.singleton(role));
        user.setCreatedAt(LocalDate.now());

        userRepository.save(user);

        UserRegisterResponse response = new UserRegisterResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setFirstname(user.getFirstname());
        response.setLastname(user.getLastname());
        response.setPhone(user.getPhone());
        response.setGender(user.getGender());
        response.setEmail(user.getEmail());
        response.setBirthday(user.getBirthday());
        response.setStatus(user.getStatus());
        response.setAvatar(user.getAvatar());
        response.setRole(Collections.singleton(new RoleDTO(role.getName(), role.getDescription())));
        response.setCreatedAt(user.getCreatedAt());

        log.info("User registered and saved successfully: {}", response);
        return response;
    }


    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public UserDTO updateUser(Long id, UserDTO userDTO, MultipartFile avatar) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cannot found user has id: " + id));
        user.setUsername(userDTO.getUsername());
        user.setFirstname(userDTO.getFirstname());
        user.setLastname(userDTO.getLastname());
        user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        user.setEmail(userDTO.getEmail());
        user.setPhone(userDTO.getPhone());
        user.setAddress(userDTO.getAddress());
        user.setGender(userDTO.getGender());
        user.setStatus(userDTO.getStatus());
        user.setBirthday(userDTO.getBirthday());
        user.setUpdatedAt(LocalDate.now());

        // Xử lý role
        Set<Role> role = userDTO.getRole().stream()
                .map(userRole -> roleRepository.findByName(userRole.getName())
                        .orElseThrow(() -> new RuntimeException("Cannot found role!")))
                .collect(Collectors.toSet());
        user.setRole(role);

        // Xử lý avatar nếu có
        if (avatar != null && !avatar.isEmpty()) {
            String avatarUrl = handleImageUpload(avatar);
            user.setAvatar(avatarUrl);
        }

        userRepository.save(user);
        return toDTO(user);
    }

    // Hàm xử lý upload ảnh
    private String handleImageUpload(MultipartFile file) {
        String uploadDir = System.getProperty("user.dir") + "/uploads/avatar";
        try {
            // Xử lý tên file
            String originalFileName = file.getOriginalFilename();
            String avatarFileName = System.currentTimeMillis() + "_" + originalFileName;
            log.info("Avatar file name: {}", avatarFileName);

            // Tạo thư mục nếu chưa tồn tại
            java.nio.file.Path uploadPath = java.nio.file.Paths.get(uploadDir);
            if (!java.nio.file.Files.exists(uploadPath)) {
                java.nio.file.Files.createDirectories(
                        uploadPath); // Tạo thư mục uploads/avatar nếu chưa có
            }

            // Đường dẫn file
            java.nio.file.Path filePath = uploadPath.resolve(avatarFileName);

            // Lưu file vào thư mục
            file.transferTo(filePath.toFile());

            // Trả về đường dẫn URL tương đối
            return "/uploads/avatar/" + avatarFileName;

        } catch (IOException e) {
            log.error("Error occurred while uploading image: {}", e.getMessage());
            throw new RuntimeException("Failed to upload image", e);
        }
    }

    private User toEntity(UserDTO userDTO) {
        Set<Role> roles = userDTO.getRole() != null ? userDTO.getRole().stream()
                .map(roleDTO -> roleRepository.findByName(roleDTO.getName())
                        .orElseThrow(
                                () -> new RuntimeException("Role not found: " + roleDTO.getName())))
                .collect(Collectors.toSet())
                : new HashSet<>();

        return User.builder()
                .id(userDTO.getId())
                .provider(userDTO.getProvider())
                .username(userDTO.getUsername())
                .firstname(userDTO.getFirstname())
                .lastname(userDTO.getLastname())
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .email(userDTO.getEmail())
                .phone(userDTO.getPhone())
                .address(userDTO.getAddress())
                .gender(userDTO.getGender())
                .status(userDTO.getStatus())
                .avatar(userDTO.getAvatar())
                .birthday(userDTO.getBirthday())
                .createdAt(
                        userDTO.getCreatedAt() != null ? userDTO.getCreatedAt() : LocalDate.now())
                .role(roles)
                .build();
    }

    private UserDTO toDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername())
                .firstname(user.getFirstname())
                .lastname(user.getLastname())
                .password(user.getPassword())
                .email(user.getEmail())
                .phone(user.getPhone())
                .address(user.getAddress())
                .gender(user.getGender())
                .status(user.getStatus())
                .provider(user.getProvider())
                .avatar(user.getAvatar())
                .birthday(user.getBirthday())
                .updatedAt(user.getUpdatedAt())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt() : LocalDate.now())
                .role(user.getRole() != null ? user.getRole().stream()
                        .map(role -> RoleDTO.builder()
                                .name(role.getName())
                                .description(role.getDescription())
                                .build()).collect(Collectors.toSet())
                        : new HashSet<>())
                .build();
    }
}
