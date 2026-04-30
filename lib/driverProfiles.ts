import { API_BASE_URL, parseApiResponse } from '@/lib/api';

export type PublicDriverProfile = {
  id: string;
  fullName: string;
  phoneNumber: string;
  profileImageUrl: string;
  status: string;
  isOnline: boolean;
  ratingAverage: number;
  ratingCount: number;
  completedRides: number;
  vehicle?: {
    category?: string;
    make?: string;
    model?: string;
    year?: number;
    plateNumber?: string;
    color?: string;
    seats?: number;
  } | null;
  recentReviews?: {
    rating: number;
    comment: string;
    reviewedAt?: string | null;
  }[];
};

export async function fetchPublicDriverProfile(
  driverId: string,
  rideId?: string
): Promise<PublicDriverProfile> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  const endpoints = [
    ...(rideId ? [`${API_BASE_URL}/rides/${rideId}/driver-public-profile`] : []),
    `${API_BASE_URL}/driver-auth/drivers/${driverId}/public-profile`,
    `${API_BASE_URL}/rides/drivers/${driverId}/public-profile`,
  ];

  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, { signal: controller.signal });
      const data = await parseApiResponse<{ driver: PublicDriverProfile }>(response);
      clearTimeout(timeout);
      return data.driver;
    } catch (error) {
      lastError = error;
    }
  }

  clearTimeout(timeout);
  throw lastError instanceof Error ? lastError : new Error('Unable to load driver profile');
}
