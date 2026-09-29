package com.swiftchat.servlet;

import com.google.gson.Gson;
import com.swiftchat.dto.ApiResponseDTO;
import com.swiftchat.dto.WebSocketMessageDTO;
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
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * REST Servlet for retrieving chronological message history for a chat.
 * Supported URL patterns:
 * - GET /api/chats/messages?chatId={chatId}&userId={userId}
 * - GET /api/chats/messages/{chatId}?userId={userId}
 * - GET /api/messages/{chatId}?userId={userId}
 */
@WebServlet(name = "ChatHistoryServlet", urlPatterns = {"/api/chats/messages", "/api/chats/messages/*", "/api/messages/*"})
public class ChatHistoryServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;
    private static final Logger LOGGER = Logger.getLogger(ChatHistoryServlet.class.getName());

    private final ChatService chatService;
    private final Gson gson;

    public ChatHistoryServlet() {
        this.chatService = new ChatService();
        this.gson = GsonProvider.getGson();
    }

    public ChatHistoryServlet(ChatService chatService) {
        this.chatService = chatService;
        this.gson = GsonProvider.getGson();
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        PrintWriter out = response.getWriter();

        Long chatId = parseChatId(request);
        if (chatId == null) {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            out.write(gson.toJson(ApiResponseDTO.error("Chat ID must be provided in path (/api/chats/messages/{chatId}) or as query parameter (?chatId={chatId}).")));
            return;
        }

        // If current user is provided, mark incoming messages as read
        String userIdParam = request.getParameter("userId");
        if (userIdParam != null && !userIdParam.trim().isEmpty()) {
            try {
                Long currentUserId = Long.parseLong(userIdParam.trim());
                chatService.markChatAsRead(chatId, currentUserId);
            } catch (Exception ex) {
                LOGGER.warning("Could not auto-mark messages as read: " + ex.getMessage());
            }
        }

        try {
            List<WebSocketMessageDTO> history = chatService.getChatHistoryDTOs(chatId);
            response.setStatus(HttpServletResponse.SC_OK);
            out.write(gson.toJson(ApiResponseDTO.success("Chat history retrieved successfully.", history)));

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error retrieving chat history for chatId: " + chatId, ex);
            response.setStatus(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            out.write(gson.toJson(ApiResponseDTO.error("Failed to retrieve chat history.")));
        }
    }

    /**
     * Extracts chatId from query parameter or path info.
     */
    private Long parseChatId(HttpServletRequest request) {
        String chatIdParam = request.getParameter("chatId");
        if (chatIdParam != null && !chatIdParam.trim().isEmpty()) {
            try {
                return Long.parseLong(chatIdParam.trim());
            } catch (NumberFormatException ignored) {
            }
        }

        String pathInfo = request.getPathInfo();
        if (pathInfo != null && pathInfo.length() > 1) {
            // PathInfo could be "/12" or "/12/messages"
            String clean = pathInfo.replaceFirst("^/", "").replaceAll("/messages$", "").trim();
            try {
                return Long.parseLong(clean);
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }
}
