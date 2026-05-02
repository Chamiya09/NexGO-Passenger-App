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
import { router } from 'expo-router';

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

  const walletStats = {
    transactions: wallet.transactions.length,
    latestTopUp: wallet.transactions.find((transaction) => transaction.type === 'topup')?.amount || 0,
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
        <View style={styles.topBar}>
          <Pressable style={[styles.backButton, { borderColor: colors.border }]} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>Wallet</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.heroTopRow}>
            <View style={[styles.heroIcon, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
              <Ionicons name="wallet-outline" size={26} color={colors.accent} />
            </View>

            <View style={styles.heroIdentity}>
              <Text style={[styles.heroName, { color: colors.textPrimary }]}>NexGO Wallet</Text>
              <Text style={[styles.heroSubline, { color: colors.textSecondary }]}>
                Passenger ride credit and top up history
              </Text>
            </View>
          </View>

          <View style={[styles.heroBadge, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colors.accent} />
            <Text style={[styles.heroBadgeText, { color: colors.accent }]}>Card details not saved</Text>
          </View>

          <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
            Keep ride credit ready and top up your wallet using a card.
          </Text>
        </View>

        {errorMessage ? <Text style={[styles.pageFeedback, { color: colors.danger }]}>{errorMessage}</Text> : null}
        {successMessage ? <Text style={[styles.pageFeedback, { color: colors.success }]}>{successMessage}</Text> : null}

        <View style={styles.metricGrid}>
          <WalletMetricCard
            icon="checkmark-circle-outline"
            label="Status"
            value={wallet.balance > 0 ? 'Ready' : 'Empty'}
            color={colors.accent}
            backgroundColor={colors.accentSoft}
            borderColor={colors.border}
            textColor={colors.textPrimary}
            secondaryColor={colors.textSecondary}
          />
          <WalletMetricCard
            icon="swap-vertical-outline"
            label="Activity"
            value={`${walletStats.transactions}`}
            color={colors.success}
            backgroundColor="#E9F8EF"
            borderColor={colors.border}
            textColor={colors.textPrimary}
            secondaryColor={colors.textSecondary}
          />
          <WalletMetricCard
            icon="card-outline"
            label="Last top up"
            value={walletStats.latestTopUp ? `LKR ${Number(walletStats.latestTopUp).toLocaleString('en-LK')}` : 'None'}
            color="#D97706"
            backgroundColor="#FFF8EC"
            borderColor={colors.border}
            textColor={colors.textPrimary}
            secondaryColor={colors.textSecondary}
          />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: colors.textSecondary }]}>WALLET BALANCE</Text>
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>Passenger wallet</Text>
        </View>

        <View style={[styles.groupCard, styles.walletCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.cardAccent, { backgroundColor: colors.accent }]} />
          <View style={styles.walletHeader}>
            <View style={styles.walletBalanceWrap}>
              <Text style={[styles.detailsTitle, { color: colors.textPrimary }]}>Available credit</Text>
              <Text style={[styles.detailsHint, { color: colors.textSecondary }]}>
                Balance ready for future rides.
              </Text>
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
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, styles.sectionTitleInline, { color: colors.textSecondary }]}>RECENT ACTIVITY</Text>
          <Text style={[styles.sectionHint, { color: colors.textSecondary }]}>Latest 3</Text>
        </View>

        <View style={[styles.groupCard, styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {loading ? (
            <View style={styles.compactStateRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={[styles.stateText, { color: colors.textSecondary }]}>Loading wallet...</Text>
            </View>
          ) : wallet.transactions.length === 0 ? (
            <View style={styles.emptyActivityWrap}>
              <View style={[styles.emptyActivityIcon, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name="receipt-outline" size={20} color={colors.accent} />
              </View>
              <Text style={[styles.emptyActivityTitle, { color: colors.textPrimary }]}>No wallet activity yet</Text>
              <Text style={[styles.emptyActivityText, { color: colors.textSecondary }]}>
                Your top ups and wallet payments will appear here.
              </Text>
            </View>
          ) : (
            wallet.transactions.slice(0, 3).map((transaction, index) => (
              <View
                key={transaction._id || `${transaction.type}-${transaction.createdAt}-${index}`}
                style={[
                  styles.transactionRow,
                  index < Math.min(wallet.transactions.length, 3) - 1
                    ? { borderBottomColor: colors.divider, borderBottomWidth: 1 }
                    : null,
                ]}>
                <View style={[styles.iconWrap, styles.transactionIconWrap, { backgroundColor: colors.accentSoft }]}>
                  <Ionicons
                    name={transaction.type === 'topup' ? 'arrow-down-circle-outline' : 'receipt-outline'}
                    size={16}
                    color={colors.accent}
                  />
                </View>

                <View style={styles.transactionTextWrap}>
                  <Text
                    style={[styles.rowValue, { color: colors.textPrimary }]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    {transaction.description || 'Wallet transaction'}
                  </Text>
                  <Text
                    style={[styles.rowMeta, { color: colors.textSecondary }]}
                    numberOfLines={2}
                    ellipsizeMode="tail">
                    {formatTransactionDate(transaction.createdAt)} - Balance {formatMoney(transaction.balanceAfter)}
                  </Text>
                </View>

                <View style={styles.transactionAmountWrap}>
                  <Text
                    style={[styles.transactionAmount, { color: colors.success }]}
                    numberOfLines={1}
                    ellipsizeMode="tail">
                    +{formatMoney(transaction.amount)}
                  </Text>
                </View>
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

function WalletMetricCard({
  icon,
  label,
  value,
  color,
  backgroundColor,
  borderColor,
  textColor,
  secondaryColor,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  backgroundColor: string;
  borderColor: string;
  textColor: string;
  secondaryColor: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor, borderColor }]}>
      <View style={[styles.metricIcon, { backgroundColor: '#FFFFFF' }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={[styles.metricValue, { color: textColor }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={[styles.metricLabel, { color: secondaryColor }]}>{label}</Text>
    </View>
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
  pageFeedback: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 15,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionHeaderRow: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 2,
  },
  sectionTitleInline: {
    marginBottom: 0,
    marginTop: 0,
  },
  sectionHint: {
    fontSize: 11,
    fontWeight: '700',
  },
  groupCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
    padding: 12,
  },
  walletCard: {
    position: 'relative',
    paddingLeft: 16,
  },
  activityCard: {
    paddingVertical: 4,
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
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
    marginTop: 8,
    flexShrink: 1,
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
  },
  walletHint: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
    marginTop: 12,
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
  compactStateRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  transactionRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
  },
  transactionIconWrap: {
    flexShrink: 0,
  },
  transactionTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  transactionAmountWrap: {
    width: 104,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
  transactionAmount: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'right',
  },
  stateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyActivityWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 26,
  },
  emptyActivityIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyActivityTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptyActivityText: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 18,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  rowMeta: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
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
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineField: {
    flex: 1,
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
