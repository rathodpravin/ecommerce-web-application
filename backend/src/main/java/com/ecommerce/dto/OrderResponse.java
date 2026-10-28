package com.ecommerce.dto;

import com.ecommerce.entity.OrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/** paymentNote makes it explicit that no real payment is processed. */
public record OrderResponse(Long id, String orderNumber, OrderStatus status, BigDecimal totalAmount,
                            String shippingAddress, LocalDateTime createdAt, LocalDateTime updatedAt,
                            String customerName, String customerEmail, List<OrderItemResponse> items,
                            String paymentNote) {}
