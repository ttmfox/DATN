package com.tirashop.service;

import com.tirashop.dto.ImageDTO;
import com.tirashop.dto.ProductDTO;
import com.tirashop.dto.request.ProductRequest;
import com.tirashop.dto.response.ProductResponse;
import com.tirashop.model.PagedData;
import com.tirashop.persitence.entity.*;
import com.tirashop.persitence.repository.BrandRepository;
import com.tirashop.persitence.repository.CategoryRepository;
import com.tirashop.persitence.repository.ImageRepository;
import com.tirashop.persitence.repository.ProductRepository;
import com.tirashop.persitence.specification.ProductSpecification;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.data.domain.Pageable;

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
public class ProductService {

    ProductRepository productRepository;
    CategoryRepository categoryRepository;
    BrandRepository brandRepository;
    ImageRepository imageRepository;


    private final WebhookService webhookService;

    private static final String UPLOAD_DIR =
            System.getProperty("user.dir") + "/uploads/product/image";


    public List<ProductDTO> getAllBestSellerProducts() {
        return productRepository.findAll()
                .stream()
                .map(this::toDTO)
                .filter(ProductDTO::getIsBestSeller)
                .collect(Collectors.toList());
    }


    public PagedData<ProductDTO> filterProducts(String word1, Pageable pageable) {
        Page<Product> productPage;
        productPage = productRepository.findByNameContainingVietnamese(word1, pageable);
        return mapToPagedData(productPage);
    }

    public PagedData<ProductDTO> filterProductsWithLanguage(String language, String word1, String word2, Pageable pageable) {
        Page<Product> productPage;
        if ("vi".equalsIgnoreCase(language)) {
            productPage = productRepository.findByNameContainingVietnamese(word1, pageable);
        } else {
            productPage = productRepository.findByNameContainingEnglish(word1, word2, pageable);
        }
        return mapToPagedData(productPage);
    }

    private PagedData<ProductDTO> mapToPagedData(Page<Product> productPage) {
        return PagedData.<ProductDTO>builder()
                .pageNo(productPage.getNumber())
                .elementPerPage(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .elementList(productPage.getContent().stream()
                        .map(this::toDTO)
                        .collect(Collectors.toList()))
                .build();
    }

    public PagedData<ProductDTO> searchProductsByLabel(String label, Pageable pageable) {
        Page<Product> productPage = productRepository.findByTagName(label, pageable);
        List<ProductDTO> productDTOs = productPage.getContent()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return PagedData.<ProductDTO>builder()
                .pageNo(productPage.getNumber())
                .elementPerPage(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .elementList(productDTOs)
                .build();
    }


    public void deleteImageProduct(Long productId) {
        var listImageProduct = imageRepository.findByProductId(productId).stream()
                .collect(Collectors.toList());
        imageRepository.deleteAll(listImageProduct);
    }

    public PagedData<ProductDTO> filterProductsWithPaging(String name, String size, Double minPrice,
                                                          Double maxPrice, String category, String brand, Pageable pageable) {

        Specification<Product> spec = ProductSpecification.filterProducts(name, size, minPrice,
                maxPrice, category, brand);

        Page<Product> productPage = productRepository.findAll(spec, pageable);

        List<ProductDTO> productDTOs = productPage.getContent()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return PagedData.<ProductDTO>builder()
                .pageNo(productPage.getNumber())
                .elementPerPage(productPage.getSize())
                .totalElements(productPage.getTotalElements())
                .totalPages(productPage.getTotalPages())
                .elementList(productDTOs)
                .build();
    }


    public ProductResponse createProduct(ProductRequest request) {
        // Kiểm tra nếu tên sản phẩm đã tồn tại
        if (productRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Product name already exists");
        }

        // Kiểm tra giá trị hợp lệ
        if (request.getPrice() <= 0) {
            throw new IllegalArgumentException("Price must be greater than 0");
        }

        if (request.getOriginalPrice() != null && request.getOriginalPrice() < request.getPrice()) {
            throw new IllegalArgumentException("Original price must be greater than current price");
        }

        // Chuyển đổi từ ProductRequest sang Product
        Product product = toEntity(request);

        // Gán giá gốc (nếu có)
        if (request.getOriginalPrice() != null) {
            product.setOriginalPrice(request.getOriginalPrice());
        }

        // Lưu sản phẩm
        productRepository.save(product);

        webhookService.notifyProductChange("created", product.getId());
        return toResponse(product);
    }


    public ProductResponse updateProduct(Long id, ProductRequest request) {
        Product productUpdate = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cannot find product with ID: " + id));
        if (!productUpdate.getName().equals(request.getName()) && productRepository.existsByName(request.getName())) {
            throw new IllegalArgumentException("Product name already exists");
        }
        if (request.getPrice() <= 0) {
            throw new IllegalArgumentException("Price must be greater than 0");
        }

        if (request.getOriginalPrice() != null && request.getOriginalPrice() < request.getPrice()) {
            throw new IllegalArgumentException("Original price must be greater than current price");
        }
        productUpdate.setName(request.getName());
        productUpdate.setCode(request.getCode());
        productUpdate.setDescription(request.getDescription());
        productUpdate.setMaterial(request.getMaterial());
        productUpdate.setPrice(request.getPrice());
        productUpdate.setQuantity(request.getQuantity());
        productUpdate.setStatus(request.getStatus());
        productUpdate.setSize(request.getSize());
        productUpdate.setInventory(request.getInventory());
        productUpdate.setUpdatedAt(LocalDate.now());

        if (request.getOriginalPrice() != null) {
            productUpdate.setOriginalPrice(request.getOriginalPrice());
        } else {
            productUpdate.setOriginalPrice(null);
        }
        productRepository.save(productUpdate);

        webhookService.notifyProductChange("updated", productUpdate.getId());
        return toResponse(productUpdate);
    }


    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cannot found product has id: " + id));
        return toDTO(product);
    }


    public void deleteProduct(Long id) {
        productRepository.deleteById(id);

        webhookService.notifyProductChange("deleted", id);
    }


    // Chuyển đổi từ Product sang ProductDTO
    private ProductDTO toDTO(Product product) {
        ProductDTO productDTO = new ProductDTO();
        productDTO.setId(product.getId());
        productDTO.setName(product.getName());
        productDTO.setCode(product.getCode());
        productDTO.setDescription(product.getDescription());
        productDTO.setMaterial(product.getMaterial());
        productDTO.setPrice(product.getPrice());
        productDTO.setQuantity(product.getQuantity());
        productDTO.setStatus(product.getStatus());
        productDTO.setSize(product.getSize());
        productDTO.setTagName(product.getTagName());
        productDTO.setCategoryId(product.getCategory() != null ? product.getCategory().getId() : null);
        productDTO.setCategoryName(product.getCategory() != null ? product.getCategory().getName() : null);
        productDTO.setBrandId(product.getBrand() != null ? product.getBrand().getId() : null);
        productDTO.setBrandName(product.getBrand() != null ? product.getBrand().getName() : null);
        // Nếu inventory = 0, tự động lấy quantity đắp vào
        productDTO.setInventory(product.getInventory() == 0 ? product.getQuantity() : product.getInventory());
        productDTO.setCreatedAt(product.getCreatedAt());
        productDTO.setUpdatedAt(product.getUpdatedAt());
        productDTO.setOriginalPrice(product.getOriginalPrice());
        List<String> productUrl = product.getImages().stream().map(Image::getUrl).toList();
        productDTO.setImageUrls(productUrl);

        // Tính trung bình đánh giá sao từ reviews
        double averageRating = product.getReviews().isEmpty()
                ? 0.0
                : product.getReviews().stream()
                .mapToDouble(Review::getRating) // Giả sử Review có getRating()
                .average()
                .orElse(0.0);
        productDTO.setAverageRating(averageRating);

        // Tính tổng số lượng bán ra từ orderItems (chỉ tính đơn hàng COMPLETED)
        int totalSold = product.getOrderItems().stream()
                .filter(orderItem -> orderItem.getOrder().getStatus() == Order.OrderStatus.COMPLETED)
                .mapToInt(OrderItem::getQuantity)
                .sum();
        productDTO.setIsBestSeller(totalSold > 5);

        return productDTO;
    }

    private ProductResponse toResponse(Product product) {
        ProductResponse response = new ProductResponse();
        response.setId(product.getId());
        response.setName(product.getName());
        response.setOriginalPrice(product.getOriginalPrice());
        response.setCode(product.getCode());
        response.setDescription(product.getDescription());
        response.setMaterial(product.getMaterial());
        response.setPrice(product.getPrice());
        response.setTagName(product.getTagName());
        response.setQuantity(product.getQuantity());
        response.setStatus(product.getStatus());
        response.setSize(product.getSize());
        response.setCategoryId(product.getCategory() != null ? product.getCategory().getId() : null);
        response.setBrandId(product.getBrand() != null ? product.getBrand().getId() : null);
        response.setInventory(product.getInventory() == 0 ? product.getQuantity() : product.getInventory());
        response.setCreatedAt(product.getCreatedAt());
        response.setUpdatedAt(product.getUpdatedAt());

        // Tính trung bình đánh giá sao từ reviews
        double averageRating = product.getReviews().isEmpty()
                ? 0.0
                : product.getReviews().stream()
                .mapToDouble(Review::getRating)
                .average()
                .orElse(0.0);
        response.setAverageRating(averageRating);

        // Tính tổng số lượng bán ra từ orderItems (chỉ tính đơn hàng COMPLETED)
        int totalSold = product.getOrderItems().stream()
                .filter(orderItem -> orderItem.getOrder().getStatus() == Order.OrderStatus.COMPLETED)
                .mapToInt(OrderItem::getQuantity)
                .sum();
        response.setIsBestSeller(totalSold > 5);

        return response;
    }

    // Chuyển đổi từ ProductRequest sang Product
    private Product toEntity(ProductRequest request) {
        Product product = new Product();
        product.setName(request.getName());
        product.setCode(request.getCode());
        product.setDescription(request.getDescription());
        product.setMaterial(request.getMaterial());
        product.setPrice(request.getPrice());
        product.setQuantity(request.getQuantity());
        product.setTagName(request.getTagName());
        product.setStatus(request.getStatus());
        product.setSize(request.getSize());
        product.setInventory(request.getInventory() == 0 ? request.getQuantity() : request.getInventory());
        product.setOriginalPrice(request.getOriginalPrice());

        // createdAt luôn là LocalDate.now() nếu là sản phẩm mới
        if (product.getId() == null) {
            product.setCreatedAt(LocalDate.now());
        } else {
            product.setCreatedAt(request.getCreatedAt());
        }

        product.setUpdatedAt(request.getUpdatedAt());

        // Xử lý mối quan hệ với Category
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new IllegalArgumentException("Category not exist"));
            product.setCategory(category);
        }

        // Xử lý mối quan hệ với Brand
        if (request.getBrandId() != null) {
            Brand brand = brandRepository.findById(request.getBrandId())
                    .orElseThrow(() -> new IllegalArgumentException("Brand not exist"));
            product.setBrand(brand);
        }

        return product;
    }

    public List<ImageDTO> getAllImagesByProductId(Long productId) {
        List<Image> images = imageRepository.findByProductId(productId);
        return images.stream().map(this::toImageDTO).collect(Collectors.toList());
    }

    // xu li image
    public ImageDTO uploadImageToProduct(Long productId, MultipartFile file) {
        Product product = productRepository.findById(productId)
                .orElseThrow(
                        () -> new RuntimeException("Cannot find product with ID: " + productId));

        String tempFileName = file.getOriginalFilename();
        String tempFileUrl = "/uploads/product/image/" + tempFileName;

        boolean imageExists = imageRepository.existsByUrl(tempFileUrl);
        if (imageExists) {
            throw new RuntimeException("This image already exists in the database.");
        }

        String imagePath = handleImageUpload(file, UPLOAD_DIR);

        Image image = new Image();
        image.setFileName(file.getOriginalFilename());
        image.setFileType(file.getContentType());
        image.setUrl(imagePath);
        image.setProduct(product);
        image.setCreatedAt(LocalDate.now());

        Image savedImage = imageRepository.save(image);
        return toImageDTO(savedImage);
    }

    public void deleteImageById(Long productId, Long imageId) {
        Image image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Cannot find image with ID: " + imageId));

        // Kiểm tra xem ảnh có thuộc về sản phẩm không
        if (!image.getProduct().getId().equals(productId)) {
            throw new RuntimeException("Image does not belong to the specified product.");
        }

        // Xóa ảnh
        imageRepository.delete(image);
    }

    public ImageDTO updateImage(Long productId, Long imageId, MultipartFile file) {
        Image image = imageRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Cannot find image with ID: " + imageId));

        // Kiểm tra xem ảnh có thuộc về sản phẩm không
        if (!image.getProduct().getId().equals(productId)) {
            throw new RuntimeException("Image does not belong to the specified product.");
        }

        // Lưu file mới
        String imagePath = handleImageUpload(file, UPLOAD_DIR);

        // Cập nhật thông tin
        image.setFileName(file.getOriginalFilename());
        image.setFileType(file.getContentType());
        image.setUrl(imagePath);

        Image updatedImage = imageRepository.save(image);
        return toImageDTO(updatedImage);
    }


    private String handleImageUpload(MultipartFile file, String uploadDir) {
        try {
            // Tạo thư mục nếu chưa tồn tại
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Đường dẫn file
            Path filePath = uploadPath.resolve(file.getOriginalFilename());

            // Lưu file vào thư mục
            file.transferTo(filePath.toFile());

            // Trả về URL tương đối
            return "/uploads/product/image/" + file.getOriginalFilename();

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image", e);
        }
    }


    private ImageDTO toImageDTO(Image image) {
        return new ImageDTO(
                image.getId(),
                image.getFileName(),
                image.getFileType(),
                image.getUrl(),
                image.getProduct().getId(),
                image.getCreatedAt()
        );
    }


}
