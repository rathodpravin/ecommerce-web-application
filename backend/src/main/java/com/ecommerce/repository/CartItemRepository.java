package com.ecommerce.repository;

import com.ecommerce.entity.CartItem;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {

    @EntityGraph(attributePaths = "product")
    List<CartItem> findByUserIdOrderByIdAsc(Long userId);

    @EntityGraph(attributePaths = "product")
    Optional<CartItem> findByUserIdAndProductId(Long userId, Long productId);

    @EntityGraph(attributePaths = "product")
    Optional<CartItem> findByIdAndUserId(Long id, Long userId);

    @Query("select c.product.id from CartItem c where c.user.id = :userId")
    List<Long> findProductIdsByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("delete from CartItem c where c.product.id = :productId")
    void deleteByProductId(@Param("productId") Long productId);
}
