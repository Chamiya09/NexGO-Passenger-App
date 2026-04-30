import React from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import RefreshableScrollView from '@/components/RefreshableScrollView';

export default function SavedAddressesWebScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <RefreshableScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.badge}>
            <Ionicons name="map-outline" size={15} color="#14988F" />
            <Text style={styles.badgeText}>Map-based selection</Text>
          </View>

          <Text style={styles.title}>Saved Addresses</Text>
          <Text style={styles.hint}>
            Address selection on this page uses the interactive map flow from the mobile app, similar to ride booking.
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="phone-portrait-outline" size={28} color="#14988F" />
          <Text style={styles.infoTitle}>Open this page on Android or iPhone</Text>
          <Text style={styles.infoText}>
            Saved addresses are now chosen from the map and stored with exact coordinates in the database.
          </Text>
        </View>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8F7',
  },
  container: {
    padding: 20,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE9E7',
    padding: 16,
    marginBottom: 14,
  },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E7F5F3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  badgeText: {
    color: '#14988F',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#123532',
    marginBottom: 6,
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#6A807D',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DFE9E7',
    padding: 20,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#123532',
    marginTop: 12,
    marginBottom: 6,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
    color: '#6A807D',
    textAlign: 'center',
  },
});
