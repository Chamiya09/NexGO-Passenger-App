import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
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
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
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
    danger: '#C13B3B',
    dangerSoft: '#FFF4F4',
    success: '#157A62',
  };

  useEffect(() => {
    setForm({
      fullName: user?.fullName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
    });
  }, [user?.email, user?.fullName, user?.phoneNumber]);

  const handleChange = (field: 'fullName' | 'email' | 'phoneNumber', value: string) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
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
      });
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

            <Pressable
              style={[
                styles.primaryButton,
                { backgroundColor: colors.accent },
                saving ? styles.buttonDisabled : null,
              ]}
              onPress={() => {
                void handleSave();
              }}
              disabled={saving || deleting}>
              <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Update Details'}</Text>
            </Pressable>
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
    padding: 20,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
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
  heroHint: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  feedback: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 8,
    marginTop: 4,
  },
  groupCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
    padding: 14,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
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
    padding: 14,
  },
  dangerHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
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
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  dangerText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  deleteButton: {
    minHeight: 46,
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
});
