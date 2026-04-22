import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function RideWebScreen() {
  const router = useRouter();
  const [pickup] = useState('Colombo Fort');
  const [dropoff] = useState('Bambalapitiya');
  const [selectedVehicle, setSelectedVehicle] = useState<'Mini' | 'Sedan' | 'Van'>('Mini');

  const priceMap = {
    Mini: 'LKR 1301',
    Sedan: 'LKR 1450',
    Van: 'LKR 2100',
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.mapFallbackCard}>
          <Ionicons name="map-outline" size={36} color="#14988F" />
          <Text style={styles.fallbackTitle}>Interactive map is available on mobile app</Text>
          <Text style={styles.fallbackHint}>
            Web uses a simplified ride flow. You can continue and confirm your ride from here.
          </Text>
        </View>

        <View style={styles.routeCard}>
          <Text style={styles.sectionTitle}>ROUTE</Text>
          <View style={styles.routeRow}>
            <Feather name="map-pin" size={16} color="#14988F" />
            <Text style={styles.routeText}>Pickup: {pickup}</Text>
          </View>
          <View style={styles.routeRow}>
            <Feather name="flag" size={16} color="#14988F" />
            <Text style={styles.routeText}>Drop-off: {dropoff}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>CHOOSE VEHICLE</Text>
        <View style={styles.vehicleRow}>
          {(['Mini', 'Sedan', 'Van'] as const).map((vehicle) => {
            const active = selectedVehicle === vehicle;
            return (
              <TouchableOpacity
                key={vehicle}
                style={[styles.vehicleCard, active && styles.vehicleCardActive]}
                onPress={() => setSelectedVehicle(vehicle)}>
                <MaterialCommunityIcons
                  name={vehicle === 'Van' ? 'van-passenger' : vehicle === 'Sedan' ? 'car-estate' : 'car'}
                  size={24}
                  color={active ? '#FFFFFF' : '#14988F'}
                />
                <Text style={[styles.vehicleName, active && styles.vehicleNameActive]}>{vehicle}</Text>
                <Text style={[styles.vehiclePrice, active && styles.vehiclePriceActive]}>{priceMap[vehicle]}</Text>
              </TouchableOpacity>
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
              },
            })
          }>
          <Text style={styles.confirmText}>Confirm {selectedVehicle} - {priceMap[selectedVehicle]}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  mapFallbackCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#123532',
    marginTop: 10,
    marginBottom: 6,
  },
  fallbackHint: {
    fontSize: 13,
    lineHeight: 19,
    color: '#617C79',
  },
  sectionTitle: {
    fontSize: 12,
    color: '#617C79',
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  routeText: {
    fontSize: 14,
    color: '#123532',
    fontWeight: '600',
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
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 5,
  },
  vehicleCardActive: {
    backgroundColor: '#14988F',
    borderColor: '#14988F',
  },
  vehicleName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#123532',
  },
  vehicleNameActive: {
    color: '#FFFFFF',
  },
  vehiclePrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#617C79',
  },
  vehiclePriceActive: {
    color: '#FFFFFF',
  },
  confirmButton: {
    backgroundColor: '#14988F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
