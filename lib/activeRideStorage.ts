import AsyncStorage from '@react-native-async-storage/async-storage';

type StoredPayload<T> = {
  params: T;
  savedAt: number;
};

export type PassengerActiveRideParams = {
  id: string;
  driverId?: string;
  driverName?: string;
  driverImage?: string;
  vehicleType?: string;
  status?: string;
  pLat?: string;
  pLng?: string;
  dLat?: string;
  dLng?: string;
  drLat?: string;
  drLng?: string;
};

const STORAGE_KEY = 'nexgo.passenger.latestNavigation';

export async function savePassengerActiveRide(params: PassengerActiveRideParams): Promise<void> {
  if (!params?.id) return;

  try {
    const payload: StoredPayload<PassengerActiveRideParams> = {
      params,
      savedAt: Date.now(),
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('[ActiveRideStorage] Failed to save passenger navigation', error);
  }
}

export async function loadPassengerActiveRide(): Promise<PassengerActiveRideParams | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredPayload<PassengerActiveRideParams> | PassengerActiveRideParams;
    if (!parsed) return null;

    if ('params' in parsed) {
      return parsed.params ?? null;
    }

    return parsed as PassengerActiveRideParams;
  } catch (error) {
    console.warn('[ActiveRideStorage] Failed to load passenger navigation', error);
    return null;
  }
}

export async function clearPassengerActiveRide(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('[ActiveRideStorage] Failed to clear passenger navigation', error);
  }
}
