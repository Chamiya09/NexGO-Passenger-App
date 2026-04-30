import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import RefreshableScrollView from '@/components/RefreshableScrollView';
import { clearPassengerActiveRide } from '@/lib/activeRideStorage';

const teal = '#169F95';

const getParam = (value: string | string[] | undefined, fallback = '') =>
  Array.isArray(value) ? value[0] ?? fallback : value ?? fallback;

export default function ActiveRideWebScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const driverName = getParam(params.driverName, 'Driver');
  const vehicleType = getParam(params.vehicleType, 'Vehicle');
  const status = getParam(params.status, 'Accepted');

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <RefreshableScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backButton} onPress={() => router.replace('/(tabs)/home')}>
          <Ionicons name="arrow-back" size={20} color="#123532" />
        </Pressable>

        <View style={styles.heroCard}>
          <View style={styles.iconWrap}>
            <Ionicons name="navigate" size={34} color="#FFFFFF" />
          </View>
          <Text style={styles.eyebrow}>LIVE RIDE</Text>
          <Text style={styles.title}>Track your NexGO ride</Text>
          <Text style={styles.subtitle}>Open the mobile app for the live map view. Web keeps this route available for preview.</Text>
          <View style={styles.statusPill}>
            <Ionicons name="radio-outline" size={15} color="#017270" />
            <Text style={styles.statusText}>{status}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Driver</Text>
          <Text style={styles.driverName}>{driverName}</Text>
          <Text style={styles.driverMeta}>{vehicleType}</Text>
        </View>

        <Pressable
          style={styles.homeButton}
          onPress={() => {
            clearPassengerActiveRide();
            router.replace('/(tabs)/home');
          }}>
          <Text style={styles.homeButtonText}>Return Home</Text>
        </Pressable>
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
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    padding: 22,
    gap: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: teal,
    borderRadius: 24,
    padding: 22,
    gap: 12,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 11,
    fontWeight: '900',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    color: '#017270',
    fontSize: 13,
    fontWeight: '900',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    color: '#123532',
    fontSize: 17,
    fontWeight: '900',
  },
  driverName: {
    color: '#123532',
    fontSize: 16,
    fontWeight: '900',
  },
  driverMeta: {
    color: '#617C79',
    fontSize: 13,
    fontWeight: '700',
  },
  homeButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#017270',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
