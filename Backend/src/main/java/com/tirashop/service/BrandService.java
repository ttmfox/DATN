package com.tirashop.service;

import com.tirashop.dto.BrandDTO;
import com.tirashop.model.PagedData;
import com.tirashop.persitence.entity.Brand;
import com.tirashop.persitence.repository.BrandRepository;
import com.tirashop.persitence.specification.BrandSpecification;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
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
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BrandService {

    BrandRepository brandRepository;
    private static final String UPLOAD_DIR = System.getProperty("user.dir") + "/uploads/logo";

    public List<BrandDTO> getAllBrands() {
        return brandRepository.findAll().stream().map(this::toDTO).collect(Collectors.toList());
    }

    public PagedData<BrandDTO> filterBrands(String name, Pageable pageable) {
        Specification<Brand> spec = BrandSpecification.filterBrand(name);
        Page<Brand> brandPage = brandRepository.findAll(spec, pageable);

        List<BrandDTO> brandDTOs = brandPage.getContent()
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return PagedData.<BrandDTO>builder()
                .pageNo(brandPage.getNumber())
                .elementPerPage(brandPage.getSize())
                .totalElements(brandPage.getTotalElements())
                .totalPages(brandPage.getTotalPages())
                .elementList(brandDTOs)
                .build();
    }


    public BrandDTO createBrand(String name, String description, MultipartFile logoFile) {
        if (brandRepository.existsByName(name)) {
            throw new IllegalArgumentException("Brand name already exists");
        }
        Brand brand = new Brand();
        brand.setName(name);
        brand.setDescription(description);
        brand.setCreatedAt(LocalDate.now());
        brand.setUpdatedAt(null);

        if (logoFile != null && !logoFile.isEmpty()) {
            String logoPath = handleImageUpload(logoFile, UPLOAD_DIR);
            brand.setLogo(logoPath);
        }

        brandRepository.save(brand);
        return toDTO(brand);
    }

    public BrandDTO updateBrand(Long id, String name, String description, MultipartFile logoFile) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Brand not found: " + id));
        if(!brand.getName().equals(name)&& brandRepository.existsByName(name)){
            throw new RuntimeException("Brand has exist.");
        }

        brand.setName(name);
        brand.setDescription(description);
        brand.setUpdatedAt(LocalDate.now());

        if (logoFile != null && !logoFile.isEmpty()) {
            String logoPath = handleImageUpload(logoFile, UPLOAD_DIR);
            brand.setLogo(logoPath);
        }

        brandRepository.save(brand);
        return toDTO(brand);
    }

    public BrandDTO getBrandById(Long id) {
        Brand brand = brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cannot find brand with id: " + id));
        return toDTO(brand);
    }

    public void deleteBrand(Long id) {
        brandRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Cannot found this brand has id: " + id));
        brandRepository.deleteById(id);
    }

    private String handleImageUpload(MultipartFile file, String uploadDir) {
        try {
            // Xử lý tên file
            String originalFileName = file.getOriginalFilename();
            String fileName = System.currentTimeMillis() + "_" + originalFileName;
            log.info("File name: {}", fileName);

            // Tạo thư mục nếu chưa tồn tại
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Đường dẫn file
            Path filePath = uploadPath.resolve(fileName);

            // Lưu file vào thư mục
            file.transferTo(filePath.toFile());

            // Trả về đường dẫn URL tương đối
            return "/uploads/logo/" + fileName;

        } catch (IOException e) {
            log.error("Error occurred while uploading image: {}", e.getMessage());
            throw new RuntimeException("Failed to upload image", e);
        }
    }

    private BrandDTO toDTO(Brand brand) {
        return BrandDTO.builder()
                .id(brand.getId())
                .name(brand.getName())
                .description(brand.getDescription())
                .logo(brand.getLogo())
                .createdAt(brand.getCreatedAt())
                .updatedAt(brand.getUpdatedAt())
                .build();
    }
}
