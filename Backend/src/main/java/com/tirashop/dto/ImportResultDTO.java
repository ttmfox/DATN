package com.tirashop.dto;


import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
public class ImportResultDTO {
    private int totalRows;
    private int successCount;
    private int failCount;
    private List<RowError> errors;

    @Data
    @AllArgsConstructor
    public static class RowError {
        private int row;
        private String name;
        private String code;
        private String errorMessage;
    }
}
