package com.ecommerce.dto;

import java.math.BigDecimal;

public record CartItemResponse(Long itemId, Long productId, String productName, String imageUrl,
                               BigDecimal unitPrice, Integer quantity, BigDecimal subtotal,
                               Integer availableStock) {}
