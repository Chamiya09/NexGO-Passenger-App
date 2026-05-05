import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, useWindowDimensions, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { Feather, Ionicons } from '@expo/vector-icons';
import { CustomOsmMap, CustomOsmMapRef } from '@/components/CustomOsmMap';
import { useAuth } from '@/context/auth-context';
import { API_BASE_URL, parseApiResponse } from '@/lib/api';

const teal = '#169F95';
const MARKER_TIP_TOP_RATIO = 0.4;
const DEFAULT_LOCATION = {
  latitude: 6.9271,
  longitude: 79.8612,
};
const CURRENT_LOCATION_REGION_DELTA = 0.008;
const DEVICE_LOCATION_DEBOUNCE_MS = 100;
const MAP_LOCATION_DEBOUNCE_MS = 550;

type Coordinates = {
  latitude: number;
  longitude: number;
};

const getMarkerAlignedRegion = (coords: Coordinates) => ({
  latitude: coords.latitude - (0.5 - MARKER_TIP_TOP_RATIO) * CURRENT_LOCATION_REGION_DELTA,
  longitude: coords.longitude,
  latitudeDelta: CURRENT_LOCATION_REGION_DELTA,
  longitudeDelta: CURRENT_LOCATION_REGION_DELTA,
});

type PhotonReverseGeocodeResponse = {
  features?: {
    properties?: {
      name?: string;
      street?: string;
      district?: string;
      locality?: string;
      city?: string;
      county?: string;
      state?: string;
      country?: string;
    };
  }[];
};

type AddressLabel = 'Home' | 'Work' | 'Other';

type SavedAddress = {
  _id: string;
  label: AddressLabel;
  title: string;
  addressLine: string;
  latitude: number;
  longitude: number;
  note: string;
  isDefault: boolean;
};

export default function RideScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<CustomOsmMapRef>(null);
  const geocodeRequestRef = useRef(0);
  const locatingRef = useRef(false);
  const programmaticMoveRef = useRef(false);
  const programmaticMoveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAppliedDeviceLocationRef = useRef<Coordinates | null>(null);
  const latestDeviceLocationRef = useRef<Coordinates | null>(null);
  const deviceLocationLockedRef = useRef(false);
  const activeStepRef = useRef<'PICKUP' | 'DROP'>('PICKUP');
  const locationSourceRef = useRef<'map' | 'device' | 'saved'>('map');
  const { height } = useWindowDimensions();
  const markerTipTop = height * MARKER_TIP_TOP_RATIO;
  const selectedPromoCode = typeof params.promoCode === 'string' ? params.promoCode : '';

  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [locationSource, setLocationSource] = useState<'map' | 'device' | 'saved'>('map');
  const [locationNameRefreshKey, setLocationNameRefreshKey] = useState(0);
  const [activeStep, setActiveStep] = useState<'PICKUP' | 'DROP'>('PICKUP');
  const [isLocating, setIsLocating] = useState(false);
  const [hasLatestDeviceLocation, setHasLatestDeviceLocation] = useState(false);
  
  const [pickupData, setPickupData] = useState({
    coords: DEFAULT_LOCATION,
    name: 'Fetching...',
  });

  const [dropData, setDropData] = useState({
    coords: null as any,
    name: 'Unknown Location',
  });

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);

  useFocusEffect(
    useCallback(() => {
      async function fetchSavedAddresses() {
        if (!token) return;
        try {
          const response = await fetch(`${API_BASE_URL}/auth/saved-addresses`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await parseApiResponse<{ savedAddresses: SavedAddress[] }>(response);
          setSavedAddresses(data.savedAddresses);
        } catch (error) {
          console.error('Failed to load saved addresses', error);
        }
      }
      void fetchSavedAddresses();
    }, [token])
  );

  useEffect(() => {
    activeStepRef.current = activeStep;
  }, [activeStep]);

  useEffect(() => {
    locationSourceRef.current = locationSource;
  }, [locationSource]);

  const formatCoordsFallback = (latitude: number, longitude: number) =>
    `Pinned location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;

  const formatReverseGeocode = (place: Location.LocationGeocodedAddress | null | undefined, allowRegionOnly = true) => {
    if (!place) {
      return null;
    }

    const streetAddress = [place.streetNumber, place.street].filter(Boolean).join(' ');
    const hasSpecificPlace = Boolean(streetAddress || place.district || place.city || place.subregion);

    if (!allowRegionOnly && !hasSpecificPlace) {
      return null;
    }

    const addressParts = [
      streetAddress,
      place.district,
      place.city || place.subregion,
      place.region,
      place.country,
    ].filter((part, index, parts) => part && parts.indexOf(part) === index);

    return addressParts.length > 0 ? addressParts.join(', ') : null;
  };

  const fetchDetailedLocationName = async ({ latitude, longitude }: Coordinates, allowRegionOnly: boolean) => {
    const response = await fetch(`https://photon.komoot.io/reverse?lon=${longitude}&lat=${latitude}`);

    if (!response.ok) {
      throw new Error('Unable to resolve location');
    }

    const data = (await response.json()) as PhotonReverseGeocodeResponse;
    const properties = data.features?.[0]?.properties;

    if (!properties) {
      return null;
    }

    const detail = properties.name || properties.street || properties.district || properties.locality;
    const region = properties.city || properties.county || (allowRegionOnly ? properties.state : undefined);
    const country = properties.country;
    const parts = [detail, region, country].filter(Boolean);

    return parts.length > 0 ? parts.join(', ') : null;
  };

  const applyDeviceLocation = useCallback((coords: Coordinates, animationDuration = 450, forceNameRefresh = false) => {
    latestDeviceLocationRef.current = coords;
    setHasLatestDeviceLocation(true);
    const previousCoords = lastAppliedDeviceLocationRef.current;
    const isSameLocation =
      previousCoords &&
      Math.abs(previousCoords.latitude - coords.latitude) < 0.00001 &&
      Math.abs(previousCoords.longitude - coords.longitude) < 0.00001;

    if (isSameLocation) {
      if (forceNameRefresh) {
        deviceLocationLockedRef.current = true;
        programmaticMoveRef.current = true;
        if (programmaticMoveTimerRef.current) {
          clearTimeout(programmaticMoveTimerRef.current);
        }
        programmaticMoveTimerRef.current = setTimeout(() => {
          programmaticMoveRef.current = false;
        }, animationDuration + 250);
        setLocationSource('device');
        setLocationNameRefreshKey((current) => current + 1);
        mapRef.current?.animateToRegion(
          getMarkerAlignedRegion(coords),
          animationDuration
        );
      }
      return;
    }

    lastAppliedDeviceLocationRef.current = coords;
    deviceLocationLockedRef.current = true;
    programmaticMoveRef.current = true;
    if (programmaticMoveTimerRef.current) {
      clearTimeout(programmaticMoveTimerRef.current);
    }
    programmaticMoveTimerRef.current = setTimeout(() => {
      programmaticMoveRef.current = false;
    }, animationDuration + 250);

    setLocationSource('device');
    setLocationNameRefreshKey((current) => current + 1);
    setSelectedLocation(coords);
    mapRef.current?.animateToRegion(
      getMarkerAlignedRegion(coords),
      animationDuration
    );
  }, []);

  const moveToDeviceLocation = useCallback(async (showAlerts = false, useCachedLocation = true, forceFreshLocation = false) => {
    if (locatingRef.current && !forceFreshLocation) {
      return;
    }

    locatingRef.current = true;
    setIsLocating(true);

    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        if (showAlerts) {
          Alert.alert('Location is turned off', 'Please enable location services to use your current location.');
        }
        return;
      }

      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        if (showAlerts) {
          Alert.alert('Location permission needed', 'Allow NexGO to access your location so we can select your current place.');
        }
        return;
      }

      if (useCachedLocation) {
        const lastKnownPosition = await Location.getLastKnownPositionAsync({
          maxAge: 30000,
          requiredAccuracy: 50,
        });
        if (lastKnownPosition) {
          applyDeviceLocation(
            {
              latitude: lastKnownPosition.coords.latitude,
              longitude: lastKnownPosition.coords.longitude,
            },
            250,
            showAlerts
          );
        }
      }

      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const currentCoords = {
        latitude: currentPosition.coords.latitude,
        longitude: currentPosition.coords.longitude,
      };

      applyDeviceLocation(currentCoords, 450, showAlerts);
    } catch {
      if (showAlerts) {
        Alert.alert('Unable to find location', 'Please try again or move the map manually.');
      }
    } finally {
      locatingRef.current = false;
      setIsLocating(false);
    }
  }, [applyDeviceLocation]);

  const handleUseCurrentLocation = useCallback(() => {
    const latestDeviceLocation = latestDeviceLocationRef.current;

    if (latestDeviceLocation) {
      applyDeviceLocation(latestDeviceLocation, 350, true);
      void moveToDeviceLocation(false, false, true);
      return;
    }

    void moveToDeviceLocation(true, false, true);
  }, [applyDeviceLocation, moveToDeviceLocation]);

  useEffect(() => {
    const fetchLocationName = async () => {
      if (locationSource === 'saved') {
        return;
      }

      const requestId = geocodeRequestRef.current + 1;
      geocodeRequestRef.current = requestId;

      try {
        if (activeStep === 'PICKUP') {
          setPickupData(prev => ({ ...prev, name: locationSource === 'device' ? 'Current location' : 'Fetching...' }));
        } else {
          setDropData(prev => ({ ...prev, name: locationSource === 'device' ? 'Current location' : 'Fetching...' }));
        }

        const allowRegionOnly = locationSource !== 'device';
        const places = await Location.reverseGeocodeAsync(selectedLocation).catch(() => []);
        const expoName = formatReverseGeocode(places?.[0], allowRegionOnly);
        if (expoName && requestId === geocodeRequestRef.current) {
          if (activeStep === 'PICKUP') {
            setPickupData({ coords: selectedLocation, name: expoName });
          } else {
            setDropData({ coords: selectedLocation, name: expoName });
          }
        }

        const detailedName = await fetchDetailedLocationName(selectedLocation, allowRegionOnly).catch(() => null);
        const composedName =
          detailedName ||
          expoName ||
          (locationSource === 'device'
            ? 'Current location'
            : formatCoordsFallback(selectedLocation.latitude, selectedLocation.longitude));

        if (requestId !== geocodeRequestRef.current) {
          return;
        }

        if (activeStep === 'PICKUP') {
          setPickupData({ coords: selectedLocation, name: composedName });
        } else {
          setDropData({ coords: selectedLocation, name: composedName });
        }
      } catch {
        if (requestId !== geocodeRequestRef.current) {
          return;
        }

        const fallbackName =
          locationSource === 'device'
            ? 'Current location'
            : formatCoordsFallback(selectedLocation.latitude, selectedLocation.longitude);
        if (activeStep === 'PICKUP') {
          setPickupData(prev => ({ ...prev, name: fallbackName }));
        } else {
          setDropData(prev => ({ ...prev, name: fallbackName }));
        }
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchLocationName();
    }, locationSource === 'device' ? DEVICE_LOCATION_DEBOUNCE_MS : MAP_LOCATION_DEBOUNCE_MS);

    return () => clearTimeout(debounceTimer);
  }, [selectedLocation, activeStep, locationSource, locationNameRefreshKey]);

  useEffect(() => {
    let watchSubscription: Location.LocationSubscription | null = null;

    const startPassengerLocationWatch = async () => {
      await moveToDeviceLocation(false);

      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        return;
      }

      watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        (location) => {
          const watchedCoords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };

          latestDeviceLocationRef.current = watchedCoords;
          setHasLatestDeviceLocation(true);

          if (activeStepRef.current !== 'PICKUP' || locationSourceRef.current !== 'device') {
            return;
          }

          applyDeviceLocation(watchedCoords, 250);
        }
      );
    };

    startPassengerLocationWatch();

    return () => {
      watchSubscription?.remove();
      if (programmaticMoveTimerRef.current) {
        clearTimeout(programmaticMoveTimerRef.current);
      }
    };
  }, [applyDeviceLocation, moveToDeviceLocation]);

  const handleSelectSavedAddress = useCallback((address: SavedAddress) => {
    const coords = { latitude: address.latitude, longitude: address.longitude };
    
    programmaticMoveRef.current = true;
    if (programmaticMoveTimerRef.current) {
      clearTimeout(programmaticMoveTimerRef.current);
    }
    programmaticMoveTimerRef.current = setTimeout(() => {
      programmaticMoveRef.current = false;
    }, 600);

    setLocationSource('saved');
    setSelectedLocation(coords);
    mapRef.current?.animateToRegion(getMarkerAlignedRegion(coords), 350);

    if (activeStep === 'PICKUP') {
      setPickupData({ coords, name: address.title });
    } else {
      setDropData({ coords, name: address.title });
    }
  }, [activeStep]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      
      {/* Map Background */}
      <View style={styles.mapPlaceholder}>
        <CustomOsmMap
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: DEFAULT_LOCATION.latitude,
            longitude: DEFAULT_LOCATION.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          ref={mapRef}
          onPanDrag={() => {
            deviceLocationLockedRef.current = false;
            setLocationSource('map');
          }}
          onRegionChangeComplete={(region) => {
            if (programmaticMoveRef.current || deviceLocationLockedRef.current) {
              return;
            }

            setLocationSource('map');
            setSelectedLocation({ latitude: region.latitude, longitude: region.longitude });
          }}
        />

        {/* Fixed Center Selection Marker */}
        <View pointerEvents="none" style={[styles.fixedMarkerContainer, { top: markerTipTop }]}>
          <Ionicons name="location-sharp" size={40} color="#169F95" style={styles.fixedMarkerIcon} />
        </View>
      </View>

      {/* Target Location Button */}
      <TouchableOpacity
        style={[styles.targetButton, isLocating && !hasLatestDeviceLocation && styles.targetButtonDisabled]}
        onPress={handleUseCurrentLocation}
        disabled={isLocating && !hasLatestDeviceLocation}
        accessibilityRole="button"
        accessibilityLabel="Use current location"
      >
        {isLocating && !hasLatestDeviceLocation ? (
          <ActivityIndicator color="#017270" />
        ) : (
          <Ionicons name="locate" size={24} color="#017270" />
        )}
      </TouchableOpacity>

      {/* Bottom Sheet Card */}
      <View style={styles.bottomCardContainer}>
        <View style={styles.bottomCard}>
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.eyebrow}>BOOK RIDE</Text>
              <Text style={styles.sheetTitle}>Set your route</Text>
            </View>
            <View style={styles.statusPill}>
              <Ionicons name="radio-outline" size={14} color={teal} />
              <Text style={styles.statusPillText}>{activeStep === 'PICKUP' ? 'Pickup' : 'Drop-off'}</Text>
            </View>
          </View>
          
          <View style={styles.inputContainer}>
            {/* Timeline Graphic */}
            <View style={styles.timeline}>
              <View style={styles.timelineDotHollow} />
              <View style={styles.timelineLine} />
              <View style={styles.timelineSquare} />
            </View>

            {/* Input Fields */}
            <View style={styles.inputFields}>
              {/* First Input Row - PICKUP */}
              <TouchableOpacity 
                style={[styles.inputRow, activeStep !== 'PICKUP' && { paddingLeft: 11 }]}
                onPress={() => setActiveStep('PICKUP')}
              >
                {activeStep === 'PICKUP' && <View style={styles.activeIndicator} />}
                <View style={styles.inputTextContainer}>
                  <Text style={activeStep === 'PICKUP' ? styles.activeLocationText : styles.inactiveLocationText} numberOfLines={1}>
                    {pickupData.name}
                  </Text>
                </View>
                <View style={styles.inputIcons}>
                  <TouchableOpacity><Feather name="heart" size={20} color={activeStep === 'PICKUP' ? "#017270" : "#E0E8E7"} /></TouchableOpacity>
                </View>
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Second Input Row - DROP */}
              <TouchableOpacity 
                style={[styles.inputRow, activeStep !== 'DROP' && { paddingLeft: 11 }]}
                onPress={() => setActiveStep('DROP')}
              >
                {activeStep === 'DROP' && <View style={styles.activeIndicator} />}
                <View style={styles.inputTextContainer}>
                  <Text style={activeStep === 'DROP' ? styles.activeLocationText : styles.inactiveLocationText} numberOfLines={1}>
                    {dropData.name}
                  </Text>
                </View>
                <View style={styles.inputIcons}>
                  <TouchableOpacity><Feather name="plus-circle" size={20} color={activeStep === 'DROP' ? "#017270" : "#E0E8E7"} /></TouchableOpacity>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Tags */}
          {savedAddresses.length > 0 && (
            <View style={styles.tagsContainerWrapper}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={styles.tagsContainer}
              >
                {savedAddresses.map((address) => {
                  let iconName: React.ComponentProps<typeof Feather>['name'] = 'map-pin';
                  if (address.label === 'Home') iconName = 'home';
                  if (address.label === 'Work') iconName = 'briefcase';

                  return (
                    <TouchableOpacity 
                      key={address._id} 
                      style={styles.tagPill}
                      onPress={() => handleSelectSavedAddress(address)}
                    >
                      <Feather name={iconName} size={16} color="#017270" />
                      <Text style={styles.tagText}>{address.title}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Confirm Button */}
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => {
              if (activeStep === 'PICKUP') {
                setActiveStep('DROP');
              } else {
                if (!dropData.coords || !pickupData.coords) {
                  alert('Please select both locations');
                  return;
                }
                
                router.push({
                  pathname: '/confirm-route',
                  params: {
                    pLat: pickupData.coords.latitude,
                    pLng: pickupData.coords.longitude,
                    pName: pickupData.name,
                    dLat: dropData.coords.latitude,
                    dLng: dropData.coords.longitude,
                    dName: dropData.name,
                    ...(selectedPromoCode && { promoCode: selectedPromoCode }),
                  }
                });
              }
            }}
          >
            <Text style={styles.confirmButtonText}>
              {activeStep === 'PICKUP' ? 'Confirm Pickup' : 'Confirm Dropoff'}
            </Text>
          </TouchableOpacity>

        </View>
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
    overflow: 'hidden',
  },
  mapGraphic: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  mapElement: {
    position: 'absolute',
    backgroundColor: '#D1E6C5',
  },
  roadLine: {
    position: 'absolute',
    width: '150%',
    height: 12,
    backgroundColor: '#FFFFFF',
    top: 150,
    left: -50,
    transform: [{ rotate: '-15deg' }],
  },
  fixedMarkerContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: -20, 
    marginTop: -40, 
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    elevation: 30,
  },
  fixedMarkerIcon: {
    textShadowColor: 'rgba(0,0,0,0.3)', 
    textShadowOffset: { width: 0, height: 4 }, 
    textShadowRadius: 6,
  },
  topSafeArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
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
  targetButton: {
    position: 'absolute',
    bottom: 330,
    right: 20,
    width: 52,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
  },
  targetButtonDisabled: {
    opacity: 0.75,
  },
  bottomCardContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 20,
  },
  bottomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 14,
  },
  eyebrow: {
    color: teal,
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 3,
  },
  sheetTitle: {
    color: '#102A28',
    fontSize: 20,
    fontWeight: '900',
  },
  statusPill: {
    minHeight: 30,
    borderRadius: 15,
    backgroundColor: '#E7F5F3',
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusPillText: {
    color: teal,
    fontSize: 12,
    fontWeight: '900',
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#D9E9E6',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#F7FBFA',
  },
  timeline: {
    alignItems: 'center',
    width: 16,
    marginRight: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  timelineDotHollow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#017270',
    backgroundColor: '#FFF',
  },
  timelineLine: {
    width: 1,
    flex: 1,
    backgroundColor: '#C8DDD9',
    marginVertical: 4,
  },
  timelineSquare: {
    width: 6,
    height: 6,
    backgroundColor: '#017270',
    borderRadius: 1,
  },
  inputFields: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 36,
  },
  activeIndicator: {
    width: 3,
    height: '100%',
    backgroundColor: '#017270',
    marginRight: 8,
    borderRadius: 2,
  },
  inputTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  activeLocationText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#284644',
  },
  inactiveLocationText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#D1E0DE',
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F5F4',
    marginVertical: 4,
  },
  tagsContainerWrapper: {
    marginBottom: 20,
    marginHorizontal: -16, 
  },
  tagsContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    gap: 12,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E6EFEF',
    gap: 6,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#102A28',
  },
  confirmButton: {
    backgroundColor: '#017270',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
