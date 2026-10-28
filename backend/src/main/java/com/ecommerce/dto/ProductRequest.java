package com.ecommerce.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record ProductRequest(
        @NotBlank @Size(max = 200) String name,
        @Size(max = 2000) String description,
        @NotNull @DecimalMin(value = "0.01", message = "Price must be at least 0.01")
        @Digits(integer = 8, fraction = 2) BigDecimal price,
        @NotNull @Min(0) @Max(1_000_000) Integer stockQuantity,
        @NotBlank @Size(max = 100) String category,
        @Size(max = 500) String imageUrl) {}
