import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import { API_BASE_URL, parseApiResponse } from '@/lib/api';
import { useThemeColor } from '@/hooks/use-theme-color';

type AddressLabel = 'Home' | 'Work' | 'Other';

type SavedAddress = {
  _id: string;
  label: AddressLabel;
  title: string;
  addressLine: string;
  note: string;
  isDefault: boolean;
};

const initialForm = {
  title: '',
  addressLine: '',
  note: '',
  label: 'Other' as AddressLabel,
  isDefault: false,
};

const labelIconMap: Record<AddressLabel, keyof typeof Ionicons.glyphMap> = {
  Home: 'home-outline',
  Work: 'briefcase-outline',
  Other: 'location-outline',
};

export default function SavedAddressesScreen() {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [form, setForm] = useState(initialForm);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingDefaultId, setUpdatingDefaultId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const colors = {
    background: useThemeColor({}, 'background'),
    textPrimary: useThemeColor({}, 'text'),
    textSecondary: useThemeColor({ light: '#6A807D', dark: '#A3B1AE' }, 'icon'),
    card: useThemeColor({ light: '#FFFFFF', dark: '#1F2327' }, 'background'),
    border: useThemeColor({ light: '#DFE9E7', dark: '#33383D' }, 'icon'),
    divider: useThemeColor({ light: '#EAF0EF', dark: '#3A4147' }, 'icon'),
    accent: useThemeColor({ light: '#14988F', dark: '#48C4BA' }, 'tint'),
    accentSoft: useThemeColor({ light: '#E7F5F3', dark: '#293538' }, 'background'),
    input: useThemeColor({ light: '#F7FBFA', dark: '#252A2F' }, 'background'),
    overlay: 'rgba(7, 21, 19, 0.45)',
    success: '#157A62',
    warning: '#D88B21',
    warningSoft: '#FFF5E4',
    danger: '#C13B3B',
  };

  useEffect(() => {
    const loadSavedAddresses = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/saved-addresses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await parseApiResponse<{ savedAddresses: SavedAddress[] }>(response);
        setAddresses(data.savedAddresses);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Unable to load saved addresses');
      } finally {
        setLoading(false);
      }
    };

    void loadSavedAddresses();
  }, [token]);

  const openAddModal = () => {
    setForm({
      ...initialForm,
      isDefault: addresses.length === 0,
    });
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsModalVisible(true);
  };

  const closeAddModal = () => {
    if (saving) {
      return;
    }

    setIsModalVisible(false);
    setForm(initialForm);
  };

  const handleChange = (field: keyof typeof initialForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!form.title.trim() || !form.addressLine.trim()) {
      return 'Address title and location are required.';
    }

    return null;
  };

  const saveAddress = async () => {
    if (!token) {
      setErrorMessage('You need to be logged in to save an address.');
      return;
    }

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
      const response = await fetch(`${API_BASE_URL}/auth/saved-addresses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          label: form.label,
          title: form.title.trim(),
          addressLine: form.addressLine.trim(),
          note: form.note.trim(),
          isDefault: form.isDefault,
        }),
      });

      const data = await parseApiResponse<{ savedAddresses: SavedAddress[] }>(response);
      setAddresses(data.savedAddresses);
      setSuccessMessage('Saved address added successfully.');
      setIsModalVisible(false);
      setForm(initialForm);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save address');
    } finally {
      setSaving(false);
    }
  };

  const markAsDefault = async (addressId: string) => {
    if (!token) {
      setErrorMessage('You need to be logged in to update a saved address.');
      return;
    }

    setUpdatingDefaultId(addressId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/saved-addresses/${addressId}/default`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseApiResponse<{ savedAddresses: SavedAddress[] }>(response);
      setAddresses(data.savedAddresses);
      setSuccessMessage('Default pickup address updated.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update default address');
    } finally {
      setUpdatingDefaultId(null);
    }
  };

  const deleteAddress = async (addressId: string) => {
    if (!token) {
      setErrorMessage('You need to be logged in to delete a saved address.');
      return;
    }

    setDeletingId(addressId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/saved-addresses/${addressId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseApiResponse<{ savedAddresses: SavedAddress[] }>(response);
      setAddresses(data.savedAddresses);
      setSuccessMessage('Saved address removed.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to delete saved address');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroBadge, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="navigate-outline" size={15} color={colors.accent} />
            <Text style={[styles.heroBadgeText, { color: colors.accent }]}>Faster pickups</Text>
          </View>

          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Saved Addresses</Text>
          <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
            Keep your most-used places ready for one-tap ride booking and smoother pickups.
          </Text>

          <View style={[styles.tipCard, { backgroundColor: colors.warningSoft, borderColor: '#F4DFB8' }]}>
            <Ionicons name="flash-outline" size={16} color={colors.warning} />
            <Text style={[styles.tipText, { color: colors.textPrimary }]}>
              Set one default address to speed up your next booking flow.
            </Text>
          </View>
        </View>

        {errorMessage ? <Text style={[styles.pageFeedback, { color: colors.danger }]}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={[styles.pageFeedback, { color: colors.success }]}>{successMessage}</Text> : null}

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SAVED PLACES</Text>
          <Pressable style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={openAddModal}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Address</Text>
          </Pressable>
        </View>

        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {loading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading saved addresses...</Text>
            </View>
          ) : addresses.length === 0 ? (
            <View style={styles.emptyStateWrap}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="location-outline" size={22} color={colors.accent} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>No saved places yet</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Add your home, work, or favorite pickup points for faster ride requests.
              </Text>
            </View>
          ) : (
            addresses.map((address, index) => {
              const isUpdatingDefault = updatingDefaultId === address._id;
              const isDeleting = deletingId === address._id;

              return (
                <View key={address._id}>
                  <View style={styles.addressRow}>
                    <View style={styles.rowLeft}>
                      <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                        <Ionicons name={labelIconMap[address.label]} size={16} color={colors.accent} />
                      </View>

                      <View style={styles.addressTextWrap}>
                        <View style={styles.addressTitleRow}>
                          <Text style={[styles.addressTitle, { color: colors.textPrimary }]}>{address.title}</Text>
                          {address.isDefault ? (
                            <View style={[styles.defaultPill, { backgroundColor: colors.accentSoft }]}>
                              <Text style={[styles.defaultPillText, { color: colors.accent }]}>Default</Text>
                            </View>
                          ) : null}
                        </View>

                        <Text style={[styles.addressMeta, { color: colors.textSecondary }]}>{address.label}</Text>
                        <Text style={[styles.addressLine, { color: colors.textPrimary }]}>{address.addressLine}</Text>
                        {address.note ? (
                          <Text style={[styles.addressNote, { color: colors.textSecondary }]}>{address.note}</Text>
                        ) : null}
                      </View>
                    </View>

                    <View style={styles.rowRight}>
                      {!address.isDefault ? (
                        <Pressable
                          style={[styles.inlineActionButton, { borderColor: colors.border }]}
                          onPress={() => {
                            void markAsDefault(address._id);
                          }}
                          disabled={isUpdatingDefault || isDeleting}>
                          {isUpdatingDefault ? (
                            <ActivityIndicator size="small" color={colors.accent} />
                          ) : (
                            <Text style={[styles.inlineActionText, { color: colors.textPrimary }]}>Default</Text>
                          )}
                        </Pressable>
                      ) : null}

                      <Pressable
                        style={[styles.deleteIconButton, { backgroundColor: colors.accentSoft }]}
                        onPress={() => {
                          void deleteAddress(address._id);
                        }}
                        disabled={isUpdatingDefault || isDeleting}>
                        {isDeleting ? (
                          <ActivityIndicator size="small" color={colors.danger} />
                        ) : (
                          <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        )}
                      </Pressable>
                    </View>
                  </View>

                  {index < addresses.length - 1 ? (
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      <Modal visible={isModalVisible} transparent animationType="fade" onRequestClose={closeAddModal}>
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
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Saved Address</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      Save a pickup point for faster ride booking.
                    </Text>
                  </View>

                  <Pressable style={styles.closeButton} onPress={closeAddModal} disabled={saving}>
                    <Ionicons name="close" size={20} color={colors.textPrimary} />
                  </Pressable>
                </View>

                <View style={styles.labelRow}>
                  {(['Home', 'Work', 'Other'] as AddressLabel[]).map((label) => {
                    const isActive = form.label === label;

                    return (
                      <Pressable
                        key={label}
                        style={[
                          styles.labelChip,
                          {
                            backgroundColor: isActive ? colors.accentSoft : colors.input,
                            borderColor: isActive ? colors.accent : colors.border,
                          },
                        ]}
                        onPress={() => handleChange('label', label)}>
                        <Ionicons
                          name={labelIconMap[label]}
                          size={14}
                          color={isActive ? colors.accent : colors.textSecondary}
                        />
                        <Text
                          style={[
                            styles.labelChipText,
                            { color: isActive ? colors.accent : colors.textPrimary },
                          ]}>
                          {label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Address title</Text>
                  <TextInput
                    value={form.title}
                    onChangeText={(value) => handleChange('title', value)}
                    placeholder="Home, Office, Gym"
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
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Address</Text>
                  <TextInput
                    value={form.addressLine}
                    onChangeText={(value) => handleChange('addressLine', value)}
                    placeholder="Street, city, landmark"
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        backgroundColor: colors.input,
                        borderColor: colors.border,
                        color: colors.textPrimary,
                      },
                    ]}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Pickup note</Text>
                  <TextInput
                    value={form.note}
                    onChangeText={(value) => handleChange('note', value)}
                    placeholder="Gate number, building entrance, security desk"
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

                <View style={[styles.switchRow, { borderColor: colors.border }]}>
                  <View style={styles.switchTextWrap}>
                    <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>Set as default</Text>
                    <Text style={[styles.switchHint, { color: colors.textSecondary }]}>
                      Use this place first when selecting pickups.
                    </Text>
                  </View>

                  <Switch
                    value={form.isDefault}
                    onValueChange={(value) => handleChange('isDefault', value)}
                    trackColor={{ false: '#C7D4D2', true: colors.accent }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.secondaryButton, { borderColor: colors.border }]}
                    onPress={closeAddModal}
                    disabled={saving}>
                    <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.submitButton,
                      { backgroundColor: colors.accent },
                      saving ? styles.submitButtonDisabled : null,
                    ]}
                    onPress={() => {
                      void saveAddress();
                    }}
                    disabled={saving}>
                    <Text style={styles.submitButtonText}>{saving ? 'Saving...' : 'Save Address'}</Text>
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
    padding: 20,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
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
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroHint: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    marginBottom: 12,
  },
  tipCard: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  pageFeedback: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  addButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  groupCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  stateRow: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  stateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyStateWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  addressRow: {
    minHeight: 96,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flex: 1,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTextWrap: {
    flex: 1,
  },
  addressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  addressTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  addressMeta: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  addressLine: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  addressNote: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    marginTop: 4,
  },
  defaultPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  defaultPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  inlineActionButton: {
    minWidth: 70,
    minHeight: 30,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inlineActionText: {
    fontSize: 11,
    fontWeight: '800',
  },
  deleteIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginLeft: 60,
  },
  modalOverlay: {
    flex: 1,
    paddingHorizontal: 20,
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
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    maxWidth: 240,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  labelChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  labelChipText: {
    fontSize: 12,
    fontWeight: '800',
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
  textArea: {
    minHeight: 84,
    textAlignVertical: 'top',
  },
  switchRow: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 2,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  switchTextWrap: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  switchHint: {
    fontSize: 12,
    fontWeight: '500',
    maxWidth: 220,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
  submitButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
