package com.tirashop.service;

import com.tirashop.dto.ReviewDTO;
import com.tirashop.model.PagedData;
import com.tirashop.persitence.entity.Product;
import com.tirashop.persitence.entity.Review;
import com.tirashop.persitence.entity.User;
import com.tirashop.persitence.repository.ProductRepository;
import com.tirashop.persitence.repository.ReviewRepository;
import com.tirashop.persitence.repository.UserRepository;
import com.tirashop.persitence.specification.ReviewSpecification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
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
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    private static final String REVIEW_IMAGE_DIR = System.getProperty("user.dir") + "/uploads/review";


    public PagedData<ReviewDTO> searchReview(Integer rating, String username, Pageable pageable) {
        var reviewSpec = ReviewSpecification.searchReview(rating, username);
        var reviewPage = reviewRepository.findAll(reviewSpec, pageable);

        var reviewItem = reviewPage.stream().map(
                this::toDTO
        ).toList();

        return PagedData.<ReviewDTO>builder()
                .pageNo(reviewPage.getNumber())
                .totalPages(reviewPage.getTotalPages())
                .totalElements(reviewPage.getTotalElements())
                .elementPerPage(reviewPage.getSize())
                .elementList(reviewItem)
                .build();
    }


    private ReviewDTO toDTO(Review review) {
        return ReviewDTO.builder()
                .id(review.getId())
                .productId(review.getProduct() != null ? review.getProduct().getId() : null)
                .productName(review.getProduct() != null ? review.getProduct().getName() : null)
                .userId(review.getUser() != null ? review.getUser().getId() : null)
                .username(review.getUser() != null ? review.getUser().getUsername() : null)
                .rating(review.getRating())
                .reviewText(review.getReview())
                .image(review.getImage())
                .createdAt(review.getCreatedAt())
                .updateAt(review.getUpdatedAt())
                .build();
    }




    public ReviewDTO addReview(Long productId, String username, int rating, String reviewText, MultipartFile image) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found: " + username));

        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found with ID: " + productId));

        String imageUrl = null;
        if (image != null && !image.isEmpty()) {
            imageUrl = handleImageUpload(image, REVIEW_IMAGE_DIR);
        }
        // 4. Lưu đánh giá
        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setRating(rating);
        review.setReview(reviewText);
        review.setImage(imageUrl);
        review.setCreatedAt(LocalDate.now());

        reviewRepository.save(review);
        return new ReviewDTO(
                review.getId(),
                product.getId(),
                product.getName(),
                user.getId(),
                user.getUsername(),
                rating,
                reviewText,
                imageUrl,
                review.getCreatedAt(),
                review.getUpdatedAt()
        );
    }


    public boolean deletedReview(Long id){
        if(!reviewRepository.existsById(id)){
            throw new RuntimeException("Cannot found this reviews has id: "+id);
        }
        reviewRepository.deleteById(id);
        return true;
    }

    public PagedData<ReviewDTO> getReviewsByProductId(Long productId, Pageable pageable) {
        if (!productRepository.existsById(productId)) {
            throw new RuntimeException("Product not found with ID: " + productId);
        }

        Page<Review> reviewPage = reviewRepository.findByProduct_Id(productId, pageable);

        List<ReviewDTO> reviewList = reviewPage.stream()
                .map(this::toDTO)
                .toList();

        return PagedData.<ReviewDTO>builder()
                .pageNo(reviewPage.getNumber())
                .totalPages(reviewPage.getTotalPages())
                .totalElements(reviewPage.getTotalElements())
                .elementPerPage(reviewPage.getSize())
                .elementList(reviewList)
                .build();
    }


    public PagedData<ReviewDTO> getReviewsByUser(String username, Pageable pageable) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found with username: " + username));

        Page<Review> reviewPage = reviewRepository.findByUser_Id(user.getId(), pageable);

        List<ReviewDTO> reviewList = reviewPage.stream()
                .map(this::toDTO)
                .toList();

        return PagedData.<ReviewDTO>builder()
                .pageNo(reviewPage.getNumber())
                .totalPages(reviewPage.getTotalPages())
                .totalElements(reviewPage.getTotalElements())
                .elementPerPage(reviewPage.getSize())
                .elementList(reviewList)
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

            return "/uploads/review/" + uniqueFileName;
        } catch (IOException e) {
            log.error("Error uploading image: {}", e.getMessage());
            throw new RuntimeException("Failed to upload image", e);
        }
    }
}
