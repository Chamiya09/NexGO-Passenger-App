import React from 'react';
import {
  ScrollView,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  Platform,
  StatusBar as RNStatusBar,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';

type ProfileSection = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route:
    | '/profile/personal-details'
    | '/profile/membership'
    | '/profile/support-help'
    | '/profile/saved-addresses'
    | '/profile/payment-details'
    | '/profile/privacy-security'
    | '/profile/earn-with-nexgo'
    | '/profile/about-us';
  badge?: string;
};

const PROFILE_SECTIONS: ProfileSection[] = [
  { title: 'Membership', icon: 'ribbon-outline', route: '/profile/membership' },
  { title: 'Account Security', icon: 'shield-checkmark-outline', route: '/profile/privacy-security' },
  { title: 'Help and Support', icon: 'help-circle-outline', route: '/profile/support-help' },
  { title: 'Saved Addresses', icon: 'heart-outline', route: '/profile/saved-addresses', badge: 'New' },
  { title: 'Payment', icon: 'card-outline', route: '/profile/payment-details' },
  { title: 'Earn with NexGO', icon: 'car-sport-outline', route: '/profile/earn-with-nexgo' },
  { title: 'About Us', icon: 'information-circle-outline', route: '/profile/about-us' },
];

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const fullName = user?.fullName || 'Passenger';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHead}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>{initials || 'P'}</Text>
          </View>

          <Pressable style={styles.nameRow} onPress={() => router.push('/profile/personal-details')}>
            <Text style={styles.nameText}>{fullName}</Text>
            <Ionicons name="chevron-forward" size={20} color="#64748B" />
          </Pressable>

          <View style={styles.memberTag}>
            <Text style={styles.memberTagText}>NEXGO PLUS</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressTopRow}>
            <Text style={styles.progressTitle}>
              5 of 10 <Text style={styles.progressTitleAccent}>profile complete</Text>
            </Text>
            <Text style={styles.progressLink}>Complete now</Text>
          </View>

          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>

          <Text style={styles.progressCaption}>
            Add a few more details for faster bookings and safer rides.
          </Text>
        </View>

        <View style={styles.offerCard}>
          <Text style={styles.offerLabel}>NexGO Wallet</Text>
          <Text style={styles.offerTitle}>Get cashback on rides and unlock monthly perks</Text>
          <Pressable style={styles.offerButton}>
            <Text style={styles.offerButtonText}>Activate now</Text>
          </Pressable>

          <View style={styles.offerDecorOne} />
          <View style={styles.offerDecorTwo} />
        </View>

        {PROFILE_SECTIONS.map((section) => (
          <Pressable
            key={section.title}
            style={styles.settingRow}
            onPress={() => router.push(section.route)}>
            <View style={styles.settingLeft}>
              <Ionicons name={section.icon} size={25} color="#1E1E22" />
              <Text style={styles.settingText}>{section.title}</Text>
            </View>

            <View style={styles.settingRight}>
              {section.badge ? (
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>{section.badge}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={22} color="#B8BCC4" />
            </View>
          </Pressable>
        ))}

        <Pressable
          style={[styles.settingRow, styles.logoutRow]}
          onPress={() => {
            logout();
            router.replace('/login');
          }}>
          <View style={styles.settingLeft}>
            <Ionicons name="log-out-outline" size={24} color="#C03939" />
            <Text style={styles.logoutRowText}>Log out</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#D4A9A9" />
        </Pressable>

        <View style={styles.footerWrap}>
          <Text style={styles.footerTop}>Made with ❤️ in Sri Lanka</Text>
          <Text style={styles.footerBottom}>App version: 1.0.0 - 264</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7F6',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },
  profileHead: {
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 16,
  },
  avatarCircle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#DDE9E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CDE0DC',
  },
  avatarInitials: {
    fontSize: 32,
    color: '#1E4B45',
    fontWeight: '800',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  nameText: {
    fontSize: 23,
    fontWeight: '800',
    color: '#173A36',
    marginRight: 4,
  },
  memberTag: {
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C746A',
  },
  memberTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  progressCard: {
    borderRadius: 16,
    backgroundColor: '#E9F1F8',
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DDE7F2',
  },
  progressTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 15,
    color: '#1F3552',
    fontWeight: '700',
  },
  progressTitleAccent: {
    color: '#345E93',
    fontWeight: '700',
  },
  progressLink: {
    color: '#2569A3',
    fontSize: 13,
    fontWeight: '500',
  },
  progressTrack: {
    height: 6,
    borderRadius: 4,
    backgroundColor: '#C7D9EA',
    marginBottom: 10,
  },
  progressFill: {
    width: '50%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#1F5F9A',
  },
  progressCaption: {
    color: '#314D70',
    fontSize: 12,
    fontWeight: '500',
  },
  offerCard: {
    borderRadius: 18,
    backgroundColor: '#0F8A80',
    minHeight: 150,
    padding: 16,
    marginBottom: 18,
    overflow: 'hidden',
  },
  offerLabel: {
    alignSelf: 'flex-start',
    backgroundColor: '#E8FAF7',
    color: '#0A5C54',
    fontWeight: '700',
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginBottom: 10,
  },
  offerTitle: {
    width: '62%',
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 23,
    marginBottom: 14,
  },
  offerButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  offerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10312D',
  },
  offerDecorOne: {
    position: 'absolute',
    width: 170,
    height: 170,
    borderRadius: 85,
    right: -26,
    top: -22,
    backgroundColor: '#0A766D',
  },
  offerDecorTwo: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    right: -68,
    bottom: -96,
    backgroundColor: '#3AC0B0',
    opacity: 0.35,
  },
  settingRow: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    minHeight: 72,
    paddingHorizontal: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 2,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 17,
    color: '#1C1F24',
    fontWeight: '500',
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  badgePill: {
    backgroundColor: '#E43A3A',
    paddingHorizontal: 11,
    height: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  logoutRow: {
    marginTop: 8,
    backgroundColor: '#FFF7F7',
  },
  logoutRowText: {
    fontSize: 17,
    color: '#B72F2F',
    fontWeight: '600',
  },
  footerWrap: {
    paddingVertical: 14,
    paddingHorizontal: 2,
  },
  footerTop: {
    fontSize: 16,
    color: '#252A34',
    marginBottom: 5,
    fontWeight: '500',
  },
  footerBottom: {
    color: '#9DA3AE',
    fontSize: 14,
  },
});
