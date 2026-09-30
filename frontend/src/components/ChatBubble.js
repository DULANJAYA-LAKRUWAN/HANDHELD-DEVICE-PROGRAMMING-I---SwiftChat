import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { formatBubbleTime } from '../utils/formatDate';

/**
 * Reusable chat message bubble component.
 * Adapts alignment and theme based on message sender identity.
 * Displays WhatsApp-style timestamps, blue/grey delivery ticks,
 * and handles text and image/media attachments.
 *
 * @param {Object} props.message - WebSocketMessageDTO object
 * @param {boolean} props.isCurrentUser - true if message sent by logged-in user
 */
export default function ChatBubble({ message, isCurrentUser, currentUserId }) {
  const isOutgoing =
    isCurrentUser !== undefined
      ? Boolean(isCurrentUser)
      : message?.senderId != null && currentUserId != null && Number(message.senderId) === Number(currentUserId);
  const formattedTime = formatBubbleTime(message?.timestamp);

  const isImageAttachment = message?.text && message.text.startsWith('[IMAGE]:');
  const imageUrl = isImageAttachment ? message.text.replace('[IMAGE]:', '').trim() : null;

  const renderStatusTicks = () => {
    if (!isOutgoing) return null;
    const isRead = message?.status === 'READ';
    const isDelivered = message?.status === 'DELIVERED';
    const tickColor = isRead ? '#38BDF8' : 'rgba(255, 255, 255, 0.7)';
    const tickText = isRead || isDelivered ? '✓✓' : '✓';

    return (
      <Text style={[styles.ticks, { color: tickColor }]}>
        {tickText}
      </Text>
    );
  };

  return (
    <View
      style={[
        styles.bubbleContainer,
        isOutgoing ? styles.outgoingContainer : styles.incomingContainer,
      ]}
    >
      <View
        style={[
          styles.bubble,
          isOutgoing ? styles.outgoingBubble : styles.incomingBubble,
          isImageAttachment ? styles.imageBubble : null,
        ]}
      >
        {isImageAttachment ? (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.attachmentImage}
              resizeMode="cover"
            />
          </View>
        ) : (
          <Text style={[styles.messageText, isOutgoing ? styles.outgoingText : styles.incomingText]}>
            {message?.text}
          </Text>
        )}

        <View style={styles.metaRow}>
          <Text
            style={[
              styles.timestampText,
              isOutgoing ? styles.outgoingTimestamp : styles.incomingTimestamp,
            ]}
          >
            {formattedTime}
          </Text>
          {renderStatusTicks()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleContainer: {
    width: '100%',
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  outgoingContainer: {
    alignItems: 'flex-end',
  },
  incomingContainer: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 8,
    borderRadius: 18,
  },
  outgoingBubble: {
    backgroundColor: '#0284C7',
    borderBottomRightRadius: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  incomingBubble: {
    backgroundColor: '#1E293B',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  outgoingText: {
    color: '#FFFFFF',
  },
  incomingText: {
    color: '#F8FAFC',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  timestampText: {
    fontSize: 11,
  },
  outgoingTimestamp: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  incomingTimestamp: {
    color: '#94A3B8',
  },
  ticks: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '700',
    letterSpacing: -1.5,
  },
  imageBubble: {
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 6,
  },
  imageWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  attachmentImage: {
    width: 240,
    height: 180,
    borderRadius: 12,
    backgroundColor: '#0F172A',
  },
});
