import React, { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import RefreshableScrollView from '@/components/RefreshableScrollView';

const teal = '#169F95';

export default function RideWebScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [pickup] = useState('Colombo Fort');
  const [dropoff] = useState('Bambalapitiya');
  const [selectedVehicle, setSelectedVehicle] = useState<'Mini' | 'Sedan' | 'Van'>('Mini');
  const selectedPromoCode = typeof params.promoCode === 'string' ? params.promoCode : '';

  const priceMap = {
    Mini: 'LKR 1301',
    Sedan: 'LKR 1450',
    Van: 'LKR 2100',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <RefreshableScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>BOOK RIDE</Text>
          <Text style={styles.title}>Plan your trip</Text>
          <Text style={styles.subtitle}>Choose pickup, drop-off, and vehicle type with the same NexGO ride flow.</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusIconWrap}>
            <Ionicons name="map-outline" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusTitle}>Map preview</Text>
            <Text style={styles.statusSubtitle}>Interactive map is available on mobile. Web keeps booking simple and clear.</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="time-outline" size={18} color={teal} />
            <Text style={styles.summaryValue}>26m</Text>
            <Text style={styles.summaryLabel}>ETA</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="navigate-outline" size={18} color={teal} />
            <Text style={styles.summaryValue}>9.3</Text>
            <Text style={styles.summaryLabel}>Km</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="cash-outline" size={18} color={teal} />
            <Text style={styles.summaryValue}>{priceMap[selectedVehicle].replace('LKR ', '')}</Text>
            <Text style={styles.summaryLabel}>Fare</Text>
          </View>
        </View>

        <View style={styles.routeBlock}>
          <RoutePoint icon="radio-button-on" label="Pickup" value={pickup} />
          <View style={styles.routeDivider} />
          <RoutePoint icon="location" label="Drop-off" value={dropoff} />
        </View>

        <View style={styles.sectionHeadingWrap}>
          <Text style={styles.sectionHeading}>Choose Vehicle</Text>
          <Text style={styles.sectionSubheading}>Select a ride type before confirming</Text>
        </View>

        <View style={styles.vehicleRow}>
          {(['Mini', 'Sedan', 'Van'] as const).map((vehicle) => {
            const active = selectedVehicle === vehicle;
            return (
              <Pressable
                key={vehicle}
                style={[styles.vehicleCard, active && styles.vehicleCardActive]}
                onPress={() => setSelectedVehicle(vehicle)}>
                <MaterialCommunityIcons
                  name={vehicle === 'Van' ? 'van-passenger' : vehicle === 'Sedan' ? 'car-estate' : 'car'}
                  size={24}
                  color={active ? '#FFFFFF' : teal}
                />
                <Text style={[styles.vehicleName, active && styles.vehicleNameActive]}>{vehicle}</Text>
                <Text style={[styles.vehiclePrice, active && styles.vehiclePriceActive]}>{priceMap[vehicle]}</Text>
              </Pressable>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.confirmButton}
          onPress={() =>
            router.push({
              pathname: '/confirm-route',
              params: {
                pLat: '6.9271',
                pLng: '79.8612',
                pName: pickup,
                dLat: '6.9066',
                dLng: '79.8707',
                dName: dropoff,
                ...(selectedPromoCode && { promoCode: selectedPromoCode }),
              },
            })
          }>
          <Text style={styles.confirmText}>Confirm {selectedVehicle} - {priceMap[selectedVehicle]}</Text>
          <Feather name="chevron-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}

function RoutePoint({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.routePoint}>
      <View style={styles.routeIconWrap}>
        <Ionicons name={icon} size={16} color={teal} />
      </View>
      <View style={styles.routeTextWrap}>
        <Text style={styles.routeLabel}>{label}</Text>
        <Text style={styles.routeValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8F7',
  },
  container: {
    padding: 16,
    paddingBottom: 28,
  },
  header: {
    marginBottom: 16,
  },
  eyebrow: {
    color: teal,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 4,
  },
  title: {
    color: '#102A28',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 5,
  },
  subtitle: {
    color: '#617C79',
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  statusCard: {
    borderRadius: 22,
    backgroundColor: teal,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextWrap: {
    flex: 1,
  },
  statusTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 3,
  },
  statusSubtitle: {
    color: 'rgba(255, 255, 255, 0.86)',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  summaryValue: {
    color: '#102A28',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 6,
  },
  summaryLabel: {
    color: '#617C79',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  routeBlock: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    padding: 14,
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E7F5F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    color: '#617C79',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  routeValue: {
    color: '#102A28',
    fontSize: 14,
    fontWeight: '800',
  },
  routeDivider: {
    height: 1,
    backgroundColor: '#D9E9E6',
    marginVertical: 10,
    marginLeft: 42,
  },
  sectionHeadingWrap: {
    marginBottom: 10,
  },
  sectionHeading: {
    color: '#102A28',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionSubheading: {
    color: '#617C79',
    fontSize: 12,
    fontWeight: '500',
  },
  vehicleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 5,
  },
  vehicleCardActive: {
    backgroundColor: teal,
    borderColor: teal,
  },
  vehicleName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#123532',
  },
  vehicleNameActive: {
    color: '#FFFFFF',
  },
  vehiclePrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#617C79',
  },
  vehiclePriceActive: {
    color: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: teal,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
