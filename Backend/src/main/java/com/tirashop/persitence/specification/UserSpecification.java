package com.tirashop.persitence.specification;

import com.tirashop.persitence.entity.User;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.experimental.UtilityClass;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.jpa.domain.Specification;

@UtilityClass
public class UserSpecification {
    public static Specification<User> filterUsers(String username, String address, String status){
        return (Root<User> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            Predicate predicate = cb.conjunction();

            if (StringUtils.isNotBlank(username)) {
                // Sử dụng LIKE và TRIM
                predicate = cb.and(predicate, cb.like(cb.lower(cb.trim(root.get(User.Fields.username))), "%" + username.trim().toLowerCase() + "%"));
            }
            if (StringUtils.isNotBlank(address)) {
                // Sử dụng LIKE và TRIM
                predicate = cb.and(predicate, cb.like(cb.lower(cb.trim(root.join(User.Fields.address).get("name"))), "%" + address.trim().toLowerCase() + "%"));
            }
            if (StringUtils.isNotBlank(status)) {
                // Sử dụng LIKE và TRIM
                predicate = cb.and(predicate, cb.like(cb.lower(cb.trim(root.join(User.Fields.status).get("name"))), "%" + status.trim().toLowerCase() + "%"));
            }
            return predicate;
        };

    }
}
