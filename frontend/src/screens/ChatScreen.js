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
  Modal,
  StyleSheet,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import ChatBubble from '../components/ChatBubble';
import { formatDateDivider, parseDate } from '../utils/formatDate';

const ATTACHMENT_PRESETS = [
  { label: '🌿 Nature Scenic', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800' },
  { label: '💻 Workspace', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800' },
  { label: '🌆 Cityscape', url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?w=800' },
  { label: '☕ Coffee Lounge', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800' },
];

/**
 * Real-Time Chat Screen
 * Integrates live full-duplex WebSocket messaging with REST chat history.
 */
export default function ChatScreen({ route }) {
  const { chatId, otherUser } = route.params || {};
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const [isAttachmentModalVisible, setIsAttachmentModalVisible] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

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

  const handleSendImage = (url) => {
    if (!url || !url.trim() || !isConnected) return;
    sendMessage(`[IMAGE]:${url.trim()}`);
    setIsAttachmentModalVisible(false);
    setCustomImageUrl('');
  };

  // For inverted FlatList: most recent message is at index 0 (bottom of screen)
  const reversedMessages = [...messages].reverse();
  const hasMessages = reversedMessages.length > 0;

  const renderMessageItem = ({ item, index }) => {
    const isCurrentUser = Number(item.senderId) === Number(user?.id);

    // Calculate if date divider should be displayed
    const currentDate = parseDate(item.timestamp);
    const nextItem = reversedMessages[index + 1];
    let showDateDivider = false;

    if (!nextItem) {
      // Oldest message (top of chat) starts a date group
      showDateDivider = true;
    } else {
      const prevDate = parseDate(nextItem.timestamp);
      if (
        currentDate &&
        prevDate &&
        (currentDate.getFullYear() !== prevDate.getFullYear() ||
          currentDate.getMonth() !== prevDate.getMonth() ||
          currentDate.getDate() !== prevDate.getDate())
      ) {
        showDateDivider = true;
      }
    }

    return (
      <View>
        {showDateDivider && (
          <View style={styles.dateDividerContainer}>
            <View style={styles.dateDividerPill}>
              <Text style={styles.dateDividerText}>
                {formatDateDivider(item.timestamp)}
              </Text>
            </View>
          </View>
        )}
        <ChatBubble
          message={item}
          isCurrentUser={isCurrentUser}
          currentUserId={user?.id}
        />
      </View>
    );
  };

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
        <TouchableOpacity
          style={styles.attachmentButton}
          onPress={() => setIsAttachmentModalVisible(true)}
          disabled={!isConnected}
          activeOpacity={0.7}
        >
          <Text style={styles.attachmentIcon}>📎</Text>
        </TouchableOpacity>

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

      {/* Media Attachment Modal */}
      <Modal
        visible={isAttachmentModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAttachmentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.attachmentModalCard}>
            <Text style={styles.attachmentModalTitle}>Share Media / Photo</Text>
            <Text style={styles.attachmentModalSubtitle}>
              Select a photo preset or paste a direct image URL:
            </Text>

            <View style={styles.presetGrid}>
              {ATTACHMENT_PRESETS.map((preset, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.presetButton}
                  onPress={() => handleSendImage(preset.url)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.presetButtonText}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.urlInputRow}>
              <TextInput
                style={styles.urlInput}
                placeholder="https://example.com/photo.jpg"
                placeholderTextColor="#64748B"
                value={customImageUrl}
                onChangeText={setCustomImageUrl}
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={[
                  styles.sendUrlButton,
                  !customImageUrl.trim() && styles.sendButtonDisabled,
                ]}
                onPress={() => handleSendImage(customImageUrl)}
                disabled={!customImageUrl.trim()}
              >
                <Text style={styles.sendUrlButtonText}>Send</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsAttachmentModalVisible(false)}
            >
              <Text style={styles.modalCloseText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  dateDividerContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateDividerPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 2,
  },
  dateDividerText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  attachmentButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  attachmentIcon: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  attachmentModalCard: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  attachmentModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  attachmentModalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  presetButton: {
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  presetButtonText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  urlInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  urlInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 14,
  },
  sendUrlButton: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendUrlButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalCloseButton: {
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalCloseText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
});
