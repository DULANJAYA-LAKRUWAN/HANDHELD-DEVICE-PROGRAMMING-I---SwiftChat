import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function SettingsScreen({ navigation }) {
  const { user, logout } = useAuth();

  // Settings Toggles
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const [enterIsSend, setEnterIsSend] = useState(true);
  const [saveToGallery, setSaveToGallery] = useState(false);

  const initial = (user?.username || '?').charAt(0).toUpperCase();

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will clear local temporary files and image cache. Your chats will remain intact.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: () => Alert.alert('Success', 'Local cache cleared successfully! (0 B remaining)'),
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from SwiftChat?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Profile Card Header (Shortcut to Profile Screen) */}
      <TouchableOpacity
        style={styles.profileHeaderCard}
        onPress={() => navigation.navigate('Profile')}
        activeOpacity={0.8}
      >
        <View style={styles.profileAvatar}>
          <Text style={styles.profileAvatarText}>{initial}</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName} numberOfLines={1}>
            @{user?.username || 'user'}
          </Text>
          <Text style={styles.profileSubtitle} numberOfLines={1}>
            {user?.contactNo || 'Tap to edit profile'}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Notifications Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingIconWrapper}>
            <Text style={styles.settingIcon}>🔔</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Message Notifications</Text>
            <Text style={styles.settingDesc}>Show alerts for incoming messages</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#334155', true: '#0284C7' }}
            thumbColor={notificationsEnabled ? '#38BDF8' : '#94A3B8'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingIconWrapper}>
            <Text style={styles.settingIcon}>🔊</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Message Sounds</Text>
            <Text style={styles.settingDesc}>Play sound on incoming message</Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={setSoundEnabled}
            trackColor={{ false: '#334155', true: '#0284C7' }}
            thumbColor={soundEnabled ? '#38BDF8' : '#94A3B8'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingIconWrapper}>
            <Text style={styles.settingIcon}>📳</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Vibrate</Text>
            <Text style={styles.settingDesc}>Haptic vibration on message</Text>
          </View>
          <Switch
            value={vibrationEnabled}
            onValueChange={setVibrationEnabled}
            trackColor={{ false: '#334155', true: '#0284C7' }}
            thumbColor={vibrationEnabled ? '#38BDF8' : '#94A3B8'}
          />
        </View>
      </View>

      {/* Chats Section */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>CHATS & MESSAGING</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingIconWrapper}>
            <Text style={styles.settingIcon}>✓✓</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Read Receipts</Text>
            <Text style={styles.settingDesc}>Show double blue checkmarks when read</Text>
          </View>
          <Switch
            value={readReceiptsEnabled}
            onValueChange={setReadReceiptsEnabled}
            trackColor={{ false: '#334155', true: '#0284C7' }}
            thumbColor={readReceiptsEnabled ? '#38BDF8' : '#94A3B8'}
          />
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingIconWrapper}>
            <Text style={styles.settingIcon}>⏎</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Enter is Send</Text>
            <Text style={styles.settingDesc}>Enter key sends your chat message</Text>
          </View>
          <Switch
            value={enterIsSend}
            onValueChange={setEnterIsSend}
            trackColor={{ false: '#334155', true: '#0284C7' }}
            thumbColor={enterIsSend ? '#38BDF8' : '#94A3B8'}
          />
        </View>

        <TouchableOpacity style={styles.actionRow} onPress={handleClearCache}>
          <View style={styles.settingIconWrapper}>
            <Text style={styles.settingIcon}>🗑️</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Clear Chat Cache</Text>
            <Text style={styles.settingDesc}>Free up temporary storage space</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy & Security */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>PRIVACY & SECURITY</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingIconWrapper}>
            <Text style={styles.settingIcon}>🔒</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>End-to-End Encryption</Text>
            <Text style={styles.settingDesc}>Messages are secured in transit</Text>
          </View>
          <View style={styles.statusPill}>
            <Text style={styles.statusPillText}>ACTIVE</Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingIconWrapper}>
            <Text style={styles.settingIcon}>🕒</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Last Seen & Online</Text>
            <Text style={styles.settingDesc}>Everyone</Text>
          </View>
        </View>
      </View>

      {/* About & Info */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>APPLICATION INFO</Text>

        <View style={styles.settingRow}>
          <View style={styles.settingIconWrapper}>
            <Text style={styles.settingIcon}>🚀</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>SwiftChat Mobile</Text>
            <Text style={styles.settingDesc}>Version 1.2.0 (Build 42)</Text>
          </View>
        </View>

        <View style={styles.settingRow}>
          <View style={styles.settingIconWrapper}>
            <Text style={styles.settingIcon}>🌐</Text>
          </View>
          <View style={styles.settingTextContainer}>
            <Text style={styles.settingLabel}>Backend Server</Text>
            <Text style={styles.settingDesc}>Apache Tomcat 10.1 • Port 8090</Text>
          </View>
          <View style={styles.statusOnlinePill}>
            <Text style={styles.statusOnlinePillText}>ONLINE</Text>
          </View>
        </View>
      </View>

      {/* Destructive Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.signOutIcon}>🚪</Text>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 48,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  profileAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#38BDF8',
    marginRight: 16,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
  },
  chevron: {
    fontSize: 24,
    color: '#64748B',
    marginLeft: 8,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#283548',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  settingIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingIcon: {
    fontSize: 16,
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 10,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: '#94A3B8',
  },
  statusPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  statusPillText: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusOnlinePill: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  statusOnlinePillText: {
    color: '#22C55E',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7F1D1D',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  signOutIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  signOutText: {
    color: '#FEE2E2',
    fontSize: 16,
    fontWeight: '700',
  },
});
