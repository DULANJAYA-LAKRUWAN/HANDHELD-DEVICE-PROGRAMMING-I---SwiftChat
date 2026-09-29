package com.swiftchat.dto;

import java.io.Serializable;
import java.util.Date;

/**
 * Data Transfer Object representing a conversation channel with participant metadata
 * and WhatsApp-level unread message metrics.
 */
public class ChatDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long chatId;
    private Long user1Id;
    private Long user2Id;
    private UserDTO otherUser;
    private WebSocketMessageDTO lastMessage;
    private Date createdAt;
    private int unreadCount;

    public ChatDTO() {
    }

    public ChatDTO(Long chatId, Long user1Id, Long user2Id, UserDTO otherUser,
                   WebSocketMessageDTO lastMessage, Date createdAt) {
        this(chatId, user1Id, user2Id, otherUser, lastMessage, createdAt, 0);
    }

    public ChatDTO(Long chatId, Long user1Id, Long user2Id, UserDTO otherUser,
                   WebSocketMessageDTO lastMessage, Date createdAt, int unreadCount) {
        this.chatId = chatId;
        this.user1Id = user1Id;
        this.user2Id = user2Id;
        this.otherUser = otherUser;
        this.lastMessage = lastMessage;
        this.createdAt = createdAt;
        this.unreadCount = unreadCount;
    }

    public Long getChatId() {
        return chatId;
    }

    public void setChatId(Long chatId) {
        this.chatId = chatId;
    }

    public Long getUser1Id() {
        return user1Id;
    }

    public void setUser1Id(Long user1Id) {
        this.user1Id = user1Id;
    }

    public Long getUser2Id() {
        return user2Id;
    }

    public void setUser2Id(Long user2Id) {
        this.user2Id = user2Id;
    }

    public UserDTO getOtherUser() {
        return otherUser;
    }

    public void setOtherUser(UserDTO otherUser) {
        this.otherUser = otherUser;
    }

    public WebSocketMessageDTO getLastMessage() {
        return lastMessage;
    }

    public void setLastMessage(WebSocketMessageDTO lastMessage) {
        this.lastMessage = lastMessage;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    public int getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(int unreadCount) {
        this.unreadCount = unreadCount;
    }
}
