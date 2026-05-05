import React from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import RefreshableScrollView from '@/components/RefreshableScrollView';
import { ProfileDetailsGroup } from '@/components/profile/profile-details-group';

const colors = {
  background: '#F4F8F7',
  card: '#FFFFFF',
  elevatedCard: '#F7FBFA',
  textPrimary: '#123532',
  textSecondary: '#617C79',
  accent: '#14988F',
  accentSoft: '#E7F5F3',
  border: '#D9E9E6',
  success: '#157A62',
  successSoft: '#E9F8EF',
  warning: '#D97706',
  warningSoft: '#FFF8EC',
};

export default function EarnWithNexgoScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <RefreshableScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.topBarTitle}>Earn with NexGO</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}>
              <Ionicons name="car-sport-outline" size={26} color={colors.accent} />
            </View>
            <View style={styles.heroIdentity}>
              <Text style={styles.heroTitle}>Partner Programs</Text>
              <Text style={styles.heroSubline}>Driver opportunities and referral rewards.</Text>
            </View>
          </View>

          <View style={styles.heroBadge}>
            <Ionicons name="sparkles-outline" size={15} color={colors.accent} />
            <Text style={styles.heroBadgeText}>Passenger earning tools</Text>
          </View>

          <Text style={styles.heroHint}>Join NexGO partner programs and earn from referrals, driving, or future platform campaigns.</Text>
        </View>

        <View style={styles.metricGrid}>
          <MetricCard icon="gift-outline" label="Refer" value="Active" color={colors.accent} backgroundColor={colors.accentSoft} />
          <MetricCard icon="car-outline" label="Driver" value="Apply" color={colors.success} backgroundColor={colors.successSoft} />
          <MetricCard icon="trending-up-outline" label="Rewards" value="Soon" color={colors.warning} backgroundColor={colors.warningSoft} />
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>PROGRAMS</Text>
          <Text style={styles.sectionHint}>NexGO partner hub</Text>
        </View>

        <View style={styles.programCard}>
          <View style={styles.cardAccent} />
          <ProgramRow icon="gift-outline" title="Refer and earn" subtitle="Invite friends and earn rewards when referral campaigns are active." value="Active" />
          <View style={styles.divider} />
          <ProgramRow icon="car-sport-outline" title="Driver partner program" subtitle="Apply to drive with NexGO and manage trips from the Driver app." value="Apply" />
          <View style={styles.divider} />
          <ProgramRow icon="business-outline" title="Fleet partner" subtitle="Future tools for teams and local transport partners." value="Soon" />
        </View>

        <ProfileDetailsGroup
          title="GET READY"
          rows={[
            { label: 'Profile', value: 'Keep details updated' },
            { label: 'Documents', value: 'Prepare before applying' },
            { label: 'Support', value: 'Contact NexGO for help' },
          ]}
        />
      </RefreshableScrollView>
    </SafeAreaView>
  );
}

function MetricCard({ icon, label, value, color, backgroundColor }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color: string;
  backgroundColor: string;
}) {
  return (
    <View style={[styles.metricCard, { backgroundColor }]}>
      <View style={styles.metricIcon}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ProgramRow({ icon, title, subtitle, value }: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  value: string;
}) {
  return (
    <View style={styles.programRow}>
      <View style={styles.programIcon}>
        <Ionicons name={icon} size={18} color={colors.accent} />
      </View>
      <View style={styles.programTextWrap}>
        <Text style={styles.programTitle}>{title}</Text>
        <Text style={styles.programSubtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.programValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30,
  },
  topBar: {
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '900',
  },
  topBarSpacer: {
    width: 38,
    height: 38,
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  heroIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIdentity: {
    flex: 1,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroSubline: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentSoft,
  },
  heroBadgeText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  heroHint: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  metricIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionHeaderRow: {
    minHeight: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 6,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  sectionHint: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  programCard: {
    position: 'relative',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 12,
    paddingLeft: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  cardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.accent,
  },
  programRow: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  programIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  programTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  programTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  programSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  programValue: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 46,
  },
});
