package com.swiftchat.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.swiftchat.dao.UserDao;
import com.swiftchat.dto.ApiResponseDTO;
import com.swiftchat.dto.UserDTO;
import com.swiftchat.entity.User;
import com.swiftchat.util.GsonProvider;
import com.swiftchat.util.JwtUtil;
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
 * REST Servlet for user profile management.
 * Endpoints:
 * - GET /api/users/profile?userId={id}
 * - PUT /api/users/profile
 * - POST /api/users/profile
 */
@WebServlet(name = "UserProfileServlet", urlPatterns = {"/api/users/profile"})
public class UserProfileServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = Logger.getLogger(UserProfileServlet.class.getName());

    private final UserDao userDao;
    private final Gson gson;

    public UserProfileServlet() {
        this.userDao = new UserDao();
        this.gson = GsonProvider.getGson();
    }

    public UserProfileServlet(UserDao userDao) {
        this.userDao = userDao;
        this.gson = GsonProvider.getGson();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            String authHeader = request.getHeader("Authorization");
            Long tokenUserId = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7).trim();
                if (JwtUtil.validateToken(token)) {
                    tokenUserId = JwtUtil.extractUserId(token);
                }
            }

            String userIdParam = request.getParameter("userId");
            Long userId = null;
            if (userIdParam != null && !userIdParam.trim().isEmpty()) {
                try {
                    userId = Long.parseLong(userIdParam.trim());
                } catch (NumberFormatException ignored) {
                }
            } else if (tokenUserId != null) {
                userId = tokenUserId;
            }

            if (userId == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.write(gson.toJson(ApiResponseDTO.error("User identification required via query parameter 'userId' or Authorization Bearer token.")));
                return;
            }

            User user = userDao.getUserById(userId);
            if (user == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.write(gson.toJson(ApiResponseDTO.error("User not found.")));
                return;
            }

            response.setStatus(HttpServletResponse.SC_OK);
            out.write(gson.toJson(ApiResponseDTO.success("Profile retrieved successfully.", UserDTO.fromEntity(user))));

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error retrieving user profile.", ex);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write(gson.toJson(ApiResponseDTO.error("Failed to retrieve profile.")));
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handleProfileUpdate(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        handleProfileUpdate(request, response);
    }

    private void handleProfileUpdate(HttpServletRequest request, HttpServletResponse response)
            throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        try {
            String authHeader = request.getHeader("Authorization");
            Long tokenUserId = null;
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7).trim();
                if (JwtUtil.validateToken(token)) {
                    tokenUserId = JwtUtil.extractUserId(token);
                }
            }

            JsonObject body = gson.fromJson(request.getReader(), JsonObject.class);
            Long userId = null;
            if (body != null && body.has("userId")) {
                userId = body.get("userId").getAsLong();
            } else if (tokenUserId != null) {
                userId = tokenUserId;
            }

            if (userId == null) {
                response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
                out.write(gson.toJson(ApiResponseDTO.error("Missing 'userId' in update payload or Authorization Bearer token.")));
                return;
            }

            User user = userDao.getUserById(userId);
            if (user == null) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                out.write(gson.toJson(ApiResponseDTO.error("User not found for ID: " + userId)));
                return;
            }

            if (body != null && body.has("contactNo")) {
                String newContact = body.get("contactNo").getAsString().trim();
                if (!newContact.isEmpty()) {
                    User existingWithContact = userDao.getUserByContactNo(newContact);
                    if (existingWithContact != null && !existingWithContact.getId().equals(userId)) {
                        response.setStatus(HttpServletResponse.SC_CONFLICT);
                        out.write(gson.toJson(ApiResponseDTO.error("Contact number is already in use by another account.")));
                        return;
                    }
                    user.setContactNo(newContact);
                }
            }

            User updated = userDao.updateUser(user);
            response.setStatus(HttpServletResponse.SC_OK);
            out.write(gson.toJson(ApiResponseDTO.success("Profile updated successfully.", UserDTO.fromEntity(updated))));

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error updating user profile.", ex);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write(gson.toJson(ApiResponseDTO.error("Failed to update profile: " + ex.getMessage())));
        }
    }
}
