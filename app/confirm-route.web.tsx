import React from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const teal = '#169F95';

export default function ConfirmRouteWebScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const pName = (params.pName as string) || 'Pickup';
  const dName = (params.dName as string) || 'Drop-off';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#123532" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Route</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>TRIP DETAILS</Text>
          <Text style={styles.title}>Review your ride</Text>
          <Text style={styles.subtitle}>Confirm route, vehicle type, and payment before requesting a driver.</Text>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusIconWrap}>
            <MaterialCommunityIcons name="map-search-outline" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusTitle}>Route preview</Text>
            <Text style={styles.statusSubtitle}>Map preview is available on mobile. These ride details are ready to confirm.</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Ionicons name="navigate-outline" size={18} color={teal} />
            <Text style={styles.summaryValue}>9.3</Text>
            <Text style={styles.summaryLabel}>Km</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="time-outline" size={18} color={teal} />
            <Text style={styles.summaryValue}>26m</Text>
            <Text style={styles.summaryLabel}>ETA</Text>
          </View>
          <View style={styles.summaryCard}>
            <Ionicons name="cash-outline" size={18} color={teal} />
            <Text style={styles.summaryValue}>1301</Text>
            <Text style={styles.summaryLabel}>Fare</Text>
          </View>
        </View>

        <View style={styles.routeBlock}>
          <RoutePoint icon="radio-button-on" label="Pickup" value={pName} />
          <View style={styles.routeDivider} />
          <RoutePoint icon="location" label="Drop-off" value={dName} />
        </View>

        <View style={styles.loaderRow}>
          <ActivityIndicator size="small" color={teal} />
          <Text style={styles.loaderText}>Preparing route details...</Text>
        </View>

        <View style={styles.quickOptionsRow}>
          <VehicleOption name="Mini" price="LKR 1301" active />
          <VehicleOption name="Car" price="LKR 1450" />
          <VehicleOption name="Van" price="LKR 2100" />
        </View>

        <TouchableOpacity style={styles.confirmButton}>
          <Text style={styles.confirmText}>Confirm Mini - LKR 1301</Text>
          <Feather name="chevron-right" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>
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
        <Text style={styles.routeValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

function VehicleOption({ name, price, active = false }: { name: string; price: string; active?: boolean }) {
  return (
    <View style={[styles.optionCard, active && styles.optionCardActive]}>
      <Text style={[styles.optionName, active && styles.optionNameActive]}>{name}</Text>
      <Text style={[styles.optionPrice, active && styles.optionPriceActive]}>{price}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F8F7',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D9E9E6',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#123532',
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
    marginBottom: 12,
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
  loaderRow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    backgroundColor: '#FFFFFF',
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    color: '#617C79',
    fontWeight: '700',
  },
  quickOptionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  optionCardActive: {
    backgroundColor: teal,
    borderColor: teal,
  },
  optionName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#123532',
    marginBottom: 3,
  },
  optionNameActive: {
    color: '#FFFFFF',
  },
  optionPrice: {
    fontSize: 12,
    color: '#617C79',
    fontWeight: '700',
  },
  optionPriceActive: {
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
