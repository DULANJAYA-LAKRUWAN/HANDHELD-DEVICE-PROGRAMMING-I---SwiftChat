import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAuth } from '../context/AuthContext';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ChatListScreen from '../screens/ChatListScreen';
import UserSearchScreen from '../screens/UserSearchScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, isLoading, logout } = useAuth();

  // Loading state while restoring stored session from AsyncStorage on startup
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#0F172A',
          },
          headerTintColor: '#F8FAFC',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
          contentStyle: {
            backgroundColor: '#0F172A',
          },
        }}
      >
        {user ? (
          // Main authenticated stack
          <Stack.Group>
            <Stack.Screen
              name="ChatList"
              component={ChatListScreen}
              options={({ navigation }) => ({
                title: 'SwiftChat',
                headerBackVisible: false,
                headerRight: () => (
                  <View style={styles.headerActions}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate('Profile')}
                      style={styles.headerAvatarButton}
                      activeOpacity={0.7}
                    >
                      <View style={styles.headerAvatar}>
                        <Text style={styles.headerAvatarInitial}>
                          {(user?.username || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => navigation.navigate('Settings')}
                      style={styles.headerIconButton}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.headerIcon}>⚙️</Text>
                    </TouchableOpacity>
                  </View>
                ),
              })}
            />
            <Stack.Screen
              name="UserSearch"
              component={UserSearchScreen}
              options={{
                title: 'New Conversation',
              }}
            />
            <Stack.Screen
              name="Chat"
              component={ChatScreen}
              options={({ route }) => ({
                title: route.params?.otherUser?.username
                  ? `@${route.params.otherUser.username}`
                  : 'Conversation',
              })}
            />
            <Stack.Screen
              name="Profile"
              component={ProfileScreen}
              options={{
                title: 'My Profile',
              }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{
                title: 'Settings',
              }}
            />
          </Stack.Group>
        ) : (
          // Unauthenticated Auth stack
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerAvatarButton: {
    padding: 2,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
  },
  headerAvatarInitial: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  headerIconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerIcon: {
    fontSize: 16,
  },
});
