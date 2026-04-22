import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function PersonalDetailsScreen() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const [form, setForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    profileImageUrl: user?.profileImageUrl || '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const colors = {
    background: useThemeColor({}, 'background'),
    textPrimary: useThemeColor({}, 'text'),
    textSecondary: useThemeColor({ light: '#6A807D', dark: '#A3B1AE' }, 'icon'),
    card: useThemeColor({ light: '#FFFFFF', dark: '#1F2327' }, 'background'),
    border: useThemeColor({ light: '#DFE9E7', dark: '#33383D' }, 'icon'),
    accent: useThemeColor({ light: '#14988F', dark: '#48C4BA' }, 'tint'),
    accentSoft: useThemeColor({ light: '#E7F5F3', dark: '#293538' }, 'background'),
    input: useThemeColor({ light: '#F7FBFA', dark: '#252A2F' }, 'background'),
    overlay: 'rgba(7, 21, 19, 0.45)',
    danger: '#C13B3B',
    dangerSoft: '#FFF4F4',
    success: '#157A62',
  };

  useEffect(() => {
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      profileImageUrl: user?.profileImageUrl || '',
    });
  }, [user?.email, user?.fullName, user?.phoneNumber, user?.profileImageUrl]);

  const handleChange = (field: 'fullName' | 'email' | 'phoneNumber' | 'profileImageUrl', value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openEditModal = () => {
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      profileImageUrl: user?.profileImageUrl || '',
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsEditModalVisible(true);
  };

  const closeEditModal = () => {
    if (saving) {
      return;
    }

    setIsEditModalVisible(false);
  };

  const validateForm = () => {
    const fullName = form.fullName.trim();
    const email = form.email.trim();
    const phoneNumber = form.phoneNumber.trim();

    if (!fullName || !email || !phoneNumber) {
      return 'Full name, email, and phone number are required.';
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return 'Enter a valid email address.';
    }

    return null;
  };

  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage(null);
      return;
    }

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateProfile({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phoneNumber: form.phoneNumber.trim(),
        profileImageUrl: form.profileImageUrl.trim(),
      });
      setIsEditModalVisible(false);
      setSuccessMessage('Personal details updated successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update personal details');
    } finally {
      setSaving(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Delete account',
      'This will permanently remove your passenger account and saved data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            void handleDeleteAccount();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await deleteAccount();
      router.replace('/login');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete account');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.heroTopRow}>
              <View style={[styles.heroAvatar, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
                {user?.profileImageUrl ? (
                  <Image source={{ uri: user.profileImageUrl }} style={styles.heroAvatarImage} />
                ) : (
                  <Text style={[styles.heroAvatarInitials, { color: colors.accent }]}>
                    {(user?.fullName || 'Passenger')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() || '')
                      .join('') || 'P'}
                  </Text>
                )}
              </View>

              <View style={styles.heroIdentity}>
                <Text style={[styles.heroName, { color: colors.textPrimary }]}>{user?.fullName || 'Passenger'}</Text>
                <Text style={[styles.heroSubline, { color: colors.textSecondary }]}>
                  Passenger profile and recovery details
                </Text>
              </View>
            </View>

            <View style={[styles.heroBadge, { backgroundColor: colors.accentSoft }]}>
              <Ionicons name="shield-checkmark-outline" size={15} color={colors.accent} />
              <Text style={[styles.heroBadgeText, { color: colors.accent }]}>Account verified</Text>
            </View>

            <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
              Keep your details accurate for smooth bookings and secure account recovery.
            </Text>
          </View>

          {errorMessage ? <Text style={[styles.feedback, { color: colors.danger }]}>{errorMessage}</Text> : null}
          {successMessage ? <Text style={[styles.feedback, { color: colors.success }]}>{successMessage}</Text> : null}

          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PERSONAL DETAILS</Text>

          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.detailsHeader}>
              <View>
                <Text style={[styles.detailsTitle, { color: colors.textPrimary }]}>Account information</Text>
                <Text style={[styles.detailsHint, { color: colors.textSecondary }]}>
                  Review your current passenger profile details.
                </Text>
              </View>

              <Pressable
                style={[styles.compactEditButton, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}
                onPress={openEditModal}
                disabled={deleting}>
                <Ionicons name="create-outline" size={14} color={colors.accent} />
                <Text style={[styles.compactEditButtonText, { color: colors.accent }]}>Edit</Text>
              </Pressable>
            </View>

            <View style={[styles.inlineDivider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Full name</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.fullName || 'Not set'}</Text>
            </View>

            <View style={[styles.inlineDivider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.email || 'Not set'}</Text>
            </View>

            <View style={[styles.inlineDivider, { backgroundColor: colors.border }]} />

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Phone number</Text>
              <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{user?.phoneNumber || 'Not set'}</Text>
            </View>
          </View>

          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>DANGER ZONE</Text>

          <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.dangerCard, { backgroundColor: colors.dangerSoft, borderColor: '#F1D6D6' }]}>
              <View style={styles.dangerHeader}>
                <View style={[styles.dangerIconWrap, { backgroundColor: '#FFE9E9' }]}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                </View>

                <View style={styles.dangerTextWrap}>
                  <Text style={[styles.dangerTitle, { color: colors.danger }]}>Delete account</Text>
                  <Text style={[styles.dangerText, { color: colors.textSecondary }]}>
                    Permanently remove your passenger account and all saved profile data.
                  </Text>
                </View>
              </View>

              <Pressable
                style={[styles.deleteButton, deleting ? styles.buttonDisabled : null]}
                onPress={confirmDeleteAccount}
                disabled={saving || deleting}>
                <Text style={styles.deleteButtonText}>{deleting ? 'Deleting...' : 'Delete Account'}</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={isEditModalVisible} transparent animationType="fade" onRequestClose={closeEditModal}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <KeyboardAvoidingView
            style={styles.modalKeyboardWrap}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              style={styles.modalScroll}
              contentContainerStyle={styles.modalScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <View style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.modalHeader}>
                  <View>
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Update Personal Details</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      Edit your account info and save it securely.
                    </Text>
                  </View>

                  <Pressable style={styles.closeButton} onPress={closeEditModal} disabled={saving}>
                    <Ionicons name="close" size={20} color={colors.textPrimary} />
                  </Pressable>
                </View>

                {errorMessage ? <Text style={[styles.feedback, { color: colors.danger }]}>{errorMessage}</Text> : null}

                <View style={styles.avatarEditorWrap}>
                  <View style={[styles.modalAvatar, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
                    {form.profileImageUrl ? (
                      <Image source={{ uri: form.profileImageUrl }} style={styles.modalAvatarImage} />
                    ) : (
                      <Text style={[styles.modalAvatarInitials, { color: colors.accent }]}>
                        {(form.fullName || 'Passenger')
                          .split(' ')
                          .filter(Boolean)
                          .slice(0, 2)
                          .map((part) => part[0]?.toUpperCase() || '')
                          .join('') || 'P'}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.avatarEditorHint, { color: colors.textSecondary }]}>
                    Paste an image URL to update your profile icon.
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Profile image URL</Text>
                  <TextInput
                    value={form.profileImageUrl}
                    onChangeText={(value) => handleChange('profileImageUrl', value)}
                    placeholder="https://example.com/avatar.jpg"
                    placeholderTextColor={colors.textSecondary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full name</Text>
                  <TextInput
                    value={form.fullName}
                    onChangeText={(value) => handleChange('fullName', value)}
                    placeholder="Your full name"
                    placeholderTextColor={colors.textSecondary}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
                  <TextInput
                    value={form.email}
                    onChangeText={(value) => handleChange('email', value)}
                    placeholder="name@example.com"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone number</Text>
                  <TextInput
                    value={form.phoneNumber}
                    onChangeText={(value) => handleChange('phoneNumber', value)}
                    placeholder="Your phone number"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="phone-pad"
                    style={[
                      styles.input,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.secondaryButton, { borderColor: colors.border }]}
                    onPress={closeEditModal}
                    disabled={saving}>
                    <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.primaryButton,
                      styles.modalSubmitButton,
                      { backgroundColor: colors.accent },
                      saving ? styles.buttonDisabled : null,
                    ]}
                    onPress={() => {
                      void handleSave();
                    }}
                    disabled={saving}>
                    <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Update Details'}</Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardWrap: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  heroAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  heroAvatarImage: {
    width: '100%',
    height: '100%',
  },
  heroAvatarInitials: {
    fontSize: 18,
    fontWeight: '800',
  },
  heroIdentity: {
    flex: 1,
  },
  heroName: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroSubline: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroHint: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  feedback: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 2,
  },
  groupCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    padding: 12,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailsTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  detailsHint: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    maxWidth: 220,
  },
  compactEditButton: {
    minHeight: 34,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  compactEditButtonText: {
    fontSize: 12,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    minHeight: 22,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    flexShrink: 0,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  inlineDivider: {
    height: 1,
    marginVertical: 10,
  },
  inputGroup: {
    marginBottom: 10,
  },
  avatarEditorWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 8,
  },
  modalAvatarImage: {
    width: '100%',
    height: '100%',
  },
  modalAvatarInitials: {
    fontSize: 22,
    fontWeight: '800',
  },
  avatarEditorHint: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  modalSubmitButton: {
    marginTop: 0,
    flex: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  dangerCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  dangerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 12,
  },
  dangerIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerTextWrap: {
    flex: 1,
  },
  dangerTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  dangerText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  deleteButton: {
    minHeight: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C13B3B',
  },
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  modalKeyboardWrap: {
    width: '100%',
  },
  modalScroll: {
    width: '100%',
  },
  modalScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 3,
  },
  modalSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    maxWidth: 220,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});
