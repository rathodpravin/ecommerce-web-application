package com.ecommerce.service;

import com.ecommerce.dto.PageResponse;
import com.ecommerce.dto.ProductRequest;
import com.ecommerce.dto.ProductResponse;

import java.util.List;

public interface ProductService {
    PageResponse<ProductResponse> list(String q, String category, int page, int size, String sortBy, String direction);
    ProductResponse getById(Long id);
    List<String> categories();
    ProductResponse create(ProductRequest request);
    ProductResponse update(Long id, ProductRequest request);
    void delete(Long id);
}
