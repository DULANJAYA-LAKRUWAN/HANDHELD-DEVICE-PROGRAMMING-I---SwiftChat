package com.swiftchat.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.swiftchat.dto.ApiResponseDTO;
import com.swiftchat.dto.LoginRequestDTO;
import com.swiftchat.dto.UserDTO;
import com.swiftchat.entity.User;
import com.swiftchat.exception.AuthenticationException;
import com.swiftchat.service.AuthService;
import com.swiftchat.util.GsonProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * REST Servlet handling user login and authentication.
 * Endpoint: POST /api/auth/login
 */
@WebServlet(name = "LoginServlet", urlPatterns = {"/api/auth/login"})
public class LoginServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = Logger.getLogger(LoginServlet.class.getName());

    private final AuthService authService;
    private final Gson gson;

    public LoginServlet() {
        this.authService = new AuthService();
        this.gson = GsonProvider.getGson();
    }

    public LoginServlet(AuthService authService) {
        this.authService = authService;
        this.gson = GsonProvider.getGson();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        LoginRequestDTO loginDTO;
        try {
            loginDTO = gson.fromJson(request.getReader(), LoginRequestDTO.class);
        } catch (JsonSyntaxException | IOException ex) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write(gson.toJson(ApiResponseDTO.error("Malformed JSON payload in request body.")));
            return;
        }

        if (loginDTO == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write(gson.toJson(ApiResponseDTO.error("Request body cannot be empty.")));
            return;
        }

        try {
            User authenticatedUser = authService.authenticate(
                    loginDTO.getUsername(),
                    loginDTO.getPassword()
            );

            UserDTO userDTO = UserDTO.fromEntity(authenticatedUser);
            String token = com.swiftchat.util.JwtUtil.generateToken(authenticatedUser.getId(), authenticatedUser.getUsername());
            userDTO.setToken(token);
            response.setStatus(HttpServletResponse.SC_OK);
            out.write(gson.toJson(ApiResponseDTO.success("Login successful.", userDTO)));

        } catch (AuthenticationException ae) {
            LOGGER.warning("Authentication rejected: " + ae.getMessage());
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED); // 401 Unauthorized
            out.write(gson.toJson(ApiResponseDTO.error(ae.getMessage())));

        } catch (IllegalArgumentException iae) {
            LOGGER.warning("Login validation error: " + iae.getMessage());
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST); // 400 Bad Request
            out.write(gson.toJson(ApiResponseDTO.error(iae.getMessage())));

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Unexpected server error during authentication.", ex);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); // 500
            out.write(gson.toJson(ApiResponseDTO.error("An internal server error occurred. Please try again.")));
        }
    }
}
