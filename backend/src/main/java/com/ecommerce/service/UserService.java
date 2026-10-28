package com.ecommerce.service;

import com.ecommerce.dto.PageResponse;
import com.ecommerce.dto.UserResponse;

public interface UserService {
    UserResponse getProfile(String email);
    PageResponse<UserResponse> listCustomers(int page, int size);
}
