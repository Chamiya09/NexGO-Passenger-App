import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
    danger: '#C13B3B',
    success: '#157A62',
  };

  useEffect(() => {
    const loadPaymentMethods = async () => {
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
    };

    void loadPaymentMethods();
  }, [token]);

  const handleChange = (field: keyof typeof initialForm, value: string | boolean) => {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const submitPaymentMethod = async () => {
    if (!token) {
      setErrorMessage('You need to be logged in to add a payment method.');
      return;
    }

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
        body: JSON.stringify(form),
      });

      const data = await parseApiResponse<{ paymentMethods: PaymentMethod[] }>(response);
      setPaymentMethods(data.paymentMethods);
      setForm({
        ...initialForm,
        isDefault: data.paymentMethods.length === 0,
      });
      setSuccessMessage('Payment method added successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to save payment method');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroBadge, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="lock-closed-outline" size={15} color={colors.accent} />
            <Text style={[styles.heroBadgeText, { color: colors.accent }]}>Payments protected</Text>
          </View>

          <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
            Add and manage your saved cards here. We only keep masked card details for display.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PAYMENT METHODS</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {loading ? (
            <View style={styles.stateRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading payment methods...</Text>
            </View>
          ) : paymentMethods.length === 0 ? (
            <View style={styles.stateRow}>
              <Ionicons name="card-outline" size={18} color={colors.accent} />
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>No payment methods added yet.</Text>
            </View>
          ) : (
            paymentMethods.map((method, index) => (
              <View key={method._id || `${method.brand}-${method.last4}-${index}`}>
                <View style={styles.row}>
                  <View style={styles.rowLeft}>
                    <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                      <Ionicons name="card-outline" size={16} color={colors.accent} />
                    </View>

                    <View>
                      <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>
                        {method.isDefault ? 'Default card' : method.cardholderName}
                      </Text>
                      <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
                        {method.brand} ending {method.last4}
                      </Text>
                      <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                        Expires {method.expiryMonth}/{method.expiryYear}
                      </Text>
                    </View>
                  </View>
                </View>

                {index < paymentMethods.length - 1 ? (
                  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                ) : null}
              </View>
            ))
          )}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ADD PAYMENT METHOD</Text>
        <View style={[styles.formCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Cardholder name</Text>
            <TextInput
              value={form.cardholderName}
              onChangeText={(value) => handleChange('cardholderName', value)}
              placeholder="Name on card"
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
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Card number</Text>
            <TextInput
              value={form.cardNumber}
              onChangeText={(value) => handleChange('cardNumber', value)}
              placeholder="1234 5678 9012 3456"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
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

          {errorMessage ? <Text style={[styles.feedbackText, { color: colors.danger }]}>{errorMessage}</Text> : null}
          {successMessage ? <Text style={[styles.feedbackText, { color: colors.success }]}>{successMessage}</Text> : null}

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
            <Text style={styles.submitButtonText}>{saving ? 'Saving...' : 'Add Payment Method'}</Text>
          </Pressable>
        </View>
      </ScrollView>
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
  },
  row: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
    marginTop: 3,
  },
  divider: {
    height: 1,
    marginLeft: 58,
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
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
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
    marginBottom: 12,
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
  feedbackText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 10,
  },
  submitButton: {
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
