import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import RefreshableScrollView from '@/components/RefreshableScrollView';
import { fetchRideReview, RideReview, saveRideReview } from '@/lib/rideReviews';
import { useAuth } from '@/context/auth-context';

const teal = '#169F95';

type RideDetailsParams = {
  id?: string;
  status?: string;
  vehicleType?: string;
  price?: string;
  requestedAt?: string;
  acceptedAt?: string;
  completedAt?: string;
  pName?: string;
  pLat?: string;
  pLng?: string;
  dName?: string;
  dLat?: string;
  dLng?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverImage?: string;
  vehicleMake?: string;
  vehicleModel?: string;
  vehiclePlate?: string;
  vehicleColor?: string;
  vehicleCategory?: string;
};

const formatDate = (iso?: string) => {
  if (!iso) return 'Not available';

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'Not available';

  return date.toLocaleDateString('en-LK', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatMoney = (value?: string) => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return 'LKR 0';
  return `LKR ${amount.toLocaleString()}`;
};

const formatCoords = (lat?: string, lng?: string) => {
  const latitude = Number(lat);
  const longitude = Number(lng);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return 'Coordinates not available';
  }

  return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
};

const vehicleName = (params: RideDetailsParams) => {
  const parts = [params.vehicleColor, params.vehicleMake, params.vehicleModel].filter(Boolean);
  return parts.length ? parts.join(' ') : params.vehicleType || 'Vehicle not available';
};

export default function RideDetailsScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams<RideDetailsParams>();
  const isCompleted = String(params.status ?? '').toLowerCase() === 'completed';
  const rideId = String(params.id ?? '');
  const driverId = String(params.driverId ?? '');
  const [review, setReview] = useState<RideReview | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    const hydrateReview = async () => {
      const storedReview = await fetchRideReview(rideId, token);
      if (cancelled) return;

      setReview(storedReview);
      setRating(storedReview?.rating ?? 0);
      setComment(storedReview?.comment ?? '');
    };

    if (rideId) {
      void hydrateReview();
    }

    return () => {
      cancelled = true;
    };
  }, [rideId, token]);

  const handleSaveReview = async () => {
    if (!rideId || rating < 1 || saving) return;

    try {
      setSaving(true);
      setSaveMessage('');
      const nextReview = await saveRideReview(rideId, rating, comment, token);
      setReview(nextReview);
      setSaveMessage('Review saved');
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : 'Unable to save review');
    } finally {
      setSaving(false);
    }
  };

  const openDriverProfile = () => {
    if (!driverId) return;

    router.push({
      pathname: '/driver-profile/[id]',
      params: {
        id: driverId,
        name: params.driverName ?? '',
      },
    });
  };

  return (
    <View style={styles.overlay}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />

      <View style={styles.popup}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="receipt-outline" size={22} color={teal} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>COMPLETED RIDE</Text>
            <Text style={styles.title}>Ride Details</Text>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <Ionicons name="close" size={20} color="#102A28" />
          </TouchableOpacity>
        </View>

        {!isCompleted ? (
          <View style={styles.unavailableBox}>
            <Ionicons name="lock-closed-outline" size={28} color="#D97706" />
            <Text style={styles.unavailableTitle}>Details available after completion</Text>
            <Text style={styles.unavailableText}>
              Ride details and driver information are shown only for completed rides.
            </Text>
          </View>
        ) : (
          <RefreshableScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.totalBox}>
              <Text style={styles.totalLabel}>Total fare</Text>
              <Text style={styles.totalValue}>{formatMoney(params.price)}</Text>
              <View style={styles.completedPill}>
                <Ionicons name="checkmark-done-circle-outline" size={15} color="#4A6FA5" />
                <Text style={styles.completedText}>Completed</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Rider Details</Text>
              <TouchableOpacity
                style={styles.driverRow}
                onPress={openDriverProfile}
                disabled={!driverId}
                activeOpacity={0.75}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(params.driverName || 'D').trim().charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.driverTextWrap}>
                  <Text style={styles.driverName}>{params.driverName || 'Driver not available'}</Text>
                  <Text style={styles.driverMeta}>{params.driverPhone || 'Phone not available'}</Text>
                </View>
                {driverId ? <Ionicons name="chevron-forward" size={18} color="#8CA1A0" /> : null}
              </TouchableOpacity>
              <InfoRow icon="car-outline" label="Vehicle" value={vehicleName(params)} />
              <InfoRow icon="card-outline" label="Plate number" value={params.vehiclePlate || 'Not available'} selectable />
              <InfoRow icon="apps-outline" label="Category" value={params.vehicleCategory || params.vehicleType || 'Not available'} />
            </View>

            <View style={styles.routeBox}>
              <RoutePoint
                color={teal}
                icon="radio-button-on"
                label="Pickup"
                name={params.pName || 'Pickup location'}
                coords={formatCoords(params.pLat, params.pLng)}
              />
              <View style={styles.routeConnector} />
              <RoutePoint
                color="#E74C3C"
                icon="location"
                label="Drop-off"
                name={params.dName || 'Drop-off location'}
                coords={formatCoords(params.dLat, params.dLng)}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ride Details</Text>
              <InfoRow icon="calendar-outline" label="Requested" value={formatDate(params.requestedAt)} />
              <InfoRow icon="flag-outline" label="Completed" value={formatDate(params.completedAt)} />
              <InfoRow icon="pricetag-outline" label="Ride ID" value={params.id || 'Not available'} selectable />
              <InfoRow icon="wallet-outline" label="Payment" value="Cash" />
            </View>

            <View style={styles.reviewSection}>
              <View style={styles.reviewHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Review & Rating</Text>
                  <Text style={styles.reviewSubtitle}>
                    {review ? 'Your feedback for this ride' : 'Rate your completed ride'}
                  </Text>
                </View>
                {review ? (
                  <View style={styles.savedBadge}>
                    <Ionicons name="checkmark-circle" size={14} color={teal} />
                    <Text style={styles.savedBadgeText}>Saved</Text>
                  </View>
                ) : null}
              </View>

              <View style={styles.starPicker}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    style={[
                      styles.starButton,
                      star <= rating && styles.starButtonActive,
                    ]}
                    onPress={() => {
                      setRating(star);
                      setSaveMessage('');
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={24}
                      color={star <= rating ? '#F5A623' : '#8CA1A0'}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.reviewInput}
                value={comment}
                onChangeText={(value) => {
                  setComment(value);
                  setSaveMessage('');
                }}
                placeholder="Share what went well..."
                placeholderTextColor="#8CA1A0"
                multiline
                maxLength={220}
                textAlignVertical="top"
              />

              <View style={styles.reviewFooter}>
                <Text style={styles.characterCount}>{comment.trim().length}/220</Text>
                {saveMessage ? <Text style={styles.saveMessage}>{saveMessage}</Text> : null}
              </View>

              <TouchableOpacity
                style={[
                  styles.saveReviewButton,
                  (rating < 1 || saving) && styles.saveReviewButtonDisabled,
                ]}
                onPress={handleSaveReview}
                disabled={rating < 1 || saving}
              >
                <Ionicons name="star" size={16} color="#FFFFFF" />
                <Text style={styles.saveReviewButtonText}>
                  {saving ? 'Saving...' : review ? 'Update review' : 'Submit review'}
                </Text>
              </TouchableOpacity>
            </View>
          </RefreshableScrollView>
        )}
      </View>
    </View>
  );
}

function RoutePoint({
  color,
  icon,
  label,
  name,
  coords,
}: {
  color: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  name: string;
  coords: string;
}) {
  return (
    <View style={styles.routePoint}>
      <View style={[styles.routeIconWrap, { backgroundColor: `${color}18` }]}>
        <Ionicons name={icon} size={17} color={color} />
      </View>
      <View style={styles.routeTextWrap}>
        <Text style={styles.routeLabel}>{label}</Text>
        <Text style={styles.routeName}>{name}</Text>
        <Text style={styles.routeCoords} selectable>{coords}</Text>
      </View>
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
      <View style={styles.infoIconWrap}>
        <Ionicons name={icon} size={17} color={teal} />
      </View>
      <View style={styles.infoTextWrap}>
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
    padding: 18,
  },
  popup: {
    maxHeight: '88%',
    backgroundColor: '#F4F8F7',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#D9E9E6',
  },
  header: {
    minHeight: 70,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3EFED',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#E7F5F3',
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
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F0F5F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 14,
    gap: 12,
  },
  totalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    padding: 14,
    gap: 8,
  },
  totalLabel: {
    color: '#617C79',
    fontSize: 12,
    fontWeight: '800',
  },
  totalValue: {
    color: '#102A28',
    fontSize: 27,
    fontWeight: '900',
  },
  completedPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#F0F5FA',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  completedText: {
    color: '#4A6FA5',
    fontSize: 12,
    fontWeight: '900',
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
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingBottom: 2,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E7F5F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: teal,
    fontSize: 18,
    fontWeight: '900',
  },
  driverTextWrap: {
    flex: 1,
  },
  driverName: {
    color: '#102A28',
    fontSize: 16,
    fontWeight: '900',
  },
  driverMeta: {
    color: '#617C79',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  routeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    padding: 14,
  },
  routePoint: {
    flexDirection: 'row',
    gap: 12,
  },
  routeIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    color: '#617C79',
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 2,
  },
  routeName: {
    color: '#102A28',
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 19,
  },
  routeCoords: {
    color: '#617C79',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  routeConnector: {
    width: 2,
    height: 22,
    backgroundColor: '#D9E9E6',
    marginLeft: 18,
    marginVertical: 5,
    borderRadius: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#E7F5F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: {
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
  reviewSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    padding: 12,
    gap: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  reviewSubtitle: {
    color: '#617C79',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: '#E7F5F3',
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  savedBadgeText: {
    color: teal,
    fontSize: 11,
    fontWeight: '900',
  },
  starPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  starButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    backgroundColor: '#F7FBFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButtonActive: {
    borderColor: '#F8D58C',
    backgroundColor: '#FFF8EC',
  },
  reviewInput: {
    minHeight: 92,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    backgroundColor: '#F7FBFA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#102A28',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  reviewFooter: {
    minHeight: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  characterCount: {
    color: '#8CA1A0',
    fontSize: 11,
    fontWeight: '800',
  },
  saveMessage: {
    color: teal,
    fontSize: 12,
    fontWeight: '900',
  },
  saveReviewButton: {
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: teal,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  saveReviewButtonDisabled: {
    backgroundColor: '#A7C8C4',
  },
  saveReviewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  unavailableBox: {
    padding: 28,
    alignItems: 'center',
    gap: 10,
  },
  unavailableTitle: {
    color: '#102A28',
    fontSize: 16,
    fontWeight: '900',
    textAlign: 'center',
  },
  unavailableText: {
    color: '#617C79',
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 19,
    textAlign: 'center',
  },
});
