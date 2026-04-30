import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
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

import RefreshableScrollView from '@/components/RefreshableScrollView';
import { useAuth } from '@/context/auth-context';
import { API_BASE_URL, parseApiResponse } from '@/lib/api';
import { useThemeColor } from '@/hooks/use-theme-color';

type PaymentMethod = {
  _id: string;
  cardholderName: string;
  brand: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
};

const initialForm = {
  cardholderName: '',
  cardNumber: '',
  expiryMonth: '',
  expiryYear: '',
  isDefault: false,
};

export default function PaymentDetailsScreen() {
  const { token } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingDefaultId, setUpdatingDefaultId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);

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
    danger: '#C13B3B',
    success: '#157A62',
  };

  const loadPaymentMethods = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/payment-methods`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseApiResponse<{ paymentMethods: PaymentMethod[] }>(response);
      setPaymentMethods(data.paymentMethods);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load payment methods');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadPaymentMethods();
  }, [loadPaymentMethods]);

  const handleChange = (field: keyof typeof initialForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const openAddModal = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setForm({
      ...initialForm,
      isDefault: paymentMethods.length === 0,
    });
    setIsModalVisible(true);
  };

  const closeAddModal = () => {
    if (saving) {
      return;
    }

    setIsModalVisible(false);
    setForm(initialForm);
  };

  const validatePaymentForm = () => {
    const cardholderName = form.cardholderName.trim();
    const cardNumber = form.cardNumber.replace(/\D/g, '');
    const expiryMonth = form.expiryMonth.trim();
    const expiryYear = form.expiryYear.trim();

    if (!cardholderName || !cardNumber || !expiryMonth || !expiryYear) {
      return 'Please complete all payment method fields.';
    }

    if (cardNumber.length < 12 || cardNumber.length > 19) {
      return 'Card number must be between 12 and 19 digits.';
    }

    if (!/^(0?[1-9]|1[0-2])$/.test(expiryMonth)) {
      return 'Enter a valid expiry month between 1 and 12.';
    }

    if (!/^\d{2,4}$/.test(expiryYear)) {
      return 'Enter a valid expiry year with 2 or 4 digits.';
    }

    return null;
  };

  const submitPaymentMethod = async () => {
    if (!token) {
      setErrorMessage('You need to be logged in to add a payment method.');
      return;
    }

    const validationError = validatePaymentForm();
    if (validationError) {
      setErrorMessage(validationError);
      setSuccessMessage(null);
      return;
    }

    Keyboard.dismiss();

    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cardholderName: form.cardholderName.trim(),
          cardNumber: form.cardNumber.replace(/\D/g, ''),
          expiryMonth: form.expiryMonth.trim(),
          expiryYear: form.expiryYear.trim(),
          isDefault: form.isDefault,
        }),
      });

      const data = await parseApiResponse<{ paymentMethods: PaymentMethod[] }>(response);
      setPaymentMethods(data.paymentMethods);
      setIsModalVisible(false);
      setForm(initialForm);
      setSuccessMessage('Payment method added successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save payment method');
    } finally {
      setSaving(false);
    }
  };

  const updateDefaultPaymentMethod = async (paymentMethodId: string) => {
    if (!token) {
      setErrorMessage('You need to be logged in to update the default payment method.');
      return;
    }

    setUpdatingDefaultId(paymentMethodId);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/payment-methods/${paymentMethodId}/default`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await parseApiResponse<{ paymentMethods: PaymentMethod[] }>(response);
      setPaymentMethods(data.paymentMethods);
      setSuccessMessage('Default payment method updated.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to update default payment method');
    } finally {
      setUpdatingDefaultId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <RefreshableScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onRefreshPage={loadPaymentMethods}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroBadge, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="lock-closed-outline" size={15} color={colors.accent} />
            <Text style={[styles.heroBadgeText, { color: colors.accent }]}>Payments protected</Text>
          </View>

          <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
            Add and manage your saved cards here. Raw card numbers are not stored in the database.
          </Text>
        </View>

        {errorMessage ? <Text style={[styles.pageFeedback, { color: colors.danger }]}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={[styles.pageFeedback, { color: colors.success }]}>{successMessage}</Text> : null}

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PAYMENT METHODS</Text>
          <Pressable style={[styles.addButton, { backgroundColor: colors.accent }]} onPress={openAddModal}>
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Method</Text>
          </Pressable>
        </View>

        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {loading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading payment methods...</Text>
            </View>
          ) : paymentMethods.length === 0 ? (
            <View style={styles.emptyStateWrap}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="card-outline" size={22} color={colors.accent} />
              </View>
              <Text style={[styles.emptyStateTitle, { color: colors.textPrimary }]}>No payment methods yet</Text>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                Tap Add Method to save your first card.
              </Text>
            </View>
          ) : (
            paymentMethods.map((method, index) => {
              const isUpdatingDefault = updatingDefaultId === method._id;

              return (
                <View key={method._id || `${method.brand}-${method.last4}-${index}`}>
                  <View style={styles.methodRow}>
                    <View style={styles.rowLeft}>
                      <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                        <Ionicons name="card-outline" size={16} color={colors.accent} />
                      </View>

                      <View style={styles.methodTextWrap}>
                        <View style={styles.methodTitleRow}>
                          <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
                            {method.brand} ending {method.last4}
                          </Text>
                          {method.isDefault ? (
                            <View style={[styles.defaultPill, { backgroundColor: colors.accentSoft }]}>
                              <Text style={[styles.defaultPillText, { color: colors.accent }]}>Default</Text>
                            </View>
                          ) : null}
                        </View>

                        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{method.cardholderName}</Text>
                        <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                          Expires {method.expiryMonth}/{method.expiryYear}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.defaultToggleWrap}>
                      {isUpdatingDefault ? (
                        <ActivityIndicator size="small" color={colors.accent} />
                      ) : (
                        <Switch
                          value={method.isDefault}
                          onValueChange={(value) => {
                            if (value && !method.isDefault) {
                              void updateDefaultPaymentMethod(method._id);
                            }
                          }}
                          trackColor={{ false: '#C7D4D2', true: colors.accent }}
                          thumbColor="#FFFFFF"
                        />
                      )}
                    </View>
                  </View>

                  {index < paymentMethods.length - 1 ? (
                    <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                  ) : null}
                </View>
              );
            })
          )}
        </View>
      </RefreshableScrollView>

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
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Add Payment Method</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                      Save masked card details securely for future rides.
                    </Text>
                  </View>

                  <Pressable style={styles.closeButton} onPress={closeAddModal} disabled={saving}>
                    <Ionicons name="close" size={20} color={colors.textPrimary} />
                  </Pressable>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Cardholder name</Text>
                  <TextInput
                    value={form.cardholderName}
                    onChangeText={(value) => handleChange('cardholderName', value)}
                    placeholder="Name on card"
                    placeholderTextColor={colors.textSecondary}
                    returnKeyType="next"
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
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Card number</Text>
                  <TextInput
                    value={form.cardNumber}
                    onChangeText={(value) => handleChange('cardNumber', value)}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    returnKeyType="next"
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

                <View style={styles.inlineFields}>
                  <View style={[styles.inputGroup, styles.inlineField]}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Expiry month</Text>
                    <TextInput
                      value={form.expiryMonth}
                      onChangeText={(value) => handleChange('expiryMonth', value)}
                      placeholder="MM"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                      returnKeyType="next"
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

                  <View style={[styles.inputGroup, styles.inlineField]}>
                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Expiry year</Text>
                    <TextInput
                      value={form.expiryYear}
                      onChangeText={(value) => handleChange('expiryYear', value)}
                      placeholder="YYYY"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        void submitPaymentMethod();
                      }}
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
                </View>

                <View style={[styles.switchRow, { borderColor: colors.border }]}>
                  <View>
                    <Text style={[styles.switchTitle, { color: colors.textPrimary }]}>Set as default</Text>
                    <Text style={[styles.switchHint, { color: colors.textSecondary }]}>
                      Use this payment method first for future rides.
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
                      void submitPaymentMethod();
                    }}
                    disabled={saving}>
                    <Text style={styles.submitButtonText}>{saving ? 'Saving...' : 'Save Method'}</Text>
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
  heroHint: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
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
  methodRow: {
    minHeight: 88,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  methodTextWrap: {
    flex: 1,
  },
  methodTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  rowMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
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
  defaultToggleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 52,
  },
  divider: {
    height: 1,
    marginLeft: 58,
  },
  modalOverlay: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  modalCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
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
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineField: {
    flex: 1,
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
