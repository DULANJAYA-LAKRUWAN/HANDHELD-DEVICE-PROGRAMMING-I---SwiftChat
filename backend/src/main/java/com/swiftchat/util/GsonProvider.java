package com.swiftchat.util;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;

/**
 * Centralized, thread-safe provider for Google Gson serialization.
 * Standardizes all date/timestamp serialization to ISO-8601 UTC format
 * ("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"), preventing "Invalid Date" parsing errors
 * across mobile JavaScript engines (Hermes / V8).
 */
public final class GsonProvider {

    private static final Gson GSON = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
            .disableHtmlEscaping()
            .create();

    private GsonProvider() {
        // Prevent instantiation
    }

    /**
     * Retrieves the configured singleton Gson instance.
     *
     * @return ISO-8601 compliant Gson instance
     */
    public static Gson getGson() {
        return GSON;
    }
}
