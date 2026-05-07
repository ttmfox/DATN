package com.tirashop.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.tirashop.dto.RoleDTO;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserRegisterResponse {
    private Long id;

    @Size(min = 6, message = "Username must be at least 6 characters!")
    private String username;

    private String firstname;
    private String lastname;
    private String phone;
    private String gender;

    @Email(message = "Email must be in valid format !!!")
    private String email;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private LocalDate birthday;

    private String status;
    private  String avatar;
    Set<RoleDTO> role;

    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private LocalDate createdAt;

}
