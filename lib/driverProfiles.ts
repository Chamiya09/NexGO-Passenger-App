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
  driverId?: string,
  rideId?: string
): Promise<PublicDriverProfile> {
  const cleanDriverId = String(driverId ?? '').trim();
  const cleanRideId = String(rideId ?? '').trim();
  const endpoints = [
    ...(cleanRideId ? [`${API_BASE_URL}/rides/${cleanRideId}/driver-public-profile`] : []),
    ...(cleanDriverId
      ? [
          `${API_BASE_URL}/driver-auth/drivers/${cleanDriverId}/public-profile`,
          `${API_BASE_URL}/rides/drivers/${cleanDriverId}/public-profile`,
        ]
      : []),
  ];

  if (endpoints.length === 0) {
    throw new Error('Driver profile route is missing ride or driver id');
  }

  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, { signal: controller.signal });
      const data = await parseApiResponse<{ driver: PublicDriverProfile }>(response);
      clearTimeout(timeout);
      return data.driver;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unable to load driver profile');
}
