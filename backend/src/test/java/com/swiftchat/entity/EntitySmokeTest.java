package com.swiftchat.entity;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("JPA Entity Model Smoke Tests")
class EntitySmokeTest {

    @Test
    @DisplayName("User entity instantiation, getters, setters, and equals/hashCode")
    void testUserEntity() {
        User user = new User("alice_test", "hashed_pass_123", "+94770001122");
        user.setId(10L);
        user.setCreatedAt(new Date());

        assertEquals(10L, user.getId());
        assertEquals("alice_test", user.getUsername());
        assertEquals("hashed_pass_123", user.getPasswordHash());
        assertEquals("+94770001122", user.getContactNo());
        assertNotNull(user.getCreatedAt());

        User sameUser = new User("alice_test", "different_hash", "diff_contact");
        sameUser.setId(10L);

        assertEquals(user, sameUser);
        assertEquals(user.hashCode(), sameUser.hashCode());
        assertTrue(user.toString().contains("alice_test"));
    }

    @Test
    @DisplayName("Chat entity participant management and canonical relationship")
    void testChatEntity() {
        User user1 = new User("user1", "hash1", "0771111111");
        user1.setId(1L);
        User user2 = new User("user2", "hash2", "0772222222");
        user2.setId(2L);

        Chat chat = new Chat(user1, user2);
        chat.setChatId(50L);
        chat.setCreatedAt(new Date());

        assertEquals(50L, chat.getChatId());
        assertEquals(1L, chat.getUser1().getId());
        assertEquals(2L, chat.getUser2().getId());
        assertNotNull(chat.getCreatedAt());

        Chat sameChat = new Chat();
        sameChat.setChatId(50L);
        assertEquals(chat, sameChat);
        assertEquals(chat.hashCode(), sameChat.hashCode());
    }

    @Test
    @DisplayName("Message entity status transitions, relationship attributes, and equality")
    void testMessageEntity() {
        User sender = new User("sender_user", "hash", "0773333333");
        sender.setId(1L);
        User receiver = new User("receiver_user", "hash", "0774444444");
        receiver.setId(2L);

        Chat chat = new Chat(sender, receiver);
        chat.setChatId(99L);

        Message message = new Message(chat, sender, "Hello SwiftChat!", MessageStatus.SENT);
        message.setMessageId(1001L);
        message.setTimestamp(new Date());

        assertEquals(1001L, message.getMessageId());
        assertEquals(chat, message.getChat());
        assertEquals(sender, message.getSender());
        assertEquals("Hello SwiftChat!", message.getText());
        assertEquals(MessageStatus.SENT, message.getStatus());
        assertNotNull(message.getTimestamp());

        // Update status to DELIVERED and READ
        message.setStatus(MessageStatus.DELIVERED);
        assertEquals(MessageStatus.DELIVERED, message.getStatus());

        message.setStatus(MessageStatus.READ);
        assertEquals(MessageStatus.READ, message.getStatus());

        Message sameMessage = new Message();
        sameMessage.setMessageId(1001L);
        assertEquals(message, sameMessage);
    }
}
