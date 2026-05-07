package com.tirashop.persitence.repository;

import com.tirashop.persitence.entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, Long>, JpaSpecificationExecutor<Voucher> {
    boolean existsByCode(String code);
    Optional<Voucher> findByCode(String code);

    List<Voucher> findByStatusAndEndDateBefore(
            Voucher.VoucherStatus status,
            LocalDate date
    );

}
