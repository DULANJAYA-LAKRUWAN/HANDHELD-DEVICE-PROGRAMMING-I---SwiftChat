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
                  <TouchableOpacity
                    onPress={logout}
                    style={styles.headerButton}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.logoutText}>Sign Out</Text>
                  </TouchableOpacity>
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
  headerButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutText: {
    color: '#F87171',
    fontSize: 13,
    fontWeight: '600',
  },
});
