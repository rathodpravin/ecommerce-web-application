package com.ecommerce;

import com.ecommerce.entity.OrderStatus;
import org.junit.jupiter.api.Test;

import static com.ecommerce.entity.OrderStatus.*;
import static org.junit.jupiter.api.Assertions.*;

class OrderStatusTest {
    @Test void validTransitions() {
        assertTrue(PLACED.canTransitionTo(CONFIRMED));
        assertTrue(CONFIRMED.canTransitionTo(SHIPPED));
        assertTrue(SHIPPED.canTransitionTo(DELIVERED));
        assertTrue(PLACED.canTransitionTo(CANCELLED));
    }
    @Test void invalidTransitions() {
        assertFalse(SHIPPED.canTransitionTo(CANCELLED));
        assertFalse(DELIVERED.canTransitionTo(CANCELLED));
        assertFalse(CANCELLED.canTransitionTo(PLACED));
        assertFalse(PLACED.canTransitionTo(DELIVERED));
    }
}
