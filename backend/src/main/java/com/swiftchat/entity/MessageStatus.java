package com.swiftchat.entity;

/**
 * Enumeration representing message delivery status.
 * Values:
 * - SENT: Message submitted by sender and recorded in database
 * - DELIVERED: Message reached recipient client session
 * - READ: Message viewed by recipient
 */
public enum MessageStatus {
    SENT,
    DELIVERED,
    READ
}
