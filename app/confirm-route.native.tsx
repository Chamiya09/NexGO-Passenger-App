import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ConfirmRouteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  
  const [routesData, setRoutesData] = useState<{coords: {latitude: number, longitude: number}[], distance: string, duration: string}[]>([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState('Mini');

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
        
        if (selectedVehicle === 'Bike' || selectedVehicle === 'TukTuk') {
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

  // Derived price calculator for dynamic button
  const getPriceForSelected = () => {
    switch (selectedVehicle) {
      case 'Bike':
        return 'LKR 850';
      case 'TukTuk':
        return 'LKR 1115';
      case 'Mini':
        return 'LKR 1301';
      case 'Sedan':
        return 'LKR 1450';
      case 'Van':
        return 'LKR 2100';
      default:
        return 'LKR 1301';
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      
      {/* Map Background */}
      <View style={styles.mapPlaceholder}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          mapType="standard"
          initialRegion={{
            latitude: pLat || 6.9271,
            longitude: pLng || 79.8612,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}>
          {/* Pickup Marker */}
          {pLat && pLng && (
            <Marker coordinate={{ latitude: pLat, longitude: pLng }} anchor={{ x: 0.5, y: 1 }} zIndex={3}>
              <View style={styles.mapLabelPill}>
                <View style={[styles.mapLabelDot, { backgroundColor: '#169F95' }]} />
                <Text style={styles.mapLabelText} numberOfLines={1}>Pickup</Text>
              </View>
              <View style={[styles.mapLabelPointer, { borderTopColor: '#FFFFFF' }]} />
            </Marker>
          )}
          
          {/* Dropoff Marker */}
          {dLat && dLng && (
            <Marker coordinate={{ latitude: dLat, longitude: dLng }} anchor={{ x: 0.5, y: 1 }} zIndex={4}>
              <View style={styles.mapLabelPill}>
                <View style={[styles.mapLabelDot, { backgroundColor: '#E74C3C' }]} />
                <Text style={styles.mapLabelText} numberOfLines={1}>Dropoff</Text>
              </View>
              <View style={[styles.mapLabelPointer, { borderTopColor: '#FFFFFF' }]} />
            </Marker>
          )}

          {/* Alternative Routes (Rendered First so they are beneath primary) */}
          {routesData.length > 1 && routesData.slice(1).map((route, index) => (
            <React.Fragment key={`alt-${index}`}>
              <Polyline
                coordinates={route.coords}
                strokeColor="#B0B0B0"
                strokeWidth={6}
                lineJoin="round"
                lineCap="round"
                zIndex={1}
              />
              <Polyline
                coordinates={route.coords}
                strokeColor="#E0E0E0"
                strokeWidth={3}
                lineJoin="round"
                lineCap="round"
                zIndex={1}
              />
            </React.Fragment>
          ))}

          {/* Primary Route Line Highlight (Outer Border) */}
          {routesData.length > 0 && (
            <Polyline
              coordinates={routesData[0].coords}
              strokeColor="#017270"
              strokeWidth={8}
              lineJoin="round"
              lineCap="round"
              zIndex={2}
            />
          )}
          {/* Primary Route Line Core (Inner) */}
          {routesData.length > 0 && (
            <Polyline
              coordinates={routesData[0].coords}
              strokeColor="#169F95"
              strokeWidth={4}
              lineJoin="round"
              lineCap="round"
              zIndex={3}
            />
          )}

          {/* Primary Route Label Midway */}
          {routesData.length > 0 && (
            <Marker coordinate={routesData[0].coords[Math.floor(routesData[0].coords.length / 2)]} anchor={{ x: 0.5, y: 0.5 }} zIndex={5}>
              <View style={styles.routeTagPill}>
                <Text style={styles.routeTagText}>Local Fastest</Text>
              </View>
            </Marker>
          )}

          {/* Alternative Route Label Midway */}
          {routesData.length > 1 && (
            <Marker coordinate={routesData[1].coords[Math.floor(routesData[1].coords.length / 2)]} anchor={{ x: 0.5, y: 0.5 }} zIndex={4}>
              <View style={[styles.routeTagPill, { backgroundColor: '#FFFFFF', borderColor: '#B0B0B0' }]}>
                <Text style={[styles.routeTagText, { color: '#526E6C' }]}>Short Way</Text>
              </View>
            </Marker>
          )}
        </MapView>
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
                  <Text style={styles.sheetTitle}>Choose Your Ride</Text>
                  <View style={styles.distancePill}>
                    <Text style={styles.distancePillText}>{distance || '9.3 km'}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <>
                  {/* Path Row */}
                  <View style={styles.pathRow}>
                    <Text style={styles.pathText} numberOfLines={1}>{pName?.split(',')[0]}...</Text>
                    <Feather name="arrow-right" size={16} color="#017270" style={{ marginHorizontal: 8 }} />
                    <Text style={styles.pathText} numberOfLines={1}>{dName?.split(',')[0]}...</Text>
                  </View>

                  {(selectedVehicle === 'Bike' || selectedVehicle === 'TukTuk') && (
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
                  <MaterialCommunityIcons name="motorbike" size={26} color={selectedVehicle === 'Bike' ? '#FFF' : '#017270'} />
                  <Text style={[styles.rideSquareTitle, selectedVehicle === 'Bike' && { color: '#FFF' }]}>Bike</Text>
                  <Text style={[styles.rideSquarePrice, selectedVehicle === 'Bike' && { color: '#FFF' }]}>LKR 850</Text>
                  <Text style={[styles.rideSquareETA, selectedVehicle === 'Bike' && { color: '#FFF' }]}>15 min</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rideSquare, selectedVehicle === 'TukTuk' && styles.activeRideSquare]}
                  onPress={() => setSelectedVehicle('TukTuk')}>
                  <MaterialCommunityIcons name="train-car" size={26} color={selectedVehicle === 'TukTuk' ? '#FFF' : '#017270'} />
                  <Text style={[styles.rideSquareTitle, selectedVehicle === 'TukTuk' && { color: '#FFF' }]}>TukTuk</Text>
                  <Text style={[styles.rideSquarePrice, selectedVehicle === 'TukTuk' && { color: '#FFF' }]}>LKR 1115</Text>
                  <Text style={[styles.rideSquareETA, selectedVehicle === 'TukTuk' && { color: '#FFF' }]}>28 min</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rideSquare, selectedVehicle === 'Mini' && styles.activeRideSquare]}
                  onPress={() => setSelectedVehicle('Mini')}>
                  <MaterialCommunityIcons name="car" size={26} color={selectedVehicle === 'Mini' ? '#FFF' : '#017270'} />
                  <Text style={[styles.rideSquareTitle, selectedVehicle === 'Mini' && { color: '#FFF' }]}>Mini</Text>
                  <Text style={[styles.rideSquarePrice, selectedVehicle === 'Mini' && { color: '#FFF' }]}>LKR 1301</Text>
                  <Text style={[styles.rideSquareETA, selectedVehicle === 'Mini' && { color: '#FFF' }]}>26 min</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rideSquare, selectedVehicle === 'Sedan' && styles.activeRideSquare]}
                  onPress={() => setSelectedVehicle('Sedan')}>
                  <MaterialCommunityIcons name="car-estate" size={26} color={selectedVehicle === 'Sedan' ? '#FFF' : '#017270'} />
                  <Text style={[styles.rideSquareTitle, selectedVehicle === 'Sedan' && { color: '#FFF' }]}>Sedan</Text>
                  <Text style={[styles.rideSquarePrice, selectedVehicle === 'Sedan' && { color: '#FFF' }]}>LKR 1450</Text>
                  <Text style={[styles.rideSquareETA, selectedVehicle === 'Sedan' && { color: '#FFF' }]}>24 min</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.rideSquare, selectedVehicle === 'Van' && styles.activeRideSquare]}
                  onPress={() => setSelectedVehicle('Van')}>
                  <MaterialCommunityIcons name="van-passenger" size={26} color={selectedVehicle === 'Van' ? '#FFF' : '#017270'} />
                  <Text style={[styles.rideSquareTitle, selectedVehicle === 'Van' && { color: '#FFF' }]}>Van</Text>
                  <Text style={[styles.rideSquarePrice, selectedVehicle === 'Van' && { color: '#FFF' }]}>LKR 2100</Text>
                  <Text style={[styles.rideSquareETA, selectedVehicle === 'Van' && { color: '#FFF' }]}>30 min</Text>
                </TouchableOpacity>
              </ScrollView>

              {isExpanded && (
                <View style={styles.actionList}>
                  <TouchableOpacity style={styles.listRow}>
                    <MaterialCommunityIcons name="ticket-outline" size={22} color="#8A9A9A" />
                    <View style={styles.listRowTextContainer}>
                      <Text style={styles.listRowTitle}>Add Promo Code</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color="#8A9A9A" />
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  <TouchableOpacity style={styles.listRow}>
                    <MaterialCommunityIcons name="cash" size={22} color="#8A9A9A" />
                    <View style={styles.listRowTextContainer}>
                      <Text style={styles.listRowTitle}>Payment Method</Text>
                      <Text style={styles.listRowSub}>Cash</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color="#8A9A9A" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Confirm Book Button */}
              <TouchableOpacity style={styles.superConfirmButton}>
                <Text style={styles.superConfirmButtonText}>Confirm {selectedVehicle} • {getPriceForSelected()}</Text>
              </TouchableOpacity>
            </>
          )}
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
  bottomCardContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  bottomCard: {
    backgroundColor: '#F0F5F4',
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
    marginBottom: 6,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#102A28',
  },
  distancePill: {
    backgroundColor: '#D9ECEB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  distancePillText: {
    color: '#017270',
    fontWeight: '800',
    fontSize: 12,
  },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pathText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#017270',
    maxWidth: '42%',
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
  actionList: {
    backgroundColor: '#F0F5F4',
    marginBottom: 12,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  listRowTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  listRowTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#102A28',
  },
  listRowSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A9A9A',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E6EFEF',
    marginVertical: 0,
  },
  superConfirmButton: {
    backgroundColor: '#017270',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
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
});
