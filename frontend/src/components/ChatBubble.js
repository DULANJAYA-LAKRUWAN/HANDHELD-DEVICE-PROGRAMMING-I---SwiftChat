import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Structural Placeholder: ChatBubble component
 * Renders individual incoming and outgoing message bubbles.
 */
export default function ChatBubble({ message, isCurrentUser }) {
  return (
    <View style={[styles.bubble, isCurrentUser ? styles.outgoing : styles.incoming]}>
      <Text style={styles.text}>{message?.text || 'Message'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  outgoing: {
    alignSelf: 'flex-end',
    backgroundColor: '#0284C7',
  },
  incoming: {
    alignSelf: 'flex-start',
    backgroundColor: '#1E293B',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
  },
});
