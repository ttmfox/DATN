package com.tirashop.persitence.repository;

import com.tirashop.persitence.entity.Order;
import com.tirashop.persitence.entity.Order.OrderStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long>,
        JpaSpecificationExecutor<Order> {

    List<Order> findByUser_UsernameAndStatus(String username, Order.OrderStatus status);
    Page<Order> findByUser_UsernameAndStatus(String username, Order.OrderStatus status, Pageable pageable);
    List<Order> findByStatus(OrderStatus status);

    @Query("SELECT CASE WHEN COUNT(o) > 0 THEN true ELSE false END " +
            "FROM Order o " +
            "JOIN o.orderItems i " +
            "WHERE o.user.username = :username " +
            "AND i.product.id = :productId " +
            "AND o.status = :status")
    boolean existsByUserUsernameAndProductIdAndStatus(
            @Param("username") String username,
            @Param("productId") Long productId,
            @Param("status") Order.OrderStatus status
    );

    // Doanh thu: dựa vào đơn bán completed
    @Query("SELECT MONTH(o.createdAt) AS month, SUM(oi.price * oi.quantity) AS revenue " +
            "FROM Order o " +
            "JOIN o.orderItems oi " +
            "WHERE o.status = 'COMPLETED' " +
            "AND (:year IS NULL OR YEAR(o.createdAt) = :year) " +
            "AND (:month IS NULL OR MONTH(o.createdAt) = :month) " +
            "GROUP BY MONTH(o.createdAt) " +
            "ORDER BY MONTH(o.createdAt)")
    List<Object[]> getMonthlyRevenue(@Param("year") Integer year,
                                     @Param("month") Integer month);

    // Chi phí: dựa vào tháng nhập hàng của product
    @Query("SELECT MONTH(p.createdAt) AS month, SUM(p.originalPrice * p.quantity) AS cost " +
            "FROM Product p " +
            "WHERE (:year IS NULL OR YEAR(p.createdAt) = :year) " +
            "AND (:month IS NULL OR MONTH(p.createdAt) = :month) " +
            "GROUP BY MONTH(p.createdAt) " +
            "ORDER BY MONTH(p.createdAt)")
    List<Object[]> getMonthlyCost(@Param("year") Integer year,
                                  @Param("month") Integer month);

    // Lợi nhuận: revenue - cost
    // Ở đây sẽ tính theo tháng/năm bán
    @Query("SELECT MONTH(o.createdAt) AS month, " +
            "SUM(oi.price * oi.quantity) - SUM(p.originalPrice * oi.quantity) AS profit " +
            "FROM Order o " +
            "JOIN o.orderItems oi " +
            "JOIN oi.product p " +
            "WHERE o.status = 'COMPLETED' " +
            "AND (:year IS NULL OR YEAR(o.createdAt) = :year) " +
            "AND (:month IS NULL OR MONTH(o.createdAt) = :month) " +
            "GROUP BY MONTH(o.createdAt) " +
            "ORDER BY MONTH(o.createdAt)")
    List<Object[]> getMonthlyProfit(@Param("year") Integer year,
                                    @Param("month") Integer month);

}
