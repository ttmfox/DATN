package com.tirashop.controller;

import com.tirashop.dto.CartDTO;
import com.tirashop.dto.CartItemDTO;
import com.tirashop.dto.request.AddToCartRequest;
import com.tirashop.dto.response.ApiResponse;
import com.tirashop.service.CartService;
import io.swagger.v3.oas.annotations.Operation;

import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/tirashop/cart")
@RequiredArgsConstructor
@Tag(name = "Cart", description = "APIs for cart")
public class CartController {

    private final CartService cartService;

    @PostMapping("/add")
    @Operation(summary = "Add product to cart", description = "Add product to user's cart or temporary cart")
    @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Product added successfully")
    public ApiResponse<CartDTO> addToCart(@RequestBody AddToCartRequest request,
            Authentication authentication) {
        String username = null;

        if (authentication != null && authentication.isAuthenticated()) {
            username = authentication.getName();
        }
        CartDTO cart = cartService.addToCartByUsername(request, username);
        return new ApiResponse<>("success", 200, "Product added to cart", cart);
    }

    @PutMapping("/update")
    @Operation(summary = "Update item quantity/size", description = "Update quantity or size of an item in the cart")
    public ApiResponse<CartDTO> updateItem(@RequestBody CartItemDTO request,
            Authentication authentication) {
        String username = null;

        if (authentication != null && authentication.isAuthenticated()) {
            username = authentication.getName();
        }

        CartDTO cart = cartService.updateItemInCart(username, request);
        return new ApiResponse<>("success", 200, "Cart item updated", cart);
    }

    @GetMapping("/list")
    @Operation(summary = "Get cart items", description = "Retrieve all items in the cart")
    public ApiResponse<CartDTO> getCart(Authentication authentication) {
        String username = null;

        if (authentication != null && authentication.isAuthenticated()) {
            username = authentication.getName();
        }

        CartDTO cart = cartService.getCartByUsername(username);
        return new ApiResponse<>("success", 200, "Cart retrieved successfully", cart);
    }

    @DeleteMapping("/remove/{itemId}")
    @Operation(summary = "Remove item from cart", description = "Remove a specific item from the cart")
    public ApiResponse<CartDTO> removeItem(@PathVariable Long itemId,
            Authentication authentication) {
        String username = null;

        if (authentication != null && authentication.isAuthenticated()) {
            username = authentication.getName();
        }

        CartDTO cart = cartService.removeItemFromCart(username, itemId);
        return new ApiResponse<>("success", 200, "Item removed from cart", cart);
    }

    @DeleteMapping("/clear")
    @Operation(summary = "Clear cart", description = "Remove all items from the cart")
    public ApiResponse<CartDTO> clearCart(Authentication authentication) {
        String username = null;

        if (authentication != null && authentication.isAuthenticated()) {
            username = authentication.getName();
        }

        CartDTO cart = cartService.clearCart(username);
        return new ApiResponse<>("success", 200, "Cart cleared", cart);
    }



}

