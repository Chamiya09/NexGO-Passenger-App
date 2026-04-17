import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons } from '@expo/vector-icons';
import MapView, { UrlTile, Marker } from 'react-native-maps';

const { width, height } = Dimensions.get('window');

export default function RideScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      
      {/* Map Background Placeholder */}
      <View style={styles.mapPlaceholder}>
        <MapView
          style={StyleSheet.absoluteFillObject}
          mapType="none"
          initialRegion={{
            latitude: 6.9271,
            longitude: 79.8612,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          <UrlTile
            urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
          />
          <Marker
            coordinate={{ latitude: 6.9271, longitude: 79.8612 }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.markerIcon}>
              <View style={styles.markerDot} />
            </View>
          </Marker>
        </MapView>
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
              {/* First Input Row */}
              <View style={styles.inputRow}>
                <View style={styles.activeIndicator} />
                <View style={styles.inputTextContainer}>
                  <Text style={styles.activeLocationText}>Unknown Location</Text>
                </View>
                <View style={styles.inputIcons}>
                  <TouchableOpacity><Feather name="heart" size={20} color="#A0B3B2" /></TouchableOpacity>
                  <TouchableOpacity><Feather name="plus-circle" size={20} color="#017270" /></TouchableOpacity>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Second Input Row */}
              <View style={[styles.inputRow, { paddingLeft: 11 }]}>
                <View style={styles.inputTextContainer}>
                  <Text style={styles.inactiveLocationText}>Unknown Location</Text>
                </View>
                <View style={styles.inputIcons}>
                  <TouchableOpacity><Feather name="heart" size={20} color="#E0E8E7" /></TouchableOpacity>
                  <TouchableOpacity><Feather name="plus-circle" size={20} color="#E0E8E7" /></TouchableOpacity>
                </View>
              </View>
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
          <TouchableOpacity style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Confirm Pickup</Text>
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
  markerContainer: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -15,
    marginTop: -40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  markerIcon: {
    width: 30,
    height: 30,
    backgroundColor: '#017270',
    borderRadius: 15,
    borderBottomRightRadius: 2,
    transform: [{ rotate: '-45deg' }],
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    backgroundColor: '#FFF',
    borderRadius: 6,
  },
  markerPointer: {
    display: 'none', 
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
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E6EFEF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  timeline: {
    alignItems: 'center',
    width: 20,
    marginRight: 10,
    marginTop: 10,
    marginBottom: 10,
  },
  timelineDotHollow: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    width: 8,
    height: 8,
    backgroundColor: '#017270',
    borderRadius: 2,
  },
  inputFields: {
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 44,
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
    fontSize: 16,
    fontWeight: '800',
    color: '#284644',
  },
  inactiveLocationText: {
    fontSize: 16,
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
    marginBottom: 24,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E6EFEF',
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#102A28',
  },
  confirmButton: {
    backgroundColor: '#017270',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});
