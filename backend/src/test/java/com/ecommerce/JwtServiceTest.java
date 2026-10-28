package com.ecommerce;

import com.ecommerce.security.JwtService;
import io.jsonwebtoken.JwtException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    private static final String SECRET = "unit-test-secret-unit-test-secret-1234";

    @Test void roundTrip() {
        JwtService s = new JwtService(SECRET, 60_000);
        assertEquals("a@b.com", s.extractEmail(s.generateToken("a@b.com")));
    }
    @Test void expiredTokenRejected() {
        JwtService s = new JwtService(SECRET, -1000);
        assertThrows(JwtException.class, () -> s.extractEmail(s.generateToken("a@b.com")));
    }
    @Test void tamperedTokenRejected() {
        JwtService s = new JwtService(SECRET, 60_000);
        JwtService other = new JwtService("another-secret-another-secret-12345678", 60_000);
        assertThrows(JwtException.class, () -> s.extractEmail(other.generateToken("a@b.com")));
    }
    @Test void shortSecretRefused() {
        assertThrows(IllegalStateException.class, () -> new JwtService("short", 1000));
    }
}
