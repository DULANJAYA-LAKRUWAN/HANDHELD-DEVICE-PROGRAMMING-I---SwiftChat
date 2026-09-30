package com.swiftchat.service;

import com.swiftchat.dao.UserDao;
import com.swiftchat.entity.User;
import com.swiftchat.exception.AuthenticationException;
import com.swiftchat.exception.DuplicateUserException;
import com.swiftchat.util.PasswordUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit & Smoke Tests")
class AuthServiceTest {

    @Mock
    private UserDao userDao;

    private AuthService authService;

    @BeforeEach
    void setUp() {
        authService = new AuthService(userDao);
    }

    @Test
    @DisplayName("Should successfully register a new user with BCrypt hashed password")
    void testRegisterSuccess() throws Exception {
        when(userDao.getUserByUsername("newuser")).thenReturn(null);
        when(userDao.getUserByContactNo("0771234567")).thenReturn(null);

        User savedUser = new User("newuser", "some_hash", "0771234567");
        savedUser.setId(1L);
        when(userDao.saveUser(any(User.class))).thenReturn(savedUser);

        User result = authService.register("newuser", "PlainPassword123", "0771234567");

        assertNotNull(result);
        assertEquals(1L, result.getId());
        assertEquals("newuser", result.getUsername());
        verify(userDao).saveUser(any(User.class));
    }

    @Test
    @DisplayName("Should throw DuplicateUserException if username already exists")
    void testRegisterDuplicateUsername() throws Exception {
        User existing = new User("alice", "hash", "0770000000");
        when(userDao.getUserByUsername("alice")).thenReturn(existing);

        assertThrows(DuplicateUserException.class, () ->
                authService.register("alice", "Password123", "0771111111")
        );
        verify(userDao, never()).saveUser(any(User.class));
    }

    @Test
    @DisplayName("Should throw DuplicateUserException if contact number already exists")
    void testRegisterDuplicateContact() throws Exception {
        when(userDao.getUserByUsername("uniqueuser")).thenReturn(null);
        User existingContact = new User("otheruser", "hash", "0771112233");
        when(userDao.getUserByContactNo("0771112233")).thenReturn(existingContact);

        assertThrows(DuplicateUserException.class, () ->
                authService.register("uniqueuser", "Password123", "0771112233")
        );
        verify(userDao, never()).saveUser(any(User.class));
    }

    @Test
    @DisplayName("Should validate required registration fields")
    void testRegisterValidation() {
        assertThrows(IllegalArgumentException.class, () -> authService.register(null, "pass", "phone"));
        assertThrows(IllegalArgumentException.class, () -> authService.register("user", "", "phone"));
        assertThrows(IllegalArgumentException.class, () -> authService.register("user", "pass", " "));
    }

    @Test
    @DisplayName("Should successfully authenticate user with correct credentials")
    void testAuthenticateSuccess() throws Exception {
        String rawPassword = "CorrectPassword123";
        String hashedPassword = PasswordUtil.hashPassword(rawPassword);

        User storedUser = new User("john_doe", hashedPassword, "0779998877");
        storedUser.setId(42L);
        when(userDao.getUserByUsername("john_doe")).thenReturn(storedUser);

        User result = authService.authenticate("john_doe", rawPassword);
        assertNotNull(result);
        assertEquals(42L, result.getId());
    }

    @Test
    @DisplayName("Should throw AuthenticationException on incorrect password")
    void testAuthenticateWrongPassword() {
        String hashedPassword = PasswordUtil.hashPassword("RealPassword");
        User storedUser = new User("john_doe", hashedPassword, "0779998877");
        when(userDao.getUserByUsername("john_doe")).thenReturn(storedUser);

        assertThrows(AuthenticationException.class, () ->
                authService.authenticate("john_doe", "WrongPassword")
        );
    }

    @Test
    @DisplayName("Should throw AuthenticationException when user does not exist")
    void testAuthenticateUserNotFound() {
        when(userDao.getUserByUsername("nonexistent")).thenReturn(null);

        assertThrows(AuthenticationException.class, () ->
                authService.authenticate("nonexistent", "Password123")
        );
    }
}
