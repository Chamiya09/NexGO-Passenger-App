import React from 'react';
import { SafeAreaView, StyleSheet, Text } from 'react-native';

import RefreshableScrollView from '@/components/RefreshableScrollView';
import { ProfileDetailsGroup } from '@/components/profile/profile-details-group';

export default function MembershipScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <RefreshableScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageHint}>Benefits and offers available with your current tier.</Text>

        <ProfileDetailsGroup
          title="CURRENT PLAN"
          rows={[
            { label: 'Tier', value: 'Blue Member' },
            { label: 'Points balance', value: '450 pts' },
          ]}
        />

        <ProfileDetailsGroup
          title="BENEFITS"
          rows={[
            { label: 'Ride cashback', value: 'Up to 5%' },
            { label: 'Priority support', value: 'Included' },
          ]}
        />
      </RefreshableScrollView>
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
