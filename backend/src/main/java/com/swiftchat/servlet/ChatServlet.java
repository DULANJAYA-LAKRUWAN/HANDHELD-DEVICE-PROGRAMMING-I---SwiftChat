package com.swiftchat.servlet;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonSyntaxException;
import com.swiftchat.dto.ApiResponseDTO;
import com.swiftchat.dto.ChatDTO;
import com.swiftchat.dto.UserDTO;
import com.swiftchat.dto.WebSocketMessageDTO;
import com.swiftchat.entity.Chat;
import com.swiftchat.entity.User;
import com.swiftchat.service.ChatService;
import com.swiftchat.util.GsonProvider;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.io.PrintWriter;
import java.util.List;
import java.util.Objects;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * REST Servlet for managing user chat channels and read receipts.
 * Endpoints:
 * - GET /api/chats?userId=...               (Fetches active conversations for a user with unread counts)
 * - GET /api/chats/{chatId}/messages?userId=... (Fetches messages and marks them as read)
 * - POST /api/chats                         (Creates or retrieves a chat between two users)
 * - POST|PUT /api/chats/{chatId}/read?userId=... (Explicitly marks messages in chat as read)
 */
@WebServlet(name = "ChatServlet", urlPatterns = {"/api/chats", "/api/chats/*"})
public class ChatServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = Logger.getLogger(ChatServlet.class.getName());

    private final ChatService chatService;
    private final Gson gson;

    public ChatServlet() {
        this.chatService = new ChatService();
        this.gson = GsonProvider.getGson();
    }

    public ChatServlet(ChatService chatService) {
        this.chatService = chatService;
        this.gson = GsonProvider.getGson();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String pathInfo = request.getPathInfo();
        // Check for /api/chats/{chatId}/messages pattern
        if (pathInfo != null && pathInfo.matches("^/\\d+/messages/?$")) {
            String idStr = pathInfo.replaceAll("[^0-9]", "");
            try {
                Long chatId = Long.parseLong(idStr);
                String userIdParam = request.getParameter("userId");
                if (userIdParam != null && !userIdParam.trim().isEmpty()) {
                    try {
                        Long currentUserId = Long.parseLong(userIdParam.trim());
                        chatService.markChatAsRead(chatId, currentUserId);
                    } catch (Exception ignored) {
                    }
                }
                List<WebSocketMessageDTO> history = chatService.getChatHistoryDTOs(chatId);
                response.setStatus(HttpServletResponse.SC_OK);
                out.write(gson.toJson(ApiResponseDTO.success("Chat history retrieved successfully.", history)));
                return;
            } catch (Exception ex) {
                LOGGER.log(Level.SEVERE, "Error retrieving chat messages for path: " + pathInfo, ex);
                response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
                out.write(gson.toJson(ApiResponseDTO.error("Failed to retrieve chat messages.")));
                return;
            }
        }

        String userIdParam = request.getParameter("userId");
        if (userIdParam == null || userIdParam.trim().isEmpty()) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write(gson.toJson(ApiResponseDTO.error("Query parameter 'userId' is required.")));
            return;
        }

        Long userId;
        try {
            userId = Long.parseLong(userIdParam.trim());
        } catch (NumberFormatException nfe) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write(gson.toJson(ApiResponseDTO.error("Invalid 'userId' format.")));
            return;
        }

        try {
            List<ChatDTO> chatDTOs = chatService.getUserChatDTOs(userId);
            response.setStatus(HttpServletResponse.SC_OK);
            out.write(gson.toJson(ApiResponseDTO.success("Chats retrieved successfully.", chatDTOs)));

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error retrieving chats for userId: " + userId, ex);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write(gson.toJson(ApiResponseDTO.error("Failed to retrieve chat channels.")));
        }
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        String pathInfo = request.getPathInfo();
        if (pathInfo != null && pathInfo.matches("^/\\d+/read/?$")) {
            handleMarkAsRead(request, response, pathInfo);
            return;
        }

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        Long initiatorId = null;
        Long targetId = null;

        try {
            JsonObject body = gson.fromJson(request.getReader(), JsonObject.class);
            if (body != null) {
                if (body.has("initiatorId")) {
                    initiatorId = body.get("initiatorId").getAsLong();
                }
                if (body.has("targetId")) {
                    targetId = body.get("targetId").getAsLong();
                }
            }
        } catch (JsonSyntaxException | IllegalStateException | IOException ex) {
            LOGGER.warning("Could not parse JSON body in POST /api/chats: " + ex.getMessage());
        }

        // Fallback to request parameters if not in JSON body
        if (initiatorId == null && request.getParameter("initiatorId") != null) {
            initiatorId = Long.parseLong(request.getParameter("initiatorId"));
        }
        if (targetId == null && request.getParameter("targetId") != null) {
            targetId = Long.parseLong(request.getParameter("targetId"));
        }

        if (initiatorId == null || targetId == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write(gson.toJson(ApiResponseDTO.error("Both 'initiatorId' and 'targetId' are required.")));
            return;
        }

        try {
            Chat chat = chatService.getOrCreateChat(initiatorId, targetId);

            User otherUserEntity = Objects.equals(chat.getUser1().getId(), initiatorId)
                    ? chat.getUser2()
                    : chat.getUser1();

            ChatDTO chatDTO = new ChatDTO(
                    chat.getChatId(),
                    chat.getUser1().getId(),
                    chat.getUser2().getId(),
                    UserDTO.fromEntity(otherUserEntity),
                    null,
                    chat.getCreatedAt(),
                    0
            );

            response.setStatus(HttpServletResponse.SC_OK);
            out.write(gson.toJson(ApiResponseDTO.success("Chat channel resolved.", chatDTO)));

        } catch (IllegalArgumentException iae) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write(gson.toJson(ApiResponseDTO.error(iae.getMessage())));

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error creating/retrieving chat.", ex);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write(gson.toJson(ApiResponseDTO.error("Failed to establish chat session.")));
        }
    }

    @Override
    protected void doPut(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {
        String pathInfo = request.getPathInfo();
        if (pathInfo != null && pathInfo.matches("^/\\d+/read/?$")) {
            handleMarkAsRead(request, response, pathInfo);
            return;
        }
        super.doPut(request, response);
    }

    private void handleMarkAsRead(HttpServletRequest request, HttpServletResponse response, String pathInfo)
            throws IOException {
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        String idStr = pathInfo.replaceAll("[^0-9]", "");
        Long chatId = Long.parseLong(idStr);

        Long userId = null;
        String userIdParam = request.getParameter("userId");
        if (userIdParam != null && !userIdParam.trim().isEmpty()) {
            try {
                userId = Long.parseLong(userIdParam.trim());
            } catch (NumberFormatException ignored) {
            }
        }

        if (userId == null) {
            try {
                JsonObject body = gson.fromJson(request.getReader(), JsonObject.class);
                if (body != null && body.has("userId")) {
                    userId = body.get("userId").getAsLong();
                }
            } catch (Exception ignored) {
            }
        }

        if (userId == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write(gson.toJson(ApiResponseDTO.error("Parameter 'userId' is required to mark messages as read.")));
            return;
        }

        int updated = chatService.markChatAsRead(chatId, userId);
        response.setStatus(HttpServletResponse.SC_OK);
        out.write(gson.toJson(ApiResponseDTO.success("Messages marked as read.", updated)));
    }
}
