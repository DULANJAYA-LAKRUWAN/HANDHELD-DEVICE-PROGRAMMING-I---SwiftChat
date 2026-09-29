package com.swiftchat.exception;

/**
 * Exception thrown when user authentication fails due to invalid credentials,
 * non-existent user accounts, or account state issues.
 */
public class AuthenticationException extends Exception {

    private static final long serialVersionUID = 1L;

    public AuthenticationException(String message) {
        super(message);
    }

    public AuthenticationException(String message, Throwable cause) {
        super(message, cause);
    }
}
