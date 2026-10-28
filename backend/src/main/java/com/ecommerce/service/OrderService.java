package com.ecommerce.service;

import com.ecommerce.dto.CheckoutRequest;
import com.ecommerce.dto.OrderResponse;
import com.ecommerce.dto.PageResponse;
import com.ecommerce.entity.OrderStatus;

public interface OrderService {
    OrderResponse checkout(String email, CheckoutRequest request);
    PageResponse<OrderResponse> myOrders(String email, int page, int size);
    OrderResponse getOrder(String email, Long orderId);
    OrderResponse cancelMyOrder(String email, Long orderId);
    PageResponse<OrderResponse> listAll(OrderStatus status, int page, int size);
    OrderResponse updateStatus(Long orderId, OrderStatus newStatus);
}
