package com.swiftchat.dao;

import com.swiftchat.entity.Chat;
import com.swiftchat.util.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.query.Query;

import java.util.Collections;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Data Access Object for Chat entity operations.
 * Handles database interaction for 1-on-1 private conversations.
 */
public class ChatDao {

    private static final Logger LOGGER = Logger.getLogger(ChatDao.class.getName());

    /**
     * Persists a new Chat room into the database within a transaction.
     *
     * @param chat Transient Chat entity to persist
     * @return Persisted Chat entity with generated primary key
     * @throws Exception if a persistence error occurs
     */
    public Chat createChat(Chat chat) throws Exception {
        Transaction transaction = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            transaction = session.beginTransaction();
            session.persist(chat);
            transaction.commit();
            LOGGER.info("Chat created successfully with ID: " + chat.getChatId());
            return chat;
        } catch (Exception ex) {
            if (transaction != null && transaction.isActive()) {
                try {
                    transaction.rollback();
                    LOGGER.warning("Transaction rolled back for createChat.");
                } catch (Exception rollbackEx) {
                    LOGGER.log(Level.SEVERE, "Rollback failed during createChat.", rollbackEx);
                }
            }
            LOGGER.log(Level.SEVERE, "Error creating chat between users.", ex);
            throw ex;
        }
    }

    /**
     * Retrieves a Chat entity by its primary key ID.
     *
     * @param chatId the chat ID
     * @return Chat entity if found, or null otherwise
     */
    public Chat getChatById(Long chatId) {
        if (chatId == null) {
            return null;
        }
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.get(Chat.class, chatId);
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error retrieving chat by ID: " + chatId, ex);
            throw ex;
        }
    }

    /**
     * Finds an existing chat between two participants regardless of argument order.
     *
     * @param userId1 ID of the first user
     * @param userId2 ID of the second user
     * @return Existing Chat entity if found, or null otherwise
     */
    public Chat getChatByParticipants(Long userId1, Long userId2) {
        if (userId1 == null || userId2 == null) {
            return null;
        }
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            String hql = "FROM Chat c WHERE (c.user1.id = :u1 AND c.user2.id = :u2) " +
                         "OR (c.user1.id = :u2 AND c.user2.id = :u1)";
            Query<Chat> query = session.createQuery(hql, Chat.class);
            query.setParameter("u1", userId1);
            query.setParameter("u2", userId2);
            return query.uniqueResult();
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error finding chat by participants (" + userId1 + ", " + userId2 + ")", ex);
            throw ex;
        }
    }

    /**
     * Retrieves all chat channels that a given user participates in.
     * Ordered by creation timestamp descending.
     *
     * @param userId the user ID to look up
     * @return List of Chat entities
     */
    public List<Chat> getUserChats(Long userId) {
        if (userId == null) {
            return Collections.emptyList();
        }
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            String hql = "FROM Chat c WHERE c.user1.id = :userId OR c.user2.id = :userId ORDER BY c.createdAt DESC";
            Query<Chat> query = session.createQuery(hql, Chat.class);
            query.setParameter("userId", userId);
            return query.list();
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error retrieving user chats for userId: " + userId, ex);
            throw ex;
        }
    }
}
