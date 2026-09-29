import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { parseDate } from '../utils/formatDate';

const STATUS_PRESETS = [
  'Available 🟢',
  'Busy 🔴',
  'At work 💼',
  'In a meeting 🤝',
  'Battery about to die 🪫',
  'Urgent calls only 📞',
  'Hey there! I am using SwiftChat 🚀',
];

export default function ProfileScreen({ navigation }) {
  const { user, updateUser, logout } = useAuth();

  const [isEditingContact, setIsEditingContact] = useState(false);
  const [newContact, setNewContact] = useState(user?.contactNo || '');
  const [isSaving, setIsSaving] = useState(false);

  const [statusText, setStatusText] = useState(
    user?.status || 'Hey there! I am using SwiftChat 🚀'
  );
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [customStatusInput, setCustomStatusInput] = useState(statusText);

  const initial = (user?.username || '?').charAt(0).toUpperCase();

  // Format account creation date
  const joinedDate = parseDate(user?.createdAt);
  const formattedJoined = joinedDate
    ? joinedDate.toLocaleDateString([], {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'September 2026';

  const handleSaveContact = async () => {
    const trimmed = newContact.trim();
    if (!trimmed) {
      Alert.alert('Validation Error', 'Contact number cannot be empty.');
      return;
    }
    if (trimmed === user?.contactNo) {
      setIsEditingContact(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await api.updateUserProfile(user.id, {
        contactNo: trimmed,
      });
      if (response && response.data) {
        await updateUser({ contactNo: trimmed });
        Alert.alert('Success', 'Contact number updated successfully.');
        setIsEditingContact(false);
      } else {
        Alert.alert('Notice', response?.message || 'Updated profile.');
      }
    } catch (error) {
      Alert.alert('Update Failed', error.message || 'Could not update contact number.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectStatus = async (selectedStatus) => {
    setStatusText(selectedStatus);
    await updateUser({ status: selectedStatus });
    setIsEditingStatus(false);
  };

  const handleSaveCustomStatus = async () => {
    const trimmed = customStatusInput.trim();
    if (!trimmed) return;
    setStatusText(trimmed);
    await updateUser({ status: trimmed });
    setIsEditingStatus(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Hero Avatar Header */}
      <View style={styles.heroSection}>
        <View style={styles.avatarWrapper}>
          <View style={styles.largeAvatar}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
          <TouchableOpacity
            style={styles.cameraBadge}
            activeOpacity={0.8}
            onPress={() => Alert.alert('Profile Photo', 'Photo upload feature is coming in next release!')}
          >
            <Text style={styles.cameraIcon}>📷</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.usernameText}>@{user?.username || 'user'}</Text>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedCheck}>✓</Text>
          <Text style={styles.verifiedText}>Verified SwiftChat User</Text>
        </View>
      </View>

      {/* Profile Details Cards */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>ABOUT & STATUS</Text>
        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => setIsEditingStatus(true)}
          activeOpacity={0.7}
        >
          <View style={styles.infoIconWrapper}>
            <Text style={styles.infoIcon}>💬</Text>
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={styles.infoValue}>{statusText}</Text>
          </View>
          <Text style={styles.editChevron}>✏️</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>CONTACT DETAILS</Text>
        
        {/* Phone number */}
        <TouchableOpacity
          style={styles.infoRow}
          onPress={() => {
            setNewContact(user?.contactNo || '');
            setIsEditingContact(true);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.infoIconWrapper}>
            <Text style={styles.infoIcon}>📱</Text>
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Phone Number</Text>
            <Text style={styles.infoValue}>{user?.contactNo || 'Not provided'}</Text>
          </View>
          <Text style={styles.editChevron}>✏️</Text>
        </TouchableOpacity>

        {/* Username */}
        <View style={styles.infoRow}>
          <View style={styles.infoIconWrapper}>
            <Text style={styles.infoIcon}>👤</Text>
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>@{user?.username}</Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionHeader}>ACCOUNT INFO</Text>

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrapper}>
            <Text style={styles.infoIcon}>🆔</Text>
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>User ID</Text>
            <Text style={styles.infoValue}>#UID-{user?.id || '0000'}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoIconWrapper}>
            <Text style={styles.infoIcon}>📅</Text>
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>{formattedJoined}</Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonGroup}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonIcon}>⚙️</Text>
          <Text style={styles.secondaryButtonText}>App Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareProfileButton}
          onPress={() => Alert.alert('Share Profile', `Share your SwiftChat handle @${user?.username} with friends!`)}
          activeOpacity={0.8}
        >
          <Text style={styles.shareProfileIcon}>🔗</Text>
          <Text style={styles.shareProfileText}>Share Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Edit Contact Modal */}
      <Modal
        visible={isEditingContact}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditingContact(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Update Phone Number</Text>
            <Text style={styles.modalSubtitle}>
              Enter your updated contact number below.
            </Text>

            <TextInput
              style={styles.modalInput}
              value={newContact}
              onChangeText={setNewContact}
              placeholder="e.g. 0771234567"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              autoFocus
            />

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setIsEditingContact(false)}
                disabled={isSaving}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={handleSaveContact}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Status Modal */}
      <Modal
        visible={isEditingStatus}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEditingStatus(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Status</Text>
            <Text style={styles.modalSubtitle}>
              Choose a preset or type your own custom status:
            </Text>

            <TextInput
              style={styles.modalInput}
              value={customStatusInput}
              onChangeText={setCustomStatusInput}
              placeholder="Type custom status..."
              placeholderTextColor="#64748B"
            />

            <TouchableOpacity
              style={styles.customStatusSaveBtn}
              onPress={handleSaveCustomStatus}
            >
              <Text style={styles.customStatusSaveText}>Set Custom Status</Text>
            </TouchableOpacity>

            <View style={styles.statusPresetList}>
              {STATUS_PRESETS.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.presetItem}
                  onPress={() => handleSelectStatus(item)}
                >
                  <Text style={styles.presetText}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setIsEditingStatus(false)}
            >
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingTop: 24,
    paddingBottom: 48,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  largeAvatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#0284C7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#38BDF8',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '800',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#0F172A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraIcon: {
    fontSize: 16,
  },
  usernameText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  verifiedCheck: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '900',
    marginRight: 4,
  },
  verifiedText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '600',
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
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#283548',
  },
  infoIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  infoIcon: {
    fontSize: 18,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F8FAFC',
  },
  editChevron: {
    fontSize: 14,
    color: '#94A3B8',
    marginLeft: 8,
  },
  buttonGroup: {
    marginTop: 8,
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  secondaryButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  secondaryButtonText: {
    color: '#38BDF8',
    fontSize: 16,
    fontWeight: '700',
  },
  shareProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    borderRadius: 14,
    paddingVertical: 14,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  shareProfileIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  shareProfileText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
    color: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  modalCancelText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  modalSaveButton: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    minWidth: 80,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  customStatusSaveBtn: {
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 14,
  },
  customStatusSaveText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  statusPresetList: {
    marginBottom: 12,
  },
  presetItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#283548',
  },
  presetText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '500',
  },
});
