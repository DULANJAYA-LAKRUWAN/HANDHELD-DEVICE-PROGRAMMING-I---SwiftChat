-- =====================================================================
-- SwiftChat Database Schema
-- Database: MySQL 8.x
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `swiftchat_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `swiftchat_db`;

-- 1. Users Table
-- Stores user credentials, contact details, and account creation timestamp
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `contact_no` VARCHAR(20) NOT NULL UNIQUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_contact_no` (`contact_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Chats Table
-- Represents a one-on-one conversation between two users
CREATE TABLE IF NOT EXISTS `chats` (
    `chat_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user1_id` BIGINT NOT NULL,
    `user2_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`chat_id`),
    CONSTRAINT `fk_chats_user1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_chats_user2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `uq_chats_participants` UNIQUE (`user1_id`, `user2_id`),
    INDEX `idx_chats_user1` (`user1_id`),
    INDEX `idx_chats_user2` (`user2_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Messages Table
-- Stores chat messages, sender reference, timestamp, and delivery status
CREATE TABLE IF NOT EXISTS `messages` (
    `message_id` BIGINT NOT NULL AUTO_INCREMENT,
    `chat_id` BIGINT NOT NULL,
    `sender_id` BIGINT NOT NULL,
    `text` TEXT NOT NULL,
    `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('sent', 'delivered', 'read') NOT NULL DEFAULT 'sent',
    PRIMARY KEY (`message_id`),
    CONSTRAINT `fk_messages_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`chat_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_messages_chat_id` (`chat_id`),
    INDEX `idx_messages_sender_id` (`sender_id`),
    INDEX `idx_messages_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
