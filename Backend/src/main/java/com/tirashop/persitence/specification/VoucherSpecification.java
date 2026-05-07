package com.tirashop.persitence.specification;


import com.tirashop.persitence.entity.Voucher;
import com.tirashop.persitence.entity.Voucher.Fields;
import jakarta.persistence.criteria.CriteriaBuilder;
import jakarta.persistence.criteria.CriteriaQuery;
import jakarta.persistence.criteria.Root;
import lombok.experimental.UtilityClass;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.jpa.domain.Specification;

@UtilityClass
public class VoucherSpecification {
    public static Specification<Voucher> searchVoucher(String code, String status){
        return (Root<Voucher> root, CriteriaQuery<?> query, CriteriaBuilder cb)->{
            if(StringUtils.isNotBlank(code)){
                return cb.like(cb.lower(root.get(Fields.code)),"%"+code.trim().toLowerCase()+"%");
            }
            if(StringUtils.isNotBlank(status)){
                return cb.like(cb.lower(root.get(Fields.status)),"%"+status.trim().toLowerCase()+"%");
            }
            return cb.conjunction();
        };


    }

}
