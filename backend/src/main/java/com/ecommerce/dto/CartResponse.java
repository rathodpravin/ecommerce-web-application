package com.ecommerce.dto;

import java.math.BigDecimal;
import java.util.List;

public record CartResponse(List<CartItemResponse> items, int totalItems, BigDecimal subtotal, BigDecimal total) {}
