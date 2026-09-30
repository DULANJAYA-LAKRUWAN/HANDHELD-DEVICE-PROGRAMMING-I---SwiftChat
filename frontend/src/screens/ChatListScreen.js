import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { formatChatListDate } from '../utils/formatDate';

export default function ChatListScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [chats, setChats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchChats = useCallback(async (isRefresh = false) => {
    if (!user || !user.id) return;
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const response = await api.getUserChats(user.id);
      if (response && response.data) {
        setChats(response.data);
      }
    } catch (error) {
      console.error('Failed to load chat channels:', error);
      Alert.alert('Error', 'Unable to fetch conversations. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // Refresh conversation list every time screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [fetchChats])
  );

  const handleOpenChat = (chatItem) => {
    navigation.navigate('Chat', {
      chatId: chatItem.chatId,
      otherUser: chatItem.otherUser,
    });
  };

  const renderChatItem = ({ item }) => {
    const partnerName = item.otherUser ? item.otherUser.username : 'Unknown User';
    const initial = partnerName.charAt(0).toUpperCase();
    let lastMsg = 'No messages yet';
    if (item.lastMessage && item.lastMessage.text) {
      if (item.lastMessage.text.startsWith('[IMAGE]:')) {
        lastMsg = '📷 Photo';
      } else {
        lastMsg = item.lastMessage.text;
      }
    }
    const rawTimestamp = item.lastMessage ? item.lastMessage.timestamp : item.createdAt;
    const timestamp = formatChatListDate(rawTimestamp);

    const unreadCount = item.unreadCount || 0;
    const hasUnread = unreadCount > 0;

    // Check if the current user authored the latest message
    const isOutgoing =
      item.lastMessage &&
      user?.id &&
      Number(item.lastMessage.senderId) === Number(user.id);

    const isRead = item.lastMessage?.status === 'READ';
    const isDelivered = item.lastMessage?.status === 'DELIVERED';
    const tickColor = isRead ? '#38BDF8' : '#94A3B8';
    const tickText = isRead || isDelivered ? '✓✓' : '✓';

    return (
      <TouchableOpacity
        style={[styles.chatCard, hasUnread ? styles.unreadChatCard : null]}
        onPress={() => handleOpenChat(item)}
        activeOpacity={0.7}
      >
        {/* User Avatar Initial */}
        <View style={[styles.avatar, hasUnread ? styles.unreadAvatar : null]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        {/* Conversation Metadata */}
        <View style={styles.chatInfo}>
          <View style={styles.chatHeaderRow}>
            <Text
              style={[styles.partnerName, hasUnread ? styles.unreadPartnerName : null]}
              numberOfLines={1}
            >
              {partnerName}
            </Text>
            <Text
              style={[styles.timestampText, hasUnread ? styles.unreadTimestampText : null]}
            >
              {timestamp}
            </Text>
          </View>

          <View style={styles.chatPreviewRow}>
            <View style={styles.messagePreviewContainer}>
              {isOutgoing && (
                <Text style={[styles.previewTick, { color: tickColor }]}>
                  {tickText}{' '}
                </Text>
              )}
              <Text
                style={[
                  styles.lastMessageText,
                  hasUnread ? styles.unreadMessageText : null,
                ]}
                numberOfLines={1}
              >
                {lastMsg}
              </Text>
            </View>

            {hasUnread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => {
    if (isLoading) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>💬</Text>
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptySubtitle}>
          Tap the '+' button below to search for users and start chatting!
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Loading Indicator */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38BDF8" />
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.chatId.toString()}
          renderItem={renderChatItem}
          contentContainerStyle={chats.length === 0 ? styles.emptyListContent : styles.listContent}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => fetchChats(true)}
              tintColor="#38BDF8"
              colors={['#38BDF8']}
            />
          }
        />
      )}

      {/* Floating Action Button (FAB) to navigate to User Search */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('UserSearch')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 12,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  chatInfo: {
    flex: 1,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    flex: 1,
    marginRight: 8,
  },
  timestampText: {
    fontSize: 12,
    color: '#64748B',
  },
  unreadTimestampText: {
    color: '#22C55E',
    fontWeight: '700',
  },
  unreadPartnerName: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  chatPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 3,
  },
  messagePreviewContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  previewTick: {
    fontSize: 13,
    fontWeight: '700',
    marginRight: 3,
    letterSpacing: -1.5,
  },
  lastMessageText: {
    fontSize: 14,
    color: '#94A3B8',
    flex: 1,
  },
  unreadMessageText: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  unreadChatCard: {
    borderColor: '#38BDF8',
    borderWidth: 1.2,
  },
  unreadAvatar: {
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  unreadBadge: {
    backgroundColor: '#22C55E',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 4,
    elevation: 4,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: Platform.OS === 'android' ? 32 : 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 34,
  },
});
