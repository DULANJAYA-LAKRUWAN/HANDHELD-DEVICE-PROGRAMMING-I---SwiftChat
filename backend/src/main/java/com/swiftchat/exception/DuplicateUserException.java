package com.swiftchat.exception;

/**
 * Exception thrown when a user registration violates unique constraints
 * such as duplicate username or contact number.
 */
public class DuplicateUserException extends Exception {

    private static final long serialVersionUID = 1L;

    public DuplicateUserException(String message) {
        super(message);
    }

    public DuplicateUserException(String message, Throwable cause) {
        super(message, cause);
    }
}
