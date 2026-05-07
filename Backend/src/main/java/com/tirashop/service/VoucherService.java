package com.tirashop.service;

import com.tirashop.dto.VoucherDTO;
import com.tirashop.model.PagedData;
import com.tirashop.persitence.entity.Voucher;
import com.tirashop.persitence.repository.VoucherRepository;
import com.tirashop.persitence.specification.VoucherSpecification;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VoucherService {

    VoucherRepository voucherRepository;
    private final WebhookService webhookService;


    @PostConstruct
    @Transactional
    public void checkAndUpdateExpiredVouchers() {
        log.info("Bắt đầu kiểm tra voucher hết hạn...");

        LocalDate today = LocalDate.now();

        List<Voucher> expiredVouchers = voucherRepository
                .findByStatusAndEndDateBefore(Voucher.VoucherStatus.ACTIVE, today);

        if (!expiredVouchers.isEmpty()) {
            expiredVouchers.forEach(voucher -> {
                voucher.setStatus(Voucher.VoucherStatus.EXPIRED);
                voucher.setUpdatedAt(LocalDate.now());
                log.info("Voucher {} đã hết hạn, chuyển sang trạng thái EXPIRED",
                        voucher.getCode());
            });

            voucherRepository.saveAll(expiredVouchers);
            log.info("Đã cập nhật {} voucher hết hạn", expiredVouchers.size());
        } else {
            log.info("Không có voucher nào hết hạn");
        }
    }

    public PagedData<VoucherDTO> seachVoucher(String code, String status, Pageable pageable) {

        var voucherSpec = VoucherSpecification.searchVoucher(code, status);
        var voucherPage = voucherRepository.findAll(voucherSpec, pageable);

        var voucherItem = voucherPage.getContent().stream().map(
                this::mapToDto
        ).toList();

        return PagedData.<VoucherDTO>builder()
                .pageNo(voucherPage.getNumber())
                .elementPerPage(voucherPage.getSize())
                .totalElements(voucherPage.getTotalElements())
                .totalPages(voucherPage.getTotalPages())
                .elementList(voucherItem)
                .build();
    }


    public List<VoucherDTO> getAllVouchers() {
        return voucherRepository.findAll()
                .stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public VoucherDTO createVoucher(VoucherDTO voucherDTO) {
        Voucher voucher = mapToEntity(voucherDTO, true); // isCreate = true
        Voucher savedVoucher = voucherRepository.save(voucher);

        webhookService.notifyVoucherChange("created", savedVoucher.getId());
        return mapToDto(savedVoucher);
    }


    public VoucherDTO updateVoucher(Long id, VoucherDTO voucherDTO) {
        Voucher existingVoucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found with id: " + id));

        if (!existingVoucher.getCode().equals(voucherDTO.getCode()) &&
                voucherRepository.existsByCode(voucherDTO.getCode())) {

            throw new RuntimeException("Voucher has exist");
        }

        Voucher updatedVoucher = mapToEntity(voucherDTO, false);
        updatedVoucher.setId(existingVoucher.getId());
        updatedVoucher.setCreatedAt(existingVoucher.getCreatedAt());
        Voucher savedVoucher = voucherRepository.save(updatedVoucher);

        webhookService.notifyVoucherChange("updated", savedVoucher.getId());
        return mapToDto(savedVoucher);
    }


    public void deleteVoucher(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found with id: " + id));

        voucherRepository.delete(voucher);
        webhookService.notifyVoucherChange("deleted", id);
    }


    public VoucherDTO getVoucherById(Long id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Voucher not found with id: " + id));
        return mapToDto(voucher);
    }


    public VoucherDTO validateVoucherByCode(String code) {
        var voucherOptional = voucherRepository.findByCode(code);

        if (!voucherOptional.isPresent()) {
            throw new RuntimeException("Voucher not found");
        }

        Voucher voucher = voucherOptional.get();

        if (voucher.getStatus() == Voucher.VoucherStatus.EXPIRED || voucher.getStatus() == Voucher.VoucherStatus.USED) {
            throw new RuntimeException("Voucher is expired or already used");
        }

        if (LocalDate.now().isBefore(voucher.getStartDate()) || LocalDate.now().isAfter(voucher.getEndDate())) {
            throw new RuntimeException("Voucher is not valid yet or has expired");
        }

        return new VoucherDTO(
                voucher.getId(),
                voucher.getCode(),
                voucher.getDiscountType(),
                voucher.getDiscountValue(),
                voucher.getStartDate(),
                voucher.getEndDate(),
                voucher.getStatus(),
                voucher.getCreatedAt(),
                voucher.getUpdatedAt()
        );
    }

    private VoucherDTO mapToDto(Voucher voucher) {
        if (voucher == null) {
            return null;
        }
        return new VoucherDTO(
                voucher.getId(),
                voucher.getCode(),
                voucher.getDiscountType(),
                voucher.getDiscountValue(),
                voucher.getStartDate(),
                voucher.getEndDate(),
                voucher.getStatus(),
                voucher.getCreatedAt(),
                voucher.getUpdatedAt()
        );
    }


    private Voucher mapToEntity(VoucherDTO voucherDTO, boolean isCreate) {
        if (voucherDTO == null) {
            return null;
        }
        Voucher voucher = new Voucher();
        voucher.setId(voucherDTO.getId());
        voucher.setCode(voucherDTO.getCode());
        voucher.setDiscountType(voucherDTO.getDiscountType());
        voucher.setDiscountValue(voucherDTO.getDiscountValue());
        voucher.setStartDate(voucherDTO.getStartDate());
        voucher.setEndDate(voucherDTO.getEndDate());
        voucher.setStatus(voucherDTO.getStatus());

        if (isCreate) {
            voucher.setCreatedAt(LocalDate.now()); // Khi tạo, lấy thời gian hiện tại
            voucher.setUpdatedAt(null); // Khi tạo, `updatedAt` sẽ null
        } else {
            voucher.setUpdatedAt(LocalDate.now()); // Khi cập nhật, lấy thời gian hiện tại
        }

        return voucher;
    }


}
