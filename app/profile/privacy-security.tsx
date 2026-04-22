import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';

import { ProfileDetailsGroup } from '@/components/profile/profile-details-group';

export default function PrivacySecurityScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageHint}>Manage account safety and privacy controls.</Text>

        <ProfileDetailsGroup
          title="SECURITY"
          rows={[
            { label: 'Password', value: 'Last changed 45 days ago' },
            { label: 'Two-factor authentication', value: 'Not enabled' },
            { label: 'Trusted devices', value: '3 active devices' },
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
