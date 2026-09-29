import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * Structural Placeholder: UserSearchScreen
 * Contact search to discover registered users will be implemented in Phase 2.
 */
export default function UserSearchScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find Users</Text>
      <Text style={styles.subtitle}>User search placeholder</Text>
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
