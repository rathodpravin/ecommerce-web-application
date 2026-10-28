package com.ecommerce.dto;

import java.math.BigDecimal;

public record OrderItemResponse(Long id, Long productId, String productName, BigDecimal unitPrice,
                                Integer quantity, BigDecimal subtotal) {}
