package com.swiftchat.util;

import com.google.gson.Gson;
import com.google.gson.JsonObject;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Enterprise Cryptographic Utility for JSON Web Token (JWT) Generation & Validation.
 * Complies with RFC 7519 using HMAC-SHA256 (HS256) signature verification.
 * Implemented natively via standard Java 17 Cryptography Architecture (JCA)
 * to maintain high performance with zero external dependency bloat.
 */
public final class JwtUtil {

    private static final Logger LOGGER = Logger.getLogger(JwtUtil.class.getName());
    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final Gson GSON = GsonProvider.getGson();

    // 7-day token expiration (in seconds)
    private static final long EXPIRATION_SECONDS = 7 * 24 * 60 * 60;

    // Secure fallback secret key, overridable via JWT_SECRET environment variable
    private static final byte[] SECRET_KEY_BYTES = resolveSecretKey();

    private JwtUtil() {
        // Utility class
    }

    private static byte[] resolveSecretKey() {
        String envSecret = System.getenv("JWT_SECRET");
        if (envSecret == null || envSecret.trim().isEmpty()) {
            envSecret = "SwiftChat_Enterprise_HMAC_SHA256_UltraSecureKey_2026";
        }
        return envSecret.getBytes(StandardCharsets.UTF_8);
    }

    /**
     * Generates a signed, URL-safe JWT for an authenticated user.
     *
     * @param userId   unique user database identifier
     * @param username user login handle
     * @return signed JWT string (header.payload.signature)
     */
    public static String generateToken(Long userId, String username) {
        if (userId == null || username == null) {
            throw new IllegalArgumentException("User ID and username must not be null.");
        }

        long nowSeconds = System.currentTimeMillis() / 1000L;
        long expSeconds = nowSeconds + EXPIRATION_SECONDS;

        // 1. JWT Header
        JsonObject header = new JsonObject();
        header.addProperty("alg", "HS256");
        header.addProperty("typ", "JWT");

        // 2. JWT Payload (Claims)
        JsonObject payload = new JsonObject();
        payload.addProperty("sub", userId.toString());
        payload.addProperty("username", username);
        payload.addProperty("iat", nowSeconds);
        payload.addProperty("exp", expSeconds);

        String encodedHeader = base64UrlEncode(GSON.toJson(header).getBytes(StandardCharsets.UTF_8));
        String encodedPayload = base64UrlEncode(GSON.toJson(payload).getBytes(StandardCharsets.UTF_8));

        String contentToSign = encodedHeader + "." + encodedPayload;
        String signature = sign(contentToSign);

        return contentToSign + "." + signature;
    }

    /**
     * Validates a candidate JWT token for structural integrity, HMAC signature match,
     * and non-expiration.
     *
     * @param token candidate JWT string
     * @return true if valid and active, false otherwise
     */
    public static boolean validateToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return false;
        }

        String[] parts = token.trim().split("\\.");
        if (parts.length != 3) {
            return false;
        }

        try {
            String contentToSign = parts[0] + "." + parts[1];
            String expectedSignature = sign(contentToSign);

            // Constant-time signature comparison to mitigate timing attacks
            if (!MessageDigest.isEqual(
                    expectedSignature.getBytes(StandardCharsets.UTF_8),
                    parts[2].getBytes(StandardCharsets.UTF_8)
            )) {
                LOGGER.warning("JWT signature mismatch detected.");
                return false;
            }

            // Verify expiration claim
            String payloadJson = new String(base64UrlDecode(parts[1]), StandardCharsets.UTF_8);
            JsonObject claims = GSON.fromJson(payloadJson, JsonObject.class);

            if (!claims.has("exp")) {
                return false;
            }

            long exp = claims.get("exp").getAsLong();
            long now = System.currentTimeMillis() / 1000L;

            if (now > exp) {
                LOGGER.warning("JWT has expired (exp=" + exp + ", now=" + now + ")");
                return false;
            }

            return true;

        } catch (Exception ex) {
            LOGGER.log(Level.WARNING, "Error validating JWT token.", ex);
            return false;
        }
    }

    /**
     * Extracts the user ID claim (subject) from a valid JWT.
     *
     * @param token candidate JWT
     * @return Long userId, or null if invalid
     */
    public static Long extractUserId(String token) {
        if (!validateToken(token)) {
            return null;
        }
        try {
            String[] parts = token.trim().split("\\.");
            String payloadJson = new String(base64UrlDecode(parts[1]), StandardCharsets.UTF_8);
            JsonObject claims = GSON.fromJson(payloadJson, JsonObject.class);
            return claims.get("sub").getAsLong();
        } catch (Exception ex) {
            return null;
        }
    }

    /**
     * Extracts username claim from a valid JWT.
     *
     * @param token candidate JWT
     * @return String username, or null if invalid
     */
    public static String extractUsername(String token) {
        if (!validateToken(token)) {
            return null;
        }
        try {
            String[] parts = token.trim().split("\\.");
            String payloadJson = new String(base64UrlDecode(parts[1]), StandardCharsets.UTF_8);
            JsonObject claims = GSON.fromJson(payloadJson, JsonObject.class);
            return claims.get("username").getAsString();
        } catch (Exception ex) {
            return null;
        }
    }

    private static String sign(String data) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            SecretKeySpec secretKey = new SecretKeySpec(SECRET_KEY_BYTES, HMAC_ALGORITHM);
            mac.init(secretKey);
            byte[] hmacBytes = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return base64UrlEncode(hmacBytes);
        } catch (Exception ex) {
            throw new RuntimeException("Failed to generate HMAC signature: " + ex.getMessage(), ex);
        }
    }

    private static String base64UrlEncode(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static byte[] base64UrlDecode(String str) {
        return Base64.getUrlDecoder().decode(str);
    }
}
