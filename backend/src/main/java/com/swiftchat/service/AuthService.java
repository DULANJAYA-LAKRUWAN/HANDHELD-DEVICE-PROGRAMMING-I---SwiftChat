package com.swiftchat.service;

import com.swiftchat.dao.UserDao;
import com.swiftchat.entity.User;
import com.swiftchat.exception.AuthenticationException;
import com.swiftchat.exception.DuplicateUserException;
import com.swiftchat.util.PasswordUtil;
import org.hibernate.exception.ConstraintViolationException;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Service responsible for user authentication and account registration.
 * Coordinates between data access objects (UserDao) and cryptographic hashing (PasswordUtil).
 */
public class AuthService {

    private static final Logger LOGGER = Logger.getLogger(AuthService.class.getName());
    private final UserDao userDao;

    /**
     * Default constructor creating standard UserDao instance.
     */
    public AuthService() {
        this(new UserDao());
    }

    /**
     * Parameterized constructor supporting dependency injection for testing.
     *
     * @param userDao Data access object for user operations
     */
    public AuthService(UserDao userDao) {
        if (userDao == null) {
            throw new IllegalArgumentException("UserDao cannot be null.");
        }
        this.userDao = userDao;
    }

    /**
     * Registers a new user account with a BCrypt-hashed password.
     * Enforces uniqueness for username and contact number before saving.
     *
     * @param username    the desired unique username
     * @param rawPassword the candidate plain-text password to hash
     * @param contactNo   the unique phone / contact number
     * @return the persisted User entity with assigned ID
     * @throws DuplicateUserException   if the username or contact number already exists
     * @throws IllegalArgumentException if required fields are null or empty
     * @throws Exception                if an unexpected database error occurs
     */
    public User register(String username, String rawPassword, String contactNo)
            throws DuplicateUserException, IllegalArgumentException, Exception {

        if (username == null || username.trim().isEmpty()) {
            throw new IllegalArgumentException("Username is required and cannot be empty.");
        }
        if (rawPassword == null || rawPassword.trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required and cannot be empty.");
        }
        if (contactNo == null || contactNo.trim().isEmpty()) {
            throw new IllegalArgumentException("Contact number is required and cannot be empty.");
        }

        String trimmedUsername = username.trim();
        String trimmedContactNo = contactNo.trim();

        // 1. Proactive uniqueness check for username
        User existingUser = userDao.getUserByUsername(trimmedUsername);
        if (existingUser != null) {
            LOGGER.warning("Registration rejected: Username '" + trimmedUsername + "' already exists.");
            throw new DuplicateUserException("Username '" + trimmedUsername + "' is already registered.");
        }

        // 2. Proactive uniqueness check for contact number
        User existingContact = userDao.getUserByContactNo(trimmedContactNo);
        if (existingContact != null) {
            LOGGER.warning("Registration rejected: Contact number '" + trimmedContactNo + "' already exists.");
            throw new DuplicateUserException("Contact number '" + trimmedContactNo + "' is already registered.");
        }

        // 3. Cryptographic hashing of the plain-text password using BCrypt
        String passwordHash = PasswordUtil.hashPassword(rawPassword);

        // 4. Construct entity and persist via DAO
        User newUser = new User(trimmedUsername, passwordHash, trimmedContactNo);

        try {
            return userDao.saveUser(newUser);
        } catch (ConstraintViolationException cve) {
            LOGGER.log(Level.WARNING, "Constraint violation during registration for: " + trimmedUsername, cve);
            throw new DuplicateUserException("User with given credentials already exists in the system.");
        } catch (Exception ex) {
            // Check if root cause is a constraint violation
            if (ex.getCause() instanceof ConstraintViolationException) {
                throw new DuplicateUserException("User with given credentials already exists in the system.");
            }
            LOGGER.log(Level.SEVERE, "Unexpected error during registration of user: " + trimmedUsername, ex);
            throw ex;
        }
    }

    /**
     * Authenticates a user against stored BCrypt password hash.
     *
     * @param username    the username entered by user
     * @param rawPassword the plain-text password entered by user
     * @return the authenticated User entity
     * @throws AuthenticationException if the user is not found or credentials do not match
     */
    public User authenticate(String username, String rawPassword) throws AuthenticationException {
        if (username == null || username.trim().isEmpty() || rawPassword == null || rawPassword.trim().isEmpty()) {
            throw new AuthenticationException("Invalid credentials. Username and password must be provided.");
        }

        String trimmedUsername = username.trim();
        User user = userDao.getUserByUsername(trimmedUsername);

        if (user == null) {
            LOGGER.warning("Authentication failed: User '" + trimmedUsername + "' not found.");
            // Consistent message to prevent username enumeration
            throw new AuthenticationException("Invalid username or password.");
        }

        boolean passwordMatches = PasswordUtil.checkPassword(rawPassword, user.getPasswordHash());
        if (!passwordMatches) {
            LOGGER.warning("Authentication failed: Incorrect password for user '" + trimmedUsername + "'.");
            throw new AuthenticationException("Invalid username or password.");
        }

        LOGGER.info("Authentication successful for user: " + trimmedUsername);
        return user;
    }
}
