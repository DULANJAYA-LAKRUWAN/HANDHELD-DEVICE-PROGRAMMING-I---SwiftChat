package com.swiftchat.entity;

/**
 * Enumeration representing the delivery and read states of a chat message.
 * Aligned with the database ENUM('sent', 'delivered', 'read').
 */
public enum MessageStatus {
    sent,
    delivered,
    read
}
