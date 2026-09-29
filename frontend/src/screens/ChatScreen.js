import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Structural Placeholder: ChatScreen
 * Real-time private chat messages via WebSocket will be implemented in Phase 2.
 */
export default function ChatScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conversation</Text>
      <Text style={styles.subtitle}>1-on-1 chat window placeholder</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
});
