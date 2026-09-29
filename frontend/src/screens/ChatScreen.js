import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import ChatBubble from '../components/ChatBubble';

/**
 * Real-Time Chat Screen
 * Integrates live full-duplex WebSocket messaging with REST chat history.
 */
export default function ChatScreen({ route }) {
  const { chatId, otherUser } = route.params || {};
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');

  const {
    messages,
    sendMessage,
    isConnected,
    isLoadingHistory,
    error,
    refreshHistory,
  } = useChat(chatId, user?.id, otherUser?.id);

  const flatListRef = useRef(null);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || !isConnected) return;

    const sent = sendMessage(trimmed);
    if (sent) {
      setInputText('');
    }
  };

  const renderMessageItem = ({ item }) => {
    const isCurrentUser = Number(item.senderId) === Number(user?.id);
    return (
      <ChatBubble
        message={item}
        isCurrentUser={isCurrentUser}
        currentUserId={user?.id}
      />
    );
  };

  // For inverted FlatList: most recent message is at index 0 (bottom of screen)
  const reversedMessages = [...messages].reverse();
  const hasMessages = reversedMessages.length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Live Connection / Status Sub-Header */}
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, isConnected ? styles.dotOnline : styles.dotOffline]} />
        <Text style={[styles.statusText, isConnected ? styles.textOnline : styles.textOffline]}>
          {isConnected ? 'Real-Time WebSocket Connected' : 'Connecting to real-time server...'}
        </Text>
      </View>

      {/* Message History Loading Indicator */}
      {isLoadingHistory && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#38BDF8" />
          <Text style={styles.loadingText}>Loading conversation history...</Text>
        </View>
      )}

      {/* History Error Banner */}
      {error && (
        <TouchableOpacity
          style={styles.errorBanner}
          onPress={refreshHistory}
          activeOpacity={0.8}
        >
          <Text style={styles.errorBannerText}>{error} Tap to retry.</Text>
        </TouchableOpacity>
      )}

      {/* Message Stream */}
      <FlatList
        ref={flatListRef}
        data={reversedMessages}
        keyExtractor={(item, index) =>
          item.messageId ? item.messageId.toString() : `temp-${index}`
        }
        renderItem={renderMessageItem}
        inverted={hasMessages}
        contentContainerStyle={hasMessages ? styles.messagesContainer : styles.emptyContentContainer}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          !isLoadingHistory ? (
            <View style={styles.emptyContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {(otherUser?.username || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.emptyTitle}>
                Say hello to @{otherUser?.username || 'User'}! 👋
              </Text>
              <Text style={styles.emptySubtitle}>
                No messages yet. Send a message below to start the live conversation.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Composer Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor="#64748B"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!inputText.trim() || !isConnected) && styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={!inputText.trim() || !isConnected}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.sendButtonText,
              (!inputText.trim() || !isConnected) && styles.sendButtonTextDisabled,
            ]}
          >
            ➤
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  dotOnline: {
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  dotOffline: {
    backgroundColor: '#F59E0B',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textOnline: {
    color: '#86EFAC',
  },
  textOffline: {
    color: '#FCD34D',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 12,
    marginLeft: 8,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorBannerText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '500',
  },
  messagesContainer: {
    paddingVertical: 12,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  emptyContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 32,
  },
  avatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#0284C7',
    borderWidth: 3,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 14 : 20, // Prevents Android navigation bar collision
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 110,
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0284C7',
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
    elevation: 0,
    shadowOpacity: 0,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 18,
    marginLeft: 2, // Optical centering for arrow icon
  },
  sendButtonTextDisabled: {
    color: '#64748B',
  },
});
