import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function UserSearchScreen({ navigation }) {
  const { user } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Debounced user search
  const performSearch = useCallback(async (query) => {
    if (!user || !user.id) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const response = await api.searchUsers(query.trim(), user.id);
      if (response && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('User search error:', error);
      Alert.alert('Search Error', error.message || 'Failed to search registered users.');
    } finally {
      setIsSearching(false);
    }
  }, [user]);

  // Initial load of users & search debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, performSearch]);

  const handleSelectUser = async (targetUser) => {
    if (!user || !user.id || !targetUser || !targetUser.id) return;
    if (isConnecting) return;

    setIsConnecting(true);
    try {
      const response = await api.getOrCreateChat(user.id, targetUser.id);
      if (response && response.data) {
        const chatData = response.data;
        navigation.navigate('Chat', {
          chatId: chatData.chatId,
          otherUser: targetUser,
        });
      }
    } catch (error) {
      console.error('Failed to resolve chat session:', error);
      Alert.alert('Chat Error', error.message || 'Could not establish conversation channel.');
    } finally {
      setIsConnecting(false);
    }
  };

  const renderUserItem = ({ item }) => {
    const initial = (item.username || '?').charAt(0).toUpperCase();

    return (
      <TouchableOpacity
        style={styles.userCard}
        onPress={() => handleSelectUser(item)}
        activeOpacity={0.7}
        disabled={isConnecting}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.contactNo}>{item.contactNo || 'No contact provided'}</Text>
        </View>

        <Text style={styles.chatActionText}>Chat →</Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => {
    if (isSearching) return null;
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🔍</Text>
        <Text style={styles.emptyTitle}>
          {hasSearched && searchQuery.trim() ? 'No users found' : 'Find SwiftChat Users'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {hasSearched && searchQuery.trim()
            ? `No registered user matches "${searchQuery}".`
            : 'Type a username or phone number above to start a private conversation.'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username or contact number..."
          placeholderTextColor="#64748B"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {/* Loading Overlay when establishing chat channel */}
      {isConnecting ? (
        <View style={styles.connectingBanner}>
          <ActivityIndicator size="small" color="#38BDF8" style={{ marginRight: 8 }} />
          <Text style={styles.connectingText}>Opening conversation channel...</Text>
        </View>
      ) : null}

      {/* Search Results List */}
      {isSearching && users.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#38BDF8" />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUserItem}
          contentContainerStyle={users.length === 0 ? styles.emptyListContent : styles.listContent}
          ListEmptyComponent={renderEmptyComponent}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  searchInput: {
    height: 46,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#334155',
  },
  connectingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderBottomWidth: 1,
    borderBottomColor: '#0284C7',
  },
  connectingText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 10,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  userCard: {
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0369A1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  contactNo: {
    fontSize: 13,
    color: '#94A3B8',
  },
  chatActionText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
