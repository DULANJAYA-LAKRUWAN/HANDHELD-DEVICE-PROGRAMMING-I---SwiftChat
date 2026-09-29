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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Real-time Connection Status Banner */}
      {!isConnected && (
        <View style={styles.connectingBanner}>
          <ActivityIndicator size="small" color="#F59E0B" style={styles.bannerSpinner} />
          <Text style={styles.connectingBannerText}>Connecting to real-time chat server...</Text>
        </View>
      )}

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
        inverted
        contentContainerStyle={styles.messagesContainer}
        ListEmptyComponent={
          !isLoadingHistory ? (
            <View style={styles.emptyContainer}>
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {(otherUser?.username || '?').charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.emptyTitle}>
                Say hello to @{otherUser?.username || 'User'}!
              </Text>
              <Text style={styles.emptySubtitle}>
                No messages yet. Send a message below to start the conversation.
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
            Send
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
  connectingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(245, 158, 11, 0.3)',
  },
  bannerSpinner: {
    marginRight: 8,
  },
  connectingBannerText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: '#1E293B',
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 48,
    transform: [{ scaleY: -1 }], // Counteracts FlatList inverted orientation
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#0F172A',
    color: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendButton: {
    backgroundColor: '#0284C7',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  sendButtonTextDisabled: {
    color: '#64748B',
  },
});
