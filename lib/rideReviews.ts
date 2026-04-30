import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'nexgo.passenger.rideReviews.v1';

export type RideReview = {
  rideId: string;
  rating: number;
  comment: string;
  updatedAt: string;
};

export type RideReviewMap = Record<string, RideReview>;

const clampRating = (rating: number) => {
  if (!Number.isFinite(rating)) return 0;
  return Math.max(0, Math.min(5, Math.round(rating)));
};

export async function loadRideReviews(): Promise<RideReviewMap> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as RideReviewMap;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.warn('[RideReviews] Failed to load ride reviews', error);
    return {};
  }
}

export async function loadRideReview(rideId: string): Promise<RideReview | null> {
  if (!rideId) return null;

  const reviews = await loadRideReviews();
  return reviews[rideId] ?? null;
}

export async function saveRideReview(
  rideId: string,
  rating: number,
  comment: string
): Promise<RideReview> {
  const review: RideReview = {
    rideId,
    rating: clampRating(rating),
    comment: comment.trim(),
    updatedAt: new Date().toISOString(),
  };

  const reviews = await loadRideReviews();
  const nextReviews = {
    ...reviews,
    [rideId]: review,
  };

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(nextReviews));
  return review;
}
