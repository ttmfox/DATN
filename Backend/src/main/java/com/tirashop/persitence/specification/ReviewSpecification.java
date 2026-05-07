package com.tirashop.persitence.specification;

import com.tirashop.persitence.entity.Review;
import com.tirashop.persitence.entity.User;
import io.micrometer.common.util.StringUtils;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import java.util.ArrayList;
import java.util.List;
import lombok.experimental.UtilityClass;
import org.springframework.data.jpa.domain.Specification;

@UtilityClass
public class ReviewSpecification {

    public static Specification<Review> searchReview(Integer rating, String username) {
        return (Root<Review> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            // Tìm kiếm theo rating
            if (rating != null) {
                predicates.add(cb.equal(root.get(Review.Fields.rating), rating));
            }

            // Tìm kiếm theo username
            if (StringUtils.isNotBlank(username)) {
                Join<Review, User> userJoin = root.join("user",
                        JoinType.LEFT); // Join sang bảng User
                predicates.add(cb.like(cb.lower(userJoin.get(User.Fields.username)),
                        "%" + username.trim().toLowerCase() + "%"));
            }

            // Kết hợp tất cả các điều kiện
            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }


}
