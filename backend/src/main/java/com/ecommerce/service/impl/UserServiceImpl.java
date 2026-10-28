package com.ecommerce.service.impl;

import com.ecommerce.dto.PageResponse;
import com.ecommerce.dto.UserResponse;
import com.ecommerce.entity.Role;
import com.ecommerce.exception.ResourceNotFoundException;
import com.ecommerce.mapper.DtoMapper;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Override
    public UserResponse getProfile(String email) {
        return userRepository.findByEmail(email).map(DtoMapper::toUser)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    @Override
    public PageResponse<UserResponse> listCustomers(int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.from(userRepository.findByRole(Role.CUSTOMER, pageable).map(DtoMapper::toUser));
    }
}
