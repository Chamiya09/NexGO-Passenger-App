import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Platform, Image } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons } from '@expo/vector-icons';
import MapView, { UrlTile, Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function RideScreen() {
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
  });
  const [activeStep, setActiveStep] = useState<'PICKUP' | 'DROP'>('PICKUP');
  
  const [pickupData, setPickupData] = useState({
    coords: { latitude: 6.9271, longitude: 79.8612 },
    name: 'Fetching...',
  });

  const [dropData, setDropData] = useState({
    coords: null as any,
    name: 'Unknown Location',
  });

  useEffect(() => {
    const fetchLocationName = async () => {
      try {
        if (activeStep === 'PICKUP') {
          setPickupData(prev => ({ ...prev, name: 'Fetching...' }));
        } else {
          setDropData(prev => ({ ...prev, name: 'Fetching...' }));
        }

        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${selectedLocation.latitude}&lon=${selectedLocation.longitude}&zoom=18&addressdetails=1`);
        const data = await response.json();
        
        let composedName = 'Unknown Location';
        if (data && data.address) {
          const detail = data.address.road || data.address.neighbourhood || data.address.suburb || data.address.village;
          const region = data.address.city || data.address.town || data.address.state;
          
          let name = detail ? `${detail}` : '';
          if (region && detail && detail !== region) {
            name += `, ${region}`;
          } else if (!name && region) {
            name = region;
          }
          if (name) composedName = name;
        }

        if (activeStep === 'PICKUP') {
          setPickupData({ coords: selectedLocation, name: composedName });
        } else {
          setDropData({ coords: selectedLocation, name: composedName });
        }
      } catch (error) {
        console.error('Error fetching location name:', error);
        if (activeStep === 'PICKUP') {
          setPickupData(prev => ({ ...prev, name: 'Unknown Location' }));
        } else {
          setDropData(prev => ({ ...prev, name: 'Unknown Location' }));
        }
      }
    };

    fetchLocationName();
  }, [selectedLocation, activeStep]);

  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      
      {/* Map Background */}
      <View style={styles.mapPlaceholder}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          mapType={Platform.OS === 'android' ? 'none' : 'standard'}
          initialRegion={{
            latitude: 6.9271,
            longitude: 79.8612,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onRegionChangeComplete={(region) => {
            setSelectedLocation({ latitude: region.latitude, longitude: region.longitude });
          }}
        >
          <UrlTile
            urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            shouldReplaceMapContent={true}
            zIndex={1}
          />
        </MapView>

        {/* Fixed Center Selection Marker */}
        <View pointerEvents="none" style={styles.fixedMarkerContainer}>
          <Ionicons name="location-sharp" size={40} color="#169F95" style={styles.fixedMarkerIcon} />
        </View>
      </View>

      {/* Back Button */}
      <SafeAreaView style={styles.topSafeArea}>
        <TouchableOpacity style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#102A28" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Target Location Button */}
      <TouchableOpacity style={styles.targetButton}>
        <Ionicons name="locate" size={24} color="#017270" />
      </TouchableOpacity>

      {/* Bottom Sheet Card */}
      <View style={styles.bottomCardContainer}>
        <View style={styles.bottomCard}>
          
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
          <View style={styles.tagsContainer}>
            <TouchableOpacity style={styles.tagPill}>
              <Feather name="home" size={16} color="#017270" />
              <Text style={styles.tagText}>Home</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tagPill}>
              <Feather name="briefcase" size={16} color="#017270" />
              <Text style={styles.tagText}>Work</Text>
            </TouchableOpacity>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => {
              if (activeStep === 'PICKUP') {
                setActiveStep('DROP');
              } else {
                // Future Implementation: Confirm Route
                alert(`Route confirmed from ${pickupData.name} to ${dropData.name}`);
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
    top: '50%',
    left: '50%',
    marginLeft: -20, 
    marginTop: -40, 
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E6EFEF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
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
  tagsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
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
