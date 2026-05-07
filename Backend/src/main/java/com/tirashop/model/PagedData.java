package com.tirashop.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedData<T> {

    private int pageNo;
    private int elementPerPage;
    private Long totalElements;
    private int totalPages;

    private List<T> elementList;
}

