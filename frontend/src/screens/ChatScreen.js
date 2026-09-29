import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Structural Placeholder: ChatScreen
 * Real-time WebSocket connection, message bubbles, and live chat composer
 * will be integrated into this screen during Phase 3C.
 */
export default function ChatScreen({ route }) {
  const { chatId, otherUser } = route.params || {};

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(otherUser?.username || '?').charAt(0).toUpperCase()}
          </Text>
        </View>

        <Text style={styles.chatTitle}>
          Chatting with: <Text style={styles.highlight}>{otherUser?.username || 'User'}</Text>
        </Text>

        <Text style={styles.chatIdText}>
          Chat Room ID: <Text style={styles.chatIdVal}>{chatId || 'N/A'}</Text>
        </Text>

        {otherUser?.contactNo ? (
          <Text style={styles.contactText}>Phone: {otherUser.contactNo}</Text>
        ) : null}

        <View style={styles.badgeContainer}>
          <Text style={styles.badgeText}>Phase 3C Real-Time Messaging Target</Text>
        </View>

        <Text style={styles.infoNotice}>
          Live full-duplex WebSocket messaging and conversation bubbles will be mounted here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  chatTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    textAlign: 'center',
  },
  highlight: {
    color: '#38BDF8',
  },
  chatIdText: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 4,
  },
  chatIdVal: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  contactText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  badgeContainer: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    marginVertical: 12,
  },
  badgeText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
  },
  infoNotice: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
  },
});
