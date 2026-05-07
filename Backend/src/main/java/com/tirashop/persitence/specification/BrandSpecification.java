package com.tirashop.persitence.specification;

import com.tirashop.persitence.entity.Brand;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import lombok.experimental.UtilityClass;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.jpa.domain.Specification;

@UtilityClass
public class BrandSpecification {

    public static Specification<Brand> filterBrand(String name) {
        return (Root<Brand> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            Predicate predicate = cb.conjunction();

            if (StringUtils.isNotBlank(name)) {
                predicate = cb.and(predicate,
                        cb.like(cb.lower(cb.trim(root.get(Brand.Fields.name))),
                                "%" + name.trim().toLowerCase() + "%"));
            }
            return predicate;
        };

    }
}
