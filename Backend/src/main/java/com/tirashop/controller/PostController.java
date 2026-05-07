package com.tirashop.controller;

import com.tirashop.dto.PostDTO;
import com.tirashop.dto.response.ApiResponse;
import com.tirashop.model.PagedData;
import com.tirashop.service.PostService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/tirashop/posts")
@Tag(name = "Post", description = "APIs for managing posts")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PostController {

    PostService postService;

    @GetMapping("")
    @Operation(summary = "Filter and Listing all posts", description = "Retrieve all posts")
    public ApiResponse<PagedData<PostDTO>> getAllPosts(
            @RequestParam(value = "name", required = false) String name,
            @RequestParam(value = "topic", required = false) String topic,
            @RequestParam(value = "author", required = false) String author,
            @PageableDefault(page = 0, size = 25, sort = "createdAt", direction = Direction.DESC) Pageable pageable
    ) {
        var posts = postService.searchPost(name, topic, author, pageable);
        return new ApiResponse<>("success", 200, "All posts retrieved successfully", posts);
    }


    @PostMapping(value = "/create", consumes = "multipart/form-data")
    @Operation(summary = "Create new post", description = "Create a new post with optional image")
    public ApiResponse<PostDTO> createPost(
            @RequestParam String name,
            @RequestParam String topic,
            @RequestParam String shortDescription,
            @RequestParam String content,
            @RequestParam(required = false) MultipartFile image,
            Authentication authentication) {

        String username = authentication.getName();

        PostDTO postDTO = postService.createPostManually(name, topic, shortDescription, content,
                image,
                username);
        return new ApiResponse<>("success", 200, "Post created successfully", postDTO);
    }

    @PostMapping(value = "/createWithAI", consumes = "multipart/form-data")
    @Operation(summary = "Create new post with AI-generated content", description = "Create a new post with AI-generated content, optional image, and scheduling")
    public ApiResponse<PostDTO> createPostWithAI(
            @RequestParam String name,
            @RequestParam String topic,
            @RequestParam String shortDescription,
            @RequestParam(required = false) MultipartFile image,
            Authentication authentication) {

        String username = authentication.getName();

        PostDTO postDTO = postService.createPostWithAI(name, topic, shortDescription, username,
                image);
        return new ApiResponse<>("success", 200, "Post created successfully", postDTO);
    }

    @PutMapping("/{postId}/change-status")
    @Operation(summary = "Update status post", description = "Update an existing post")
    public ApiResponse<Long> updatePost(
            @PathVariable Long postId,
            @RequestParam(required = true) String status
    ) {

        var post = postService.updateStatus(postId, status);
        return new ApiResponse<>("success", 200, "Post update status successfully", post);
    }

    @PutMapping("/{postId}/imageUrl")
    @Operation(summary = "Update image post", description = "Update image post")
    public ApiResponse<Void> updateImagePost(
            @PathVariable Long postId,
            @RequestParam(required = false) MultipartFile img
    ) {

        postService.updateImg(postId, img);
        return new ApiResponse<>("success", 200, "Post update image status successfully", null);
    }

    @PutMapping(value = "/{postId}/update", consumes = "multipart/form-data")
    @Operation(summary = "Update post", description = "Update an existing post")
    public ApiResponse<PostDTO> updatePost(
            @PathVariable Long postId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String shortDescription,
            @RequestParam(required = false) String content,
            @RequestParam(required = false) MultipartFile image,
            Authentication authentication) {

        String username = authentication.getName();
        PostDTO postDTO = postService.updatePost(postId, name, topic, shortDescription, content,
                image, username);
        return new ApiResponse<>("success", 200, "Post updated successfully", postDTO);
    }


    @DeleteMapping("/{postId}/delete")
    @Operation(summary = "Delete post", description = "Delete an existing post")
    public ApiResponse<Boolean> deletePost(
            @PathVariable Long postId,
            Authentication authentication) {

        String username = authentication.getName();  // Get username from authentication
        boolean success = postService.deletePost(postId, username);
        return new ApiResponse<>("success", 200, "Post deleted successfully", success);
    }


    @GetMapping("/{postId}")
    @Operation(summary = "Get post by ID", description = "Retrieve a specific post by its ID")
    public ApiResponse<PostDTO> getPostById(@PathVariable Long postId) {
        PostDTO postDTO = postService.getPostById(postId);
        return new ApiResponse<>("success", 200, "Post retrieved successfully", postDTO);
    }


    @GetMapping("/all")
    @Operation(summary = "Get all posts", description = "Retrieve all posts")
    public ApiResponse<List<PostDTO>> getAllPosts() {
        List<PostDTO> posts = postService.getAllPosts();
        return new ApiResponse<>("success", 200, "All posts retrieved successfully", posts);
    }
}



