package com.tirashop.controller;

import com.tirashop.dto.ReviewDTO;
import com.tirashop.dto.response.ApiResponse;
import com.tirashop.model.PagedData;
import com.tirashop.service.OrderService;
import com.tirashop.service.ReviewService;
import com.tirashop.service.openAi.OpenAiModerationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;


@RestController
@RequestMapping("/tirashop/reviews")
@Tag(name = "Review", description = "APIs for managing reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final OpenAiModerationService moderationService;
    private final OrderService orderService;


    @GetMapping("")
    @Operation(summary = "Filter and list all reviews", description = "Retrieve all reviews")
    public ApiResponse<PagedData<ReviewDTO>> getAllReviews(
            @RequestParam(value = "rating", required = false) Integer rating,
            @RequestParam(value = "username", required = false) String username,
            @PageableDefault(page = 0, size = 25, sort = "createdAt", direction = Direction.DESC) Pageable pageable
    ) {
        var reviews = reviewService.searchReview(rating, username, pageable);
        return new ApiResponse<>("success", 200, "All reviews retrieved successfully", reviews);
    }

    @PostMapping(value = "/{productId}",consumes = "multipart/form-data")
    @Operation(summary = "Create review", description = "Create review for product")
    public ApiResponse<ReviewDTO> addReview(
            @PathVariable Long productId,
            @RequestParam int rating,
            @RequestParam(required = false) String reviewText,
            @RequestParam(required = false) MultipartFile image,
            Authentication authentication) {

        String username = authentication != null ? authentication.getName() : null;

        boolean hasPurchased = orderService.hasUserPurchasedProduct(username, productId);
        if (!hasPurchased) {
            return new ApiResponse<>("error", 403, "You can only review products you have purchased", null);
        }


        if (Optional.ofNullable(reviewText).filter(text -> !text.isBlank()).isPresent()) {
            try {
                boolean isSafe = moderationService.isContentSafe(reviewText);
                if (!isSafe) {
                    System.out.println("WARNING: This content is prohibited by Gemini AI!");
                    return new ApiResponse<>("error", 400, "Bình luận của bạn chứa ngôn từ không phù hợp",
                            null);
                }
            } catch (Exception e) {
                e.printStackTrace();
                return new ApiResponse<>("error", 500, "Error checking content moderation", null);
            }
        }
        if (image != null && !image.isEmpty()) {
            try {
                boolean isImageSafe = moderationService.isImageSafe(image);
                if (!isImageSafe) {
                    return new ApiResponse<>("error", 400, "Image contains inappropriate content",
                            null);
                }
            } catch (Exception e) {
                return new ApiResponse<>("error", 500, "Error checking image: " + e.getMessage(),
                        null);
            }
        }

        ReviewDTO review = reviewService.addReview(productId, username, rating, reviewText, image);
        return new ApiResponse<>("success", 200, "Review added successfully", review);
    }


    @DeleteMapping("/delete")
    @Operation(summary = "Delete review", description = "Delete review of product")
    public ApiResponse<Boolean> deletedReview(@RequestParam Long id) {
        return new ApiResponse<>("success", 200, "Review added successfully",
                reviewService.deletedReview(id));

    }

    @GetMapping("/product/{productId}")
    @Operation(summary = "Get reviews by product ID", description = "Retrieve all reviews for a product with pagination")
    public ApiResponse<PagedData<ReviewDTO>> getReviewsByProductId(
            @PathVariable Long productId,
            Pageable pageable
    ) {
        var reviews = reviewService.getReviewsByProductId(productId, pageable);
        return new ApiResponse<>("success", 200, "Reviews retrieved successfully", reviews);
    }


    @GetMapping("/user/{username}")
    @Operation(summary = "Get reviews by username", description = "Retrieve all reviews by a user with pagination")
    public ApiResponse<PagedData<ReviewDTO>> getReviewsByUser(
            @PathVariable String username,
            Pageable pageable
    ) {
        var reviews = reviewService.getReviewsByUser(username, pageable);
        return new ApiResponse<>("success", 200, "Reviews retrieved successfully", reviews);
    }

}
