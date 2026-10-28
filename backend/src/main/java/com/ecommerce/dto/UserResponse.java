package com.ecommerce.dto;

import com.ecommerce.entity.Role;
import java.time.LocalDateTime;

public record UserResponse(Long id, String fullName, String email, Role role, LocalDateTime createdAt) {}
