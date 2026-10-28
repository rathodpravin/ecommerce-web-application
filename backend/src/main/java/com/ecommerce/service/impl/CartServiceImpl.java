package com.ecommerce.service.impl;

import com.ecommerce.dto.CartItemRequest;
import com.ecommerce.dto.CartResponse;
import com.ecommerce.entity.CartItem;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.User;
import com.ecommerce.exception.InsufficientStockException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.mapper.DtoMapper;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartServiceImpl implements CartService {

    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    @Override
    public CartResponse getCart(String email) {
        return DtoMapper.toCart(cartItemRepository.findByUserIdOrderByIdAsc(user(email).getId()));
    }

    @Override
    @Transactional
    public CartResponse addItem(String email, CartItemRequest req) {
        User user = user(email);
        Product product = productRepository.findById(req.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + req.productId()));

        CartItem item = cartItemRepository.findByUserIdAndProductId(user.getId(), product.getId()).orElse(null);
        int newQty = (item == null ? 0 : item.getQuantity()) + req.quantity();
        if (newQty > product.getStockQuantity()) {
            throw new InsufficientStockException(product.getName(), product.getStockQuantity());
        }
        if (item == null) {            // one row per (user, product): otherwise just bump the quantity
            item = new CartItem();
            item.setUser(user);
            item.setProduct(product);
        }
        item.setQuantity(newQty);
        cartItemRepository.save(item);
        return DtoMapper.toCart(cartItemRepository.findByUserIdOrderByIdAsc(user.getId()));
    }

    @Override
    @Transactional
    public CartResponse updateItem(String email, Long itemId, int quantity) {
        User user = user(email);
        CartItem item = ownedItem(user, itemId);
        if (quantity > item.getProduct().getStockQuantity()) {
            throw new InsufficientStockException(item.getProduct().getName(), item.getProduct().getStockQuantity());
        }
        item.setQuantity(quantity);
        cartItemRepository.save(item);
        return DtoMapper.toCart(cartItemRepository.findByUserIdOrderByIdAsc(user.getId()));
    }

    @Override
    @Transactional
    public CartResponse removeItem(String email, Long itemId) {
        User user = user(email);
        cartItemRepository.delete(ownedItem(user, itemId));
        cartItemRepository.flush();
        return DtoMapper.toCart(cartItemRepository.findByUserIdOrderByIdAsc(user.getId()));
    }

    /** Looks up by (itemId AND userId): another user's item looks exactly like a missing item (404). */
    private CartItem ownedItem(User user, Long itemId) {
        return cartItemRepository.findByIdAndUserId(itemId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Cart item not found"));
    }

    private User user(String email) {
        return userRepository.findByEmail(email).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
