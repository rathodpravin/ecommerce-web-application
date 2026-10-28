package com.ecommerce.service.impl;

import com.ecommerce.dto.PageResponse;
import com.ecommerce.dto.ProductRequest;
import com.ecommerce.dto.ProductResponse;
import com.ecommerce.entity.Product;
import com.ecommerce.exception.ConflictException;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.mapper.DtoMapper;
import com.ecommerce.repository.CartItemRepository;
import com.ecommerce.repository.OrderItemRepository;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private static final Set<String> SORTABLE = Set.of("price", "name", "createdAt");

    private final ProductRepository productRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderItemRepository orderItemRepository;

    @Override
    public PageResponse<ProductResponse> list(String q, String category, int page, int size, String sortBy, String direction) {
        String sortField = SORTABLE.contains(sortBy) ? sortBy : "createdAt";
        Sort.Direction dir = "asc".equalsIgnoreCase(direction) ? Sort.Direction.ASC : Sort.Direction.DESC;
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50),
                Sort.by(dir, sortField).and(Sort.by(Sort.Direction.ASC, "id")));
        return PageResponse.from(productRepository.search(blankToNull(q), blankToNull(category), pageable).map(DtoMapper::toProduct));
    }

    @Override
    public ProductResponse getById(Long id) {
        return DtoMapper.toProduct(find(id));
    }

    @Override
    public List<String> categories() {
        return productRepository.findDistinctCategories();
    }

    @Override
    @Transactional
    public ProductResponse create(ProductRequest r) {
        Product p = new Product();
        apply(p, r);
        return DtoMapper.toProduct(productRepository.save(p));
    }

    @Override
    @Transactional
    public ProductResponse update(Long id, ProductRequest r) {
        Product p = find(id);
        apply(p, r);
        return DtoMapper.toProduct(productRepository.save(p));
    }

    @Override
    @Transactional
    public void delete(Long id) {
        Product p = find(id);
        if (orderItemRepository.existsByProductId(id)) {
            throw new ConflictException("This product appears in past orders and cannot be deleted. Set its stock to 0 instead.");
        }
        cartItemRepository.deleteByProductId(id);
        productRepository.delete(p);
    }

    private Product find(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product not found with id " + id));
    }

    private void apply(Product p, ProductRequest r) {
        p.setName(r.name().trim());
        p.setDescription(r.description() == null ? null : r.description().trim());
        p.setPrice(r.price());
        p.setStockQuantity(r.stockQuantity());
        p.setCategory(r.category().trim());
        p.setImageUrl(blankToNull(r.imageUrl()));
    }

    private static String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }
}
