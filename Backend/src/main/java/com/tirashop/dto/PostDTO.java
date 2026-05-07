package com.tirashop.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.Column;
import java.time.LocalDateTime;
import lombok.*;

import java.time.LocalDate;
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PostDTO {

    private Long id;
    private String name;
    private String topic;
    private String imageUrl;
    private String short_description;
    private String content;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "dd-MM-yyyy")
    private LocalDate createdAt = LocalDate.now();
    private LocalDate updatedAt;
    private String status;
    private Long authorId;
    private String authorName;
    private String authorAvatar;
    private Boolean isMarkdown;
}

