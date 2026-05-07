package com.tirashop.service;

import com.tirashop.dto.ImportResultDTO;
import com.tirashop.persitence.entity.Brand;
import com.tirashop.persitence.entity.Category;
import com.tirashop.persitence.entity.Product;
import com.tirashop.persitence.repository.BrandRepository;
import com.tirashop.persitence.repository.CategoryRepository;
import com.tirashop.persitence.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProductImportService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;

    public ImportResultDTO importFromExcel(MultipartFile file) throws IOException {
        List<ImportResultDTO.RowError> errors = new ArrayList<>();
        List<Product> toSave = new ArrayList<>();

        Set<String> namesInFile = new HashSet<>();
        Set<String> codesInFile = new HashSet<>();

        try (Workbook wb = WorkbookFactory.create(file.getInputStream())) {
            Sheet sheet = wb.getSheet("Thêm Sản Phẩm");
            if (sheet == null) {
                throw new IllegalArgumentException(
                        "File không đúng template. Cần sheet tên 'Thêm Sản Phẩm'.");
            }

            for (int i = 3; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null || isRowBlank(row)) continue;

                int excelRow = i + 1;
                List<String> rowErrors = new ArrayList<>();

                String name          = getString(row, 0);
                String code          = getString(row, 1);
                String description   = getString(row, 2);
                String material      = getString(row, 3);
                Double price         = getDouble(row, 4, "Giá bán", rowErrors);
                Double originalPrice = getDoubleNullable(row, 5);
                Integer quantity     = getInteger(row, 6, "Số lượng", rowErrors);
                String status        = getString(row, 7);
                String size          = getString(row, 8);
                Long categoryId      = getLong(row, 9, "ID Danh mục", rowErrors);
                Long brandId         = getLong(row, 10, "ID Thương hiệu", rowErrors);
                String tagName       = getString(row, 11);

                if (name.isBlank())   rowErrors.add("Tên sản phẩm không được trống");
                if (code.isBlank())   rowErrors.add("Mã sản phẩm không được trống");
                if (status.isBlank()) rowErrors.add("Trạng thái không được trống");

                if (price != null && price <= 0)
                    rowErrors.add("Giá bán phải > 0");
                if (price != null && originalPrice != null && originalPrice < price)
                    rowErrors.add("Giá gốc phải ≥ Giá bán");

                if (!status.isBlank() &&
                        !Set.of("Available", "Disavailable").contains(status))
                    rowErrors.add("Trạng thái không hợp lệ: " + status);

                if (quantity != null && quantity < 0)
                    rowErrors.add("Số lượng không được âm");

                if (!name.isBlank() && productRepository.existsByName(name))
                    rowErrors.add("Tên '" + name + "' đã tồn tại trong hệ thống");
                if (!code.isBlank() && productRepository.existsByCode(code))
                    rowErrors.add("Mã '" + code + "' đã tồn tại trong hệ thống");

                if (!name.isBlank() && !namesInFile.add(name.toLowerCase()))
                    rowErrors.add("Tên '" + name + "' bị trùng trong file");
                if (!code.isBlank() && !codesInFile.add(code.toLowerCase()))
                    rowErrors.add("Mã '" + code + "' bị trùng trong file");

                Category category = null;
                Brand brand = null;
                if (categoryId != null) {
                    category = categoryRepository.findById(categoryId).orElse(null);
                    if (category == null)
                        rowErrors.add("ID Danh mục " + categoryId + " không tồn tại");
                }
                if (brandId != null) {
                    brand = brandRepository.findById(brandId).orElse(null);
                    if (brand == null)
                        rowErrors.add("ID Thương hiệu " + brandId + " không tồn tại");
                }

                if (!rowErrors.isEmpty()) {
                    errors.add(new ImportResultDTO.RowError(
                            excelRow, name, code, String.join(" | ", rowErrors)));
                    continue;
                }

                Product p = new Product();
                p.setName(name);
                p.setCode(code);
                p.setDescription(description);
                p.setMaterial(material);
                p.setPrice(price);
                p.setOriginalPrice(originalPrice);
                p.setQuantity(quantity);
                p.setInventory(quantity);
                p.setStatus(status);
                p.setSize(size);
                p.setTagName(tagName);
                p.setCategory(category);
                p.setBrand(brand);
                p.setCreatedAt(LocalDate.now());
                toSave.add(p);
            }
        }

        productRepository.saveAll(toSave);
        log.info("[IMPORT] {} thành công, {} lỗi", toSave.size(), errors.size());

        ImportResultDTO result = new ImportResultDTO();
        result.setTotalRows(toSave.size() + errors.size());
        result.setSuccessCount(toSave.size());
        result.setFailCount(errors.size());
        result.setErrors(errors);
        return result;
    }

    private String getString(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null) return "";
        return switch (cell.getCellType()) {
            case STRING  -> cell.getStringCellValue().trim();
            case NUMERIC -> String.valueOf((long) cell.getNumericCellValue());
            default      -> "";
        };
    }

    private Double getDouble(Row row, int col, String label, List<String> errs) {
        Cell cell = row.getCell(col);
        if (cell == null || cell.getCellType() == CellType.BLANK) {
            errs.add(label + " không được trống");
            return null;
        }
        if (cell.getCellType() != CellType.NUMERIC) {
            errs.add(label + " phải là số");
            return null;
        }
        return cell.getNumericCellValue();
    }

    private Double getDoubleNullable(Row row, int col) {
        Cell cell = row.getCell(col);
        if (cell == null || cell.getCellType() == CellType.BLANK) return null;
        return cell.getCellType() == CellType.NUMERIC ? cell.getNumericCellValue() : null;
    }

    private Integer getInteger(Row row, int col, String label, List<String> errs) {
        Double d = getDouble(row, col, label, errs);
        if (d == null) return null;
        if (d != Math.floor(d)) { errs.add(label + " phải là số nguyên"); return null; }
        return d.intValue();
    }

    private Long getLong(Row row, int col, String label, List<String> errs) {
        Double d = getDouble(row, col, label, errs);
        return d == null ? null : d.longValue();
    }

    private boolean isRowBlank(Row row) {
        for (Cell c : row)
            if (c != null && c.getCellType() != CellType.BLANK &&
                    !c.toString().isBlank()) return false;
        return true;
    }
}