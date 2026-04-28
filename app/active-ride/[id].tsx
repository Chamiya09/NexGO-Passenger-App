import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ActivityIndicator, Modal } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { Feather, Ionicons } from '@expo/vector-icons';
import { io, Socket } from 'socket.io-client';
import * as geolib from 'geolib';
import { useAuth } from '@/context/auth-context';
import { API_BASE_URL, parseApiResponse } from '@/lib/api';
import { clearPassengerActiveRide, savePassengerActiveRide } from '@/lib/activeRideStorage';

const SOCKET_SERVER_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000').replace(/\/api$/, '');
const teal = '#008080';

const formatMoney = (value?: number | string | null) => {
    const amount = Number(value ?? 0);
    if (!Number.isFinite(amount)) return 'LKR 0';
    return `LKR ${amount.toLocaleString()}`;
};

// Types
type LatLng = { latitude: number; longitude: number };
type MapPhase = 'TRACK_DRIVER' | 'TRACK_TRIP';
type ArrivalVerificationCodePayload = { rideId: string; code: string; passengerId?: string };

// OSRM fetcher
async function fetchOsrmRoute(from: LatLng, to: LatLng) {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data?.routes?.length) throw new Error('No route found');
    const route = data.routes[0];
    return {
        coords: route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng })) as LatLng[],
        distanceKm: (route.distance / 1000).toFixed(1),
        durationMin: Math.round(route.duration / 60),
    };
}

export default function ActiveRideScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const mapRef = useRef<MapView>(null);
    const socketRef = useRef<Socket | null>(null);
    const { user, token } = useAuth();

    // Payload parsing
    const rideId = params.id as string;
    const driverId = params.driverId as string;
    const pLat = parseFloat(params.pLat as string);
    const pLng = parseFloat(params.pLng as string);
    const dLat = parseFloat(params.dLat as string);
    const dLng = parseFloat(params.dLng as string);
    const drLat = parseFloat(params.drLat as string);
    const drLng = parseFloat(params.drLng as string);
    const vehicleType = params.vehicleType as string || 'Vehicle';
    const driverName = params.driverName as string || 'Driver';
    const statusParam = params.status as string || 'Accepted';

    const pickup: LatLng = { latitude: pLat, longitude: pLng };
    const dropoff: LatLng = { latitude: dLat, longitude: dLng };

    const [driverPos, setDriverPos] = useState<LatLng | null>(
        Number.isFinite(drLat) && Number.isFinite(drLng)
            ? { latitude: drLat, longitude: drLng }
            : null
    );
    const [driverHeading, setDriverHeading] = useState(0);

    const [phase, setPhase] = useState<MapPhase>(statusParam === 'InProgress' ? 'TRACK_TRIP' : 'TRACK_DRIVER');
    const [activeStatus, setActiveStatus] = useState(statusParam);
    const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
    const [slicedRouteCoords, setSlicedRouteCoords] = useState<LatLng[]>([]);

    const [distance, setDistance] = useState('—');
    const [duration, setDuration] = useState('—');
    const [loadingRoute, setLoadingRoute] = useState(true);
    const [arrivalCode, setArrivalCode] = useState<string | null>(null);
    const [paymentVisible, setPaymentVisible] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState<string>('LKR 0');

    useEffect(() => {
        if (!rideId) return;

        savePassengerActiveRide({
            id: rideId,
            driverId,
            driverName,
            vehicleType,
            status: activeStatus,
            pLat: String(pLat),
            pLng: String(pLng),
            dLat: String(dLat),
            dLng: String(dLng),
            ...(Number.isFinite(drLat) && Number.isFinite(drLng)
                ? { drLat: String(drLat), drLng: String(drLng) }
                : {}),
        });
    }, [
        activeStatus,
        dLat,
        dLng,
        driverId,
        driverName,
        drLat,
        drLng,
        pLat,
        pLng,
        rideId,
        vehicleType,
    ]);

    // Map Phase Route Computation
    useEffect(() => {
        let active = true;
        const fetchPath = async () => {
            setLoadingRoute(true);
            try {
                const fromPos = phase === 'TRACK_DRIVER' ? (driverPos || pickup) : pickup;
                const toPos = phase === 'TRACK_DRIVER' ? pickup : dropoff;

                // Wait till we have a valid driver pos if in track driver phase to fetch Osrm route
                if (phase === 'TRACK_DRIVER' && !driverPos) return;

                const result = await fetchOsrmRoute(fromPos, toPos);
                if (active) {
                    setRouteCoords(result.coords);
                    setSlicedRouteCoords(result.coords);
                    setDistance(`${result.distanceKm} km`);
                    setDuration(`${result.durationMin} min`);

                    setTimeout(() => {
                        mapRef.current?.fitToCoordinates(result.coords, {
                            edgePadding: { top: 80, right: 60, bottom: 320, left: 60 },
                            animated: true,
                        });
                    }, 600);
                }
            } catch (err) {
                console.error('Route fetch err:', err);
            } finally {
                if (active) setLoadingRoute(false);
            }
        };

        fetchPath();
        return () => { active = false; };
    }, [phase, pickup.latitude, dropoff.latitude, driverPos?.latitude]); // Include driver start pos just once

    // Geolib slice on raw position updates
    useEffect(() => {
        if (phase === 'TRACK_DRIVER' && driverPos && routeCoords.length > 0) {
            const closestIndex = geolib.findNearest(driverPos, routeCoords) as LatLng;
            const matchedIndex = routeCoords.findIndex(c => c.latitude === closestIndex.latitude && c.longitude === closestIndex.longitude);
            if (matchedIndex >= 0) {
                setSlicedRouteCoords(routeCoords.slice(matchedIndex));
            }
        }
    }, [driverPos, phase, routeCoords]);

    // WebSockets
    useEffect(() => {
        const socket = io(SOCKET_SERVER_URL, { transports: ['websocket'] });
        socketRef.current = socket;

        socket.on('connect', () => {
            if (user?.id) socket.emit('registerPassenger', user.id);
        });

        if (driverId) {
            socket.on(`driver_location_${driverId}`, (loc: { latitude: number; longitude: number; heading?: number }) => {
                setDriverPos({ latitude: loc.latitude, longitude: loc.longitude });
                if (loc.heading) setDriverHeading(loc.heading);

                // Minor logic hook: When driver moves, we ensure map fits. Handled sparingly via animation/view thresholds externally.
            });
        }

        socket.on('rideStatusUpdate', (data: { rideId: string; status?: string; canonicalStatus?: string; invoice?: { amount?: number | string } }) => {
            if (data.rideId === rideId) {
                if (data.status) {
                    setActiveStatus(data.status);
                }
                const canonical = String(data.canonicalStatus ?? data.status ?? '').toUpperCase();

                if (canonical === 'ARRIVED') {
                    setArrivalCode(null);
                }
                if (canonical === 'IN_TRANSIT' || canonical === 'INPROGRESS') {
                    setActiveStatus('InProgress');
                    setPhase('TRACK_TRIP');
                } else if (canonical === 'COMPLETED') {
                    clearPassengerActiveRide();
                    setArrivalCode(null);
                    setPaymentAmount(formatMoney(data.invoice?.amount));
                    setPaymentVisible(true);
                } else if (canonical === 'CANCELLED') {
                    clearPassengerActiveRide();
                    router.replace('/(tabs)');
                }
            }
        });

        const handleArrivalVerificationCode = (data: ArrivalVerificationCodePayload) => {
            if (data.passengerId && user?.id && data.passengerId !== user.id) return;

            if (data.rideId === rideId) {
                setArrivalCode(data.code);
            }
        };

        socket.on('arrivalVerificationCode', handleArrivalVerificationCode);
        socket.on('arrivalVerificationCodeBroadcast', handleArrivalVerificationCode);

        return () => { socket.disconnect(); };
    }, [driverId, rideId, user?.id]);

    useEffect(() => {
        if (!token || !rideId) return;

        let cancelled = false;
        const fetchArrivalCode = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/rides/${rideId}/arrival-code`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                const data = await parseApiResponse<{ code: string | null }>(response);
                if (!cancelled && data.code) {
                    setArrivalCode(data.code);
                }
            } catch (error) {
                console.log('[ActiveRide] arrival code fallback failed:', error);
            }
        };

        void fetchArrivalCode();
        const interval = setInterval(fetchArrivalCode, 2000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [rideId, token]);

    const pathColor = phase === 'TRACK_DRIVER' ? teal : '#1A365D';

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFillObject}
                mapType="none"
                initialRegion={{
                    latitude: pLat, longitude: pLng, latitudeDelta: 0.05, longitudeDelta: 0.05
                }}>
                <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />

                {/* Dynamic Route */}
                {slicedRouteCoords.length > 0 && (
                    <Polyline coordinates={slicedRouteCoords} strokeColor={pathColor} strokeWidth={5} lineCap="round" lineJoin="round" zIndex={3} />
                )}

                {/* Driver Marker */}
                {driverPos && (
                    <Marker coordinate={driverPos} anchor={{ x: 0.5, y: 0.5 }} rotation={driverHeading} zIndex={5}>
                        <View style={styles.driverCar}>
                            <Ionicons name="car-sport" size={20} color="#FFF" />
                        </View>
                    </Marker>
                )}

                {/* Target Marker */}
                <Marker coordinate={phase === 'TRACK_DRIVER' ? pickup : dropoff} anchor={{ x: 0.5, y: 1 }} zIndex={4}>
                    <View style={styles.nexusMarker}>
                        <View style={[styles.markerRing, { backgroundColor: pathColor }]} />
                    </View>
                    <View style={[styles.markerPointer, { borderTopColor: '#FFF' }]} />
                </Marker>
            </MapView>

            {/* Safety Header Back Btn */}
            <View style={styles.topNav}>
                <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
                    <Feather name="arrow-left" size={24} color="#102A28" />
                </TouchableOpacity>
            </View>

            {/* Control Card */}
            <View style={styles.card}>
                <View style={styles.dragHandle} />
                <Text style={styles.headerTitle}>
                    {phase === 'TRACK_DRIVER' ? (duration !== '—' ? `Driver is ${duration} away` : 'Driver is on the way') : 'Heading to destination'}
                </Text>

                <View style={styles.infoBlock}>
                    <View style={styles.avatar}>
                        <Ionicons name="person" size={24} color="#FFF" />
                    </View>
                    <View style={styles.metaCol}>
                        <Text style={styles.driverName}>{driverName}</Text>
                        <Text style={styles.vehicleType}>{vehicleType} • {distance}</Text>
                    </View>
                    <TouchableOpacity style={styles.callIcon}>
                        <Ionicons name="call" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <Modal visible={!!arrivalCode} transparent animationType="fade" statusBarTranslucent>
                <View style={styles.codeBackdrop}>
                    <View style={styles.codeCard}>
                        <TouchableOpacity
                            style={styles.codeCloseButton}
                            onPress={() => setArrivalCode(null)}
                            accessibilityRole="button"
                            accessibilityLabel="Close confirm your driver popup">
                            <Ionicons name="close" size={20} color="#4D6F6C" />
                        </TouchableOpacity>
                        <View style={styles.codeIcon}>
                            <Ionicons name="shield-checkmark" size={32} color={teal} />
                        </View>
                        <Text style={styles.codeTitle}>Confirm Your Driver</Text>
                        <Text style={styles.codeSubtitle}>Share this code with your driver after confirming the vehicle and driver.</Text>
                        <Text style={styles.codeValue}>{arrivalCode}</Text>
                        <Text style={styles.codeHint}>Do not share this code before the driver arrives.</Text>
                    </View>
                </View>
            </Modal>

            <Modal visible={paymentVisible} transparent animationType="fade" statusBarTranslucent>
                <View style={styles.codeBackdrop}>
                    <View style={styles.paymentCard}>
                        <View style={styles.completedIcon}>
                            <Ionicons name="checkmark-done" size={30} color={teal} />
                        </View>
                        <Text style={styles.codeTitle}>Trip Completed</Text>
                        <Text style={styles.codeSubtitle}>Your ride has ended. Please confirm the trip payment.</Text>
                        <Text style={styles.paymentValue}>{paymentAmount}</Text>
                        <TouchableOpacity
                            style={styles.paymentButton}
                            onPress={() => {
                                setPaymentVisible(false);
                                router.replace('/(tabs)');
                            }}>
                            <Text style={styles.paymentButtonText}>Confirm Payment</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#EAE6DF' },
    topNav: {
        position: 'absolute', top: 50, left: 20, zIndex: 10
    },
    backBtn: {
        width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8
    },
    driverCar: {
        width: 40, height: 40, borderRadius: 20, backgroundColor: teal, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFF', elevation: 6
    },
    nexusMarker: {
        width: 24, height: 24, borderRadius: 12, backgroundColor: '#FFF', padding: 4, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 5
    },
    markerRing: {
        flex: 1, borderRadius: 10
    },
    markerPointer: {
        width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 10, borderLeftColor: 'transparent', borderRightColor: 'transparent', alignSelf: 'center', marginTop: -2
    },
    card: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: '#FFF', borderTopLeftRadius: 32, borderTopRightRadius: 32,
        paddingHorizontal: 24, paddingVertical: 20, paddingBottom: 40,
        elevation: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -10 }
    },
    dragHandle: {
        width: 40, height: 5, borderRadius: 3, backgroundColor: '#D1E0DE', alignSelf: 'center', marginBottom: 20
    },
    headerTitle: {
        fontSize: 22, fontWeight: '800', color: '#102A28', marginBottom: 20, textAlign: 'center'
    },
    infoBlock: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7FBFA', padding: 16, borderRadius: 24, borderWidth: 1, borderColor: '#E6F5F4'
    },
    avatar: {
        width: 50, height: 50, borderRadius: 25, backgroundColor: '#C8DDD9', justifyContent: 'center', alignItems: 'center'
    },
    metaCol: {
        flex: 1, marginLeft: 16
    },
    driverName: {
        fontSize: 18, fontWeight: '800', color: '#102A28'
    },
    vehicleType: {
        fontSize: 14, fontWeight: '600', color: '#6AA8A4', marginTop: 4
    },
    callIcon: {
        width: 44, height: 44, borderRadius: 22, backgroundColor: teal, justifyContent: 'center', alignItems: 'center', elevation: 4
    },
    codeBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(6, 22, 21, 0.46)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
    },
    codeCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center'
    },
    codeCloseButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F0F7F6',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2
    },
    codeIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E7F5F3',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14
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
        paddingVertical: 14
    },
    codeHint: { fontSize: 12, fontWeight: '800', color: '#D97706', textAlign: 'center', marginTop: 14 },
    paymentCard: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        alignItems: 'center'
    },
    completedIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#E7F5F3',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#BFE7E2'
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
        marginTop: 6
    },
    paymentButton: {
        marginTop: 18,
        backgroundColor: teal,
        borderRadius: 18,
        paddingVertical: 12,
        paddingHorizontal: 22
    },
    paymentButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 }
});
