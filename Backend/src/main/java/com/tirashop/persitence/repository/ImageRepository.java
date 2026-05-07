package com.tirashop.persitence.repository;
import com.tirashop.persitence.entity.Image;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ImageRepository extends JpaRepository<Image,Long> {
    List<Image> findByProductId(Long productId);
    boolean existsByUrl(String url);
}
