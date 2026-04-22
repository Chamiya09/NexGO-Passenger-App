import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';

import { ProfileDetailsGroup } from '@/components/profile/profile-details-group';

export default function PaymentDetailsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageHint}>Cards, wallet settings, and payment preferences.</Text>

        <ProfileDetailsGroup
          title="CARDS"
          rows={[
            { label: 'Primary card', value: 'Visa ending 1024' },
            { label: 'Backup card', value: 'Mastercard ending 7781' },
          ]}
        />

        <ProfileDetailsGroup
          title="WALLET"
          rows={[
            { label: 'Wallet balance', value: 'INR 540.00' },
            { label: 'Auto debit for rides', value: 'Enabled' },
          ]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },
  container: {
    padding: 20,
  },
  pageHint: {
    fontSize: 14,
    color: '#738786',
    marginBottom: 14,
  },
});
