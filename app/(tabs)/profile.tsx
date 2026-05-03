import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
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
import RefreshableScrollView from '@/components/RefreshableScrollView';
import { API_BASE_URL, parseApiResponse } from '@/lib/api';

type ProfileSection = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  route:
    | '/profile/personal-details'
    | '/profile/support-help'
    | '/profile/my-support-tickets'
    | '/profile/my-reviews'
    | '/profile/saved-addresses'
    | '/profile/wallet'
    | '/profile/privacy-security'
    | '/profile/earn-with-nexgo'
    | '/profile/about-us';
  badge?: string;
};

const PROFILE_SECTIONS: ProfileSection[] = [
  {
    title: 'Personal Details',
    subtitle: 'Update your passenger identity and contact profile',
    icon: 'person-circle-outline',
    route: '/profile/personal-details',
  },
  {
    title: 'Wallet',
    subtitle: 'Top up ride credit and view wallet activity',
    icon: 'wallet-outline',
    route: '/profile/wallet',
  },
  {
    title: 'My Reviews',
    subtitle: 'View, update, or remove your ride ratings',
    icon: 'star-half-outline',
    route: '/profile/my-reviews',
    badge: 'NEW',
  },
  {
    title: 'Saved Addresses',
    subtitle: 'Home, work, and favorite destinations',
    icon: 'location-outline',
    route: '/profile/saved-addresses',
    badge: 'NEW',
  },
  {
    title: 'Account Security',
    subtitle: 'Password, privacy controls, and login devices',
    icon: 'shield-checkmark-outline',
    route: '/profile/privacy-security',
  },
  {
    title: 'Help and Support',
    subtitle: 'Resolve issues and contact support quickly',
    icon: 'help-circle-outline',
    route: '/profile/support-help',
  },
  {
    title: 'My Support Tickets',
    subtitle: 'Track passenger complaints and support requests',
    icon: 'file-tray-full-outline',
    route: '/profile/my-support-tickets',
    badge: 'NEW',
  },
  {
    title: 'Earn with NexGO',
    subtitle: 'Join as a driver or partner with NexGO',
    icon: 'car-sport-outline',
    route: '/profile/earn-with-nexgo',
  },
  {
    title: 'About Us',
    subtitle: 'Company, terms, and platform information',
    icon: 'information-circle-outline',
    route: '/profile/about-us',
  },
];

type WalletSummary = {
  balance: number;
  transactions?: unknown[];
};

type RideSummary = {
  status?: string;
  canonicalStatus?: string;
  review?: unknown;
};

type ProfileSummary = {
  walletBalance: number;
  completedRides: number;
  reviewedRides: number;
};

const emptyProfileSummary: ProfileSummary = {
  walletBalance: 0,
  completedRides: 0,
  reviewedRides: 0,
};

function getRideStatus(ride: RideSummary) {
  return String(ride.canonicalStatus || ride.status || '').toLowerCase();
}

function formatMoney(amount: number) {
  return `LKR ${Number(amount || 0).toLocaleString('en-LK', { maximumFractionDigits: 0 })}`;
}

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const [profileSummary, setProfileSummary] = useState<ProfileSummary>(emptyProfileSummary);

  const palette = {
    background: '#F4F8F7',
    card: '#FFFFFF',
    elevatedCard: '#F7FBFA',
    primaryText: '#123532',
    secondaryText: '#617C79',
    accent: '#14988F',
    accentMuted: '#E7F5F3',
    border: '#D9E9E6',
    danger: '#C13B3B',
    dangerBg: '#FFF4F4',
  };

  const fullName = user?.fullName || 'Passenger';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

  const loadProfileSummary = useCallback(async () => {
    if (!token) {
      setProfileSummary(emptyProfileSummary);
      return;
    }

    try {
      const requestConfig = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      const [walletResponse, ridesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/auth/wallet`, requestConfig),
        fetch(`${API_BASE_URL}/rides/my-rides`, requestConfig),
      ]);

      const [{ wallet }, { rides }] = await Promise.all([
        parseApiResponse<{ wallet: WalletSummary }>(walletResponse),
        parseApiResponse<{ rides: RideSummary[] }>(ridesResponse),
      ]);

      const safeRides = rides ?? [];
      const completedRides = safeRides.filter((ride) => getRideStatus(ride) === 'completed').length;
      const reviewedRides = safeRides.filter((ride) => Boolean(ride.review)).length;

      setProfileSummary({
        walletBalance: Number(wallet?.balance || 0),
        completedRides,
        reviewedRides,
      });
    } catch {
      setProfileSummary(emptyProfileSummary);
    }
  }, [token]);

  useEffect(() => {
    void loadProfileSummary();
  }, [loadProfileSummary]);

  const profileMetrics = useMemo(
    () => [
      { label: 'Wallet', value: formatMoney(profileSummary.walletBalance), icon: 'wallet-outline' as const },
      { label: 'Completed', value: String(profileSummary.completedRides), icon: 'checkmark-done-outline' as const },
      { label: 'Reviews', value: String(profileSummary.reviewedRides), icon: 'star-outline' as const },
    ],
    [profileSummary.completedRides, profileSummary.reviewedRides, profileSummary.walletBalance]
  );

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <StatusBar style="dark" />
      <RefreshableScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        onRefreshPage={loadProfileSummary}>
        <View style={[styles.heroCard, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={styles.profileHead}>
            <View style={[styles.avatarCircle, { backgroundColor: palette.accentMuted, borderColor: palette.border }]}>
              {user?.profileImageUrl ? (
                <Image source={{ uri: user.profileImageUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={[styles.avatarInitials, { color: palette.accent }]}>{initials || 'P'}</Text>
              )}
            </View>

            <Text style={[styles.profileName, { color: palette.primaryText }]}>{fullName}</Text>
            <Text style={[styles.memberCaption, { color: palette.secondaryText }]}>Passenger account</Text>
          </View>

          <View style={styles.metricsRow}>
            {profileMetrics.map((metric) => (
              <View
                key={metric.label}
                style={[styles.metricItem, { backgroundColor: palette.elevatedCard, borderColor: palette.border }]}>
                <Ionicons name={metric.icon} size={16} color={palette.accent} />
                <Text style={[styles.metricValue, { color: palette.primaryText }]}>{metric.value}</Text>
                <Text style={[styles.metricLabel, { color: palette.secondaryText }]}>{metric.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionHeadingWrap}>
          <Text style={[styles.sectionHeading, { color: palette.primaryText }]}>Account Tools</Text>
          <Text style={[styles.sectionSubheading, { color: palette.secondaryText }]}>Manage your profile and preferences</Text>
        </View>

        {PROFILE_SECTIONS.map((section) => (
          <Pressable
            key={section.title}
            style={[styles.settingRow, { backgroundColor: palette.card, borderColor: palette.border }]}
            onPress={() => router.push(section.route)}>
            <View style={styles.settingLeft}>
              <View style={[styles.settingIconWrap, { backgroundColor: palette.accentMuted }]}>
                <Ionicons name={section.icon} size={20} color={palette.accent} />
              </View>

              <View style={styles.settingTextWrap}>
                <Text style={[styles.settingText, { color: palette.primaryText }]}>{section.title}</Text>
                <Text style={[styles.settingSubtext, { color: palette.secondaryText }]}>{section.subtitle}</Text>
              </View>
            </View>

            <View style={styles.settingRight}>
              {section.badge ? (
                <View style={[styles.badgePill, { backgroundColor: palette.accentMuted, borderColor: palette.border }]}>
                  <Text style={[styles.badgePillText, { color: palette.accent }]}>{section.badge}</Text>
                </View>
              ) : null}
              <Ionicons name="chevron-forward" size={21} color={palette.secondaryText} />
            </View>
          </Pressable>
        ))}

        <Pressable
          style={[
            styles.settingRow,
            styles.logoutRow,
            { backgroundColor: palette.dangerBg, borderColor: '#F1D6D6' },
          ]}
          onPress={() => {
            logout();
            router.replace('/login');
          }}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconWrap, { backgroundColor: '#FFE9E9' }]}>
              <Ionicons name="log-out-outline" size={20} color={palette.danger} />
            </View>

            <View style={styles.settingTextWrap}>
              <Text style={[styles.logoutRowText, { color: palette.danger }]}>Log out</Text>
              <Text style={[styles.settingSubtext, { color: palette.secondaryText }]}>Sign out of this device</Text>
            </View>
          </View>

          <Ionicons name="chevron-forward" size={21} color={palette.secondaryText} />
        </Pressable>

        <View style={styles.footerWrap}>
          <Text style={[styles.footerTop, { color: palette.primaryText }]}>NexGO Passenger</Text>
          <Text style={[styles.footerBottom, { color: palette.secondaryText }]}>Version 1.0.0 (264)</Text>
        </View>
      </RefreshableScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 34,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  profileHead: {
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 11,
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    fontSize: 30,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  memberCaption: {
    fontSize: 12,
    fontWeight: '600',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  metricItem: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 1,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionHeadingWrap: {
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionSubheading: {
    fontSize: 12,
    fontWeight: '500',
  },
  settingRow: {
    borderRadius: 16,
    borderWidth: 1,
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  settingIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingTextWrap: {
    flex: 1,
  },
  settingText: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  settingSubtext: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 17,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 10,
  },
  badgePill: {
    borderWidth: 1,
    paddingHorizontal: 9,
    height: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  logoutRow: {
    marginTop: 6,
  },
  logoutRowText: {
    fontSize: 15,
    fontWeight: '700',
  },
  footerWrap: {
    paddingVertical: 16,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  footerTop: {
    fontSize: 14,
    marginBottom: 3,
    fontWeight: '700',
  },
  footerBottom: {
    fontSize: 12,
    fontWeight: '500',
  },
});
