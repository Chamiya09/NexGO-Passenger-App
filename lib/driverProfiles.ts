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
  token?: string | null
): Promise<PublicDriverProfile> {
  const response = await fetch(`${API_BASE_URL}/driver-auth/drivers/${driverId}/public-profile`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  const data = await parseApiResponse<{ driver: PublicDriverProfile }>(response);
  return data.driver;
}
