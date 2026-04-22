import React, { useMemo } from 'react';
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
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: '/profile/personal-details' | '/profile/payment-details' | '/profile/privacy-security' | '/profile/support-help';
};

const PROFILE_SECTIONS: ProfileSection[] = [
  {
    title: 'Personal Details',
    subtitle: 'Name, email, phone, and saved places',
    icon: 'person-circle-outline',
    route: '/profile/personal-details',
  },
  {
    title: 'Payment Details',
    subtitle: 'Cards, wallet, and billing preferences',
    icon: 'card-outline',
    route: '/profile/payment-details',
  },
  {
    title: 'Privacy & Security',
    subtitle: 'Password, 2FA, and trusted devices',
    icon: 'shield-checkmark-outline',
    route: '/profile/privacy-security',
  },
  {
    title: 'Support & Help',
    subtitle: 'Safety center and 24/7 app support',
    icon: 'help-buoy-outline',
    route: '/profile/support-help',
  },
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

  const userSince = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return `Member since ${currentYear - 1}`;
  }, []);

  const onLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials || 'P'}</Text>
          </View>

          <Text style={styles.name}>{fullName}</Text>
          <Text style={styles.meta}>{user?.email || 'No email available'}</Text>
          <Text style={styles.memberSince}>{userSince}</Text>

          <View style={styles.badgesRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>Points</Text>
              <Text style={styles.badgeValue}>450</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>Rides</Text>
              <Text style={styles.badgeValue}>32</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeLabel}>Rating</Text>
              <Text style={styles.badgeValue}>4.9</Text>
            </View>
          </View>
        </View>

        {PROFILE_SECTIONS.map((section) => (
          <Pressable
            key={section.title}
            style={styles.sectionBox}
            onPress={() => router.push(section.route)}>
            <View style={styles.sectionIconWrap}>
              <Ionicons name={section.icon} size={22} color="#0E857C" />
            </View>
            <View style={styles.sectionTextWrap}>
              <Text style={styles.sectionBoxTitle}>{section.title}</Text>
              <Text style={styles.sectionBoxSubtitle}>{section.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#8CA3A0" />
          </Pressable>
        ))}

        <View style={styles.dangerZone}>
          <Text style={styles.dangerZoneTitle}>Session</Text>
          <Text style={styles.dangerZoneText}>Log out from this device and require sign in next time.</Text>

          <Pressable style={styles.logoutButton} onPress={onLogout}>
            <Text style={styles.logoutText}>Log out</Text>
          </Pressable>
        </View>

        <Text style={styles.versionText}>NexGO Passenger v1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F8F7',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  heroCard: {
    borderRadius: 24,
    padding: 22,
    backgroundColor: '#0B8D83',
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#0D2D2A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  heroGlowOne: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    top: -45,
    right: -35,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroGlowTwo: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    bottom: -40,
    left: -25,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  name: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  meta: {
    fontSize: 14,
    color: '#E8FCFA',
    marginBottom: 4,
  },
  memberSince: {
    color: '#CFF4EF',
    fontSize: 13,
    marginBottom: 16,
    fontWeight: '600',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 10,
  },
  badge: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  badgeLabel: {
    color: '#D9F8F4',
    fontSize: 12,
    marginBottom: 2,
  },
  badgeValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 19,
    fontWeight: '800',
    color: '#123733',
    marginBottom: 4,
  },
  sectionSubheading: {
    fontSize: 13,
    color: '#5D7572',
    marginBottom: 12,
  },
  sectionBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E6ECEB',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 15,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0F2F2C',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF7F6',
    marginRight: 12,
  },
  sectionTextWrap: {
    flex: 1,
  },
  sectionBoxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A3E3A',
    marginBottom: 2,
  },
  sectionBoxSubtitle: {
    fontSize: 13,
    color: '#708684',
  },
  dangerZone: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFF6F6',
    borderWidth: 1,
    borderColor: '#F4D1D1',
  },
  dangerZoneTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#7B2727',
    marginBottom: 4,
  },
  dangerZoneText: {
    color: '#8C4747',
    fontSize: 13,
    marginBottom: 12,
  },
  logoutButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#D84242',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  versionText: {
    marginTop: 14,
    textAlign: 'center',
    color: '#9BAAA9',
    fontSize: 12,
    fontWeight: '600',
  },
});
