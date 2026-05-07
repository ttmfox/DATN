package com.tirashop.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tirashop.dto.PostDTO;
import com.tirashop.model.PagedData;
import com.tirashop.persitence.entity.Post;
import com.tirashop.persitence.entity.User;
import com.tirashop.persitence.repository.PostRepository;
import com.tirashop.persitence.repository.UserRepository;
import com.tirashop.persitence.specification.PostSpecification;
import io.github.cdimascio.dotenv.Dotenv;

import java.time.LocalDateTime;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PostService {

    PostRepository postRepository;
    UserRepository userRepository;
    private static final Dotenv dotenv = Dotenv.load();
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
    private static final String GEMINI_API_KEY = dotenv.get("GEMINI_POST_KEY");

    private static final String POST_IMAGE_DIR = System.getProperty("user.dir") + "/uploads/post";

    public PagedData<PostDTO> searchPost(String name, String topic, String author,
                                         Pageable pageable) {

        var postSpec = PostSpecification.searchPost(name, topic, author);
        var postPage = postRepository.findAll(postSpec, pageable);

        var postItem = postPage.stream().map(
                this::toDTO
        ).toList();
        return PagedData.<PostDTO>builder()
                .pageNo(postPage.getNumber())
                .totalPages(postPage.getTotalPages())
                .totalElements(postPage.getTotalElements())
                .elementPerPage(postPage.getSize())
                .elementList(postItem)
                .build();
    }

    public void updateImg(Long id, MultipartFile url) {
        var post = postRepository.findById(id).orElseThrow(() -> new RuntimeException("Post not found."));

        String imageUrl = null;
        if (url != null && !url.isEmpty()) {
            imageUrl = handleImageUpload(url, POST_IMAGE_DIR);
        }

        post.setImageUrl(imageUrl);
        postRepository.save(post);


    }

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public PostDTO createPostManually(String name, String topic, String shortDescription,
                                      String content,
                                      MultipartFile image, String username) {
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = handleImageUpload(image, POST_IMAGE_DIR);
        }
        Post post = new Post();
        post.setName(name);
        post.setTopic(topic);
        post.setShort_description(shortDescription);
        post.setContent(content);
        post.setImageUrl(imageUrl);
        post.setAuthor(author);
        post.setCreatedAt(LocalDate.now());
        post.setStatus("PUBLISHED");
        post.setIsMarkdown(false);

        postRepository.save(post);
        return toDTO(post);
    }

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public PostDTO createPostWithAI(String name, String topic, String shortDescription,
                                    String username,
                                    MultipartFile image) {
        User author = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        String content = generateContentWithAI(topic, name,
                shortDescription);

        Post post = new Post();
        post.setName(name);
        post.setTopic(topic);
        post.setShort_description(shortDescription);
        post.setContent(content);
        post.setAuthor(author);
        post.setCreatedAt(LocalDate.now());
        post.setStatus("DRAFT");
        post.setIsMarkdown(true);

        if (image != null && !image.isEmpty()) {
            String imageUrl = handleImageUpload(image, POST_IMAGE_DIR);
            post.setImageUrl(imageUrl);
        }

        postRepository.save(post);
        return toDTO(post);
    }

    public Long updateStatus(Long id, String status) {
        var post = postRepository.findById(id).orElseThrow(
                () -> new RuntimeException("Post not found."));

        post.setStatus(status);
        postRepository.save(post);
        return post.getId();
    }

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public PostDTO updatePost(Long postId, String name, String topic, String shortDescription,
                              String content, MultipartFile image, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getAuthor().getUsername().equals(username)) {
            throw new RuntimeException("You are not authorized to update this post.");
        }

        if (name != null) {
            post.setName(name);
        }
        if (topic != null) {
            post.setTopic(topic);
        }
        if (shortDescription != null) {
            post.setShort_description(shortDescription);
        }
        if (content != null) {
            post.setContent(content);
        }

        if (image != null && !image.isEmpty()) {
            String imageUrl = handleImageUpload(image, POST_IMAGE_DIR);
            post.setImageUrl(imageUrl);
        }

        post.setUpdatedAt(LocalDate.now());
        postRepository.save(post);

        return toDTO(post);
    }

    @PreAuthorize("hasRole('ROLE_ADMIN')")
    public boolean deletePost(Long postId, String username) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        postRepository.delete(post);
        return true;
    }


    public PostDTO getPostById(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
        return toDTO(post);
    }

    public List<PostDTO> getAllPosts() {
        return postRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PostDTO toDTO(Post post) {
        return PostDTO.builder()
                .id(post.getId())
                .name(post.getName())
                .topic(post.getTopic())
                .imageUrl(post.getImageUrl())
                .short_description(post.getShort_description())
                .content(post.getContent())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .authorId(post.getAuthor().getId())
                .authorName(post.getAuthor().getUsername())
                .authorAvatar(post.getAuthor().getAvatar())
                .status(post.getStatus())
                .isMarkdown(post.getIsMarkdown())
                .build();
    }

    private String handleImageUpload(MultipartFile file, String uploadDir) {
        try {
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String originalFileName = file.getOriginalFilename();
            String uniqueFileName = System.currentTimeMillis() + "_" + originalFileName;

            Path filePath = uploadPath.resolve(uniqueFileName);
            file.transferTo(filePath.toFile());

            return "/uploads/post/" + uniqueFileName;
        } catch (IOException e) {
            log.error("Error uploading image: {}", e.getMessage());
            throw new RuntimeException("Failed to upload image", e);
        }
    }

    private String generateContentWithAI(String topic, String name, String shortDescription) {
        try {
            String geminiApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

            String escapedName = name.replace("\"", "\\\"");  // Escape "
            String escapedShortDesc = shortDescription.replace("\"", "\\\"");
            String escapedTopic = topic.replace("\"", "\\\"");

            String payload = String.format(
                    "{ \"contents\": [{ \"parts\": [{\"text\": \"Generate a blog post about %s titled '%s'. Short description: %s\" }] }] }",
                    escapedTopic, escapedName, escapedShortDesc
            );

            log.info("Request payload: {}", payload);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            RestTemplate restTemplate = new RestTemplate();
            HttpEntity<String> entity = new HttpEntity<>(payload, headers);

            // SỬA: Gọi API với model mới
            ResponseEntity<String> response = restTemplate.exchange(
                    geminiApiUrl + "?key=" + GEMINI_API_KEY,
                    HttpMethod.POST,
                    entity,
                    String.class
            );

            log.info("Response from Gemini API: {}", response.getBody());

            if (!response.getStatusCode().is2xxSuccessful()) {
                throw new RuntimeException("Error generating content: " + response.getStatusCode() + " - " + response.getBody());
            }

            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonNode = objectMapper.readTree(response.getBody());

            // SỬA: Kiểm tra an toàn (nếu không có candidates → throw lỗi rõ ràng)
            JsonNode candidates = jsonNode.path("candidates");
            if (candidates.isMissingNode() || !candidates.isArray() || candidates.size() == 0) {
                throw new RuntimeException("No content generated by Gemini: " + response.getBody());
            }

            JsonNode contentNode = candidates.path(0).path("content");
            if (contentNode.isMissingNode()) {
                throw new RuntimeException("Invalid response structure from Gemini: No 'content' field");
            }

            JsonNode parts = contentNode.path("parts");
            if (parts.isMissingNode() || !parts.isArray() || parts.size() == 0) {
                throw new RuntimeException("Invalid response structure from Gemini: No 'parts' field");
            }

            String generatedContent = parts.path(0).path("text").asText();
            if (generatedContent.isEmpty()) {
                throw new RuntimeException("Generated content is empty");
            }

            log.info("Generated Content: {}", generatedContent);
            return generatedContent;

        } catch (Exception e) {
            log.error("AI content generation failed: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate AI content: " + e.getMessage(), e);
        }
    }



}
