import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';

import { ProfileDetailsGroup } from '@/components/profile/profile-details-group';

export default function SupportHelpScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageHint}>Get help for rides, billing, and safety.</Text>

        <ProfileDetailsGroup
          title="SUPPORT"
          rows={[
            { label: 'Safety center', value: 'Always on' },
            { label: '24/7 chat support', value: 'Available' },
            { label: 'FAQ and guides', value: 'Browse topics' },
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
