import React, { useState } from 'react';
import {
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
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import RefreshableScrollView from '@/components/RefreshableScrollView';
import { ProfileDetailsGroup } from '@/components/profile/profile-details-group';
import { useAuth } from '@/context/auth-context';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function PrivacySecurityScreen() {
  const { changePassword, loading } = useAuth();
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
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
    success: '#157A62',
    warning: '#A16207',
    warningSoft: '#FFF6E3',
  };

  const handleChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openPasswordModal = () => {
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsPasswordModalVisible(true);
  };

  const closePasswordModal = () => {
    if (loading) {
      return;
    }

    setIsPasswordModalVisible(false);
  };

  const validatePasswordForm = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmNewPassword) {
      return 'Please fill in all password fields.';
    }

    if (passwordForm.newPassword.length < 6) {
      return 'New password must be at least 6 characters long.';
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      return 'New password and confirmation do not match.';
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      return 'Choose a new password that is different from the current one.';
    }

    return null;
  };

  const submitPasswordChange = async () => {
    const validationError = validatePasswordForm();
    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage(null);
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      await changePassword(passwordForm);

      setIsPasswordModalVisible(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
      setSuccessMessage('Password updated successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update password');
    }
  };

  const privacyActions = [
    {
      title: 'Change password',
      subtitle: 'Update your sign-in password securely',
      icon: 'key-outline' as const,
      badge: 'Recommended',
      badgeTone: 'accent' as const,
      onPress: openPasswordModal,
    },
    {
      title: 'Two-factor authentication',
      subtitle: 'Add an extra verification step during sign in',
      icon: 'shield-checkmark-outline' as const,
      badge: 'Off',
      badgeTone: 'warning' as const,
    },
    {
      title: 'Download account data',
      subtitle: 'Export your rides, wallet history, and saved account info',
      icon: 'download-outline' as const,
    },
    {
      title: 'Blocked riders and contacts',
      subtitle: 'Review people you no longer want to interact with',
      icon: 'ban-outline' as const,
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <RefreshableScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable style={[styles.backButton, { borderColor: colors.border }]} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>Account Security</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroIcon, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
              <Ionicons name="shield-checkmark-outline" size={26} color={colors.accent} />
            </View>
            <View style={styles.heroIdentity}>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Account Protection</Text>
              <Text style={[styles.heroSubline, { color: colors.textSecondary }]}>
                Password, privacy, and trusted access settings.
              </Text>
            </View>
          </View>

          <View style={[styles.heroBadge, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colors.accent} />
            <Text style={[styles.heroBadgeText, { color: colors.accent }]}>Protection active</Text>
          </View>

          <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
            Review sign-in safety, data visibility, and trusted access across your NexGO account.
          </Text>

          <View style={[styles.heroDetailsCard, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
            <View style={styles.heroDetailRow}>
              <View style={styles.heroDetailLeft}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
                <Text style={[styles.heroDetailLabel, { color: colors.textPrimary }]}>Sign-in protection</Text>
              </View>
              <Text style={[styles.heroDetailValue, { color: colors.textSecondary }]}>Password and 2FA settings</Text>
            </View>

            <View style={[styles.heroInlineDivider, { backgroundColor: colors.border }]} />

            <View style={styles.heroDetailRow}>
              <View style={styles.heroDetailLeft}>
                <Ionicons name="notifications-outline" size={16} color={colors.accent} />
                <Text style={[styles.heroDetailLabel, { color: colors.textPrimary }]}>Security alerts</Text>
              </View>
              <Text style={[styles.heroDetailValue, { color: colors.textSecondary }]}>
                New login and account activity notices
              </Text>
            </View>

            <View style={[styles.heroInlineDivider, { backgroundColor: colors.border }]} />

            <View style={styles.heroDetailRow}>
              <View style={styles.heroDetailLeft}>
                <Ionicons name="document-text-outline" size={16} color={colors.accent} />
                <Text style={[styles.heroDetailLabel, { color: colors.textPrimary }]}>Privacy requests</Text>
              </View>
              <Text style={[styles.heroDetailValue, { color: colors.textSecondary }]}>
                Download data and manage blocked contacts
              </Text>
            </View>
          </View>
        </View>

        {errorMessage && !isPasswordModalVisible ? (
          <Text style={[styles.pageFeedback, { color: colors.danger }]}>{errorMessage}</Text>
        ) : null}
        {successMessage ? <Text style={[styles.pageFeedback, { color: colors.success }]}>{successMessage}</Text> : null}

        <ProfileDetailsGroup title="ACCOUNT SAFETY" actionRows={privacyActions} />
      </RefreshableScrollView>

      <Modal visible={isPasswordModalVisible} transparent animationType="fade" onRequestClose={closePasswordModal}>
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
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Change Password</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      Confirm your current password and set a new one for your account.
                    </Text>
                  </View>

                  <Pressable style={styles.closeButton} onPress={closePasswordModal} disabled={loading}>
                    <Ionicons name="close" size={20} color={colors.textPrimary} />
                  </Pressable>
                </View>

                {errorMessage ? <Text style={[styles.modalFeedback, { color: colors.danger }]}>{errorMessage}</Text> : null}

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Current password</Text>
                  <TextInput
                    value={passwordForm.currentPassword}
                    onChangeText={(value) => handleChange('currentPassword', value)}
                    placeholder="Enter current password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
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
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>New password</Text>
                  <TextInput
                    value={passwordForm.newPassword}
                    onChangeText={(value) => handleChange('newPassword', value)}
                    placeholder="Enter new password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
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
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Confirm new password</Text>
                  <TextInput
                    value={passwordForm.confirmNewPassword}
                    onChangeText={(value) => handleChange('confirmNewPassword', value)}
                    placeholder="Confirm new password"
                    placeholderTextColor={colors.textSecondary}
                    secureTextEntry
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

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.secondaryButton, { borderColor: colors.border }]}
                    onPress={closePasswordModal}
                    disabled={loading}>
                    <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.primaryButton,
                      { backgroundColor: colors.accent },
                      loading ? styles.buttonDisabled : null,
                    ]}
                    onPress={() => {
                      void submitPasswordChange();
                    }}
                    disabled={loading}>
                    <Text style={styles.primaryButtonText}>{loading ? 'Updating...' : 'Update Password'}</Text>
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
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  topBar: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  topBarSpacer: {
    width: 38,
    height: 38,
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
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIdentity: {
    flex: 1,
    minWidth: 0,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroSubline: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  heroHint: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  heroDetailsCard: {
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 14,
  },
  heroDetailRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  heroDetailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  heroDetailLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  heroDetailValue: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  heroInlineDivider: {
    height: 1,
    marginLeft: 12,
  },
  pageFeedback: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
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
    maxWidth: 230,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFeedback: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 10,
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
  primaryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.7,
  },
});
