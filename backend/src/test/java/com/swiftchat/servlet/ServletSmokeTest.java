package com.swiftchat.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.swiftchat.dao.UserDao;
import com.swiftchat.entity.User;
import com.swiftchat.exception.AuthenticationException;
import com.swiftchat.exception.DuplicateUserException;
import com.swiftchat.service.AuthService;
import com.swiftchat.service.ChatService;
import com.swiftchat.util.GsonProvider;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.io.BufferedReader;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("Jakarta Servlet REST Endpoints Smoke Tests")
class ServletSmokeTest {

    @Mock
    private HttpServletRequest request;
    @Mock
    private HttpServletResponse response;
    @Mock
    private AuthService authService;
    @Mock
    private UserDao userDao;
    @Mock
    private ChatService chatService;

    private final Gson gson = GsonProvider.getGson();

    @Test
    @DisplayName("LoginServlet POST /api/auth/login success returns 200 and token")
    void testLoginServletSuccess() throws Exception {
        LoginServlet servlet = new LoginServlet(authService);

        String jsonPayload = "{\"username\":\"alice\",\"password\":\"Password123\"}";
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader(jsonPayload)));

        StringWriter responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

        User user = new User("alice", "hashed", "0771112233");
        user.setId(1L);
        when(authService.authenticate("alice", "Password123")).thenReturn(user);

        servlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_OK);
        JsonObject jsonResponse = gson.fromJson(responseWriter.toString(), JsonObject.class);
        assertTrue(jsonResponse.get("success").getAsBoolean());
        assertTrue(jsonResponse.getAsJsonObject("data").has("token"));
    }

    @Test
    @DisplayName("LoginServlet POST /api/auth/login rejected credentials returns 401 Unauthorized")
    void testLoginServletUnauthorized() throws Exception {
        LoginServlet servlet = new LoginServlet(authService);

        String jsonPayload = "{\"username\":\"alice\",\"password\":\"WrongPassword\"}";
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader(jsonPayload)));

        StringWriter responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

        when(authService.authenticate("alice", "WrongPassword"))
                .thenThrow(new AuthenticationException("Invalid username or password."));

        servlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        JsonObject jsonResponse = gson.fromJson(responseWriter.toString(), JsonObject.class);
        assertFalse(jsonResponse.get("success").getAsBoolean());
    }

    @Test
    @DisplayName("RegisterServlet POST /api/auth/register success returns 201 Created")
    void testRegisterServletSuccess() throws Exception {
        RegisterServlet servlet = new RegisterServlet(authService);

        String jsonPayload = "{\"username\":\"bob\",\"password\":\"Password123\",\"contactNo\":\"0772223344\"}";
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader(jsonPayload)));

        StringWriter responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

        User user = new User("bob", "hashed", "0772223344");
        user.setId(2L);
        when(authService.register("bob", "Password123", "0772223344")).thenReturn(user);

        servlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_CREATED);
        JsonObject jsonResponse = gson.fromJson(responseWriter.toString(), JsonObject.class);
        assertTrue(jsonResponse.get("success").getAsBoolean());
    }

    @Test
    @DisplayName("RegisterServlet POST /api/auth/register duplicate returns 409 Conflict")
    void testRegisterServletConflict() throws Exception {
        RegisterServlet servlet = new RegisterServlet(authService);

        String jsonPayload = "{\"username\":\"existing\",\"password\":\"Password123\",\"contactNo\":\"0772223344\"}";
        when(request.getReader()).thenReturn(new BufferedReader(new StringReader(jsonPayload)));

        StringWriter responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

        when(authService.register("existing", "Password123", "0772223344"))
                .thenThrow(new DuplicateUserException("Username already registered."));

        servlet.doPost(request, response);

        verify(response).setStatus(HttpServletResponse.SC_CONFLICT);
        JsonObject jsonResponse = gson.fromJson(responseWriter.toString(), JsonObject.class);
        assertFalse(jsonResponse.get("success").getAsBoolean());
    }

    @Test
    @DisplayName("UserSearchServlet GET /api/users/search returns 200 with matching users")
    void testUserSearchServletSuccess() throws Exception {
        UserSearchServlet servlet = new UserSearchServlet(userDao);

        when(request.getParameter("query")).thenReturn("ali");
        when(request.getParameter("excludeId")).thenReturn("5");

        User u = new User("alice", "hash", "0771112233");
        u.setId(1L);
        when(userDao.searchUsers("ali", 5L)).thenReturn(List.of(u));

        StringWriter responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

        servlet.doGet(request, response);

        verify(response).setStatus(HttpServletResponse.SC_OK);
        JsonObject jsonResponse = gson.fromJson(responseWriter.toString(), JsonObject.class);
        assertTrue(jsonResponse.get("success").getAsBoolean());
        assertEquals(1, jsonResponse.getAsJsonArray("data").size());
    }

    @Test
    @DisplayName("UserProfileServlet GET /api/users/profile returns 200 with user profile")
    void testUserProfileServletSuccess() throws Exception {
        UserProfileServlet servlet = new UserProfileServlet(userDao);

        when(request.getParameter("userId")).thenReturn("10");

        User u = new User("dulanjaya", "hash", "0771234567");
        u.setId(10L);
        when(userDao.getUserById(10L)).thenReturn(u);

        StringWriter responseWriter = new StringWriter();
        when(response.getWriter()).thenReturn(new PrintWriter(responseWriter));

        servlet.doGet(request, response);

        verify(response).setStatus(HttpServletResponse.SC_OK);
        JsonObject jsonResponse = gson.fromJson(responseWriter.toString(), JsonObject.class);
        assertTrue(jsonResponse.get("success").getAsBoolean());
        assertEquals("dulanjaya", jsonResponse.getAsJsonObject("data").get("username").getAsString());
    }
}
