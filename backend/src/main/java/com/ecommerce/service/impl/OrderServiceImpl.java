package com.ecommerce.service.impl;

import com.ecommerce.dto.CheckoutRequest;
import com.ecommerce.dto.OrderResponse;
import com.ecommerce.dto.PageResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.BadRequestException;
import com.ecommerce.exception.InsufficientStockException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.mapper.DtoMapper;
import com.ecommerce.repository.*;
import com.ecommerce.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    /**
     * Creates an order from the user's cart. NO payment is taken.
     * Overselling protection: product rows are locked (SELECT ... FOR UPDATE) BEFORE stock is read,
     * and everything runs in one transaction, so any failure rolls back stock, order and cart together.
     */
    @Override
    @Transactional
    public OrderResponse checkout(String email, CheckoutRequest request) {
        User user = user(email);

        // 1) ids only (does not load Product entities), 2) lock + load fresh products, 3) load cart rows.
        List<Long> productIds = cartItemRepository.findProductIdsByUserId(user.getId());
        if (productIds.isEmpty()) throw new BadRequestException("Your cart is empty");
        Map<Long, Product> locked = productRepository.findAllByIdForUpdate(productIds).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        List<CartItem> cartItems = cartItemRepository.findByUserIdOrderByIdAsc(user.getId());

        Order order = new Order();
        order.setUser(user);
        order.setStatus(OrderStatus.PLACED);
        order.setOrderNumber(newOrderNumber());
        order.setShippingAddress(request.shippingAddress().trim());

        BigDecimal total = BigDecimal.ZERO;
        for (CartItem ci : cartItems) {
            Product p = locked.get(ci.getProduct().getId());
            if (p == null) throw new BadRequestException("Your cart changed during checkout. Please review it and try again.");
            if (ci.getQuantity() > p.getStockQuantity()) {
                throw new InsufficientStockException(p.getName(), p.getStockQuantity());
            }
            OrderItem oi = new OrderItem();
            oi.setProduct(p);
            oi.setProductName(p.getName());                 // snapshot
            oi.setUnitPrice(p.getPrice());                  // price comes from the DB, never from the client
            oi.setQuantity(ci.getQuantity());
            BigDecimal subtotal = p.getPrice().multiply(BigDecimal.valueOf(ci.getQuantity()));
            oi.setSubtotal(subtotal);
            order.addItem(oi);
            total = total.add(subtotal);
        }
        for (CartItem ci : cartItems) {                     // all checks passed -> reduce stock
            Product p = locked.get(ci.getProduct().getId());
            p.setStockQuantity(p.getStockQuantity() - ci.getQuantity());
        }
        order.setTotalAmount(total);
        Order saved = orderRepository.save(order);
        cartItemRepository.deleteAll(cartItems);
        return DtoMapper.toOrder(saved);
    }

    @Override
    public PageResponse<OrderResponse> myOrders(String email, int page, int size) {
        User user = user(email);
        return PageResponse.from(orderRepository.findByUserId(user.getId(), pageable(page, size)).map(DtoMapper::toOrder));
    }

    @Override
    public OrderResponse getOrder(String email, Long orderId) {
        User user = user(email);
        Order order = (user.getRole() == Role.ADMIN)
                ? orderRepository.findById(orderId).orElse(null)
                : orderRepository.findByIdAndUserId(orderId, user.getId()).orElse(null);
        if (order == null) throw new ResourceNotFoundException("Order not found");
        return DtoMapper.toOrder(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelMyOrder(String email, Long orderId) {
        User user = user(email);
        Order order = orderRepository.findByIdForUpdate(orderId)
                .filter(o -> o.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getStatus().canTransitionTo(OrderStatus.CANCELLED)) {
            throw new BadRequestException("An order with status " + order.getStatus() + " can no longer be cancelled");
        }
        cancel(order);
        return DtoMapper.toOrder(order);
    }

    @Override
    public PageResponse<OrderResponse> listAll(OrderStatus status, int page, int size) {
        Pageable pageable = pageable(page, size);
        var result = (status == null) ? orderRepository.findAll(pageable) : orderRepository.findByStatus(status, pageable);
        return PageResponse.from(result.map(DtoMapper::toOrder));
    }

    @Override
    @Transactional
    public OrderResponse updateStatus(Long orderId, OrderStatus newStatus) {
        Order order = orderRepository.findByIdForUpdate(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order not found"));
        if (!order.getStatus().canTransitionTo(newStatus)) {
            throw new BadRequestException("Cannot change order status from " + order.getStatus() + " to " + newStatus);
        }
        if (newStatus == OrderStatus.CANCELLED) cancel(order);
        else order.setStatus(newStatus);
        return DtoMapper.toOrder(order);
    }

    /** Restores stock exactly once (the order row is locked, and CANCELLED is a terminal status). */
    private void cancel(Order order) {
        List<Long> ids = order.getItems().stream().map(i -> i.getProduct().getId()).toList();
        Map<Long, Product> locked = productRepository.findAllByIdForUpdate(ids).stream()
                .collect(Collectors.toMap(Product::getId, Function.identity()));
        for (OrderItem item : order.getItems()) {
            Product p = locked.get(item.getProduct().getId());
            p.setStockQuantity(p.getStockQuantity() + item.getQuantity());
        }
        order.setStatus(OrderStatus.CANCELLED);
    }

    private static Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50), Sort.by(Sort.Direction.DESC, "createdAt"));
    }

    private static String newOrderNumber() {
        return "ORD-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + "-"
                + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    private User user(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
