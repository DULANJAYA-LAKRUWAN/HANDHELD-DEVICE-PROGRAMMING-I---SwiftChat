package com.swiftchat.dao;

import com.swiftchat.entity.User;
import com.swiftchat.util.HibernateUtil;
import org.hibernate.Session;
import org.hibernate.Transaction;
import org.hibernate.query.Query;

import java.util.Optional;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Data Access Object (DAO) for User entity persistence and querying.
 * Manages Hibernate session lifecycle and explicit transaction boundaries
 * (begin, commit, and rollback).
 */
public class UserDao {

    private static final Logger LOGGER = Logger.getLogger(UserDao.class.getName());

    /**
     * Persists a new User entity into the database within an isolated transaction.
     *
     * @param user Transient User instance to be persisted
     * @return Attached and persisted User instance with generated primary key
     * @throws Exception if a persistence error occurs
     */
    public User saveUser(User user) throws Exception {
        Transaction transaction = null;
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            transaction = session.beginTransaction();
            session.persist(user);
            transaction.commit();
            LOGGER.info("User persisted successfully with ID: " + user.getId());
            return user;
        } catch (Exception ex) {
            if (transaction != null && transaction.isActive()) {
                try {
                    transaction.rollback();
                    LOGGER.warning("Transaction rolled back for saveUser: " + user.getUsername());
                } catch (Exception rollbackEx) {
                    LOGGER.log(Level.SEVERE, "Rollback failed during saveUser.", rollbackEx);
                }
            }
            LOGGER.log(Level.SEVERE, "Error while saving user: " + user.getUsername(), ex);
            throw ex;
        }
    }

    /**
     * Retrieves a User entity by its unique username.
     *
     * @param username the username to look up
     * @return User instance if found, or null otherwise
     */
    public User getUserByUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            return null;
        }
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<User> query = session.createQuery(
                    "FROM User u WHERE u.username = :username", User.class
            );
            query.setParameter("username", username.trim());
            return query.uniqueResult();
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error retrieving user by username: " + username, ex);
            throw ex;
        }
    }

    /**
     * Retrieves a User entity by its primary key ID.
     *
     * @param id the primary key ID of the user
     * @return User instance if found, or null otherwise
     */
    public User getUserById(Long id) {
        if (id == null) {
            return null;
        }
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            return session.get(User.class, id);
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error retrieving user by ID: " + id, ex);
            throw ex;
        }
    }

    /**
     * Retrieves a User entity by its unique contact number.
     *
     * @param contactNo the contact number to look up
     * @return User instance if found, or null otherwise
     */
    public User getUserByContactNo(String contactNo) {
        if (contactNo == null || contactNo.trim().isEmpty()) {
            return null;
        }
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            Query<User> query = session.createQuery(
                    "FROM User u WHERE u.contactNo = :contactNo", User.class
            );
            query.setParameter("contactNo", contactNo.trim());
            return query.uniqueResult();
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error retrieving user by contact number: " + contactNo, ex);
            throw ex;
        }
    }

    /**
     * Searches users whose username or contact number contains the search query string.
     * Optionally excludes a specific user ID (e.g., the current user).
     *
     * @param query         the search term to match against username or contact number
     * @param excludeUserId optional user ID to exclude from results (can be null)
     * @return List of matching User entities
     */
    public java.util.List<User> searchUsers(String query, Long excludeUserId) {
        try (Session session = HibernateUtil.getSessionFactory().openSession()) {
            StringBuilder hql = new StringBuilder("FROM User u WHERE 1=1");
            boolean hasQuery = query != null && !query.trim().isEmpty();

            if (hasQuery) {
                hql.append(" AND (LOWER(u.username) LIKE :term OR u.contactNo LIKE :term)");
            }
            if (excludeUserId != null) {
                hql.append(" AND u.id != :excludeId");
            }
            hql.append(" ORDER BY u.username ASC");

            Query<User> q = session.createQuery(hql.toString(), User.class);
            if (hasQuery) {
                q.setParameter("term", "%" + query.trim().toLowerCase() + "%");
            }
            if (excludeUserId != null) {
                q.setParameter("excludeId", excludeUserId);
            }
            q.setMaxResults(50);
            return q.list();
        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Error searching users with query: " + query, ex);
            throw ex;
        }
    }
}
