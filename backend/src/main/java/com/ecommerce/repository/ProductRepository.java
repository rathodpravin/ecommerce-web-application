package com.ecommerce.repository;

import com.ecommerce.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query("""
           select p from Product p
           where (:q is null or lower(p.name) like lower(concat('%', :q, '%')))
             and (:category is null or lower(p.category) = lower(:category))
           """)
    Page<Product> search(@Param("q") String q, @Param("category") String category, Pageable pageable);

    @Query("select distinct p.category from Product p order by p.category")
    List<String> findDistinctCategories();

    long countByStockQuantityLessThanEqual(int threshold);

    /** SELECT ... FOR UPDATE, ordered by id to avoid deadlocks. Used by checkout and cancellation. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id in :ids order by p.id")
    List<Product> findAllByIdForUpdate(@Param("ids") Collection<Long> ids);
}
