import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PaymentDetailsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageHint}>Cards, wallet settings, and payment preferences.</Text>

        <Text style={styles.groupTitle}>CARDS</Text>
        <View style={styles.groupCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Primary card</Text>
            <Text style={styles.value}>Visa ending 1024</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Backup card</Text>
            <Text style={styles.value}>Mastercard ending 7781</Text>
          </View>
        </View>

        <Text style={styles.groupTitle}>WALLET</Text>
        <View style={styles.groupCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Wallet balance</Text>
            <Text style={styles.value}>INR 540.00</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Auto debit for rides</Text>
            <Text style={styles.value}>Enabled</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F8F7',
  },
  container: {
    padding: 20,
  },
  pageHint: {
    fontSize: 14,
    color: '#738786',
    marginBottom: 14,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7E9190',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  groupCard: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E7ECEB',
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
    overflow: 'hidden',
  },
  row: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F1',
    marginLeft: 14,
  },
  label: {
    fontSize: 15,
    color: '#2E4C49',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#617977',
  },
});
