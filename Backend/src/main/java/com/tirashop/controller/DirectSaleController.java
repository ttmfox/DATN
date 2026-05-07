
package com.tirashop.controller;

import com.tirashop.dto.DirectSaleRequestDTO;
import com.tirashop.dto.OrderDTO;
import com.tirashop.service.DirectSaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tirashop/pos")
@RequiredArgsConstructor
public class DirectSaleController {

    private final DirectSaleService directSaleService;

    @PostMapping("/checkout")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<OrderDTO> createDirectSale(@RequestBody DirectSaleRequestDTO request) {
        OrderDTO result = directSaleService.createDirectOrder(request);
        return ResponseEntity.ok(result);
    }
}
