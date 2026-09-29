-- =====================================================================
-- SwiftChat Database Schema
-- Database: MySQL 8.x
-- Specification: Academic Assessment - Handheld Device Programming I
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `swiftchat_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `swiftchat_db`;

-- Drop existing tables in reverse dependency order if recreating
-- DROP TABLE IF EXISTS `messages`;
-- DROP TABLE IF EXISTS `chats`;
-- DROP TABLE IF EXISTS `users`;

-- ---------------------------------------------------------------------
-- 1. Table: users
-- Description: Stores authenticated user profiles and credentials
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
    `id` BIGINT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `contact_no` VARCHAR(20) NOT NULL UNIQUE,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    CONSTRAINT `chk_username_not_empty` CHECK (CHAR_LENGTH(TRIM(`username`)) > 0),
    INDEX `idx_users_username` (`username`),
    INDEX `idx_users_contact_no` (`contact_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. Table: chats
-- Description: Stores 1-on-1 private conversations between two users
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `chats` (
    `chat_id` BIGINT NOT NULL AUTO_INCREMENT,
    `user1_id` BIGINT NOT NULL,
    `user2_id` BIGINT NOT NULL,
    `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`chat_id`),
    CONSTRAINT `fk_chats_user1` FOREIGN KEY (`user1_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_chats_user2` FOREIGN KEY (`user2_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `uq_chats_participants` UNIQUE (`user1_id`, `user2_id`),
    CONSTRAINT `chk_chats_distinct_users` CHECK (`user1_id` != `user2_id`),
    INDEX `idx_chats_user1` (`user1_id`),
    INDEX `idx_chats_user2` (`user2_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. Table: messages
-- Description: Stores private messages exchanged within a conversation
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `messages` (
    `message_id` BIGINT NOT NULL AUTO_INCREMENT,
    `chat_id` BIGINT NOT NULL,
    `sender_id` BIGINT NOT NULL,
    `text` TEXT NOT NULL,
    `timestamp` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('SENT', 'DELIVERED', 'READ') NOT NULL DEFAULT 'SENT',
    PRIMARY KEY (`message_id`),
    CONSTRAINT `fk_messages_chat` FOREIGN KEY (`chat_id`) REFERENCES `chats` (`chat_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `fk_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX `idx_messages_chat_id` (`chat_id`),
    INDEX `idx_messages_sender_id` (`sender_id`),
    INDEX `idx_messages_timestamp` (`timestamp`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
