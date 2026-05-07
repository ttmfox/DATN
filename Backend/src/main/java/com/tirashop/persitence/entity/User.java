package com.tirashop.persitence.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;


@Entity
@Getter
@Setter
@Builder
@NoArgsConstructor
@FieldNameConstants
@AllArgsConstructor
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", unique = true)
    private String username;

    private String firstname;
    private String lastname;
    private String password;

    @Column(name = "email", unique = true)
    private String email;

    private String phone;
    private String address;
    private String gender;
    private String status;
    private String provider; //local, google, facebook

    private String avatar;
    @Column(name = "reset_code")
    private String resetCode;

    @OneToMany(mappedBy = "author")
    private Set<Post> author;

    @ManyToMany
    Set<Role> role;

    @Column(name = "birthday")
    private LocalDate birthday;

    @Column(name = "created_at", updatable = false)
    private LocalDate createdAt = LocalDate.now();

    @Column(name = "updated_at")
    private LocalDate updatedAt;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviews = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Cart> carts = new ArrayList<>();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Order> orders = new ArrayList<>();


}