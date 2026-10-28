package com.ecommerce.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CheckoutRequest(@NotBlank @Size(min = 5, max = 500) String shippingAddress) {}
