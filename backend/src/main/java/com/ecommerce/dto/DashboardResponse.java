package com.ecommerce.dto;

import com.ecommerce.entity.OrderStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public record DashboardResponse(long totalProducts, long totalCustomers, long totalOrders,
                                BigDecimal totalRevenue, long lowStockProducts,
                                Map<OrderStatus, Long> ordersByStatus, List<OrderResponse> recentOrders) {}
