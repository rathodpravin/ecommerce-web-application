package com.ecommerce.controller;

import com.ecommerce.dto.CartItemRequest;
import com.ecommerce.dto.CartItemUpdateRequest;
import com.ecommerce.dto.CartResponse;
import com.ecommerce.service.CartService;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/** Every call is scoped to the authenticated user; no user id is ever accepted from the client. */
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
@Tag(name = "Cart")
@SecurityRequirement(name = "bearerAuth")
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse get(Authentication auth) {
        return cartService.getCart(auth.getName());
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public CartResponse add(Authentication auth, @Valid @RequestBody CartItemRequest request) {
        return cartService.addItem(auth.getName(), request);
    }

    @PutMapping("/items/{itemId}")
    public CartResponse update(Authentication auth, @PathVariable Long itemId,
                               @Valid @RequestBody CartItemUpdateRequest request) {
        return cartService.updateItem(auth.getName(), itemId, request.quantity());
    }

    @DeleteMapping("/items/{itemId}")
    public CartResponse remove(Authentication auth, @PathVariable Long itemId) {
        return cartService.removeItem(auth.getName(), itemId);
    }
}
