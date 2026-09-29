package com.swiftchat.websocket;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.swiftchat.dto.WebSocketMessageDTO;
import com.swiftchat.entity.Message;
import com.swiftchat.service.ChatService;
import com.swiftchat.util.GsonProvider;
import jakarta.websocket.*;
import jakarta.websocket.server.PathParam;
import jakarta.websocket.server.ServerEndpoint;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Real-time WebSocket server endpoint for SwiftChat live messaging.
 * Endpoint URI: ws://<host>:<port>/swiftchat-backend/ws/chat/{userId}
 *
 * Uses Jakarta WebSocket (Jakarta EE 10) and maintains in-memory active user sessions
 * via a thread-safe ConcurrentHashMap.
 */
@ServerEndpoint("/ws/chat/{userId}")
public class ChatWebSocket {

    private static final Logger LOGGER = Logger.getLogger(ChatWebSocket.class.getName());

    /**
     * In-memory registry of active user sessions: Key = userId, Value = active WebSocket Session.
     */
    private static final Map<Long, Session> activeSessions = new ConcurrentHashMap<>();

    private static final ChatService chatService = new ChatService();
    private static final Gson gson = GsonProvider.getGson();

    private Long userId;

    /**
     * Invoked when a client establishes a new WebSocket connection.
     *
     * @param session     the connected WebSocket session
     * @param userIdParam user ID extracted from path parameter
     */
    @OnOpen
    public void onOpen(Session session, @PathParam("userId") String userIdParam) {
        try {
            this.userId = Long.parseLong(userIdParam.trim());
            activeSessions.put(this.userId, session);
            LOGGER.info("WebSocket connected: User " + this.userId + " (Session ID: " + session.getId() + ")");
        } catch (NumberFormatException nfe) {
            LOGGER.warning("Invalid userId path parameter: " + userIdParam);
            try {
                session.close(new CloseReason(CloseReason.CloseCodes.CANNOT_ACCEPT, "Invalid userId format."));
            } catch (IOException ignored) {
            }
        }
    }

    /**
     * Handles incoming text messages over WebSocket.
     * Parses payload, persists to MySQL via ChatService, and routes to recipient if active.
     *
     * @param jsonPayload incoming JSON message string
     * @param session     sender's WebSocket session
     */
    @OnMessage
    public void onMessage(String jsonPayload, Session session) {
        LOGGER.info("Received WebSocket message from user " + this.userId + ": " + jsonPayload);
        try {
            JsonObject root = gson.fromJson(jsonPayload, JsonObject.class);
            if (root == null) {
                return;
            }

            // Handle Read Receipt event: {"type":"READ", "chatId":12, "recipientId":1}
            if (root.has("type") && "READ".equalsIgnoreCase(root.get("type").getAsString())) {
                if (root.has("chatId")) {
                    Long chatId = root.get("chatId").getAsLong();
                    Long readerId = (this.userId != null) ? this.userId : (root.has("readerId") ? root.get("readerId").getAsLong() : null);
                    if (chatId != null && readerId != null) {
                        chatService.markChatAsRead(chatId, readerId);
                    }
                    if (root.has("recipientId")) {
                        Long partnerId = root.get("recipientId").getAsLong();
                        Session partnerSession = activeSessions.get(partnerId);
                        if (partnerSession != null && partnerSession.isOpen()) {
                            JsonObject receipt = new JsonObject();
                            receipt.addProperty("type", "READ_RECEIPT");
                            receipt.addProperty("chatId", chatId);
                            receipt.addProperty("readerId", readerId);
                            synchronized (partnerSession) {
                                partnerSession.getBasicRemote().sendText(gson.toJson(receipt));
                            }
                        }
                    }
                }
                return;
            }

            WebSocketMessageDTO incomingDto = gson.fromJson(root, WebSocketMessageDTO.class);
            if (incomingDto == null || incomingDto.getChatId() == null || incomingDto.getText() == null) {
                LOGGER.warning("Incomplete message payload discarded: " + jsonPayload);
                return;
            }

            Long senderId = (incomingDto.getSenderId() != null) ? incomingDto.getSenderId() : this.userId;

            // 1. Persist the message in the database with SENT status
            Message savedMessage = chatService.processNewMessage(
                    incomingDto.getChatId(),
                    senderId,
                    incomingDto.getText()
            );

            // 2. Prepare standardized outgoing DTO with generated DB ID and timestamp
            WebSocketMessageDTO outgoingDto = new WebSocketMessageDTO(
                    savedMessage.getMessageId(),
                    savedMessage.getChat().getChatId(),
                    savedMessage.getSender().getId(),
                    incomingDto.getRecipientId(),
                    savedMessage.getText(),
                    savedMessage.getTimestamp(),
                    savedMessage.getStatus()
            );

            String outgoingJson = gson.toJson(outgoingDto);

            // 3. Route to recipient if currently online
            Long recipientId = incomingDto.getRecipientId();
            if (recipientId != null) {
                Session recipientSession = activeSessions.get(recipientId);
                if (recipientSession != null && recipientSession.isOpen()) {
                    synchronized (recipientSession) {
                        recipientSession.getBasicRemote().sendText(outgoingJson);
                    }
                    LOGGER.info("Routed message " + savedMessage.getMessageId() + " to online recipient " + recipientId);
                } else {
                    LOGGER.info("Recipient " + recipientId + " is currently offline. Stored in DB.");
                }
            }

            // 4. Echo back confirmation to sender session (updates local UI state with messageId and timestamp)
            if (session.isOpen()) {
                synchronized (session) {
                    session.getBasicRemote().sendText(outgoingJson);
                }
            }

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error handling incoming WebSocket message.", ex);
            try {
                if (session.isOpen()) {
                    session.getBasicRemote().sendText("{\"error\":\"" + ex.getMessage().replace("\"", "'") + "\"}");
                }
            } catch (IOException ignored) {
            }
        }
    }

    /**
     * Cleans up registry when a WebSocket session closes.
     *
     * @param session the closing session
     * @param reason  close reason
     */
    @OnClose
    public void onClose(Session session, CloseReason reason) {
        if (this.userId != null) {
            activeSessions.remove(this.userId);
            LOGGER.info("WebSocket disconnected: User " + this.userId + " (" + reason.getReasonPhrase() + ")");
        }
    }

    /**
     * Handles transport or network errors and ensures session removal.
     *
     * @param session   the affected session
     * @param throwable error cause
     */
    @OnError
    public void onError(Session session, Throwable throwable) {
        LOGGER.log(Level.WARNING, "WebSocket error on User " + this.userId, throwable);
        if (this.userId != null) {
            activeSessions.remove(this.userId);
        }
    }

    /**
     * Utility method to check if a specific user is currently connected.
     *
     * @param userId the user ID
     * @return true if user has an active open session
     */
    public static boolean isUserOnline(Long userId) {
        if (userId == null) return false;
        Session session = activeSessions.get(userId);
        return session != null && session.isOpen();
    }
}
