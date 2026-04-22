import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function PrivacySecurityScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageHint}>Manage account safety and privacy controls.</Text>

        <Text style={styles.groupTitle}>SECURITY</Text>
        <View style={styles.groupCard}>
          <View style={styles.row}>
            <Text style={styles.label}>Password</Text>
            <Text style={styles.value}>Last changed 45 days ago</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Two-factor authentication</Text>
            <Text style={styles.value}>Not enabled</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.label}>Trusted devices</Text>
            <Text style={styles.value}>3 active devices</Text>
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
