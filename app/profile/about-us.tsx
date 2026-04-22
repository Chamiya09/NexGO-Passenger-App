import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';

import { ProfileDetailsGroup } from '@/components/profile/profile-details-group';

export default function AboutUsScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageHint}>NexGO helps passengers book reliable rides with transparent pricing.</Text>

        <ProfileDetailsGroup
          title="APP INFO"
          rows={[
            { label: 'Version', value: '1.0.0' },
            { label: 'Build', value: '264' },
          ]}
        />

        <ProfileDetailsGroup title="COMPANY" rows={[{ label: 'Headquarters', value: 'Sri Lanka' }]} />
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
