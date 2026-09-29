package com.swiftchat.dao;

import com.swiftchat.entity.Message;
import com.swiftchat.util.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.query.Query;

import java.util.Collections;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Data Access Object for Message entity persistence and retrieval.
 */
public class MessageDao {

    private static final Logger LOGGER = Logger.getLogger(MessageDao.class.getName());

    /**
     * Persists a newly composed Message into the database within an isolated transaction.
     *
     * @param message Transient Message entity
     * @return Persisted Message entity with generated primary key and timestamp
     * @throws Exception if persistence fails
     */
    public Message saveMessage(Message message) throws Exception {
        Transaction transaction = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            transaction = session.beginTransaction();
            session.persist(message);
            transaction.commit();
            LOGGER.info("Message saved with ID: " + message.getMessageId() + " in chat: " + message.getChat().getChatId());
            return message;
        } catch (Exception ex) {
            if (transaction != null && transaction.isActive()) {
                try {
                    transaction.rollback();
                    LOGGER.warning("Transaction rolled back for saveMessage.");
                } catch (Exception rollbackEx) {
                    LOGGER.log(Level.SEVERE, "Rollback failed during saveMessage.", rollbackEx);
                }
            }
            LOGGER.log(Level.SEVERE, "Error saving message in chat.", ex);
            throw ex;
        }
    }

    /**
     * Retrieves the chronological history of messages exchanged inside a chat room.
     *
     * @param chatId the chat ID
     * @return List of Message entities ordered by timestamp ascending
     */
    public List<Message> getMessagesByChatId(Long chatId) {
        if (chatId == null) {
            return Collections.emptyList();
        }
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            String hql = "FROM Message m WHERE m.chat.chatId = :chatId ORDER BY m.timestamp ASC";
            Query<Message> query = session.createQuery(hql, Message.class);
            query.setParameter("chatId", chatId);
            return query.list();
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error retrieving messages for chatId: " + chatId, ex);
            throw ex;
        }
    }

    /**
     * Retrieves the most recent message in a chat channel (used for chat list snippets).
     *
     * @param chatId the chat ID
     * @return latest Message if present, or null
     */
    public Message getLastMessageForChat(Long chatId) {
        if (chatId == null) {
            return null;
        }
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            String hql = "FROM Message m WHERE m.chat.chatId = :chatId ORDER BY m.timestamp DESC";
            Query<Message> query = session.createQuery(hql, Message.class);
            query.setParameter("chatId", chatId);
            query.setMaxResults(1);
            return query.uniqueResult();
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error retrieving last message for chatId: " + chatId, ex);
            return null;
        }
    }

    /**
     * Counts unread incoming messages in a conversation for a specific user.
     *
     * @param chatId        the chat room ID
     * @param currentUserId the receiving user ID
     * @return count of messages not authored by currentUserId and not yet marked READ
     */
    public int getUnreadMessageCount(Long chatId, Long currentUserId) {
        if (chatId == null || currentUserId == null) {
            return 0;
        }
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            String hql = "SELECT COUNT(m) FROM Message m WHERE m.chat.chatId = :chatId " +
                    "AND m.sender.id != :currentUserId AND m.status != :readStatus";
            Query<Long> query = session.createQuery(hql, Long.class);
            query.setParameter("chatId", chatId);
            query.setParameter("currentUserId", currentUserId);
            query.setParameter("readStatus", com.swiftchat.entity.MessageStatus.READ);
            Long count = query.uniqueResult();
            return count != null ? count.intValue() : 0;
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error counting unread messages for chatId: " + chatId, ex);
            return 0;
        }
    }

    /**
     * Marks all incoming messages in a chat as READ for a specific recipient.
     *
     * @param chatId        the chat room ID
     * @param currentUserId the user reading the messages
     * @return number of messages updated
     */
    public int markMessagesAsRead(Long chatId, Long currentUserId) {
        if (chatId == null || currentUserId == null) {
            return 0;
        }
        Transaction transaction = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            transaction = session.beginTransaction();
            String hql = "UPDATE Message m SET m.status = :readStatus " +
                    "WHERE m.chat.chatId = :chatId AND m.sender.id != :currentUserId AND m.status != :readStatus";
            int updated = session.createMutationQuery(hql)
                    .setParameter("readStatus", com.swiftchat.entity.MessageStatus.READ)
                    .setParameter("chatId", chatId)
                    .setParameter("currentUserId", currentUserId)
                    .executeUpdate();
            transaction.commit();
            LOGGER.info("Marked " + updated + " messages as READ in chatId: " + chatId);
            return updated;
        } catch (Exception ex) {
            if (transaction != null && transaction.isActive()) {
                try {
                    transaction.rollback();
                } catch (Exception ignored) {
                }
            }
            LOGGER.log(Level.SEVERE, "Error marking messages as read for chatId: " + chatId, ex);
            return 0;
        }
    }
}
