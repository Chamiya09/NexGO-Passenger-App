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
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import RefreshableScrollView from '@/components/RefreshableScrollView';
import { useAuth } from '@/context/auth-context';
import { API_BASE_URL, parseApiResponse } from '@/lib/api';
import { useThemeColor } from '@/hooks/use-theme-color';

type WalletTransaction = {
  _id?: string;
  type: 'topup' | 'ride_payment' | 'refund' | 'adjustment';
  amount: number;
  balanceAfter: number;
  paymentMethodId?: string | null;
  description?: string;
  createdAt?: string;
};

type Wallet = {
  balance: number;
  transactions: WalletTransaction[];
};

const initialTopUpForm = {
  amount: '',
  cardholderName: '',
  cardNumber: '',
  expiryMonth: '',
  expiryYear: '',
};

export default function WalletScreen() {
  const { token } = useAuth();
  const [wallet, setWallet] = useState<Wallet>({ balance: 0, transactions: [] });
  const [loading, setLoading] = useState(true);
  const [topUpSaving, setTopUpSaving] = useState(false);
  const [isTopUpModalVisible, setIsTopUpModalVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [topUpForm, setTopUpForm] = useState(initialTopUpForm);

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

  const loadWalletDetails = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const requestConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const walletResponse = await fetch(`${API_BASE_URL}/auth/wallet`, requestConfig);
      const walletData = await parseApiResponse<{ wallet: Wallet }>(walletResponse);

      setWallet(walletData.wallet);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load wallet details');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadWalletDetails();
  }, [loadWalletDetails]);

  const handleTopUpChange = (field: keyof typeof initialTopUpForm, value: string) => {
    setTopUpForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const formatMoney = (amount: number) =>
    `LKR ${Number(amount || 0).toLocaleString('en-LK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const formatTransactionDate = (dateValue?: string) => {
    if (!dateValue) {
      return 'Just now';
    }

    return new Date(dateValue).toLocaleDateString('en-LK', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const openTopUpModal = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setTopUpForm({
      ...initialTopUpForm,
    });
    setIsTopUpModalVisible(true);
  };

  const closeTopUpModal = () => {
    if (topUpSaving) {
      return;
    }

    setIsTopUpModalVisible(false);
    setTopUpForm(initialTopUpForm);
  };

  const submitTopUp = async () => {
    if (!token) {
      setErrorMessage('You need to be logged in to top up your wallet.');
      return;
    }

    const amount = Number(topUpForm.amount);

    if (!Number.isFinite(amount) || amount < 100) {
      setErrorMessage('Enter a top up amount of at least LKR 100.');
      setSuccessMessage(null);
      return;
    }

    const cardNumber = topUpForm.cardNumber.replace(/\D/g, '');
    const expiryMonth = topUpForm.expiryMonth.trim();
    const expiryYear = topUpForm.expiryYear.trim();
    const cardholderName = topUpForm.cardholderName.trim();

    if (!cardholderName || !cardNumber || !expiryMonth || !expiryYear) {
      setErrorMessage('Please complete all card details for this top up.');
      setSuccessMessage(null);
      return;
    }

    if (cardNumber.length < 12 || cardNumber.length > 19) {
      setErrorMessage('Card number must be between 12 and 19 digits.');
      setSuccessMessage(null);
      return;
    }

    if (!/^(0?[1-9]|1[0-2])$/.test(expiryMonth)) {
      setErrorMessage('Enter a valid expiry month between 1 and 12.');
      setSuccessMessage(null);
      return;
    }

    if (!/^\d{2,4}$/.test(expiryYear)) {
      setErrorMessage('Enter a valid expiry year with 2 or 4 digits.');
      setSuccessMessage(null);
      return;
    }

    Keyboard.dismiss();
    setTopUpSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/wallet/top-up`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          cardholderName,
          cardNumber,
          expiryMonth,
          expiryYear,
        }),
      });

      const data = await parseApiResponse<{ wallet: Wallet }>(response);
      setWallet(data.wallet);
      setIsTopUpModalVisible(false);
      setTopUpForm(initialTopUpForm);
      setSuccessMessage('Wallet topped up successfully.');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to top up wallet');
    } finally {
      setTopUpSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <RefreshableScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onRefreshPage={loadWalletDetails}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroBadge, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="wallet-outline" size={15} color={colors.accent} />
            <Text style={[styles.heroBadgeText, { color: colors.accent }]}>Wallet</Text>
          </View>

          <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
            Keep ride credit ready and top up your wallet using a card.
          </Text>
        </View>

        {errorMessage ? <Text style={[styles.pageFeedback, { color: colors.danger }]}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={[styles.pageFeedback, { color: colors.success }]}>{successMessage}</Text> : null}

        <View style={[styles.walletCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.walletHeader}>
            <View style={styles.walletBalanceWrap}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>WALLET BALANCE</Text>
              <Text style={[styles.walletBalance, { color: colors.textPrimary }]}>{formatMoney(wallet.balance)}</Text>
            </View>

            <Pressable
              style={[styles.topUpButton, { backgroundColor: colors.accent }]}
              onPress={openTopUpModal}
              disabled={loading}>
              <Ionicons name="wallet-outline" size={16} color="#FFFFFF" />
              <Text style={styles.topUpButtonText}>Top Up</Text>
            </Pressable>
          </View>

          <Text style={[styles.walletHint, { color: colors.textSecondary }]}>
            Enter card details only when you top up. Card numbers are not saved from this wallet page.
          </Text>

          <View style={[styles.walletDivider, { backgroundColor: colors.divider }]} />

          <Text style={[styles.walletHistoryTitle, { color: colors.textPrimary }]}>Recent activity</Text>
          {loading ? (
            <View style={styles.compactStateRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading wallet...</Text>
            </View>
          ) : wallet.transactions.length === 0 ? (
            <Text style={[styles.walletHint, { color: colors.textSecondary }]}>No wallet activity yet.</Text>
          ) : (
            wallet.transactions.slice(0, 3).map((transaction, index) => (
              <View
                key={transaction._id || `${transaction.type}-${transaction.createdAt}-${index}`}
                style={styles.transactionRow}>
                <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons
                    name={transaction.type === 'topup' ? 'arrow-down-circle-outline' : 'receipt-outline'}
                    size={16}
                    color={colors.accent}
                  />
                </View>

                <View style={styles.transactionTextWrap}>
                  <Text style={[styles.rowValue, { color: colors.textPrimary }]}>
                    {transaction.description || 'Wallet transaction'}
                  </Text>
                  <Text style={[styles.rowMeta, { color: colors.textSecondary }]}>
                    {formatTransactionDate(transaction.createdAt)} - Balance {formatMoney(transaction.balanceAfter)}
                  </Text>
                </View>

                <Text style={[styles.transactionAmount, { color: colors.success }]}>
                  +{formatMoney(transaction.amount)}
                </Text>
              </View>
            ))
          )}
        </View>
      </RefreshableScrollView>

      <Modal visible={isTopUpModalVisible} transparent animationType="fade" onRequestClose={closeTopUpModal}>
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
                    <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Top Up Wallet</Text>
                    <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>Add credit using a card.</Text>
                  </View>

                  <Pressable style={styles.closeButton} onPress={closeTopUpModal} disabled={topUpSaving}>
                    <Ionicons name="close" size={20} color={colors.textPrimary} />
                  </Pressable>
                </View>

                <View style={[styles.topUpBalanceBox, { backgroundColor: colors.accentSoft }]}>
                  <Text style={[styles.topUpBalanceLabel, { color: colors.accent }]}>Current balance</Text>
                  <Text style={[styles.topUpBalanceValue, { color: colors.textPrimary }]}>
                    {formatMoney(wallet.balance)}
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Top up amount</Text>
                  <TextInput
                    value={topUpForm.amount}
                    onChangeText={(value) => handleTopUpChange('amount', value.replace(/[^\d.]/g, ''))}
                    placeholder="1000"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    onSubmitEditing={() => {
                      void submitTopUp();
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

                <View style={styles.inputGroup}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Cardholder name</Text>
                  <TextInput
                    value={topUpForm.cardholderName}
                    onChangeText={(value) => handleTopUpChange('cardholderName', value)}
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
                    value={topUpForm.cardNumber}
                    onChangeText={(value) => handleTopUpChange('cardNumber', value)}
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
                      value={topUpForm.expiryMonth}
                      onChangeText={(value) => handleTopUpChange('expiryMonth', value)}
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
                      value={topUpForm.expiryYear}
                      onChangeText={(value) => handleTopUpChange('expiryYear', value)}
                      placeholder="YYYY"
                      placeholderTextColor={colors.textSecondary}
                      keyboardType="number-pad"
                      returnKeyType="done"
                      onSubmitEditing={() => {
                        void submitTopUp();
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

                <View style={styles.modalActions}>
                  <Pressable
                    style={[styles.secondaryButton, { borderColor: colors.border }]}
                    onPress={closeTopUpModal}
                    disabled={topUpSaving}>
                    <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>Cancel</Text>
                  </Pressable>

                  <Pressable
                    style={[
                      styles.submitButton,
                      { backgroundColor: colors.accent },
                      topUpSaving ? styles.submitButtonDisabled : null,
                    ]}
                    onPress={() => {
                      void submitTopUp();
                    }}
                    disabled={topUpSaving}>
                    <Text style={styles.submitButtonText}>{topUpSaving ? 'Processing...' : 'Top Up'}</Text>
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
  walletCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 14,
  },
  walletBalanceWrap: {
    flex: 1,
    minWidth: 0,
  },
  walletBalance: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 6,
    flexShrink: 1,
  },
  walletHint: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 10,
  },
  topUpButton: {
    minHeight: 40,
    minWidth: 104,
    borderRadius: 999,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexShrink: 0,
  },
  topUpButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  walletDivider: {
    height: 1,
    marginVertical: 14,
  },
  walletHistoryTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  compactStateRow: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  transactionRow: {
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 6,
  },
  transactionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  transactionAmount: {
    fontSize: 13,
    fontWeight: '900',
    flexShrink: 0,
    paddingTop: 2,
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
  topUpBalanceBox: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  topUpBalanceLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  topUpBalanceValue: {
    fontSize: 24,
    fontWeight: '900',
  },
  cardSelectorList: {
    gap: 10,
    marginBottom: 14,
  },
  cardSelectorItem: {
    minHeight: 66,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
