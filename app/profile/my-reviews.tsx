import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import RefreshableScrollView from '@/components/RefreshableScrollView';
import { useAuth } from '@/context/auth-context';
import { API_BASE_URL, parseApiResponse } from '@/lib/api';
import { deleteRideReview, replaceRideReviews, RideReview, RideReviewMap, saveRideReview } from '@/lib/rideReviews';

const palette = {
  background: '#F4F8F7',
  card: '#FFFFFF',
  elevatedCard: '#F7FBFA',
  primaryText: '#123532',
  secondaryText: '#617C79',
  accent: '#14988F',
  accentSoft: '#E7F5F3',
  border: '#D9E9E6',
  warning: '#D97706',
  warningSoft: '#FFF8EC',
  danger: '#C13B3B',
  dangerSoft: '#FFF4F4',
};

type Coords = { latitude: number; longitude: number; name?: string };

type ReviewRide = {
  id: string;
  pickup: Coords;
  dropoff: Coords;
  vehicleType: string;
  price: number;
  status: string;
  requestedAt: string;
  acceptedAt?: string | null;
  completedAt?: string | null;
  driver?: {
    id?: string | null;
    fullName?: string;
    phoneNumber?: string;
    profileImageUrl?: string;
    vehicle?: {
      make?: string;
      model?: string;
      plateNumber?: string;
      color?: string;
      category?: string;
    } | null;
  } | null;
  review?: RideReview | null;
};

const formatDate = (iso?: string | null) => {
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

const formatMoney = (value: number) => {
  if (!Number.isFinite(value)) return 'LKR 0';
  return `LKR ${value.toLocaleString()}`;
};

const formatCoords = (coords?: Coords) => {
  if (!coords) return 'Coordinates not available';
  return `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`;
};

const getReviewStatusConfig = (status?: RideReview['status']) => {
  if (status === 'approved') {
    return {
      label: 'Approved',
      icon: 'checkmark-circle' as const,
      bg: '#E9F8EF',
      text: '#157A62',
    };
  }

  if (status === 'rejected') {
    return {
      label: 'Rejected',
      icon: 'close-circle' as const,
      bg: palette.dangerSoft,
      text: palette.danger,
    };
  }

  return {
    label: 'Pending',
    icon: 'time-outline' as const,
    bg: palette.warningSoft,
    text: palette.warning,
  };
};

export default function MyReviewsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [reviewRides, setReviewRides] = useState<ReviewRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [removingRideId, setRemovingRideId] = useState<string | null>(null);
  const [updatingRideId, setUpdatingRideId] = useState<string | null>(null);
  const [editingRide, setEditingRide] = useState<ReviewRide | null>(null);
  const [draftRating, setDraftRating] = useState(0);
  const [draftComment, setDraftComment] = useState('');
  const [error, setError] = useState('');

  const loadReviews = useCallback(async (isRefresh = false) => {
    if (!token) {
      setLoading(false);
      return;
    }

    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/rides/my-rides?refresh=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
        },
      });
      const data = await parseApiResponse<{ rides?: ReviewRide[] }>(response);
      const rides = data.rides ?? [];
      const ridesWithReviews = rides.filter((ride) => Boolean(ride.review));
      const reviewMap = ridesWithReviews.reduce<RideReviewMap>((acc, ride) => {
        if (ride.review) {
          acc[ride.id] = ride.review;
        }
        return acc;
      }, {});

      setReviewRides(ridesWithReviews);
      await replaceRideReviews(reviewMap);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Unable to load your reviews.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      void loadReviews();
    }, [loadReviews])
  );

  const openRideDetails = (ride: ReviewRide) => {
    router.push({
      pathname: '/ride-details/[id]',
      params: {
        id: ride.id,
        status: ride.status,
        vehicleType: ride.vehicleType,
        price: String(ride.price),
        requestedAt: ride.requestedAt,
        acceptedAt: ride.acceptedAt ?? '',
        completedAt: ride.completedAt ?? '',
        pName: ride.pickup?.name ?? '',
        pLat: String(ride.pickup?.latitude ?? ''),
        pLng: String(ride.pickup?.longitude ?? ''),
        dName: ride.dropoff?.name ?? '',
        dLat: String(ride.dropoff?.latitude ?? ''),
        dLng: String(ride.dropoff?.longitude ?? ''),
        driverId: ride.driver?.id ?? '',
        driverName: ride.driver?.fullName ?? '',
        driverPhone: ride.driver?.phoneNumber ?? '',
        driverImage: ride.driver?.profileImageUrl ?? '',
        driverVehicleType: ride.vehicleType,
        vehicleMake: ride.driver?.vehicle?.make ?? '',
        vehicleModel: ride.driver?.vehicle?.model ?? '',
        vehiclePlate: ride.driver?.vehicle?.plateNumber ?? '',
        vehicleColor: ride.driver?.vehicle?.color ?? '',
        vehicleCategory: ride.driver?.vehicle?.category ?? '',
      },
    });
  };

  const confirmRemoveReview = (ride: ReviewRide) => {
    Alert.alert(
      'Remove review?',
      'This deletes your rating and comment from this ride.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setRemovingRideId(ride.id);
              setError('');
              await deleteRideReview(ride.id, token);
              setReviewRides((current) => current.filter((item) => item.id !== ride.id));
            } catch (removeError) {
              setError(removeError instanceof Error ? removeError.message : 'Unable to remove review.');
            } finally {
              setRemovingRideId(null);
            }
          },
        },
      ]
    );
  };

  const updateReview = async (ride: ReviewRide, rating: number, comment: string) => {
    try {
      setUpdatingRideId(ride.id);
      setError('');
      const updatedReview = await saveRideReview(ride.id, rating, comment, token);
      setReviewRides((current) =>
        current.map((item) => (item.id === ride.id ? { ...item, review: updatedReview } : item))
      );
      return true;
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update review.');
      return false;
    } finally {
      setUpdatingRideId(null);
    }
  };

  const openUpdatePopup = (ride: ReviewRide) => {
    if (ride.review?.status === 'rejected') return;

    setEditingRide(ride);
    setDraftRating(ride.review?.rating ?? 0);
    setDraftComment(ride.review?.comment ?? '');
  };

  const closeUpdatePopup = () => {
    if (updatingRideId) return;

    setEditingRide(null);
    setDraftRating(0);
    setDraftComment('');
  };

  const savePopupUpdate = async () => {
    if (!editingRide || draftRating < 1 || updatingRideId) return;

    const saved = await updateReview(editingRide, draftRating, draftComment);
    if (saved) {
      closeUpdatePopup();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <RefreshableScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onRefreshPage={() => loadReviews(true)}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="star-half-outline" size={24} color={palette.accent} />
          </View>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>My Reviews</Text>
            <Text style={styles.heroSubtitle}>Manage ratings and comments you shared after completed rides.</Text>
          </View>
          <View style={styles.heroCount}>
            <Text style={styles.heroCountValue}>{reviewRides.length}</Text>
            <Text style={styles.heroCountLabel}>Total</Text>
          </View>
        </View>

        {error ? (
          <View style={styles.feedbackCard}>
            <Ionicons name="information-circle-outline" size={17} color={palette.danger} />
            <Text style={styles.feedbackText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="small" color={palette.accent} />
            <Text style={styles.loadingText}>Loading your reviews...</Text>
          </View>
        ) : reviewRides.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="star-outline" size={25} color={palette.accent} />
            </View>
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyText}>Completed ride reviews will appear here after you submit them.</Text>
          </View>
        ) : (
          <View style={styles.reviewList}>
            {reviewRides.map((ride) => (
              <ReviewCard
                key={ride.id}
                ride={ride}
                isRemoving={removingRideId === ride.id}
                isUpdating={updatingRideId === ride.id}
                onView={() => openRideDetails(ride)}
                onUpdate={() => openUpdatePopup(ride)}
                onRemove={() => confirmRemoveReview(ride)}
              />
            ))}
          </View>
        )}

        {refreshing ? <Text style={styles.refreshText}>Refreshing reviews...</Text> : null}
      </RefreshableScrollView>

      {editingRide ? (
        <View style={styles.popupOverlay}>
          <Pressable style={styles.popupBackdrop} onPress={closeUpdatePopup} />
          <View style={styles.popupCard}>
            <View style={styles.updateFormHeader}>
              <View style={styles.popupTitleWrap}>
                <Text style={styles.updateFormTitle}>Update review</Text>
                <Text style={styles.updateFormHint} numberOfLines={1}>
                  {editingRide.driver?.fullName || 'Driver not available'}
                </Text>
              </View>
              <Pressable style={styles.closeFormButton} onPress={closeUpdatePopup} disabled={Boolean(updatingRideId)}>
                <Ionicons name="close" size={18} color={palette.secondaryText} />
              </Pressable>
            </View>

            <View style={styles.editStarRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Pressable
                  key={star}
                  style={[styles.editStarButton, star <= draftRating && styles.editStarButtonActive]}
                  onPress={() => setDraftRating(star)}
                  disabled={Boolean(updatingRideId)}>
                  <Ionicons
                    name={star <= draftRating ? 'star' : 'star-outline'}
                    size={21}
                    color={star <= draftRating ? '#F5A623' : '#8CA1A0'}
                  />
                </Pressable>
              ))}
            </View>

            <TextInput
              style={styles.updateInput}
              value={draftComment}
              onChangeText={setDraftComment}
              placeholder="Update your ride feedback..."
              placeholderTextColor="#8CA1A0"
              multiline
              maxLength={220}
              textAlignVertical="top"
              editable={!updatingRideId}
            />

            <View style={styles.updateFooter}>
              <Text style={styles.characterCount}>{draftComment.trim().length}/220</Text>
              <View style={styles.updateFooterButtons}>
                <Pressable style={styles.cancelUpdateButton} onPress={closeUpdatePopup} disabled={Boolean(updatingRideId)}>
                  <Text style={styles.cancelUpdateText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveUpdateButton, (draftRating < 1 || Boolean(updatingRideId)) && styles.disabledButton]}
                  onPress={savePopupUpdate}
                  disabled={draftRating < 1 || Boolean(updatingRideId)}>
                  <Ionicons name="checkmark-circle-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.saveUpdateText}>{updatingRideId ? 'Saving' : 'Save'}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function ReviewCard({
  ride,
  isRemoving,
  isUpdating,
  onView,
  onUpdate,
  onRemove,
}: {
  ride: ReviewRide;
  isRemoving: boolean;
  isUpdating: boolean;
  onView: () => void;
  onUpdate: () => void;
  onRemove: () => void;
}) {
  const review = ride.review;
  const reviewStatus = getReviewStatusConfig(review?.status);
  const canEdit = review?.status !== 'rejected';

  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewTopRow}>
        <View style={styles.reviewIdentity}>
          <View style={styles.driverIcon}>
            <Ionicons name="person-outline" size={18} color={palette.accent} />
          </View>
          <View style={styles.reviewTitleWrap}>
            <Text style={styles.driverName} numberOfLines={1}>
              {ride.driver?.fullName || 'Driver not available'}
            </Text>
            <Text style={styles.rideMeta} numberOfLines={1}>
              {ride.vehicleType} | {formatDate(ride.completedAt ?? ride.requestedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={13} color="#F5A623" />
          <Text style={styles.ratingBadgeText}>{review?.rating ?? 0}.0</Text>
        </View>
      </View>

      <Text style={styles.reviewComment}>{review?.comment || 'No written comment.'}</Text>

      <View style={[styles.statusBanner, { backgroundColor: reviewStatus.bg }]}>
        <Ionicons name={reviewStatus.icon} size={15} color={reviewStatus.text} />
        <Text style={[styles.statusBannerText, { color: reviewStatus.text }]}>
          {reviewStatus.label}
        </Text>
        <Text style={styles.statusBannerHint}>
          {review?.status === 'approved'
            ? 'Visible on public driver profile. Editing sends it back to admin approval.'
            : review?.status === 'rejected'
              ? 'This review was rejected and cannot be edited.'
              : 'Waiting for admin approval before it appears publicly.'}
        </Text>
      </View>

      <View style={styles.routeBox}>
        <RouteLine label="Pickup" value={ride.pickup?.name || formatCoords(ride.pickup)} icon="radio-button-on" />
        <RouteLine label="Drop-off" value={ride.dropoff?.name || formatCoords(ride.dropoff)} icon="location" />
        <RouteLine label="Fare" value={formatMoney(ride.price)} icon="wallet-outline" />
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.viewButton} onPress={onView}>
          <Ionicons name="eye-outline" size={15} color={palette.accent} />
          <Text style={styles.viewButtonText}>View</Text>
        </Pressable>

        {canEdit ? (
          <Pressable style={[styles.updateButton, isUpdating && styles.disabledButton]} onPress={onUpdate} disabled={isUpdating}>
            <Ionicons name="create-outline" size={15} color="#FFFFFF" />
            <Text style={styles.updateButtonText}>{isUpdating ? 'Saving' : 'Update'}</Text>
          </Pressable>
        ) : (
          <View style={styles.lockedButton}>
            <Ionicons name="lock-closed-outline" size={15} color={palette.secondaryText} />
            <Text style={styles.lockedButtonText}>Locked</Text>
          </View>
        )}

        <Pressable
          style={[styles.removeButton, isRemoving && styles.disabledButton]}
          disabled={isRemoving}
          onPress={onRemove}>
          <Ionicons name="trash-outline" size={15} color={palette.danger} />
          <Text style={styles.removeButtonText}>{isRemoving ? 'Removing' : 'Remove'}</Text>
        </Pressable>
      </View>

    </View>
  );
}

function RouteLine({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <View style={styles.routeLine}>
      <Ionicons name={icon} size={14} color={palette.accent} />
      <Text style={styles.routeLabel}>{label}</Text>
      <Text style={styles.routeValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    padding: 16,
    paddingBottom: 30,
    gap: 12,
  },
  heroCard: {
    minHeight: 92,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: {
    flex: 1,
    minWidth: 0,
  },
  heroTitle: {
    color: palette.primaryText,
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 3,
  },
  heroSubtitle: {
    color: palette.secondaryText,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 17,
  },
  heroCount: {
    minWidth: 54,
    borderRadius: 14,
    backgroundColor: palette.elevatedCard,
    borderWidth: 1,
    borderColor: palette.border,
    paddingVertical: 8,
    alignItems: 'center',
  },
  heroCountValue: {
    color: palette.primaryText,
    fontSize: 17,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  heroCountLabel: {
    color: palette.secondaryText,
    fontSize: 10,
    fontWeight: '800',
  },
  feedbackCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F1D6D6',
    backgroundColor: palette.dangerSoft,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  feedbackText: {
    flex: 1,
    color: palette.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  loadingCard: {
    minHeight: 90,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: palette.secondaryText,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    padding: 22,
    alignItems: 'center',
    gap: 8,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    color: palette.primaryText,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyText: {
    color: palette.secondaryText,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 18,
    textAlign: 'center',
  },
  reviewList: {
    gap: 10,
  },
  reviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    padding: 12,
    gap: 10,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  reviewIdentity: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  driverIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: palette.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  driverName: {
    color: palette.primaryText,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  rideMeta: {
    color: palette.secondaryText,
    fontSize: 12,
    fontWeight: '600',
  },
  ratingBadge: {
    minHeight: 28,
    borderRadius: 999,
    backgroundColor: palette.warningSoft,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingBadgeText: {
    color: palette.warning,
    fontSize: 12,
    fontWeight: '900',
  },
  reviewComment: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.elevatedCard,
    padding: 11,
    color: palette.primaryText,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },
  statusBanner: {
    minHeight: 42,
    borderRadius: 13,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  statusBannerText: {
    fontSize: 12,
    fontWeight: '900',
  },
  statusBannerHint: {
    flexBasis: '100%',
    color: palette.secondaryText,
    fontSize: 11,
    fontWeight: '700',
    lineHeight: 15,
    paddingLeft: 21,
  },
  routeBox: {
    borderRadius: 13,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: '#FBFEFD',
    padding: 10,
    gap: 8,
  },
  routeLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  routeLabel: {
    width: 62,
    color: palette.secondaryText,
    fontSize: 11,
    fontWeight: '800',
  },
  routeValue: {
    flex: 1,
    color: palette.primaryText,
    fontSize: 12,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  viewButton: {
    flexGrow: 1,
    minWidth: 82,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.accentSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  viewButtonText: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  updateButton: {
    flexGrow: 1,
    minWidth: 88,
    minHeight: 38,
    borderRadius: 12,
    backgroundColor: palette.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  lockedButton: {
    flexGrow: 1,
    minWidth: 88,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.elevatedCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockedButtonText: {
    color: palette.secondaryText,
    fontSize: 12,
    fontWeight: '900',
  },
  removeButton: {
    flexGrow: 1,
    minWidth: 94,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F1D6D6',
    backgroundColor: palette.dangerSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  removeButtonText: {
    color: palette.danger,
    fontSize: 12,
    fontWeight: '900',
  },
  disabledButton: {
    opacity: 0.55,
  },
  popupOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  popupBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(18, 53, 50, 0.48)',
  },
  popupCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    padding: 16,
    gap: 12,
  },
  popupTitleWrap: {
    flex: 1,
    minWidth: 0,
  },
  updateFormHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  updateFormTitle: {
    color: palette.primaryText,
    fontSize: 14,
    fontWeight: '900',
  },
  updateFormHint: {
    color: palette.secondaryText,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  closeFormButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editStarRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  editStarButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editStarButtonActive: {
    borderColor: '#F8D58C',
    backgroundColor: palette.warningSoft,
  },
  updateInput: {
    minHeight: 84,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    paddingHorizontal: 11,
    paddingVertical: 10,
    color: palette.primaryText,
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 18,
  },
  updateFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    flexWrap: 'wrap',
  },
  characterCount: {
    color: palette.secondaryText,
    fontSize: 11,
    fontWeight: '800',
  },
  updateFooterButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cancelUpdateButton: {
    minHeight: 34,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelUpdateText: {
    color: palette.secondaryText,
    fontSize: 12,
    fontWeight: '900',
  },
  saveUpdateButton: {
    minHeight: 34,
    borderRadius: 11,
    backgroundColor: palette.accent,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  saveUpdateText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  refreshText: {
    color: palette.secondaryText,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
});
