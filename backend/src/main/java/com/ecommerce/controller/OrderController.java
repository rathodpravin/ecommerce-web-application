package com.ecommerce.controller;

import com.ecommerce.dto.CheckoutRequest;
import com.ecommerce.dto.OrderResponse;
import com.ecommerce.dto.PageResponse;
import com.ecommerce.service.OrderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Tag(name = "Orders")
@SecurityRequirement(name = "bearerAuth")
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create an order from the cart",
               description = "Creates an order only. NO payment is processed or charged.")
    public OrderResponse checkout(Authentication auth, @Valid @RequestBody CheckoutRequest request) {
        return orderService.checkout(auth.getName(), request);
    }

    @GetMapping("/my-orders")
    public PageResponse<OrderResponse> myOrders(Authentication auth,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        return orderService.myOrders(auth.getName(), page, size);
    }

    @GetMapping("/{orderId}")
    public OrderResponse get(Authentication auth, @PathVariable Long orderId) {
        return orderService.getOrder(auth.getName(), orderId);
    }

    @PostMapping("/{orderId}/cancel")
    @Operation(summary = "Cancel my order (only while PLACED or CONFIRMED); stock is restored")
    public OrderResponse cancel(Authentication auth, @PathVariable Long orderId) {
        return orderService.cancelMyOrder(auth.getName(), orderId);
    }
}
