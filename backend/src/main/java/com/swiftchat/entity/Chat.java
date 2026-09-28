package com.swiftchat.entity;

import jakarta.persistence.*;
import java.io.Serializable;
import java.util.Date;
import java.util.Objects;

/**
 * Entity representing a conversation channel between two participants.
 */
@Entity
@Table(
    name = "chats",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_chats_participants", columnNames = {"user1_id", "user2_id"})
    },
    indexes = {
        @Index(name = "idx_chats_user1", columnList = "user1_id"),
        @Index(name = "idx_chats_user2", columnList = "user2_id")
    }
)
public class Chat implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "chat_id", nullable = false, updatable = false)
    private Long chatId;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user1_id", nullable = false, foreignKey = @ForeignKey(name = "fk_chats_user1"))
    private User user1;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "user2_id", nullable = false, foreignKey = @ForeignKey(name = "fk_chats_user2"))
    private User user2;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name = "created_at", nullable = false, updatable = false, insertable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private Date createdAt;

    public Chat() {
    }

    public Chat(User user1, User user2) {
        this.user1 = user1;
        this.user2 = user2;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = new Date();
        }
    }

    public Long getChatId() {
        return chatId;
    }

    public void setChatId(Long chatId) {
        this.chatId = chatId;
    }

    public User getUser1() {
        return user1;
    }

    public void setUser1(User user1) {
        this.user1 = user1;
    }

    public User getUser2() {
        return user2;
    }

    public void setUser2(User user2) {
        this.user2 = user2;
    }

    public Date getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Date createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Chat chat = (Chat) o;
        return Objects.equals(chatId, chat.chatId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(chatId);
    }

    @Override
    public String toString() {
        return "Chat{" +
                "chatId=" + chatId +
                ", user1Id=" + (user1 != null ? user1.getId() : null) +
                ", user2Id=" + (user2 != null ? user2.getId() : null) +
                ", createdAt=" + createdAt +
                '}';
    }
}
