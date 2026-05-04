import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, ActivityIndicator, ScrollView, Alert, Animated, Modal, TextInput } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/auth-context';
import { savePassengerActiveRide } from '@/lib/activeRideStorage';
import { API_BASE_URL, parseApiResponse } from '@/lib/api';
import { CustomOsmMap, CustomOsmMapRef, OsmMarker, OsmPolyline } from '@/components/CustomOsmMap';
import { VehicleCategoryIcon } from '@/components/VehicleCategoryIcon';

const teal = '#169F95';

// Strip the '/api' suffix from the API URL to get the raw server origin for Socket.IO
const SOCKET_SERVER_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/api$/, '');

type VehicleCategory = 'Bike' | 'Tuk' | 'Mini' | 'Car' | 'Van';

type DriverMarker = {
  driverId: string;
  latitude: number;
  longitude: number;
  vehicleCategory?: string;
  distanceKm?: number;
};

type AcceptedRideData = {
  rideId: string;
  driverId: string;
  driverName?: string;
  driverImage?: string;
  vehicleType: string;
  status?: string;
  pickup?: {
    latitude: number;
    longitude: number;
  };
  dropoff?: {
    latitude: number;
    longitude: number;
  };
  driverLocation?: {
    latitude: number;
    longitude: number;
  } | null;
};

type PromotionSummary = {
  id: string;
  code: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: string;
  endDate: string;
  status: string;
  active: boolean;
};

const normalizeVehicleCategory = (category?: string | null): VehicleCategory => {
  const value = String(category ?? '').trim();
  if (value === 'Bike') return 'Bike';
  if (value === 'Tuk' || value === 'TukTuk') return 'Tuk';
  if (value === 'Mini') return 'Mini';
  if (value === 'Van') return 'Van';
  return 'Car';
};

const VEHICLE_MARKERS: Record<VehicleCategory, {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  bg: string;
  color: string;
}> = {
  Bike: { icon: 'motorbike', bg: '#EAF7FF', color: '#0077B6' },
  Tuk: { icon: 'rickshaw', bg: '#FFF7E8', color: '#D97706' },
  Mini: { icon: 'car-hatchback', bg: '#E7F5F3', color: teal },
  Car: { icon: 'car-estate', bg: '#F1F5FF', color: '#4A6FA5' },
  Van: { icon: 'van-passenger', bg: '#F3ECFF', color: '#7C3AED' },
};

const getSocketVehicleType = (category: string) => normalizeVehicleCategory(category);

export default function ConfirmRouteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<CustomOsmMapRef>(null);
  const socketRef = useRef<Socket | null>(null);
  const cancelRequestedRef = useRef(false);
  const { user } = useAuth();

  const [routesData, setRoutesData] = useState<{ coords: { latitude: number, longitude: number }[], distance: string, duration: string }[]>([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState('Mini');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'WALLET'>('CASH');
  const [promoCode, setPromoCode] = useState(() => {
    const initialPromoCode = params.promoCode;
    return typeof initialPromoCode === 'string' ? initialPromoCode.toUpperCase() : '';
  });
  const [promoStatus, setPromoStatus] = useState<'idle' | 'applied' | 'error'>('idle');
  const [promoMessage, setPromoMessage] = useState('');
  const [appliedPromotion, setAppliedPromotion] = useState<PromotionSummary | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<DriverMarker[]>([]);
  const [rideRequesting, setRideRequesting] = useState(false);
  // Overlay: 'finding' while waiting, 'accepted' when driver confirms, null = hidden
  const [overlayState, setOverlayState] = useState<'finding' | 'accepted' | null>(null);
  const [acceptedData, setAcceptedData] = useState<AcceptedRideData | null>(null);
  const [currentRideId, setCurrentRideId] = useState<string | null>(null);
  const [currentRideStatus, setCurrentRideStatus] = useState<string | null>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const driversFadeAnim = useRef(new Animated.Value(1)).current;
  // ── One ride at a time guard ────────────────────────────────────────────────
  const [hasActiveRide, setHasActiveRide] = useState(false);
  const { token } = useAuth();

  useEffect(() => {
    if (!token) return;
    // Check whether user already has a Pending or Accepted ride
    fetch(`${(process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api').replace(/\/$/, '')}/rides/my-rides`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const active = (data.rides ?? []).some(
          (r: { status: string }) => r.status === 'Pending' || r.status === 'Accepted'
        );
        setHasActiveRide(active);
      })
      .catch(() => { }); // Silently ignore network errors
  }, [token]);

  // Safely parse parameters
  const pLat = parseFloat(params.pLat as string);
  const pLng = parseFloat(params.pLng as string);
  const pName = params.pName as string;
  const dLat = parseFloat(params.dLat as string);
  const dLng = parseFloat(params.dLng as string);
  const dName = params.dName as string;

  useEffect(() => {
    const fetchRoute = async () => {
      setLoading(true);
      try {
        let url = `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson&alternatives=true`;

        if (selectedVehicle === 'Bike' || selectedVehicle === 'Tuk') {
          // Use dedicated German OSM bike instance to physically force off-highway routing algorithms
          url = `https://routing.openstreetmap.de/routed-bike/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson&alternatives=true`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data && data.routes && data.routes.length > 0) {
          const parsedRoutes = data.routes.map((route: any) => {
            const coords = route.geometry.coordinates.map((coord: any) => ({
              latitude: coord[1],
              longitude: coord[0],
            }));
            const distKm = (route.distance / 1000).toFixed(1);
            const durMin = Math.round(route.duration / 60);
            return { coords, distance: distKm, duration: durMin };
          });

          setRoutesData(parsedRoutes);

          setDistance(`${parsedRoutes[0].distance} km`);
          setDuration(`${parsedRoutes[0].duration} min`);

          // Fit map to coordinates perfectly wrapping both markers and the primary polyline
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(parsedRoutes[0].coords, {
              edgePadding: { top: 120, right: 60, bottom: 400, left: 60 },
              animated: true,
            });
          }, 800);
        }
      } catch (error) {
        console.error('Error fetching route', error);
      } finally {
        setLoading(false);
      }
    };

    if (pLat && pLng && dLat && dLng) {
      fetchRoute();
    }
  }, [pLat, pLng, dLat, dLng, selectedVehicle]);

  // ── Socket.IO setup ────────────────────────────────────────────────────────
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      transports: ['websocket'],
      reconnection: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Passenger] Socket connected:', socket.id);
      // Register this passenger so the server can route rideAccepted back to us
      if (user?.id) {
        socket.emit('registerPassenger', user.id);
      }
    });

    socket.on('rideCreated', (data) => {
      console.log('[Passenger] rideCreated received:', data);
      if (cancelRequestedRef.current) {
        socket.emit('cancelRide', { rideId: data.rideId });
        setCurrentRideId(null);
        return;
      }
      setCurrentRideId(data.rideId);
    });

    socket.on('available_drivers', (drivers) => {
      setAvailableDrivers(drivers);
      Animated.timing(driversFadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });

    socket.on('rideAccepted', (data) => {
      console.log('[Passenger] rideAccepted received:', data);
      void savePassengerActiveRide({
        id: data.rideId,
        driverId: data.driverId,
        driverName: data.driverName ?? 'Driver',
        driverImage: data.driverImage ?? '',
        vehicleType: data.vehicleType ?? selectedVehicle,
        status: data.status ?? 'Accepted',
        pLat: String(data.pickup?.latitude ?? pLat),
        pLng: String(data.pickup?.longitude ?? pLng),
        dLat: String(data.dropoff?.latitude ?? dLat),
        dLng: String(data.dropoff?.longitude ?? dLng),
        ...(data.driverLocation && {
          drLat: String(data.driverLocation.latitude),
          drLng: String(data.driverLocation.longitude),
        }),
      });
      setRideRequesting(false);
      setAcceptedData({
        rideId: data.rideId,
        driverId: data.driverId,
        driverName: data.driverName ?? 'Driver',
        driverImage: data.driverImage ?? '',
        vehicleType: data.vehicleType ?? selectedVehicle,
        status: data.status ?? 'Accepted',
        pickup: data.pickup,
        dropoff: data.dropoff,
        driverLocation: data.driverLocation ?? null,
      });
      setOverlayState('accepted');
      setCurrentRideStatus('Accepted');
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    });

    socket.on('rideStatusUpdate', (data) => {
      console.log('[Passenger] rideStatusUpdate received:', data);
      setCurrentRideStatus(data.status);

      if (data.status === 'Completed') {
        // Stop animations, unlock app, and hide overlay
        setOverlayState(null);
        pulseAnim.stopAnimation();
        setHasActiveRide(false);
        setCurrentRideId(null);
        Alert.alert('Trip Completed', 'You have arrived at your destination!');
        router.back();
      } else if (data.status === 'Cancelled') {
        setOverlayState(null);
        pulseAnim.stopAnimation();
        setHasActiveRide(false);
        setCurrentRideId(null);
      }
    });

    socket.on('rideCancelled', () => {
      console.log('[Passenger] rideCancelled received');
      setOverlayState(null);
      pulseAnim.stopAnimation();
      setHasActiveRide(false);
      setCurrentRideId(null);
    });

    socket.on('rideError', (err) => {
      if (err?.code === 'NO_MATCHING_DRIVER') {
        console.log('[Passenger] No matching driver:', err.message);
      } else {
        console.error('[Passenger] rideError:', err);
      }
      setRideRequesting(false);
      setOverlayState(null);
      pulseAnim.stopAnimation();
      cancelRequestedRef.current = false;
      // Release the lock — the ride was never created successfully
      setHasActiveRide(false);
      Alert.alert('Request Failed', err.message ?? 'Something went wrong. Please try again.');
    });

    socket.on('disconnect', () => {
      console.log('[Passenger] Socket disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  // Request new category drivers with smooth fade transition
  useEffect(() => {
    Animated.timing(driversFadeAnim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('get_available_drivers', {
          category: selectedVehicle,
          latitude: pLat,
          longitude: pLng,
        });
      }
    });

    // Fallback: poll every 7 seconds to keep drivers fresh
    const interval = setInterval(() => {
      if (socketRef.current?.connected) {
        socketRef.current.emit('get_available_drivers', {
          category: selectedVehicle,
          latitude: pLat,
          longitude: pLng,
        });
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [selectedVehicle, pLat, pLng]);

  // ── confirmRide ────────────────────────────────────────────────────────────
  const PRICE_MAP: Record<string, number> = {
    Bike: 70,
    Tuk: 150,
    Mini: 300,
    Car: 350,
    Van: 1250,
  };

  const parseDistanceKm = (value: string) => {
    const numeric = Number(String(value).replace(/[^0-9.]/g, ''));
    return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
  };

  const formatMoney = (value: number) => `LKR ${Math.max(0, Math.round(value))}`;

  const getDiscountAmount = (promotion: PromotionSummary, price: number) => {
    const numericValue = Number(promotion.discountValue);
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      return 0;
    }
    if (promotion.discountType === 'Percentage') {
      const percent = Math.min(100, Math.max(0, numericValue));
      return Math.min(price, price * (percent / 100));
    }
    return Math.min(price, numericValue);
  };

  const distanceKm = parseDistanceKm(distance) ?? 1;
  const baseRate = PRICE_MAP[selectedVehicle] ?? PRICE_MAP.Mini;
  const basePrice = baseRate * distanceKm;
  const getEstimatedFare = (category: string) =>
    formatMoney((PRICE_MAP[category] ?? PRICE_MAP.Mini) * distanceKm);
  const discountAmount = appliedPromotion ? getDiscountAmount(appliedPromotion, basePrice) : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  const applyPromotionCode = async () => {
    const trimmedCode = promoCode.trim().toUpperCase();
    if (!trimmedCode) {
      setPromoStatus('error');
      setPromoMessage('Enter a promo code to apply.');
      setAppliedPromotion(null);
      return;
    }

    setIsApplyingPromo(true);
    setPromoStatus('idle');
    setPromoMessage('');

    try {
      if (!token) {
        throw new Error('Please sign in before applying a promo code.');
      }

      const response = await fetch(`${API_BASE_URL}/promotions/validate/${encodeURIComponent(trimmedCode)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await parseApiResponse<{ promotion: PromotionSummary }>(response);
      const promotion = data.promotion;

      setAppliedPromotion(promotion);
      const discountValue = Number(promotion.discountValue);
      const discountLabel = promotion.discountType === 'Percentage'
        ? `${Math.min(100, Math.max(0, discountValue))}% off`
        : `${formatMoney(discountValue)} off`;
      setPromoStatus('applied');
      setPromoMessage(`Promo applied: ${discountLabel}`);
    } catch (error) {
      setPromoStatus('error');
      setPromoMessage(error instanceof Error ? error.message : 'Unable to apply promo code.');
      setAppliedPromotion(null);
    } finally {
      setIsApplyingPromo(false);
    }
  };

  const goToLiveTracking = () => {
    if (!acceptedData) return;

    setOverlayState(null);
    pulseAnim.stopAnimation();
    setHasActiveRide(true);
    router.replace({
      pathname: '/active-ride/[id]',
      params: {
        id: acceptedData.rideId,
        driverId: acceptedData.driverId,
        driverName: acceptedData.driverName ?? 'Driver',
        driverImage: acceptedData.driverImage ?? '',
        vehicleType: acceptedData.vehicleType ?? selectedVehicle,
        status: acceptedData.status ?? 'Accepted',
        pLat: String(acceptedData.pickup?.latitude ?? pLat),
        pLng: String(acceptedData.pickup?.longitude ?? pLng),
        dLat: String(acceptedData.dropoff?.latitude ?? dLat),
        dLng: String(acceptedData.dropoff?.longitude ?? dLng),
        ...(acceptedData.driverLocation && {
          drLat: String(acceptedData.driverLocation.latitude),
          drLng: String(acceptedData.driverLocation.longitude),
        }),
      },
    });
  };

  const confirmRide = async () => {
    if (!socketRef.current?.connected) {
      Alert.alert('Not Connected', 'Unable to reach the server. Please check your connection.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Not Logged In', 'Please sign in before booking a ride.');
      return;
    }
    if (!token) {
      Alert.alert('Not Logged In', 'Please sign in before booking a ride.');
      return;
    }
    if (availableDrivers.length === 0) {
      Alert.alert('No Drivers Online', `No online ${selectedVehicle} drivers are nearby right now. Please try another category or try again later.`);
      return;
    }

    // Lock the confirm button immediately — stays locked until driver accepts or error
    cancelRequestedRef.current = false;
    setRideRequesting(true);
    setHasActiveRide(true);
    setOverlayState('finding');
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    // Pulse animation loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.18, duration: 700, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    ).start();

    const socketVehicleType = getSocketVehicleType(selectedVehicle);
    const ridePrice = finalPrice;

    try {
      const response = await fetch(`${API_BASE_URL}/rides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          passengerName: user.fullName ?? 'Passenger',
          vehicleType: socketVehicleType,
          price: ridePrice,
          paymentMethod,
          promotion: appliedPromotion
            ? {
                id: appliedPromotion.id,
                code: appliedPromotion.code,
              }
            : null,
          pickup: {
            latitude: pLat,
            longitude: pLng,
            name: pName ?? '',
          },
          dropoff: {
            latitude: dLat,
            longitude: dLng,
            name: dName ?? '',
          },
        }),
      });
      const data = await parseApiResponse<{ ride: { id?: string; _id?: string } }>(response);
      const rideId = data.ride.id ?? data.ride._id ?? null;

      if (rideId) {
        if (cancelRequestedRef.current) {
          socketRef.current?.emit('cancelRide', { rideId });
          setCurrentRideId(null);
        } else {
          setCurrentRideId(rideId);
        }
      }

      console.log('[Passenger] ride created via REST for vehicle:', selectedVehicle, socketVehicleType);
    } catch (error) {
      console.error('[Passenger] create ride failed:', error);
      setRideRequesting(false);
      setOverlayState(null);
      pulseAnim.stopAnimation();
      cancelRequestedRef.current = false;
      setHasActiveRide(false);
      Alert.alert('Request Failed', error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  };

  // Derived price calculator for dynamic button
  const displayBasePrice = formatMoney(basePrice);
  const displayFinalPrice = formatMoney(finalPrice);
  const mapPolylines: OsmPolyline[] = [
    ...routesData.slice(1).flatMap((route, index) => [
      { id: `alt-${index}-outer`, coordinates: route.coords, color: '#B0B0B0', width: 6, opacity: 0.82 },
      { id: `alt-${index}-inner`, coordinates: route.coords, color: '#E0E0E0', width: 3, opacity: 0.95 },
    ]),
    ...(routesData[0]
      ? [
          { id: 'primary-outer', coordinates: routesData[0].coords, color: '#017270', width: 8, opacity: 0.92 },
          { id: 'primary-inner', coordinates: routesData[0].coords, color: '#169F95', width: 4, opacity: 1 },
        ]
      : []),
  ];
  const mapMarkers: OsmMarker[] = [
    ...(pLat && pLng
      ? [{ id: 'pickup', coordinate: { latitude: pLat, longitude: pLng }, color: '#169F95', label: 'Pickup', kind: 'label' as const, zIndex: 30 }]
      : []),
    ...(dLat && dLng
      ? [{ id: 'dropoff', coordinate: { latitude: dLat, longitude: dLng }, color: '#E74C3C', label: 'Dropoff', kind: 'label' as const, zIndex: 40 }]
      : []),
    ...(routesData[0]?.coords.length
      ? [{
          id: 'primary-route-label',
          coordinate: routesData[0].coords[Math.floor(routesData[0].coords.length / 2)],
          color: '#017270',
          label: 'Local Fastest',
          kind: 'label' as const,
          zIndex: 50,
        }]
      : []),
    ...(routesData[1]?.coords.length
      ? [{
          id: 'alt-route-label',
          coordinate: routesData[1].coords[Math.floor(routesData[1].coords.length / 2)],
          color: '#526E6C',
          label: 'Short Way',
          kind: 'label' as const,
          zIndex: 45,
        }]
      : []),
    ...availableDrivers.map((driver) => {
      const markerCategory = normalizeVehicleCategory(driver.vehicleCategory || selectedVehicle);
      const marker = VEHICLE_MARKERS[markerCategory];
      return {
        id: `driver-${driver.driverId}`,
        coordinate: { latitude: driver.latitude, longitude: driver.longitude },
        color: marker.color,
        title: `${markerCategory} driver`,
        kind: 'vehicle' as const,
        zIndex: 60,
      };
    }),
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Map Background */}
      <View style={styles.mapPlaceholder}>
        <CustomOsmMap
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: pLat || 6.9271,
            longitude: pLng || 79.8612,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          markers={mapMarkers}
          polylines={mapPolylines}
        />
      </View>

      {/* Back Button */}
      <SafeAreaView style={styles.topSafeArea}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#102A28" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Driver Selection Bottom Sheet */}
      <View style={styles.bottomCardContainer}>
        <View style={styles.bottomCard}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#169F95" />
              <Text style={styles.loadingText}>Plotting route...</Text>
            </View>
          ) : (
            <>
              {/* Drag Handle & Header (Touchable to toggle) */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsExpanded(!isExpanded)}>
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>

                {/* Title Header */}
                <View style={styles.sheetHeader}>
                  <View>
                    <Text style={styles.eyebrow}>TRIP DETAILS</Text>
                    <Text style={styles.sheetTitle}>Choose your ride</Text>
                  </View>
                  <View style={styles.pillGroup}>
                    <View style={styles.distancePill}>
                      <Text style={styles.distancePillText}>{distance || '9.3 km'}</Text>
                    </View>
                    <View style={styles.distancePill}>
                      <Text style={styles.distancePillText}>{duration || '26 min'}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <>
                  <View style={styles.routeBlock}>
                    <RoutePoint icon="radio-button-on" label="Pickup" value={pName || 'Pickup'} />
                    <View style={styles.routeDivider} />
                    <RoutePoint icon="location" label="Drop-off" value={dName || 'Drop-off'} />
                  </View>

                  {(selectedVehicle === 'Bike' || selectedVehicle === 'Tuk') && (
                    <Text style={styles.infoWarningText}>Bikes/Tuks are not allowed on expressways. Taking the alternative route.</Text>
                  )}
                </>
              )}

              {/* Horizontal Ride Scroller */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rideScrollContent}>
                <TouchableOpacity
                  style={[styles.rideSquare, selectedVehicle === 'Bike' && styles.activeRideSquare]}
                  onPress={() => setSelectedVehicle('Bike')}>
                  <View style={[styles.vehicleCategoryIconWrap, selectedVehicle === 'Bike' && styles.vehicleCategoryIconWrapActive]}>
                    <VehicleCategoryIcon category="Bike" size={32} active={selectedVehicle === 'Bike'} />
                  </View>
                  <Text style={[styles.rideSquareTitle, selectedVehicle === 'Bike' && { color: '#FFF' }]}>Bike</Text>
                  <Text style={[styles.rideSquarePrice, selectedVehicle === 'Bike' && { color: '#FFF' }]}>{getEstimatedFare('Bike')}</Text>
                  <Text style={[styles.rideSquareETA, selectedVehicle === 'Bike' && { color: '#FFF' }]}>15 min</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rideSquare, selectedVehicle === 'Tuk' && styles.activeRideSquare]}
                  onPress={() => setSelectedVehicle('Tuk')}>
                  <View style={[styles.vehicleCategoryIconWrap, selectedVehicle === 'Tuk' && styles.vehicleCategoryIconWrapActive]}>
                    <VehicleCategoryIcon category="Tuk" size={32} active={selectedVehicle === 'Tuk'} />
                  </View>
                  <Text style={[styles.rideSquareTitle, selectedVehicle === 'Tuk' && { color: '#FFF' }]}>Tuk</Text>
                  <Text style={[styles.rideSquarePrice, selectedVehicle === 'Tuk' && { color: '#FFF' }]}>{getEstimatedFare('Tuk')}</Text>
                  <Text style={[styles.rideSquareETA, selectedVehicle === 'Tuk' && { color: '#FFF' }]}>28 min</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rideSquare, selectedVehicle === 'Mini' && styles.activeRideSquare]}
                  onPress={() => setSelectedVehicle('Mini')}>
                  <View style={[styles.vehicleCategoryIconWrap, selectedVehicle === 'Mini' && styles.vehicleCategoryIconWrapActive]}>
                    <VehicleCategoryIcon category="Mini" size={32} active={selectedVehicle === 'Mini'} />
                  </View>
                  <Text style={[styles.rideSquareTitle, selectedVehicle === 'Mini' && { color: '#FFF' }]}>Mini</Text>
                  <Text style={[styles.rideSquarePrice, selectedVehicle === 'Mini' && { color: '#FFF' }]}>{getEstimatedFare('Mini')}</Text>
                  <Text style={[styles.rideSquareETA, selectedVehicle === 'Mini' && { color: '#FFF' }]}>26 min</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rideSquare, selectedVehicle === 'Car' && styles.activeRideSquare]}
                  onPress={() => setSelectedVehicle('Car')}>
                  <View style={[styles.vehicleCategoryIconWrap, selectedVehicle === 'Car' && styles.vehicleCategoryIconWrapActive]}>
                    <VehicleCategoryIcon category="Car" size={32} active={selectedVehicle === 'Car'} />
                  </View>
                  <Text style={[styles.rideSquareTitle, selectedVehicle === 'Car' && { color: '#FFF' }]}>Car</Text>
                  <Text style={[styles.rideSquarePrice, selectedVehicle === 'Car' && { color: '#FFF' }]}>{getEstimatedFare('Car')}</Text>
                  <Text style={[styles.rideSquareETA, selectedVehicle === 'Car' && { color: '#FFF' }]}>24 min</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rideSquare, selectedVehicle === 'Van' && styles.activeRideSquare]}
                  onPress={() => setSelectedVehicle('Van')}>
                  <View style={[styles.vehicleCategoryIconWrap, selectedVehicle === 'Van' && styles.vehicleCategoryIconWrapActive]}>
                    <VehicleCategoryIcon category="Van" size={32} active={selectedVehicle === 'Van'} />
                  </View>
                  <Text style={[styles.rideSquareTitle, selectedVehicle === 'Van' && { color: '#FFF' }]}>Van</Text>
                  <Text style={[styles.rideSquarePrice, selectedVehicle === 'Van' && { color: '#FFF' }]}>{getEstimatedFare('Van')}</Text>
                  <Text style={[styles.rideSquareETA, selectedVehicle === 'Van' && { color: '#FFF' }]}>30 min</Text>
                </TouchableOpacity>
              </ScrollView>

              {isExpanded && (
                <View style={styles.bookingFormCard}>
                  <View style={styles.formFieldBlock}>
                    <View style={styles.formLabelRow}>
                      <View style={styles.formIconWrap}>
                        <MaterialCommunityIcons name="ticket-percent-outline" size={18} color="#017270" />
                      </View>
                      <Text style={styles.formLabel}>Promotion code</Text>
                    </View>
                    <View style={styles.promoInputRow}>
                      <TextInput
                        style={styles.promoInput}
                        value={promoCode}
                        onChangeText={(value) => {
                          setPromoCode(value.toUpperCase());
                          if (appliedPromotion) {
                            setAppliedPromotion(null);
                            setPromoStatus('idle');
                            setPromoMessage('');
                          }
                        }}
                        placeholder="Enter promo code"
                        placeholderTextColor="#8A9A9A"
                        autoCapitalize="characters"
                      />
                      <TouchableOpacity
                        style={[styles.applyPromoButton, isApplyingPromo && styles.applyPromoButtonDisabled]}
                        activeOpacity={0.8}
                        onPress={applyPromotionCode}
                        disabled={isApplyingPromo}>
                        <Text style={styles.applyPromoButtonText}>
                          {isApplyingPromo ? 'Applying...' : 'Apply'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {!!promoMessage && (
                      <Text
                        style={[
                          styles.promoFeedback,
                          promoStatus === 'error' && styles.promoFeedbackError,
                        ]}>
                        {promoMessage}
                      </Text>
                    )}
                  </View>

                  <View style={styles.formDivider} />

                  <TouchableOpacity
                    style={styles.paymentMethodRow}
                    activeOpacity={0.82}
                    onPress={() => {
                      Alert.alert('Payment Method', 'Select how you want to pay', [
                        { text: 'Cash', onPress: () => setPaymentMethod('CASH') },
                        { text: 'Wallet', onPress: () => setPaymentMethod('WALLET') },
                        { text: 'Cancel', style: 'cancel' },
                      ]);
                    }}>
                    <View style={styles.paymentMethodLeft}>
                      <View style={styles.formIconWrap}>
                        <MaterialCommunityIcons
                          name={paymentMethod === 'WALLET' ? 'wallet-outline' : 'cash'}
                          size={18}
                          color="#017270"
                        />
                      </View>
                      <View style={styles.paymentTextWrap}>
                        <Text style={styles.formLabel}>Payment method</Text>
                        <Text style={styles.paymentMethodValue}>
                          {paymentMethod === 'WALLET' ? 'Wallet' : 'Cash'}
                        </Text>
                      </View>
                    </View>
                    <Feather name="chevron-right" size={18} color="#8A9A9A" />
                  </TouchableOpacity>

                  <View style={styles.totalPriceRow}>
                    <View>
                      <Text style={styles.totalPriceLabel}>Total price</Text>
                      <Text style={styles.totalPriceHint}>{selectedVehicle} ride fare</Text>
                    </View>
                    {appliedPromotion ? (
                      <View style={styles.totalPriceValueStack}>
                        <Text style={styles.totalPriceOriginalValue}>{displayBasePrice}</Text>
                        <Text style={styles.totalPriceValue}>{displayFinalPrice}</Text>
                      </View>
                    ) : (
                      <Text style={styles.totalPriceValue}>{displayBasePrice}</Text>
                    )}
                  </View>
                </View>
              )}

              {/* Active ride warning banner */}
              {hasActiveRide && (
                <View style={styles.activeRideBanner}>
                  <Ionicons name="information-circle-outline" size={16} color="#D97706" />
                  <Text style={styles.activeRideBannerText}>
                    You already have an active ride. Complete or cancel it first.
                  </Text>
                </View>
              )}

              {/* Confirm Book Button */}
              <TouchableOpacity
                style={[
                  styles.superConfirmButton,
                  (rideRequesting || hasActiveRide || availableDrivers.length === 0) && styles.superConfirmButtonDisabled,
                ]}
                onPress={confirmRide}
                disabled={rideRequesting || hasActiveRide || availableDrivers.length === 0}>
                {rideRequesting ? (
                  <View style={styles.superConfirmButtonContent}>
                    <ActivityIndicator size="small" color="#FFF" />
                    <Text style={styles.superConfirmButtonText}>Finding a Driver...</Text>
                  </View>
                ) : (
                  <Text style={styles.superConfirmButtonText}>
                    {hasActiveRide
                      ? 'Ride Already Active'
                      : availableDrivers.length === 0
                        ? `No ${selectedVehicle} Drivers Online`
                        : `Confirm ${selectedVehicle} - ${displayFinalPrice}`}
                  </Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* ── Finding / Accepted Overlay ── */}
      <Modal
        visible={overlayState !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => {
          if (overlayState === 'accepted') {
            goToLiveTracking();
          }
        }}>
        <View style={styles.overlayBackdrop}>
          <Animated.View style={[styles.overlayCard, { opacity: fadeAnim }]}>
            {overlayState === 'finding' ? (
              /* ── Searching state (white card) ── */
              <>
                {/* Pulsing teal icon ring */}
                <Animated.View style={[styles.overlayIconRing, { transform: [{ scale: pulseAnim }] }]}>
                  <View style={styles.overlayIconInner}>
                    <MaterialCommunityIcons name="car-search" size={34} color={teal} />
                  </View>
                </Animated.View>

                <Text style={styles.overlayTitle}>Finding your NexGO...</Text>
                <Text style={styles.overlaySub}>
                  {'Matching you with the nearest '}{selectedVehicle}{' driver. Hang tight!'}
                </Text>

                <View style={styles.overlayDotsRow}>
                  <ActivityIndicator size="small" color={teal} />
                  <Text style={styles.overlayDotsText}>Connecting nearby drivers</Text>
                </View>

                <TouchableOpacity
                  style={styles.overlayCancelBtn}
                  onPress={() => {
                    cancelRequestedRef.current = true;
                    if (currentRideId && socketRef.current) {
                      socketRef.current.emit('cancelRide', { rideId: currentRideId });
                    }
                    setOverlayState(null);
                    setRideRequesting(false);
                    setHasActiveRide(false);
                    setCurrentRideId(null);
                    pulseAnim.stopAnimation();
                  }}>
                  <Text style={styles.overlayCancelText}>Cancel Request</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* ── Accepted state (white card) ── */
              <>
                <View style={styles.overlayCheckCircle}>
                  <Ionicons name="checkmark-circle" size={52} color={teal} />
                </View>

                <Text style={styles.overlayTitle}>
                  {currentRideStatus === 'InProgress' ? 'Ride is in progress!' : 'Driver is on the way!'}
                </Text>
                <Text style={styles.overlaySub}>
                  {currentRideStatus === 'InProgress'
                    ? `You are heading to your destination in your ${acceptedData?.vehicleType ?? selectedVehicle}.`
                    : `Your ${acceptedData?.vehicleType ?? selectedVehicle} has been confirmed. The driver is heading to your pickup location.`
                  }
                </Text>

                {/* Route summary block */}
                <View style={styles.overlayRouteBlock}>
                  <View style={styles.overlayRouteRow}>
                    <View style={[styles.overlayRouteDot, { backgroundColor: teal }]} />
                    <Text style={styles.overlayRouteText} numberOfLines={1}>
                      {(pName as string) || 'Pickup location'}
                    </Text>
                  </View>
                  <View style={styles.overlayRouteConnector} />
                  <View style={styles.overlayRouteRow}>
                    <View style={[styles.overlayRouteDot, { backgroundColor: '#E74C3C' }]} />
                    <Text style={styles.overlayRouteText} numberOfLines={1}>
                      {(dName as string) || 'Drop-off location'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.overlayDoneBtn}
                  onPress={goToLiveTracking}>
                  <Text style={styles.overlayDoneText}>Got it</Text>
                  <Ionicons name="arrow-forward" size={17} color="#FFF" />
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

function RoutePoint({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.routePoint}>
      <View style={styles.routeIconWrap}>
        <Ionicons name={icon} size={16} color={teal} />
      </View>
      <View style={styles.routeTextWrap}>
        <Text style={styles.routeLabel}>{label}</Text>
        <Text style={styles.routeValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EAEAEA',
  },
  mapPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#EAE6DF',
  },
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 45 : 20,
    marginLeft: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mapLabelPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    maxWidth: 200,
  },
  mapLabelDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  mapLabelText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#017270',
  },
  mapLabelPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -1,
  },
  routeTagPill: {
    backgroundColor: '#017270',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  routeTagText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '800',
  },
  driverMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverMarkerDot: {
    position: 'absolute',
    bottom: -3,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 14,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 20,
  },
  dragHandleContainer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#8A9A9A',
    borderRadius: 2,
    opacity: 0.5,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  eyebrow: {
    color: teal,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 3,
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#102A28',
  },
  pillGroup: {
    alignItems: 'flex-end',
    gap: 5,
  },
  distancePill: {
    backgroundColor: '#E7F5F3',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distancePillText: {
    color: teal,
    fontWeight: '800',
    fontSize: 12,
  },
  routeBlock: {
    borderRadius: 16,
    backgroundColor: '#F7FBFA',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    padding: 12,
    marginBottom: 10,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  routeIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#E7F5F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    color: '#617C79',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 2,
  },
  routeValue: {
    color: '#102A28',
    fontSize: 14,
    fontWeight: '800',
  },
  routeDivider: {
    height: 1,
    backgroundColor: '#D9E9E6',
    marginVertical: 10,
    marginLeft: 40,
  },
  infoWarningText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#526E6C',
    opacity: 0.8,
    marginBottom: 10,
  },
  rideScrollContent: {
    paddingBottom: 12,
  },
  rideSquare: {
    width: 105,
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#017270',
    backgroundColor: '#F0F5F4',
    marginRight: 10,
    alignItems: 'center',
  },
  vehicleCategoryIconWrap: {
    width: 46,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  vehicleCategoryIconWrapActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  activeRideSquare: {
    backgroundColor: '#017270',
  },
  rideSquareTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#017270',
    marginTop: 4,
  },
  rideSquarePrice: {
    fontSize: 13,
    fontWeight: '900',
    color: '#102A28',
    marginTop: 2,
  },
  rideSquareETA: {
    fontSize: 11,
    fontWeight: '700',
    color: '#017270',
    marginTop: 2,
  },
  bookingFormCard: {
    backgroundColor: '#F7FBFA',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    gap: 10,
  },
  formFieldBlock: {
    gap: 8,
  },
  formLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#E7F5F3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#102A28',
  },
  promoInputRow: {
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 6,
    gap: 8,
  },
  promoInput: {
    flex: 1,
    minWidth: 0,
    color: '#102A28',
    fontSize: 13,
    fontWeight: '800',
    paddingVertical: 0,
  },
  promoFeedback: {
    fontSize: 11,
    fontWeight: '700',
    color: '#017270',
  },
  promoFeedbackError: {
    color: '#B45309',
  },
  applyPromoButton: {
    minHeight: 32,
    borderRadius: 10,
    backgroundColor: '#017270',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyPromoButtonDisabled: {
    opacity: 0.7,
  },
  applyPromoButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  formDivider: {
    height: 1,
    backgroundColor: '#E6EFEF',
  },
  paymentMethodRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  paymentMethodLeft: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  paymentTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  paymentMethodValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#617C79',
    marginTop: 2,
  },
  totalPriceRow: {
    minHeight: 58,
    borderRadius: 14,
    backgroundColor: '#E7F5F3',
    borderWidth: 1,
    borderColor: '#C9E5E1',
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  totalPriceLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: '#102A28',
  },
  totalPriceHint: {
    fontSize: 11,
    fontWeight: '700',
    color: '#617C79',
    marginTop: 2,
  },
  totalPriceValue: {
    color: '#017270',
    fontSize: 18,
    fontWeight: '900',
  },
  totalPriceValueStack: {
    alignItems: 'flex-end',
  },
  totalPriceOriginalValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#6B7C7A',
    textDecorationLine: 'line-through',
  },
  superConfirmButton: {
    backgroundColor: '#017270',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  superConfirmButtonDisabled: {
    backgroundColor: '#4A9A98',
  },
  superConfirmButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  superConfirmButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 10,
    fontWeight: '700',
    color: '#017270',
  },
  // ── Active ride banner ────────────────────────────────────────────────────
  activeRideBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF8EC',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  activeRideBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    lineHeight: 17,
  },
  // ── Finding / Accepted overlay ─────────────────────────────────────────────
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(10, 28, 26, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
  },
  overlayCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',         // ← white card, system UI theme
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 28,
    elevation: 20,
  },
  overlayIconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E7F5F3',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  overlayIconInner: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#D0EFEC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayCheckCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#E9F8EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  overlayTitle: {
    color: '#102A28',                    // ← dark text on white card
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  overlaySub: {
    color: '#617C79',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  overlayDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F5F4',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 22,
    width: '100%',
    justifyContent: 'center',
  },
  overlayDotsText: {
    color: '#617C79',
    fontSize: 13,
    fontWeight: '700',
  },
  overlayCancelBtn: {
    borderWidth: 1.5,
    borderColor: '#D9E9E6',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 36,
    width: '100%',
    alignItems: 'center',
  },
  overlayCancelText: {
    color: '#617C79',
    fontSize: 14,
    fontWeight: '800',
  },
  // Route block inside the accepted overlay
  overlayRouteBlock: {
    width: '100%',
    backgroundColor: '#F7FBFA',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  overlayRouteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  overlayRouteDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  overlayRouteText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#102A28',
  },
  overlayRouteConnector: {
    width: 2,
    height: 14,
    backgroundColor: '#D9E9E6',
    borderRadius: 1,
    marginLeft: 4,
    marginVertical: 3,
  },
  overlayDoneBtn: {
    backgroundColor: teal,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  overlayDoneText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});

