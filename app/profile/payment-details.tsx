import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';

export default function PaymentDetailsScreen() {
  const colors = {
    background: useThemeColor({}, 'background'),
    textPrimary: useThemeColor({}, 'text'),
    textSecondary: useThemeColor({ light: '#6A807D', dark: '#A3B1AE' }, 'icon'),
    card: useThemeColor({ light: '#FFFFFF', dark: '#1F2327' }, 'background'),
    border: useThemeColor({ light: '#DFE9E7', dark: '#33383D' }, 'icon'),
    divider: useThemeColor({ light: '#EAF0EF', dark: '#3A4147' }, 'icon'),
    accent: useThemeColor({ light: '#14988F', dark: '#48C4BA' }, 'tint'),
    accentSoft: useThemeColor({ light: '#E7F5F3', dark: '#293538' }, 'background'),
  };

  const paymentMethodRows = [
    {
      label: 'Primary card',
      value: 'Visa ending 1024',
      icon: 'card-outline' as const,
    },
    {
      label: 'Backup card',
      value: 'Mastercard ending 7781',
      icon: 'albums-outline' as const,
    },
    {
      label: 'Cash payments',
      value: 'Enabled for rides',
      icon: 'cash-outline' as const,
    },
  ];

  const ridePaymentRows = [
    {
      label: 'Wallet balance',
      value: 'INR 540.00',
      icon: 'wallet-outline' as const,
    },
    {
      label: 'Auto debit for rides',
      value: 'Enabled',
      icon: 'repeat-outline' as const,
    },
    {
      label: 'Receipts',
      value: 'Sent to your email',
      icon: 'receipt-outline' as const,
    },
  ];

  const preferenceRows = [
    {
      label: 'Default payment',
      value: 'Use primary card first',
      icon: 'checkmark-circle-outline' as const,
    },
    {
      label: 'Payment security',
      value: 'PIN required for changes',
      icon: 'shield-checkmark-outline' as const,
    },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroBadge, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="lock-closed-outline" size={15} color={colors.accent} />
            <Text style={[styles.heroBadgeText, { color: colors.accent }]}>Payments protected</Text>
          </View>

          <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
            Manage your cards and wallet settings in one place for faster and more secure checkout.
          </Text>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PAYMENT METHODS</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {paymentMethodRows.map((row, index) => (
            <View key={row.label}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name={row.icon} size={16} color={colors.accent} />
                  </View>

                  <View>
                    <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                    <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{row.value}</Text>
                  </View>
                </View>
              </View>

              {index < paymentMethodRows.length - 1 ? (
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              ) : null}
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>RIDE PAYMENTS</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {ridePaymentRows.map((row, index) => (
            <View key={row.label}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name={row.icon} size={16} color={colors.accent} />
                  </View>

                  <View>
                    <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                    <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{row.value}</Text>
                  </View>
                </View>
              </View>

              {index < ridePaymentRows.length - 1 ? (
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              ) : null}
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>PAYMENT PREFERENCES</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {preferenceRows.map((row, index) => (
            <View key={row.label}>
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name={row.icon} size={16} color={colors.accent} />
                  </View>

                  <View>
                    <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{row.label}</Text>
                    <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{row.value}</Text>
                  </View>
                </View>
              </View>

              {index < preferenceRows.length - 1 ? (
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              ) : null}
            </View>
          ))}
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
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  divider: {
    height: 1,
    marginLeft: 58,
  },
});
