package com.swiftchat.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("JwtUtil Smoke & Unit Tests")
class JwtUtilTest {

    @Test
    @DisplayName("Should generate a valid 3-part compact JWT token")
    void testGenerateToken() {
        String token = JwtUtil.generateToken(101L, "alice");
        assertNotNull(token);
        String[] parts = token.split("\\.");
        assertEquals(3, parts.length, "JWT must contain header, payload, and signature separated by dots");
    }

    @Test
    @DisplayName("Should successfully validate a legitimately generated JWT")
    void testValidateValidToken() {
        String token = JwtUtil.generateToken(202L, "bob");
        assertTrue(JwtUtil.validateToken(token), "Legitimate token should pass validation");
    }

    @Test
    @DisplayName("Should reject null, empty, or malformed tokens")
    void testValidateMalformedTokens() {
        assertFalse(JwtUtil.validateToken(null));
        assertFalse(JwtUtil.validateToken(""));
        assertFalse(JwtUtil.validateToken("invalid.token"));
        assertFalse(JwtUtil.validateToken("part1.part2.part3.extra"));
    }

    @Test
    @DisplayName("Should reject tampered payload or altered signature")
    void testTamperedToken() {
        String token = JwtUtil.generateToken(303L, "charlie");
        String[] parts = token.split("\\.");
        // Modify payload slightly
        String tamperedToken = parts[0] + ".eyJzdWIiOiI5OTkiLCJ1c2VybmFtZSI6ImhhY2tlciJ9." + parts[2];
        assertFalse(JwtUtil.validateToken(tamperedToken), "Tampered payload must be rejected");

        // Modify signature
        String tamperedSig = parts[0] + "." + parts[1] + ".invalidSignature12345";
        assertFalse(JwtUtil.validateToken(tamperedSig), "Tampered signature must be rejected");
    }

    @Test
    @DisplayName("Should accurately extract userId and username claims")
    void testExtractClaims() {
        Long expectedId = 404L;
        String expectedUsername = "david";

        String token = JwtUtil.generateToken(expectedId, expectedUsername);

        assertEquals(expectedId, JwtUtil.extractUserId(token));
        assertEquals(expectedUsername, JwtUtil.extractUsername(token));
    }

    @Test
    @DisplayName("Should return null claims when token is invalid")
    void testExtractClaimsInvalidToken() {
        assertNull(JwtUtil.extractUserId("bad.token.here"));
        assertNull(JwtUtil.extractUsername("bad.token.here"));
    }
}
