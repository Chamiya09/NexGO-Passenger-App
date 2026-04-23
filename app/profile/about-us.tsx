import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ProfileDetailsGroup } from '@/components/profile/profile-details-group';
import { useThemeColor } from '@/hooks/use-theme-color';

type ValueCard = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const PLATFORM_VALUES: ValueCard[] = [
  {
    title: 'Transparent trips',
    subtitle: 'Clear ride flow, saved destinations, and reliable fare details.',
    icon: 'receipt-outline',
  },
  {
    title: 'Passenger safety',
    subtitle: 'Account protection, support access, and safer travel tools.',
    icon: 'shield-checkmark-outline',
  },
  {
    title: 'Local mobility',
    subtitle: 'Built for everyday passengers, drivers, and city travel needs.',
    icon: 'navigate-outline',
  },
];

const PRODUCT_ROWS = [
  {
    title: 'Passenger app',
    subtitle: 'Book rides, manage payment methods, save addresses, and review activity.',
    icon: 'phone-portrait-outline' as const,
    badge: 'Active',
    badgeTone: 'accent' as const,
  },
  {
    title: 'Driver platform',
    subtitle: 'Driver tools for trips, availability, and earning opportunities.',
    icon: 'car-sport-outline' as const,
    badge: 'NexGO',
    badgeTone: 'accent' as const,
  },
  {
    title: 'Admin system',
    subtitle: 'Operational controls for accounts, trips, and platform oversight.',
    icon: 'analytics-outline' as const,
  },
];

export default function AboutUsScreen() {
  const colors = {
    background: useThemeColor({ light: '#F4F8F7', dark: '#151718' }, 'background'),
    textPrimary: useThemeColor({ light: '#123532', dark: '#ECEDEE' }, 'text'),
    textSecondary: useThemeColor({ light: '#617C79', dark: '#A3B1AE' }, 'icon'),
    card: useThemeColor({ light: '#FFFFFF', dark: '#1F2327' }, 'background'),
    elevatedCard: useThemeColor({ light: '#F7FBFA', dark: '#252A2F' }, 'background'),
    border: useThemeColor({ light: '#D9E9E6', dark: '#33383D' }, 'icon'),
    divider: useThemeColor({ light: '#EAF0EF', dark: '#3A4147' }, 'icon'),
    accent: useThemeColor({ light: '#14988F', dark: '#48C4BA' }, 'tint'),
    accentSoft: useThemeColor({ light: '#E7F5F3', dark: '#293538' }, 'background'),
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroBadge, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="sparkles-outline" size={15} color={colors.accent} />
            <Text style={[styles.heroBadgeText, { color: colors.accent }]}>NexGO mobility</Text>
          </View>

          <View style={styles.brandRow}>
            <View style={[styles.logoMark, { backgroundColor: colors.accent }]}>
              <Text style={styles.logoText}>N</Text>
            </View>
            <View style={styles.brandTextWrap}>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>NexGO Passenger</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>Reliable rides, clearer trips.</Text>
            </View>
          </View>

          <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
            NexGO helps passengers book rides, manage travel details, and stay connected with support through a simple
            mobility system.
          </Text>

          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, { backgroundColor: colors.elevatedCard, borderColor: colors.border }]}>
              <Ionicons name="car-outline" size={17} color={colors.accent} />
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>Trips</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>On demand</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.elevatedCard, borderColor: colors.border }]}>
              <Ionicons name="wallet-outline" size={17} color={colors.accent} />
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>Wallet</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Ready</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: colors.elevatedCard, borderColor: colors.border }]}>
              <Ionicons name="headset-outline" size={17} color={colors.accent} />
              <Text style={[styles.metricValue, { color: colors.textPrimary }]}>Support</Text>
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>24/7</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeadingWrap}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>What We Build For</Text>
          <Text style={[styles.sectionSubheading, { color: colors.textSecondary }]}>
            A passenger experience that feels direct, secure, and easy to manage.
          </Text>
        </View>

        <View style={styles.valueGrid}>
          {PLATFORM_VALUES.map((value) => (
            <View key={value.title} style={[styles.valueCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.valueIconWrap, { backgroundColor: colors.accentSoft }]}>
                <Ionicons name={value.icon} size={20} color={colors.accent} />
              </View>
              <Text style={[styles.valueTitle, { color: colors.textPrimary }]}>{value.title}</Text>
              <Text style={[styles.valueSubtitle, { color: colors.textSecondary }]}>{value.subtitle}</Text>
            </View>
          ))}
        </View>

        <ProfileDetailsGroup title="NEXGO SYSTEM" actionRows={PRODUCT_ROWS} />

        <View style={[styles.storyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.storyTitle, { color: colors.textPrimary }]}>Our Mission</Text>
          <View style={[styles.storyDivider, { backgroundColor: colors.divider }]} />
          <Text style={[styles.storyText, { color: colors.textSecondary }]}>
            NexGO brings passenger booking, driver operations, and admin oversight into one connected system. The goal is
            to make every trip easier to request, easier to track, and easier to support.
          </Text>
        </View>

        <ProfileDetailsGroup
          title="APP INFO"
          rows={[
            { label: 'Version', value: '1.0.0' },
            { label: 'Build', value: '264' },
            { label: 'Platform', value: 'Passenger' },
          ]}
        />

        <ProfileDetailsGroup
          title="COMPANY"
          rows={[
            { label: 'Headquarters', value: 'Sri Lanka' },
            { label: 'Service', value: 'Ride booking' },
            { label: 'Experience', value: 'Mobile first' },
          ]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  heroCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 18,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  logoMark: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
  },
  brandTextWrap: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 23,
    fontWeight: '800',
    marginBottom: 3,
  },
  heroSubtitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  heroHint: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  metricCard: {
    flex: 1,
    minHeight: 76,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 9,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 5,
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
    lineHeight: 17,
  },
  valueGrid: {
    gap: 10,
    marginBottom: 14,
  },
  valueCard: {
    minHeight: 92,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  valueIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  valueTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  valueSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  storyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  storyTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  storyDivider: {
    height: 1,
    marginVertical: 12,
  },
  storyText: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '500',
  },
});
