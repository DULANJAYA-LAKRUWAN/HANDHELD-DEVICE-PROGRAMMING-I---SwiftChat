package com.swiftchat.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import com.swiftchat.dto.ApiResponseDTO;
import com.swiftchat.dto.RegisterRequestDTO;
import com.swiftchat.dto.UserDTO;
import com.swiftchat.entity.User;
import com.swiftchat.exception.DuplicateUserException;
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
 * REST Servlet handling user registration requests.
 * Endpoint: POST /api/auth/register
 */
@WebServlet(name = "RegisterServlet", urlPatterns = {"/api/auth/register"})
public class RegisterServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = Logger.getLogger(RegisterServlet.class.getName());

    private final AuthService authService;
    private final Gson gson;

    public RegisterServlet() {
        this.authService = new AuthService();
        this.gson = GsonProvider.getGson();
    }

    public RegisterServlet(AuthService authService) {
        this.authService = authService;
        this.gson = GsonProvider.getGson();
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        RegisterRequestDTO registerDTO;
        try {
            registerDTO = gson.fromJson(request.getReader(), RegisterRequestDTO.class);
        } catch (JsonSyntaxException | IOException ex) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write(gson.toJson(ApiResponseDTO.error("Malformed JSON payload in request body.")));
            return;
        }

        if (registerDTO == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write(gson.toJson(ApiResponseDTO.error("Request body cannot be empty.")));
            return;
        }

        try {
            User createdUser = authService.register(
                    registerDTO.getUsername(),
                    registerDTO.getPassword(),
                    registerDTO.getContactNo()
            );

            UserDTO userDTO = UserDTO.fromEntity(createdUser);
            response.setStatus(HttpServletResponse.SC_CREATED);
            out.write(gson.toJson(ApiResponseDTO.success("Registration successful.", userDTO)));

        } catch (DuplicateUserException due) {
            LOGGER.warning("Registration failed (duplicate): " + due.getMessage());
            response.setStatus(HttpServletResponse.SC_CONFLICT); // 409 Conflict
            out.write(gson.toJson(ApiResponseDTO.error(due.getMessage())));

        } catch (IllegalArgumentException iae) {
            LOGGER.warning("Registration validation error: " + iae.getMessage());
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST); // 400 Bad Request
            out.write(gson.toJson(ApiResponseDTO.error(iae.getMessage())));

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Unexpected server error during user registration.", ex);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR); // 500
            out.write(gson.toJson(ApiResponseDTO.error("An internal server error occurred. Please try again.")));
        }
    }
}
