package com.tirashop.controller;

import com.tirashop.dto.CategoryDTO;
import com.tirashop.dto.response.ApiResponse;
import com.tirashop.model.PagedData;
import com.tirashop.service.CategoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort.Direction;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/tirashop/category")
@Tag(name = "Category", description = "APIs for managing categories")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CategoryController {

    CategoryService categoryService;

    @GetMapping("")
    @Operation(summary = "Filter and Listing all categories", description = "Get a list and search of all available categories")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successfully retrieved list of categories")
    public ApiResponse<PagedData<CategoryDTO>> filterCategory(
            @RequestParam(value = "name", required = false) String name,
            @PageableDefault(page = 0, size = 25, sort = "createdAt", direction = Direction.DESC) Pageable pageable
    ) {
        var cateData = categoryService.searchCate(name, pageable);
        return new ApiResponse<>("success", 200, "Get data from category success", cateData);
    }

    @GetMapping("/list")
    @Operation(summary = "Retrieve all categories", description = "Get a list of all available categories")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Successfully retrieved list of categories")
    public ApiResponse<List<CategoryDTO>> getAllCategory() {
        List<CategoryDTO> list = categoryService.getAllCate();
        return new ApiResponse<>("success", 200, "Get data from category success", list);
    }

    @PostMapping("/add")
    @Operation(summary = "Add a new category", description = "Create a new category by providing its details")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Category successfully added")
    public ApiResponse<CategoryDTO> createCategory(@RequestBody CategoryDTO request) {
        CategoryDTO cate = categoryService.addNewCate(request);
        return new ApiResponse<>("success", 200, "Add data to category success", cate);
    }

    @PutMapping("/update/{id}")
    @Operation(summary = "Update an existing category", description = "Update a category by providing its ID and new details")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Category successfully updated")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Category not found")
    public ApiResponse<CategoryDTO> createCategory(
            @PathVariable Long id,
            @RequestBody CategoryDTO request) {
        CategoryDTO cate = categoryService.updateCate(id, request);
        return new ApiResponse<>("success", 200, "Update data from category success", cate);
    }

    @DeleteMapping("/delete/{id}")
    @Operation(summary = "Delete a category", description = "Delete a category by its ID")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Category successfully deleted")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Category not found")
    public ApiResponse<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCate(id);
        return new ApiResponse<>("success", 200, "Delete category success", null);
    }
}
