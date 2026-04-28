import React, { useEffect, useRef, useState } from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/auth-context';
import {
  clearPassengerActiveRide,
  loadPassengerActiveRide,
  PassengerActiveRideParams,
  savePassengerActiveRide,
} from '@/lib/activeRideStorage';

const teal = '#008080';
const SOCKET_SERVER_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/api$/, '');

const formatMoney = (value?: number | string | null) => {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return 'LKR 0';
  return `LKR ${amount.toLocaleString()}`;
};

type RideAcceptedPayload = {
  rideId: string;
  driverId?: string;
  driverName?: string;
  vehicleType?: string;
  status?: string;
  pickup?: {
    latitude?: number;
    longitude?: number;
  };
  dropoff?: {
    latitude?: number;
    longitude?: number;
  };
  driverLocation?: {
    latitude?: number;
    longitude?: number;
  } | null;
};

export default function ActiveRideOverlays() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const activeRideRef = useRef<PassengerActiveRideParams | null>(null);
  const activeRideIdRef = useRef<string | null>(null);

  const [arrivalCode, setArrivalCode] = useState<string | null>(null);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('LKR 0');
  const [activeRideId, setActiveRideId] = useState<string | null>(null);

  const setTrackedActiveRideId = (rideId: string | null) => {
    activeRideIdRef.current = rideId;
    setActiveRideId(rideId);
  };

  const returnToLiveNavigation = () => {
    const ride = activeRideRef.current;
    if (!ride?.id) return;

    router.push({
      pathname: '/active-ride/[id]',
      params: ride,
    });
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;

    const loadActiveRide = async () => {
      const stored = await loadPassengerActiveRide();
      activeRideRef.current = stored;
      setTrackedActiveRideId(stored?.id ?? activeRideIdRef.current);
    };

    void loadActiveRide();

    timer = setInterval(() => {
      void loadActiveRide();
    }, 3000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('registerPassenger', user.id);
    });

    socket.on('rideAccepted', (data: RideAcceptedPayload) => {
      if (!data.rideId) return;

      const nextRide: PassengerActiveRideParams = {
        id: data.rideId,
        driverId: data.driverId,
        driverName: data.driverName ?? 'Driver',
        vehicleType: data.vehicleType,
        status: data.status ?? 'Accepted',
        pLat: data.pickup?.latitude != null ? String(data.pickup.latitude) : undefined,
        pLng: data.pickup?.longitude != null ? String(data.pickup.longitude) : undefined,
        dLat: data.dropoff?.latitude != null ? String(data.dropoff.latitude) : undefined,
        dLng: data.dropoff?.longitude != null ? String(data.dropoff.longitude) : undefined,
        drLat: data.driverLocation?.latitude != null ? String(data.driverLocation.latitude) : undefined,
        drLng: data.driverLocation?.longitude != null ? String(data.driverLocation.longitude) : undefined,
      };

      activeRideRef.current = nextRide;
      setTrackedActiveRideId(nextRide.id);
      savePassengerActiveRide(nextRide);
    });

    socket.on('arrivalVerificationCode', (data: { rideId: string; code: string }) => {
      if (!activeRideRef.current?.id || data.rideId !== activeRideRef.current.id) {
        void loadPassengerActiveRide().then((stored) => {
          activeRideRef.current = stored;
          setTrackedActiveRideId(stored?.id === data.rideId ? stored.id : data.rideId);
          setArrivalCode(data.code);
        });
        return;
      }
      setTrackedActiveRideId(data.rideId);
      setArrivalCode(data.code);
    });

    socket.on('rideStatusUpdate', (data: { rideId: string; status?: string; canonicalStatus?: string; invoice?: { amount?: number | string } }) => {
      const trackedRideId = activeRideRef.current?.id ?? activeRideIdRef.current;
      if (!trackedRideId || data.rideId !== trackedRideId) return;

      if (data.status) {
        if (activeRideRef.current) {
          const nextRide = {
            ...activeRideRef.current,
            status: data.status,
          } as PassengerActiveRideParams;
          activeRideRef.current = nextRide;
          savePassengerActiveRide(nextRide);
        }
      }

      const canonical = String(data.canonicalStatus ?? data.status ?? '').toUpperCase();
      if (canonical === 'ARRIVED' || canonical === 'IN_TRANSIT' || canonical === 'INPROGRESS') {
        setArrivalCode(null);
      }

      if (canonical === 'COMPLETED') {
        setArrivalCode(null);
        setPaymentAmount(formatMoney(data.invoice?.amount));
        setPaymentVisible(true);
      } else if (canonical === 'CANCELLED') {
        clearPassengerActiveRide();
        activeRideRef.current = null;
        setTrackedActiveRideId(null);
        setArrivalCode(null);
        setPaymentVisible(false);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  if (pathname.startsWith('/active-ride/')) {
    return null;
  }

  if (!activeRideId && !arrivalCode && !paymentVisible) {
    return null;
  }

  return (
    <>
      {activeRideRef.current?.id && !paymentVisible && (
        <TouchableOpacity
          style={styles.liveNavigationButton}
          activeOpacity={0.9}
          onPress={returnToLiveNavigation}
        >
          <View style={styles.liveNavigationIcon}>
            <Ionicons name="navigate" size={18} color="#FFFFFF" />
          </View>
          <View style={styles.liveNavigationCopy}>
            <Text style={styles.liveNavigationTitle}>Live navigation</Text>
            <Text style={styles.liveNavigationText} numberOfLines={1}>
              {activeRideRef.current.driverName ? `Ride with ${activeRideRef.current.driverName}` : 'Return to your active ride'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#4D6F6C" />
        </TouchableOpacity>
      )}

      <Modal visible={!!arrivalCode} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.codeBackdrop}>
          <View style={styles.codeCard}>
            <View style={styles.codeIcon}>
              <Ionicons name="shield-checkmark" size={32} color={teal} />
            </View>
            <Text style={styles.codeTitle}>Confirm Your Driver</Text>
            <Text style={styles.codeSubtitle}>Share this code with your driver after confirming the vehicle and driver.</Text>
            <Text style={styles.codeValue}>{arrivalCode}</Text>
            <Text style={styles.codeHint}>Do not share this code before the driver arrives.</Text>
            {activeRideRef.current?.id && (
              <TouchableOpacity style={styles.modalNavigationButton} onPress={returnToLiveNavigation}>
                <Ionicons name="navigate" size={16} color="#FFFFFF" />
                <Text style={styles.modalNavigationButtonText}>Return to live navigation</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={paymentVisible} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.codeBackdrop}>
          <View style={styles.paymentCard}>
            <View style={styles.codeIcon}>
              <Ionicons name="receipt-outline" size={30} color={teal} />
            </View>
            <Text style={styles.codeTitle}>Payment Confirmation</Text>
            <Text style={styles.codeSubtitle}>Please confirm the payment for this trip.</Text>
            <Text style={styles.paymentValue}>{paymentAmount}</Text>
            <TouchableOpacity
              style={styles.paymentButton}
              onPress={() => {
                setPaymentVisible(false);
                clearPassengerActiveRide();
                activeRideRef.current = null;
                setTrackedActiveRideId(null);
              }}
            >
              <Text style={styles.paymentButtonText}>Confirm Payment</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  liveNavigationButton: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 96,
    zIndex: 80,
    elevation: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#001F1E',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
  },
  liveNavigationIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveNavigationCopy: {
    flex: 1,
    minWidth: 0,
  },
  liveNavigationTitle: {
    color: '#102A28',
    fontSize: 15,
    fontWeight: '900',
  },
  liveNavigationText: {
    color: '#617C79',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  codeBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(6, 22, 21, 0.46)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  codeCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  codeIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E7F5F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  codeTitle: { fontSize: 22, fontWeight: '900', color: '#102A28', marginBottom: 8 },
  codeSubtitle: { fontSize: 14, fontWeight: '700', color: '#617C79', textAlign: 'center', lineHeight: 20, marginBottom: 18 },
  codeValue: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#F7FBFA',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    color: '#102A28',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 8,
    textAlign: 'center',
    paddingVertical: 14,
  },
  codeHint: { fontSize: 12, fontWeight: '800', color: '#D97706', textAlign: 'center', marginTop: 14 },
  modalNavigationButton: {
    marginTop: 18,
    backgroundColor: teal,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  modalNavigationButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
  paymentCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  paymentValue: {
    width: '100%',
    borderRadius: 18,
    backgroundColor: '#F7FBFA',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    color: '#102A28',
    fontSize: 30,
    fontWeight: '900',
    textAlign: 'center',
    paddingVertical: 16,
    marginTop: 6,
  },
  paymentButton: {
    marginTop: 18,
    backgroundColor: teal,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  paymentButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
});
