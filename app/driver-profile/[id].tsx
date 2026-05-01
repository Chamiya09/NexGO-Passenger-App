import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import RefreshableScrollView from '@/components/RefreshableScrollView';
import { fetchPublicDriverProfile, PublicDriverProfile } from '@/lib/driverProfiles';

const teal = '#169F95';

type DriverProfileParams = {
  id?: string;
  rideId?: string;
  name?: string;
  phone?: string;
  image?: string;
  vehicleType?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
  vehicleCategory?: string;
};

const formatVehicleName = (driver?: PublicDriverProfile | null) => {
  const vehicle = driver?.vehicle;
  if (!vehicle) return 'Vehicle not available';

  const parts = [vehicle.color, vehicle.make, vehicle.model].filter(Boolean);
  return parts.length ? parts.join(' ') : vehicle.category ?? 'Vehicle not available';
};

const formatDate = (iso?: string | null) => {
  if (!iso) return '';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  return date.toLocaleDateString('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export default function DriverProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<DriverProfileParams>();
  const driverId = String(params.id ?? '');
  const rideId = String(params.rideId ?? '');
  const fallbackName = String(params.name ?? '');
  const fallbackPhone = String(params.phone ?? '');
  const fallbackImage = String(params.image ?? '');
  const fallbackVehicleType = String(params.vehicleType ?? '');
  const fallbackVehicleMake = String(params.vehicleMake ?? '');
  const fallbackVehicleModel = String(params.vehicleModel ?? '');
  const fallbackVehiclePlate = String(params.vehiclePlate ?? '');
  const fallbackVehicleColor = String(params.vehicleColor ?? '');
  const fallbackVehicleCategory = String(params.vehicleCategory ?? '');

  const [driver, setDriver] = useState<PublicDriverProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fallbackDriver = useMemo<PublicDriverProfile>(() => ({
    id: driverId,
    fullName: fallbackName || 'Driver',
    phoneNumber: fallbackPhone,
    profileImageUrl: fallbackImage,
    status: '',
    isOnline: false,
    ratingAverage: 0,
    ratingCount: 0,
    completedRides: 0,
    vehicle: {
      category: fallbackVehicleCategory || fallbackVehicleType,
      make: fallbackVehicleMake,
      model: fallbackVehicleModel,
      plateNumber: fallbackVehiclePlate,
      color: fallbackVehicleColor,
    },
    recentReviews: [],
  }), [
    driverId,
    fallbackImage,
    fallbackName,
    fallbackPhone,
    fallbackVehicleCategory,
    fallbackVehicleColor,
    fallbackVehicleMake,
    fallbackVehicleModel,
    fallbackVehiclePlate,
    fallbackVehicleType,
  ]);

  useEffect(() => {
    let cancelled = false;

    const loadDriver = async () => {
      if (!driverId && !rideId) {
        setDriver(fallbackDriver);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const profile = await fetchPublicDriverProfile(driverId, rideId);
        if (!cancelled) {
          setDriver(profile);
        }
      } catch (loadError) {
        if (!cancelled) {
          setDriver(fallbackDriver);
          setError(loadError instanceof Error ? loadError.message : 'Live profile data unavailable');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDriver();

    return () => {
      cancelled = true;
    };
  }, [driverId, fallbackDriver, rideId]);

  const displayName = driver?.fullName || fallbackName || 'Driver';
  const ratingLabel = driver?.ratingCount
    ? `${driver.ratingAverage.toFixed(1)} average`
    : 'No ratings yet';
  const ratingValue = driver?.ratingCount ? driver.ratingAverage.toFixed(1) : 'New';

  return (
    <View style={styles.overlay}>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'transparentModal',
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      <StatusBar style="light" />
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />

      <View style={styles.popup}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color="#102A28" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>DRIVER PROFILE</Text>
            <Text style={styles.title} numberOfLines={1}>{displayName}</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="large" color={teal} />
            <Text style={styles.centerText}>Loading driver profile...</Text>
          </View>
        ) : (
          <RefreshableScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {error ? (
              <View style={styles.inlineNotice}>
                <Ionicons name="cloud-offline-outline" size={16} color="#D97706" />
                <Text style={styles.inlineNoticeText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.profileHero}>
              <View style={styles.heroTop}>
                <View style={styles.avatarWrap}>
                  {driver?.profileImageUrl ? (
                    <Image source={{ uri: driver.profileImageUrl }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.avatarInitial}>{displayName.trim().charAt(0).toUpperCase()}</Text>
                  )}
                </View>
                <View style={styles.heroCopy}>
                  <Text style={styles.driverName} numberOfLines={1}>{displayName}</Text>
                  <Text style={styles.vehicleSummary} numberOfLines={1}>{formatVehicleName(driver)}</Text>
                  <View style={styles.heroPills}>
                    <View style={styles.statusPill}>
                      <View style={[styles.statusDot, { backgroundColor: driver?.isOnline ? teal : '#8CA1A0' }]} />
                      <Text style={styles.statusText}>{driver?.isOnline ? 'Online' : 'Offline'}</Text>
                    </View>
                    <View style={styles.ratingPill}>
                      <Ionicons name="star" size={13} color="#F5A623" />
                      <Text style={styles.ratingPillText}>{ratingValue}</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.heroRatingPanel}>
                <View style={styles.ratingPanelCopy}>
                  <Text style={styles.ratingPanelValue}>{ratingValue}</Text>
                  <View>
                    <StarStrip rating={driver?.ratingAverage ?? 0} size={15} />
                    <Text style={styles.ratingPanelLabel}>{ratingLabel}</Text>
                  </View>
                </View>
                <View style={styles.tripBadge}>
                  <Ionicons name="checkmark-done" size={15} color={teal} />
                  <Text style={styles.tripBadgeText}>{driver?.completedRides ?? 0} trips</Text>
                </View>
              </View>
            </View>

            <View style={styles.statsRow}>
              <StatBox icon="star" label="Ratings" value={String(driver?.ratingCount ?? 0)} />
              <StatBox icon="checkmark-done" label="Trips" value={String(driver?.completedRides ?? 0)} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Vehicle</Text>
              <InfoRow icon="car-outline" label="Vehicle" value={formatVehicleName(driver)} />
              <InfoRow icon="apps-outline" label="Category" value={driver?.vehicle?.category || 'Not available'} />
              <InfoRow icon="card-outline" label="Plate" value={driver?.vehicle?.plateNumber || 'Not available'} />
              <InfoRow icon="people-outline" label="Seats" value={driver?.vehicle?.seats ? String(driver.vehicle.seats) : 'Not available'} />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Contact</Text>
              <InfoRow icon="call-outline" label="Phone" value={driver?.phoneNumber || 'Not available'} selectable />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top Rated Reviews</Text>
                <Text style={styles.sectionMeta}>Best 3</Text>
              </View>
              {driver?.recentReviews?.length ? (
                driver.recentReviews.map((review, index) => (
                  <View key={`${review.reviewedAt ?? index}`} style={styles.reviewRow}>
                    <View style={styles.reviewTopRow}>
                      <View style={styles.reviewRank}>
                        <Text style={styles.reviewRankText}>{index + 1}</Text>
                      </View>
                      <StarStrip rating={review.rating} size={14} />
                      <Text style={styles.reviewScore}>{review.rating}.0</Text>
                    </View>
                    {review.comment ? <Text style={styles.reviewComment}>{review.comment}</Text> : null}
                    {formatDate(review.reviewedAt) ? (
                      <Text style={styles.reviewDate}>{formatDate(review.reviewedAt)}</Text>
                    ) : null}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyReviews}>No passenger reviews yet.</Text>
              )}
            </View>
          </RefreshableScrollView>
        )}
      </View>
    </View>
  );
}

function StarStrip({ rating, size }: { rating: number; size: number }) {
  return (
    <View style={styles.starStrip}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Ionicons
          key={star}
          name={star <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={star <= Math.round(rating) ? '#F5A623' : '#B7C7C5'}
        />
      ))}
    </View>
  );
}

function StatBox({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon} size={18} color={teal} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  selectable,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  selectable?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={17} color={teal} />
      </View>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue} selectable={selectable}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 20, 19, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  popup: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '88%',
    alignSelf: 'center',
    backgroundColor: '#F4F8F7',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  header: {
    minHeight: 68,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3EFED',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0F5F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  eyebrow: {
    color: teal,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  title: {
    color: '#102A28',
    fontSize: 20,
    fontWeight: '900',
  },
  centerState: {
    padding: 34,
    alignItems: 'center',
    gap: 12,
  },
  centerText: {
    color: teal,
    fontSize: 14,
    fontWeight: '800',
  },
  errorText: {
    color: '#617C79',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    padding: 14,
    gap: 12,
  },
  inlineNotice: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F8D58C',
    backgroundColor: '#FFF8EC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineNoticeText: {
    flex: 1,
    color: '#9A6200',
    fontSize: 12,
    fontWeight: '800',
  },
  profileHero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    padding: 16,
    gap: 14,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
  },
  avatarWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#E7F5F3',
    borderWidth: 1,
    borderColor: '#BFE7E2',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitial: {
    color: teal,
    fontSize: 28,
    fontWeight: '900',
  },
  heroCopy: {
    flex: 1,
    gap: 5,
  },
  driverName: {
    color: '#102A28',
    fontSize: 20,
    fontWeight: '900',
  },
  vehicleSummary: {
    color: '#617C79',
    fontSize: 13,
    fontWeight: '800',
  },
  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#F7FBFA',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#617C79',
    fontSize: 12,
    fontWeight: '800',
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#FFF8EC',
    borderWidth: 1,
    borderColor: '#F8D58C',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  ratingPillText: {
    color: '#9A6200',
    fontSize: 12,
    fontWeight: '900',
  },
  heroRatingPanel: {
    borderRadius: 14,
    backgroundColor: '#F7FBFA',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ratingPanelCopy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  ratingPanelValue: {
    color: '#102A28',
    fontSize: 27,
    fontWeight: '900',
  },
  ratingPanelLabel: {
    color: '#617C79',
    fontSize: 11,
    fontWeight: '800',
    marginTop: 2,
  },
  tripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#E7F5F3',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tripBadgeText: {
    color: teal,
    fontSize: 12,
    fontWeight: '900',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#102A28',
    fontSize: 14,
    fontWeight: '900',
    textAlign: 'center',
  },
  statLabel: {
    color: '#617C79',
    fontSize: 11,
    fontWeight: '800',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    padding: 12,
    gap: 11,
  },
  sectionTitle: {
    color: '#102A28',
    fontSize: 15,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionMeta: {
    color: teal,
    fontSize: 11,
    fontWeight: '900',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E7F5F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    flex: 1,
  },
  infoLabel: {
    color: '#617C79',
    fontSize: 11,
    fontWeight: '700',
  },
  infoValue: {
    color: '#102A28',
    fontSize: 14,
    fontWeight: '800',
  },
  reviewRow: {
    borderRadius: 14,
    backgroundColor: '#F7FBFA',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    padding: 11,
    gap: 7,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  reviewRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E7F5F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewRankText: {
    color: teal,
    fontSize: 12,
    fontWeight: '900',
  },
  starStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewScore: {
    color: '#617C79',
    fontSize: 12,
    fontWeight: '900',
  },
  reviewComment: {
    color: '#102A28',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  reviewDate: {
    color: '#8CA1A0',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyReviews: {
    color: '#617C79',
    fontSize: 13,
    fontWeight: '700',
  },
});
