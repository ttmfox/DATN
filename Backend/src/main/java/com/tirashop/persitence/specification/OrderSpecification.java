package com.tirashop.persitence.specification;

import com.tirashop.persitence.entity.Order;
import com.tirashop.persitence.entity.OrderItem;
import jakarta.persistence.criteria.*;
import lombok.experimental.UtilityClass;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.jpa.domain.Specification;

@UtilityClass
public class OrderSpecification {

    public static Specification<Order> searchOrders(String keyword) {
        return (Root<Order> root, CriteriaQuery<?> query, CriteriaBuilder cb) -> {
            if (StringUtils.isBlank(keyword)) {
                return cb.conjunction();
            }

            Join<Order, OrderItem> orderItemsJoin = root.join("orderItems", JoinType.INNER);
            Join<OrderItem, com.tirashop.persitence.entity.Product> productJoin = orderItemsJoin.join(
                    "product", JoinType.INNER);

            Predicate usernamePredicate = cb.like(cb.lower(root.get("user").get("username")),
                    "%" + keyword.toLowerCase() + "%");
            Predicate productPredicate = cb.like(cb.lower(productJoin.get("name")),
                    "%" + keyword.toLowerCase() + "%");

            return cb.or(usernamePredicate, productPredicate);
        };
    }
}
