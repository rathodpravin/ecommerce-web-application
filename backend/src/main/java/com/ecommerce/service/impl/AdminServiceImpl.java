package com.ecommerce.service.impl;

import com.ecommerce.dto.DashboardResponse;
import com.ecommerce.entity.OrderStatus;
import com.ecommerce.entity.Role;
import com.ecommerce.mapper.DtoMapper;
import com.ecommerce.repository.OrderRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminServiceImpl implements AdminService {

    private static final int LOW_STOCK_THRESHOLD = 5;

    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;

    @Override
    public DashboardResponse dashboard() {
        Map<OrderStatus, Long> byStatus = new EnumMap<>(OrderStatus.class);
        for (OrderStatus s : OrderStatus.values()) byStatus.put(s, orderRepository.countByStatus(s));
        return new DashboardResponse(
                productRepository.count(),
                userRepository.countByRole(Role.CUSTOMER),
                orderRepository.count(),
                orderRepository.sumRevenueExcludingCancelled(),
                productRepository.countByStockQuantityLessThanEqual(LOW_STOCK_THRESHOLD),
                byStatus,
                orderRepository.findTop5ByOrderByCreatedAtDesc().stream().map(DtoMapper::toOrder).toList());
    }
}
