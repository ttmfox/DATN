package com.tirashop.controller;

import com.tirashop.dto.VoucherDTO;
import com.tirashop.dto.response.ApiResponse;
import com.tirashop.model.PagedData;
import com.tirashop.service.VoucherService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/tirashop/voucher")
@Tag(name = "Voucher", description = "APIs for managing vouchers")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VoucherController {

    VoucherService voucherService;

    @GetMapping("/validate")
    @Operation(summary = "Validate voucher by code", description = "Retrieve and validate voucher details by its code")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<VoucherDTO> validateVoucherByCode(@RequestParam(value = "code") String code) {
        try {
            VoucherDTO response = voucherService.validateVoucherByCode(code);
            return new ApiResponse<>("success", 200, "Voucher is valid", response);
        } catch (RuntimeException e) {
            return new ApiResponse<>("error", 400, e.getMessage(), null);
        }
    }

    @GetMapping()
    @Operation(summary = "Get list and filter voucher by code and status")
    public ApiResponse<PagedData<VoucherDTO>> searchVoucher(
            @RequestParam(value = "code", required = false) String code,
            @RequestParam(value = "status", required = false) String status,
            @PageableDefault(page = 0, size = 25, sort = "createdAt", direction = Direction.DESC) Pageable pageable
    ) {
        var voucherItems = voucherService.seachVoucher(code, status, pageable);
        return new ApiResponse<>("success", 200, "Filter voucher success", voucherItems);
    }

    @GetMapping("/list")
    @Operation(summary = "Get all vouchers", description = "Retrieve all vouchers with their details")
    public ApiResponse<List<VoucherDTO>> getAllVouchers() {
        List<VoucherDTO> vouchers = voucherService.getAllVouchers();
        return new ApiResponse<>("success", 200, "Get Voucher success!", vouchers);
    }

    @PostMapping("/add")
    @Operation(summary = "Add new voucher", description = "Add a new voucher with its details")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<VoucherDTO> addVoucher(@RequestBody VoucherDTO voucherDTO) {
        VoucherDTO response = voucherService.createVoucher(voucherDTO);
        return new ApiResponse<>("success", 201, "Add Voucher success", response);
    }

    @PutMapping("/update/{id}")
    @Operation(summary = "Update voucher", description = "Update voucher details by ID")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<VoucherDTO> updateVoucher(@PathVariable Long id,
            @RequestBody VoucherDTO voucherDTO) {
        VoucherDTO response = voucherService.updateVoucher(id, voucherDTO);
        return new ApiResponse<>("success", 200, "Update Voucher success", response);
    }

    @DeleteMapping("/delete/{id}")
    @Operation(summary = "Delete voucher", description = "Delete a voucher by its ID")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<Void> deleteVoucher(@PathVariable Long id) {
        voucherService.deleteVoucher(id);
        return new ApiResponse<>("success", 200, "Delete Voucher success", null);
    }

    @GetMapping("/get/{id}")
    @Operation(summary = "Get voucher by ID", description = "Retrieve voucher details by its ID")
    @ResponseStatus(HttpStatus.OK)
    public ApiResponse<VoucherDTO> getVoucherById(@PathVariable Long id) {
        VoucherDTO response = voucherService.getVoucherById(id);
        return new ApiResponse<>("success", 200, "Get Voucher success", response);
    }
}
