package com.swiftchat.util;

import org.mindrot.jbcrypt.BCrypt;

/**
 * Security utility class providing BCrypt cryptographic password hashing and verification.
 * Employs a salt round workload factor of 12 for strong brute-force resistance.
 */
public final class PasswordUtil {

    private static final int BCRYPT_WORKLOAD = 12;

    private PasswordUtil() {
        // Prevent instantiation
    }

    /**
     * Hashes a plain-text password using the BCrypt adaptive hashing algorithm.
     *
     * @param rawPassword plain-text password entered by the user
     * @return 60-character BCrypt hashed string with salt
     * @throws IllegalArgumentException if the provided raw password is null or blank
     */
    public static String hashPassword(String rawPassword) {
        if (rawPassword == null || rawPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("Password cannot be null or empty.");
        }
        String salt = BCrypt.gensalt(BCRYPT_WORKLOAD);
        return BCrypt.hashpw(rawPassword, salt);
    }

    /**
     * Verifies whether a candidate plain-text password matches a stored BCrypt hash.
     *
     * @param rawPassword    candidate plain-text password
     * @param hashedPassword stored BCrypt hash string
     * @return true if candidate matches hash, false otherwise
     */
    public static boolean checkPassword(String rawPassword, String hashedPassword) {
        if (rawPassword == null || hashedPassword == null) {
            return false;
        }
        try {
            return BCrypt.checkpw(rawPassword, hashedPassword);
        } catch (IllegalArgumentException ex) {
            // Malformed hash string
            return false;
        }
    }
}
