import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Platform, ActivityIndicator, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MapView, { UrlTile, Marker, Polyline } from 'react-native-maps';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function ConfirmRouteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);
  
  const [routeCoords, setRouteCoords] = useState<{latitude: number, longitude: number}[]>([]);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  // Safely parse parameters
  const pLat = parseFloat(params.pLat as string);
  const pLng = parseFloat(params.pLng as string);
  const pName = params.pName as string;
  const dLat = parseFloat(params.dLat as string);
  const dLng = parseFloat(params.dLng as string);
  const dName = params.dName as string;

  useEffect(() => {
    const fetchRoute = async () => {
      try {
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${pLng},${pLat};${dLng},${dLat}?overview=full&geometries=geojson`
        );
        const data = await response.json();
        
        if (data && data.routes && data.routes.length > 0) {
          const coords = data.routes[0].geometry.coordinates.map((coord: any) => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
          setRouteCoords(coords);
          
          const distKm = (data.routes[0].distance / 1000).toFixed(1);
          const durMin = Math.round(data.routes[0].duration / 60);
          setDistance(`${distKm} km`);
          setDuration(`${durMin} min`);
          
          // Fit map to coordinates perfectly wrapping both markers and the polyline
          setTimeout(() => {
            mapRef.current?.fitToCoordinates(coords, {
              edgePadding: { top: 120, right: 60, bottom: 400, left: 60 },
              animated: true,
            });
          }, 800);
        }
      } catch (error) {
        console.error("Error fetching route", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (pLat && pLng && dLat && dLng) {
      fetchRoute();
    }
  }, [pLat, pLng, dLat, dLng]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      
      {/* Map Background */}
      <View style={styles.mapPlaceholder}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          mapType={Platform.OS === 'android' ? 'none' : 'standard'}
          initialRegion={{
            latitude: pLat || 6.9271,
            longitude: pLng || 79.8612,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <UrlTile
            urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            shouldReplaceMapContent={true}
            zIndex={-1}
          />
          
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

          {/* Route Label Midway */}
          {routeCoords.length > 0 && (
            <Marker coordinate={routeCoords[Math.floor(routeCoords.length / 2)]} anchor={{ x: 0.5, y: 0.5 }} zIndex={2}>
               <View style={styles.routeTagPill}>
                 <Text style={styles.routeTagText}>Local Fastest</Text>
               </View>
            </Marker>
          )}

          {/* Route Line Highlight (Outer Border) */}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#017270"
              strokeWidth={8}
              lineJoin="round"
              lineCap="round"
              zIndex={1}
            />
          )}
          {/* Route Line Core (Inner) */}
          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#169F95"
              strokeWidth={4}
              lineJoin="round"
              lineCap="round"
              zIndex={2}
            />
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
                onPress={() => setIsExpanded(!isExpanded)}
              >
                <View style={styles.dragHandleContainer}>
                  <View style={styles.dragHandle} />
                </View>

                {/* Title Header */}
                <View style={styles.sheetHeader}>
                  <Text style={styles.sheetTitle}>Choose Your Ride</Text>
                  <View style={styles.distancePill}>
                    <Text style={styles.distancePillText}>{distance || "9.3 km"}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <>
                  {/* Path Row */}
                  <View style={styles.pathRow}>
                    <Text style={styles.pathText} numberOfLines={1}>{pName?.split(',')[0]}...</Text>
                    <Feather name="arrow-right" size={16} color="#017270" style={{marginHorizontal: 8}} />
                    <Text style={styles.pathText} numberOfLines={1}>{dName?.split(',')[0]}...</Text>
                  </View>

                  <Text style={styles.infoWarningText}>Bikes/Tuks are not allowed on expressways. Taking the alternative route.</Text>
                </>
              )}

              {/* Horizontal Ride Scroller */}
              <ScrollView 
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rideScrollContent}
              >
                <TouchableOpacity style={styles.rideSquare}>
                  <MaterialCommunityIcons name="motorbike" size={26} color="#017270" />
                  <Text style={styles.rideSquareTitle}>Bike</Text>
                  <Text style={styles.rideSquarePrice}>LKR 850</Text>
                  <Text style={styles.rideSquareETA}>15 min</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.rideSquare, styles.activeRideSquare]}>
                  <MaterialCommunityIcons name="train-car" size={26} color="#FFF" />
                  <Text style={[styles.rideSquareTitle, {color: '#FFF'}]}>TukTuk</Text>
                  <Text style={[styles.rideSquarePrice, {color: '#FFF'}]}>LKR 1115</Text>
                  <Text style={[styles.rideSquareETA, {color: '#FFF'}]}>28 min</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.rideSquare}>
                  <MaterialCommunityIcons name="car" size={26} color="#017270" />
                  <Text style={styles.rideSquareTitle}>Mini</Text>
                  <Text style={styles.rideSquarePrice}>LKR 1301</Text>
                  <Text style={styles.rideSquareETA}>26 min</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.rideSquare}>
                  <MaterialCommunityIcons name="car-estate" size={26} color="#017270" />
                  <Text style={styles.rideSquareTitle}>Sedan</Text>
                  <Text style={styles.rideSquarePrice}>LKR 1450</Text>
                  <Text style={styles.rideSquareETA}>24 min</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.rideSquare}>
                  <MaterialCommunityIcons name="van-passenger" size={26} color="#017270" />
                  <Text style={styles.rideSquareTitle}>Van</Text>
                  <Text style={styles.rideSquarePrice}>LKR 2100</Text>
                  <Text style={styles.rideSquareETA}>30 min</Text>
                </TouchableOpacity>
              </ScrollView>

              {isExpanded && (
                <View style={styles.actionList}>
                  <TouchableOpacity style={styles.listRow}>
                    <MaterialCommunityIcons name="ticket-outline" size={22} color="#8A9A9A" />
                    <Text style={styles.listRowTitle}>Add Promo Code</Text>
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
                <Text style={styles.superConfirmButtonText}>Confirm NexGO • LKR 1115</Text>
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
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#102A28',
    marginLeft: 12,
  },
  listRowSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8A9A9A',
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
  }
});
