package com.swiftchat.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Date;
import java.util.Objects;

/**
 * Entity representing an individual text message sent within a chat session.
 * Maps to database table 'messages'.
 */
@Entity
@Table(
    name = "messages",
    indexes = {
        @Index(name = "idx_messages_chat_id", columnList = "chat_id"),
        @Index(name = "idx_messages_sender_id", columnList = "sender_id"),
        @Index(name = "idx_messages_timestamp", columnList = "timestamp")
    }
)
public class Message implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "message_id", nullable = false, updatable = false)
    private Long messageId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "chat_id", nullable = false, foreignKey = @ForeignKey(name = "fk_messages_chat"))
    private Chat chat;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "sender_id", nullable = false, foreignKey = @ForeignKey(name = "fk_messages_sender"))
    private User sender;

    @Column(name = "text", nullable = false, columnDefinition = "TEXT")
    private String text;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "timestamp", nullable = false, updatable = false, insertable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private Date timestamp;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 15)
    private MessageStatus status = MessageStatus.SENT;

    /**
     * Protected no-argument constructor required by Hibernate / JPA specification.
     */
    protected Message() {
    }

    /**
     * Parameterized constructor for initiating a new outgoing message.
     */
    public Message(Chat chat, User sender, String text) {
        this.chat = chat;
        this.sender = sender;
        this.text = text;
        this.status = MessageStatus.SENT;
    }

    /**
     * Parameterized constructor specifying explicit status.
     */
    public Message(Chat chat, User sender, String text, MessageStatus status) {
        this.chat = chat;
        this.sender = sender;
        this.text = text;
        this.status = status;
    }

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = new Date();
        }
        if (this.status == null) {
            this.status = MessageStatus.SENT;
        }
    }

    public Long getMessageId() {
        return messageId;
    }

    public void setMessageId(Long messageId) {
        this.messageId = messageId;
    }

    public Chat getChat() {
        return chat;
    }

    public void setChat(Chat chat) {
        this.chat = chat;
    }

    public User getSender() {
        return sender;
    }

    public void setSender(User sender) {
        this.sender = sender;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Message message = (Message) o;
        return Objects.equals(messageId, message.messageId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(messageId);
    }

    @Override
    public String toString() {
        return "Message{" +
                "messageId=" + messageId +
                ", chatId=" + (chat != null ? chat.getChatId() : null) +
                ", senderId=" + (sender != null ? sender.getId() : null) +
                ", text='" + text + '\'' +
                ", timestamp=" + timestamp +
                ", status=" + status +
                '}';
    }
}
