package com.ecommerce.mapper;

import com.ecommerce.dto.*;
import com.ecommerce.entity.*;

import java.math.BigDecimal;
import java.util.List;

/** Converts entities to API-safe DTOs. Call only inside a transaction (lazy relations). */
public final class DtoMapper {

    public static final String PAYMENT_NOTE =
            "Order created. No payment has been processed - this application does not charge any payment method.";

    private DtoMapper() {}

    public static UserResponse toUser(User u) {
        return new UserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getRole(), u.getCreatedAt());
    }

    public static ProductResponse toProduct(Product p) {
        return new ProductResponse(p.getId(), p.getName(), p.getDescription(), p.getPrice(),
                p.getStockQuantity(), p.getCategory(), p.getImageUrl(), p.getCreatedAt());
    }

    public static CartItemResponse toCartItem(CartItem c) {
        Product p = c.getProduct();
        BigDecimal subtotal = p.getPrice().multiply(BigDecimal.valueOf(c.getQuantity()));
        return new CartItemResponse(c.getId(), p.getId(), p.getName(), p.getImageUrl(), p.getPrice(),
                c.getQuantity(), subtotal, p.getStockQuantity());
    }

    public static CartResponse toCart(List<CartItem> items) {
        List<CartItemResponse> list = items.stream().map(DtoMapper::toCartItem).toList();
        BigDecimal subtotal = list.stream().map(CartItemResponse::subtotal).reduce(BigDecimal.ZERO, BigDecimal::add);
        int count = list.stream().mapToInt(CartItemResponse::quantity).sum();
        // No shipping/tax rules exist yet, so total == subtotal.
        return new CartResponse(list, count, subtotal, subtotal);
    }

    public static OrderItemResponse toOrderItem(OrderItem i) {
        return new OrderItemResponse(i.getId(), i.getProduct().getId(), i.getProductName(),
                i.getUnitPrice(), i.getQuantity(), i.getSubtotal());
    }

    public static OrderResponse toOrder(Order o) {
        return new OrderResponse(o.getId(), o.getOrderNumber(), o.getStatus(), o.getTotalAmount(),
                o.getShippingAddress(), o.getCreatedAt(), o.getUpdatedAt(),
                o.getUser().getFullName(), o.getUser().getEmail(),
                o.getItems().stream().map(DtoMapper::toOrderItem).toList(), PAYMENT_NOTE);
    }
}
