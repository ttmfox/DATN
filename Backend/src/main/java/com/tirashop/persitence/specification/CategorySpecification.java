package com.tirashop.persitence.specification;

import com.tirashop.persitence.entity.Category;
import com.tirashop.persitence.entity.Category.Fields;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import lombok.experimental.UtilityClass;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.jpa.domain.Specification;

@UtilityClass
public class CategorySpecification {

    public static Specification<Category> searchCate(String name) {
        return (Root<Category> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            if (StringUtils.isEmpty(name)) {
                return cb.conjunction();
            }
            return cb.like(cb.lower(root.get(Fields.name)), "%" + name.trim().toLowerCase() + "%");
        };
    }

}
