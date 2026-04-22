import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text } from 'react-native';

import { ProfileDetailsGroup } from '@/components/profile/profile-details-group';

export default function SavedAddressesScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageHint}>Manage your favorite places for quick pickup and drop-off.</Text>

        <ProfileDetailsGroup
          title="FAVORITES"
          rows={[
            { label: 'Home', value: 'Set' },
            { label: 'Work', value: 'Set' },
            { label: 'Airport', value: 'Set' },
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
