import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PaymentDetailsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Payment Details</Text>
        <Text style={styles.subheading}>Cards, wallet settings, and payment preferences.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Primary card</Text>
          <Text style={styles.value}>Visa ending 1024</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Backup card</Text>
          <Text style={styles.value}>Mastercard ending 7781</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Wallet balance</Text>
          <Text style={styles.value}>INR 540.00</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Auto debit for rides</Text>
          <Text style={styles.value}>Enabled</Text>
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
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#153F3A',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: '#5A7471',
    marginBottom: 14,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DEE9E8',
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: '#65817D',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#163F3B',
  },
});
