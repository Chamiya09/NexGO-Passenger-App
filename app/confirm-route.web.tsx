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
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

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
        <View style={styles.mapFallbackCard}>
          <MaterialCommunityIcons name="map-search-outline" size={34} color="#14988F" />
          <Text style={styles.mapFallbackTitle}>Map preview is available on mobile app</Text>
          <Text style={styles.mapFallbackHint}>Continue booking here, or use Android/iOS for interactive map routing.</Text>
        </View>

        <View style={styles.routeCard}>
          <Text style={styles.sectionTitle}>Trip</Text>
          <Text style={styles.routeLine} numberOfLines={1}>From: {pName}</Text>
          <Text style={styles.routeLine} numberOfLines={1}>To: {dName}</Text>

          <View style={styles.loaderRow}>
            <ActivityIndicator size="small" color="#14988F" />
            <Text style={styles.loaderText}>Preparing route details...</Text>
          </View>
        </View>

        <View style={styles.quickOptionsRow}>
          <View style={styles.optionCard}>
            <Text style={styles.optionName}>Mini</Text>
            <Text style={styles.optionPrice}>LKR 1301</Text>
          </View>
          <View style={styles.optionCard}>
            <Text style={styles.optionName}>Sedan</Text>
            <Text style={styles.optionPrice}>LKR 1450</Text>
          </View>
          <View style={styles.optionCard}>
            <Text style={styles.optionName}>Van</Text>
            <Text style={styles.optionPrice}>LKR 2100</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.confirmButton}>
          <Text style={styles.confirmText}>Confirm Mini - LKR 1301</Text>
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
  mapFallbackCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  mapFallbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#123532',
    marginTop: 10,
    marginBottom: 6,
  },
  mapFallbackHint: {
    fontSize: 13,
    lineHeight: 19,
    color: '#617C79',
  },
  routeCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#617C79',
    marginBottom: 8,
  },
  routeLine: {
    fontSize: 14,
    color: '#123532',
    fontWeight: '600',
    marginBottom: 4,
  },
  loaderRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    color: '#617C79',
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
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  optionName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#123532',
    marginBottom: 3,
  },
  optionPrice: {
    fontSize: 12,
    color: '#617C79',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#14988F',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
