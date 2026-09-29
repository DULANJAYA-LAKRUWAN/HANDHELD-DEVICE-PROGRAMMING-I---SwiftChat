package com.swiftchat.servlet;

import com.google.gson.Gson;
import com.swiftchat.dao.UserDao;
import com.swiftchat.dto.ApiResponseDTO;
import com.swiftchat.dto.UserDTO;
import com.swiftchat.entity.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * REST Servlet for searching registered users.
 * Endpoint: GET /api/users/search?query=...&excludeId=...
 * Used by the mobile client to find contacts and initiate 1-on-1 chats.
 */
@WebServlet(name = "UserSearchServlet", urlPatterns = {"/api/users/search"})
public class UserSearchServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = Logger.getLogger(UserSearchServlet.class.getName());

    private final UserDao userDao;
    private final Gson gson;

    public UserSearchServlet() {
        this.userDao = new UserDao();
        this.gson = new Gson();
    }

    public UserSearchServlet(UserDao userDao) {
        this.userDao = userDao;
        this.gson = new Gson();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String query = request.getParameter("query");
        String excludeIdStr = request.getParameter("excludeId");

        Long excludeUserId = null;
        if (excludeIdStr != null && !excludeIdStr.trim().isEmpty()) {
            try {
                excludeUserId = Long.parseLong(excludeIdStr.trim());
            } catch (NumberFormatException nfe) {
                LOGGER.warning("Invalid excludeId parameter format: " + excludeIdStr);
            }
        }

        try {
            List<User> matchedUsers = userDao.searchUsers(query, excludeUserId);
            List<UserDTO> dtoList = matchedUsers.stream()
                    .map(UserDTO::fromEntity)
                    .toList();

            response.setStatus(HttpServletResponse.SC_OK);
            out.write(gson.toJson(ApiResponseDTO.success("Users retrieved successfully.", dtoList)));

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error searching users with query: " + query, ex);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write(gson.toJson(ApiResponseDTO.error("Failed to search users. Please try again.")));
        }
    }
}
