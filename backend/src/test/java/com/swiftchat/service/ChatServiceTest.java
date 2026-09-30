package com.swiftchat.service;

import com.swiftchat.dao.ChatDao;
import com.swiftchat.dao.MessageDao;
import com.swiftchat.dao.UserDao;
import com.swiftchat.entity.Chat;
import com.swiftchat.entity.Message;
import com.swiftchat.entity.MessageStatus;
import com.swiftchat.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ChatService Unit & Smoke Tests")
class ChatServiceTest {

    @Mock
    private ChatDao chatDao;
    @Mock
    private MessageDao messageDao;
    @Mock
    private UserDao userDao;

    private ChatService chatService;

    @BeforeEach
    void setUp() {
        chatService = new ChatService(chatDao, messageDao, userDao);
    }

    @Test
    @DisplayName("Should prevent user from starting a chat with themselves")
    void testSelfChatPrevention() {
        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () ->
                chatService.getOrCreateChat(5L, 5L)
        );
        assertTrue(ex.getMessage().contains("cannot establish a chat session with themselves"));
    }

    @Test
    @DisplayName("Should enforce canonical participant ordering (min, max)")
    void testCanonicalOrdering() throws Exception {
        Long initiator = 10L;
        Long target = 3L;

        // user1Id should be 3, user2Id should be 10
        User u3 = new User("u3", "hash", "0773");
        u3.setId(3L);
        User u10 = new User("u10", "hash", "07710");
        u10.setId(10L);

        when(chatDao.getChatByParticipants(3L, 10L)).thenReturn(null);
        when(userDao.getUserById(3L)).thenReturn(u3);
        when(userDao.getUserById(10L)).thenReturn(u10);

        Chat createdChat = new Chat(u3, u10);
        createdChat.setChatId(100L);
        when(chatDao.createChat(any(Chat.class))).thenReturn(createdChat);

        Chat result = chatService.getOrCreateChat(initiator, target);

        assertNotNull(result);
        assertEquals(3L, result.getUser1().getId());
        assertEquals(10L, result.getUser2().getId());
        verify(chatDao).getChatByParticipants(3L, 10L);
    }

    @Test
    @DisplayName("Should return existing chat channel if already present")
    void testGetExistingChat() throws Exception {
        User u2 = new User("u2", "h", "0772");
        u2.setId(2L);
        User u7 = new User("u7", "h", "0777");
        u7.setId(7L);
        Chat existing = new Chat(u2, u7);
        existing.setChatId(88L);
        when(chatDao.getChatByParticipants(2L, 7L)).thenReturn(existing);

        Chat result = chatService.getOrCreateChat(2L, 7L);
        assertEquals(88L, result.getChatId());
        verify(chatDao, never()).createChat(any());
    }

    @Test
    @DisplayName("Should process new message, validate participation, and save")
    void testProcessNewMessageSuccess() throws Exception {
        User u1 = new User("u1", "h1", "0771");
        u1.setId(1L);
        User u2 = new User("u2", "h2", "0772");
        u2.setId(2L);

        Chat chat = new Chat(u1, u2);
        chat.setChatId(15L);

        when(chatDao.getChatById(15L)).thenReturn(chat);
        when(userDao.getUserById(1L)).thenReturn(u1);

        Message savedMsg = new Message(chat, u1, "Hello from Alice", MessageStatus.SENT);
        savedMsg.setMessageId(999L);
        when(messageDao.saveMessage(any(Message.class))).thenReturn(savedMsg);

        Message result = chatService.processNewMessage(15L, 1L, "Hello from Alice");
        assertNotNull(result);
        assertEquals(999L, result.getMessageId());
        assertEquals("Hello from Alice", result.getText());
    }

    @Test
    @DisplayName("Should reject message if sender is not a participant in the chat")
    void testProcessNewMessageNonParticipant() throws Exception {
        User u1 = new User("u1", "h1", "0771");
        u1.setId(1L);
        User u2 = new User("u2", "h2", "0772");
        u2.setId(2L);

        Chat chat = new Chat(u1, u2);
        chat.setChatId(15L);

        when(chatDao.getChatById(15L)).thenReturn(chat);
        User outsider = new User("outsider", "h3", "0779");
        outsider.setId(9L);
        when(userDao.getUserById(9L)).thenReturn(outsider);

        assertThrows(SecurityException.class, () ->
                chatService.processNewMessage(15L, 9L, "Intruder message")
        );
        verify(messageDao, never()).saveMessage(any());
    }

    @Test
    @DisplayName("Should mark messages as read and return updated count")
    void testMarkChatAsRead() {
        when(messageDao.markMessagesAsRead(5L, 2L)).thenReturn(3);

        int updated = chatService.markChatAsRead(5L, 2L);
        assertEquals(3, updated);
        verify(messageDao).markMessagesAsRead(5L, 2L);
    }
}
