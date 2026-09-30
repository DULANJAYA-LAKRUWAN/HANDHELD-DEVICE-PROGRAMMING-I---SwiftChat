package com.swiftchat.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("PasswordUtil Smoke & Unit Tests")
class PasswordUtilTest {

    @Test
    @DisplayName("Should generate a valid BCrypt hash with 12 rounds")
    void testHashPassword() {
        String rawPassword = "SecretPassword123!";
        String hash = PasswordUtil.hashPassword(rawPassword);

        assertNotNull(hash);
        assertTrue(hash.startsWith("$2a$12$") || hash.startsWith("$2b$12$") || hash.startsWith("$2y$12$"),
                "Hash must be in BCrypt format with cost factor 12");
        assertNotEquals(rawPassword, hash, "Hash must never equal the raw password");
    }

    @Test
    @DisplayName("Should verify valid password against generated BCrypt hash")
    void testCheckPasswordSuccess() {
        String rawPassword = "ValidPassword#2026";
        String hash = PasswordUtil.hashPassword(rawPassword);

        assertTrue(PasswordUtil.checkPassword(rawPassword, hash), "Password matching hash must evaluate to true");
    }

    @Test
    @DisplayName("Should reject incorrect password against hash")
    void testCheckPasswordFailure() {
        String rawPassword = "CorrectPassword";
        String hash = PasswordUtil.hashPassword(rawPassword);

        assertFalse(PasswordUtil.checkPassword("WrongPassword", hash), "Wrong password must be rejected");
    }

    @Test
    @DisplayName("Should safely handle null or empty inputs")
    void testNullOrEmptyInputs() {
        assertFalse(PasswordUtil.checkPassword(null, "$2a$12$somehashhere"));
        assertFalse(PasswordUtil.checkPassword("somepassword", null));
        assertFalse(PasswordUtil.checkPassword(null, null));
    }
}
