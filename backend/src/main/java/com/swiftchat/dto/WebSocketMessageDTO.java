package com.swiftchat.dto;

import com.swiftchat.entity.MessageStatus;

import java.io.Serializable;
import java.util.Date;

/**
 * Data Transfer Object for real-time WebSocket messaging and message history payloads.
 */
public class WebSocketMessageDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long messageId;
    private Long chatId;
    private Long senderId;
    private Long recipientId;
    private String text;
    private Date timestamp;
    private MessageStatus status;

    public WebSocketMessageDTO() {
    }

    public WebSocketMessageDTO(Long messageId, Long chatId, Long senderId, Long recipientId,
                               String text, Date timestamp, MessageStatus status) {
        this.messageId = messageId;
        this.chatId = chatId;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.text = text;
        this.timestamp = timestamp;
        this.status = status;
    }

    public Long getMessageId() {
        return messageId;
    }

    public void setMessageId(Long messageId) {
        this.messageId = messageId;
    }

    public Long getChatId() {
        return chatId;
    }

    public void setChatId(Long chatId) {
        this.chatId = chatId;
    }

    public Long getSenderId() {
        return senderId;
    }

    public void setSenderId(Long senderId) {
        this.senderId = senderId;
    }

    public Long getRecipientId() {
        return recipientId;
    }

    public void setRecipientId(Long recipientId) {
        this.recipientId = recipientId;
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Date getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Date timestamp) {
        this.timestamp = timestamp;
    }

    public MessageStatus getStatus() {
        return status;
    }

    public void setStatus(MessageStatus status) {
        this.status = status;
    }
}
