package com.swiftchat.service;

import com.swiftchat.dao.ChatDao;
import com.swiftchat.dao.MessageDao;
import com.swiftchat.dao.UserDao;
import com.swiftchat.dto.ChatDTO;
import com.swiftchat.dto.UserDTO;
import com.swiftchat.dto.WebSocketMessageDTO;
import com.swiftchat.entity.Chat;
import com.swiftchat.entity.Message;
import com.swiftchat.entity.MessageStatus;
import com.swiftchat.entity.User;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

/**
 * Service orchestrating chat sessions, canonical participant ordering,
 * message processing, and history retrieval.
 */
public class ChatService {

    private final ChatDao chatDao;
    private final MessageDao messageDao;
    private final UserDao userDao;

    public ChatService() {
        this(new ChatDao(), new MessageDao(), new UserDao());
    }

    public ChatService(ChatDao chatDao, MessageDao messageDao, UserDao userDao) {
        this.chatDao = chatDao;
        this.messageDao = messageDao;
        this.userDao = userDao;
    }

    /**
     * Retrieves an existing 1-on-1 chat or creates a new one if not found.
     * Enforces canonical participant ordering (user1_id = min(u1, u2), user2_id = max(u1, u2))
     * to eliminate symmetric duplicate chat channels.
     *
     * @param initiatorId user initiating or opening the chat
     * @param targetId    user receiving or participating in the chat
     * @return the active Chat entity
     * @throws IllegalArgumentException if user IDs are invalid or identical
     * @throws Exception                if persistence fails
     */
    public Chat getOrCreateChat(Long initiatorId, Long targetId) throws Exception {
        if (initiatorId == null || targetId == null) {
            throw new IllegalArgumentException("Initiator and target user IDs must not be null.");
        }
        if (Objects.equals(initiatorId, targetId)) {
            throw new IllegalArgumentException("A user cannot establish a chat session with themselves.");
        }

        // Canonical ordering enforcement
        Long user1Id = Math.min(initiatorId, targetId);
        Long user2Id = Math.max(initiatorId, targetId);

        Chat existingChat = chatDao.getChatByParticipants(user1Id, user2Id);
        if (existingChat != null) {
            return existingChat;
        }

        // Retrieve participants
        User user1 = userDao.getUserById(user1Id);
        User user2 = userDao.getUserById(user2Id);

        if (user1 == null || user2 == null) {
            throw new IllegalArgumentException("One or both chat participant users do not exist in the database.");
        }

        Chat newChat = new Chat(user1, user2);
        return chatDao.createChat(newChat);
    }

    /**
     * Returns raw Chat entities for all conversations a user participates in.
     *
     * @param userId the user ID
     * @return List of Chat entities
     */
    public List<Chat> getUserChats(Long userId) {
        if (userId == null) {
            return new ArrayList<>();
        }
        return chatDao.getUserChats(userId);
    }

    /**
     * Returns fully resolved ChatDTOs for a user's conversation list,
     * including conversation partner metadata and the most recent message snippet.
     *
     * @param currentUserId the requesting user's ID
     * @return List of ChatDTO instances
     */
    public List<ChatDTO> getUserChatDTOs(Long currentUserId) {
        List<Chat> chats = getUserChats(currentUserId);
        List<ChatDTO> dtoList = new ArrayList<>();

        for (Chat chat : chats) {
            User otherUserEntity = Objects.equals(chat.getUser1().getId(), currentUserId)
                    ? chat.getUser2()
                    : chat.getUser1();

            UserDTO otherUserDTO = UserDTO.fromEntity(otherUserEntity);

            Message lastMsgEntity = messageDao.getLastMessageForChat(chat.getChatId());
            WebSocketMessageDTO lastMsgDTO = null;
            if (lastMsgEntity != null) {
                Long recipientId = Objects.equals(lastMsgEntity.getSender().getId(), chat.getUser1().getId())
                        ? chat.getUser2().getId()
                        : chat.getUser1().getId();

                lastMsgDTO = new WebSocketMessageDTO(
                        lastMsgEntity.getMessageId(),
                        chat.getChatId(),
                        lastMsgEntity.getSender().getId(),
                        recipientId,
                        lastMsgEntity.getText(),
                        lastMsgEntity.getTimestamp(),
                        lastMsgEntity.getStatus()
                );
            }

            int unreadCount = messageDao.getUnreadMessageCount(chat.getChatId(), currentUserId);

            ChatDTO dto = new ChatDTO(
                    chat.getChatId(),
                    chat.getUser1().getId(),
                    chat.getUser2().getId(),
                    otherUserDTO,
                    lastMsgDTO,
                    chat.getCreatedAt(),
                    unreadCount
            );
            dtoList.add(dto);
        }

        return dtoList;
    }

    /**
     * Marks all unread incoming messages in a conversation as READ for the specified recipient.
     *
     * @param chatId the chat conversation ID
     * @param currentUserId the receiving user reading the messages
     * @return the number of messages updated to READ
     */
    public int markChatAsRead(Long chatId, Long currentUserId) {
        if (chatId == null || currentUserId == null) {
            return 0;
        }
        return messageDao.markMessagesAsRead(chatId, currentUserId);
    }

    /**
     * Retrieves the chronological message history for a given chat room.
     *
     * @param chatId the chat ID
     * @return List of Message entities
     */
    public List<Message> getChatHistory(Long chatId) {
        if (chatId == null) {
            return new ArrayList<>();
        }
        return messageDao.getMessagesByChatId(chatId);
    }

    /**
     * Retrieves chat history mapped into WebSocketMessageDTO instances.
     *
     * @param chatId the chat ID
     * @return List of WebSocketMessageDTO
     */
    public List<WebSocketMessageDTO> getChatHistoryDTOs(Long chatId) {
        Chat chat = chatDao.getChatById(chatId);
        if (chat == null) {
            return new ArrayList<>();
        }

        List<Message> messages = getChatHistory(chatId);
        List<WebSocketMessageDTO> dtoList = new ArrayList<>();

        for (Message msg : messages) {
            Long recipientId = Objects.equals(msg.getSender().getId(), chat.getUser1().getId())
                    ? chat.getUser2().getId()
                    : chat.getUser1().getId();

            dtoList.add(new WebSocketMessageDTO(
                    msg.getMessageId(),
                    chatId,
                    msg.getSender().getId(),
                    recipientId,
                    msg.getText(),
                    msg.getTimestamp(),
                    msg.getStatus()
            ));
        }

        return dtoList;
    }

    /**
     * Validates, attaches, and persists an incoming chat message with SENT status.
     *
     * @param chatId   the destination chat room ID
     * @param senderId the sender's user ID
     * @param text     the message body
     * @return Persisted Message entity
     * @throws Exception if validation or persistence fails
     */
    public Message processNewMessage(Long chatId, Long senderId, String text) throws Exception {
        if (chatId == null || senderId == null) {
            throw new IllegalArgumentException("Chat ID and Sender ID are required.");
        }
        if (text == null || text.trim().isEmpty()) {
            throw new IllegalArgumentException("Message text cannot be empty.");
        }

        Chat chat = chatDao.getChatById(chatId);
        if (chat == null) {
            throw new IllegalArgumentException("Chat room not found for ID: " + chatId);
        }

        User sender = userDao.getUserById(senderId);
        if (sender == null) {
            throw new IllegalArgumentException("Sender not found for ID: " + senderId);
        }

        // Validate sender participation
        boolean isParticipant = Objects.equals(chat.getUser1().getId(), senderId) ||
                                Objects.equals(chat.getUser2().getId(), senderId);
        if (!isParticipant) {
            throw new SecurityException("User " + senderId + " is not an authorized participant in chat " + chatId);
        }

        Message message = new Message(chat, sender, text.trim(), MessageStatus.SENT);
        return messageDao.saveMessage(message);
    }
}
