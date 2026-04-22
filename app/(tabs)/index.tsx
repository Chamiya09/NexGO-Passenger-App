import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Platform, StatusBar as RNStatusBar } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { FontAwesome5, Feather, Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, Chamod! 👋</Text>
            <Text style={styles.subtext}>Where are you going today?</Text>
            
            <View style={styles.pointsBadge}>
              <FontAwesome5 name="star" size={12} color="#169F95" solid />
              <Text style={styles.pointsText}>450 Points</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.notificationBtn}>
            <View style={styles.notificationDot} />
            <Feather name="bell" size={24} color="#1A3B39" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <ActionItem icon={() => <Feather name="tag" size={20} color="#169F95" />} label="Offers" />
          <ActionItem icon={() => <Feather name="heart" size={20} color="#169F95" />} label="Saved" />
          <ActionItem icon={() => <Feather name="briefcase" size={20} color="#169F95" />} label="Lost Item" />
          <ActionItem icon={() => <Ionicons name="chatbubble-outline" size={21} color="#169F95" />} label="Support" />
        </View>

        {/* Promotions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Promotions</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>FOR YOU</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.promotionsScroll}>
          <View style={styles.promoCardPrimary}>
            <View style={styles.promoHeaderRow}>
              <View style={styles.pillPrimary}>
                <Text style={styles.pillTextPrimary}>FRI - SUN</Text>
              </View>
              <Feather name="calendar" size={20} color="#FFF" />
            </View>
            <Text style={styles.promoTitlePrimary}>Weekend Special</Text>
            <Text style={styles.promoDescPrimary}>Flat discount on all city rides this weekend.</Text>
          </View>

          <View style={styles.promoCardSecondary}>
            <View style={styles.promoHeaderRow}>
              <View style={styles.pillSecondary}>
                <Text style={styles.pillTextSecondary}>BOOKING</Text>
              </View>
            </View>
            <Text style={styles.promoTitleSecondary}>Airport Drop</Text>
            <Text style={styles.promoDescSecondary}>Book a ride to the airport...</Text>
          </View>
        </ScrollView>

        {/* News & Updates */}
        <View style={[styles.sectionHeader, { marginTop: 32 }]}>
          <Text style={styles.sectionTitle}>News & Updates</Text>
          <TouchableOpacity>
            <Text style={styles.sectionLink}>LATEST</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.newsCard}>
          <View style={styles.newsIconContainer}>
            <Feather name="shield" size={20} color="#169F95" />
          </View>
          <View style={styles.newsContent}>
            <Text style={styles.newsTitle}>Safety Reminder</Text>
            <Text style={styles.newsDesc}>Always verify the driver name and plate number before boarding.</Text>
            <Text style={styles.newsTime}>2h ago</Text>
          </View>
        </View>
        
        {/* Spacer for bottom tab */}
        <View style={{ height: 40 }} />

      </ScrollView>
    </SafeAreaView>
  );
}

const ActionItem = ({ icon, label }: { icon: () => React.ReactNode, label: string }) => (
  <View style={styles.actionItem}>
    <TouchableOpacity style={styles.actionIconBtn}>
      {icon()}
    </TouchableOpacity>
    <Text style={styles.actionLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: '#169F95',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: '#8CA1A0',
    fontWeight: '500',
    marginBottom: 12,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F5F4',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    alignSelf: 'flex-start',
    gap: 4,
  },
  pointsText: {
    color: '#169F95',
    fontSize: 12,
    fontWeight: '700',
  },
  notificationBtn: {
    padding: 8,
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF5A5F',
    zIndex: 1,
    borderWidth: 1.5,
    borderColor: '#FFF',
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  actionItem: {
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F0F5F4',
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2D4A48',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#102A28',
  },
  sectionLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6AA8A4',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  promotionsScroll: {
    gap: 16,
    paddingRight: 20,
  },
  promoCardPrimary: {
    backgroundColor: '#169F95',
    width: 280,
    borderRadius: 20,
    padding: 20,
  },
  promoCardSecondary: {
    backgroundColor: '#3FB1A9',
    width: 240,
    borderRadius: 20,
    padding: 20,
  },
  promoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  pillPrimary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillTextPrimary: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pillSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  pillTextSecondary: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  promoTitlePrimary: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  promoDescPrimary: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  promoTitleSecondary: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
  },
  promoDescSecondary: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  newsCard: {
    flexDirection: 'row',
    backgroundColor: '#F7FBFA',
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
  newsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#E6F5F4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  newsContent: {
    flex: 1,
  },
  newsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#102A28',
    marginBottom: 4,
  },
  newsDesc: {
    fontSize: 13,
    color: '#556B6A',
    lineHeight: 18,
    marginBottom: 8,
    fontWeight: '500',
  },
  newsTime: {
    fontSize: 12,
    color: '#8CA1A0',
    fontWeight: '600',
  },
});
