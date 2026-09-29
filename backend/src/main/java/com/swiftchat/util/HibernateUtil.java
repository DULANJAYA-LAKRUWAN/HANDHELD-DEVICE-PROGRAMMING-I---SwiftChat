package com.swiftchat.util;

import org.hibernate.SessionFactory;
import org.hibernate.boot.registry.StandardServiceRegistryBuilder;
import org.hibernate.cfg.Configuration;
import org.hibernate.service.ServiceRegistry;

import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Thread-safe singleton utility for configuring and providing the Hibernate SessionFactory.
 * Dynamically resolves database credentials from environment variables or JVM system properties
 * at runtime, preventing hardcoded credentials in configuration files.
 */
public final class HibernateUtil {

    private static final Logger LOGGER = Logger.getLogger(HibernateUtil.class.getName());
    private static volatile SessionFactory sessionFactory;

    private HibernateUtil() {
        // Prevent instantiation
    }

    /**
     * Retrieves the initialized SessionFactory singleton instance.
     * Uses double-checked locking for thread-safe lazy initialization.
     *
     * @return active SessionFactory
     */
    public static SessionFactory getSessionFactory() {
        if (sessionFactory == null) {
            synchronized (HibernateUtil.class) {
                if (sessionFactory == null) {
                    sessionFactory = buildSessionFactory();
                }
            }
        }
        return sessionFactory;
    }

    /**
     * Builds and configures the SessionFactory using hibernate.cfg.xml and
     * runtime environment variable overrides.
     *
     * @return constructed SessionFactory
     */
    private static SessionFactory buildSessionFactory() {
        try {
            Configuration configuration = new Configuration();
            // Load base settings and entity mappings from XML descriptor
            configuration.configure("hibernate.cfg.xml");

            // Resolve environment variables with system property fallbacks
            String host = getEnvOrDefault("DB_HOST", "localhost");
            String port = getEnvOrDefault("DB_PORT", "3306");
            String dbName = getEnvOrDefault("DB_NAME", "swiftchat_db");
            String username = getEnvOrDefault("DB_USER", "root");
            String password = getEnvOrDefault("DB_PASSWORD", "");

            String jdbcUrl = String.format(
                    "jdbc:mysql://%s:%s/%s?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC&characterEncoding=UTF-8",
                    host, port, dbName
            );

            // Dynamically override connection properties securely at runtime
            configuration.setProperty("hibernate.connection.url", jdbcUrl);
            configuration.setProperty("hibernate.connection.username", username);
            configuration.setProperty("hibernate.connection.password", password);

            ServiceRegistry serviceRegistry = new StandardServiceRegistryBuilder()
                    .applySettings(configuration.getProperties())
                    .build();

            LOGGER.info("Hibernate SessionFactory initialized successfully for database: " + dbName);
            return configuration.buildSessionFactory(serviceRegistry);

        } catch (Exception ex) {
            LOGGER.log(Level.SEVERE, "Initial SessionFactory creation failed.", ex);
            throw new ExceptionInInitializerError("Failed to initialize Hibernate SessionFactory: " + ex.getMessage());
        }
    }

    /**
     * Helper to read from environment variables first, falling back to JVM system properties,
     * and finally to a sensible default.
     */
    private static String getEnvOrDefault(String key, String defaultValue) {
        String value = System.getenv(key);
        if (value == null || value.trim().isEmpty()) {
            value = System.getProperty(key);
        }
        return (value != null && !value.trim().isEmpty()) ? value.trim() : defaultValue;
    }

    /**
     * Closes caches and connection pools on application shutdown.
     */
    public static void shutdown() {
        if (sessionFactory != null && !sessionFactory.isClosed()) {
            LOGGER.info("Closing Hibernate SessionFactory.");
            sessionFactory.close();
        }
    }
}
