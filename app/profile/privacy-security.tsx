import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { ProfileDetailsGroup } from '@/components/profile/profile-details-group';
import { useThemeColor } from '@/hooks/use-theme-color';

const PRIVACY_ACTIONS = [
  {
    title: 'Change password',
    subtitle: 'Last updated 45 days ago',
    icon: 'key-outline' as const,
    badge: 'Recommended',
  },
  {
    title: 'Two-factor authentication',
    subtitle: 'Add an extra verification step during sign in',
    icon: 'shield-checkmark-outline' as const,
    badge: 'Off',
  },
  {
    title: 'Download account data',
    subtitle: 'Export your rides, wallet history, and saved account info',
    icon: 'download-outline' as const,
  },
  {
    title: 'Blocked riders and contacts',
    subtitle: 'Review people you no longer want to interact with',
    icon: 'ban-outline' as const,
  },
];

export default function PrivacySecurityScreen() {
  const colors = {
    background: useThemeColor({}, 'background'),
    textPrimary: useThemeColor({}, 'text'),
    textSecondary: useThemeColor({ light: '#6A807D', dark: '#A3B1AE' }, 'icon'),
    card: useThemeColor({ light: '#FFFFFF', dark: '#1F2327' }, 'background'),
    border: useThemeColor({ light: '#DFE9E7', dark: '#33383D' }, 'icon'),
    divider: useThemeColor({ light: '#EAF0EF', dark: '#3A4147' }, 'icon'),
    accent: useThemeColor({ light: '#14988F', dark: '#48C4BA' }, 'tint'),
    accentSoft: useThemeColor({ light: '#E7F5F3', dark: '#293538' }, 'background'),
    warning: '#A16207',
    warningSoft: '#FFF6E3',
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroBadge, { backgroundColor: colors.accentSoft }]}>
            <Ionicons name="shield-checkmark-outline" size={15} color={colors.accent} />
            <Text style={[styles.heroBadgeText, { color: colors.accent }]}>Protection active</Text>
          </View>

          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Privacy & security controls</Text>
          <Text style={[styles.heroHint, { color: colors.textSecondary }]}>
            Review sign-in safety, data visibility, and trusted access across your NexGO account.
          </Text>

          <View style={[styles.heroDetailsCard, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
            <View style={styles.heroDetailRow}>
              <View style={styles.heroDetailLeft}>
                <Ionicons name="shield-checkmark-outline" size={16} color={colors.accent} />
                <Text style={[styles.heroDetailLabel, { color: colors.textPrimary }]}>Sign-in protection</Text>
              </View>
              <Text style={[styles.heroDetailValue, { color: colors.textSecondary }]}>Password and 2FA settings</Text>
            </View>

            <View style={[styles.heroInlineDivider, { backgroundColor: colors.border }]} />

            <View style={styles.heroDetailRow}>
              <View style={styles.heroDetailLeft}>
                <Ionicons name="notifications-outline" size={16} color={colors.accent} />
                <Text style={[styles.heroDetailLabel, { color: colors.textPrimary }]}>Security alerts</Text>
              </View>
              <Text style={[styles.heroDetailValue, { color: colors.textSecondary }]}>New login and account activity notices</Text>
            </View>

            <View style={[styles.heroInlineDivider, { backgroundColor: colors.border }]} />

            <View style={styles.heroDetailRow}>
              <View style={styles.heroDetailLeft}>
                <Ionicons name="document-text-outline" size={16} color={colors.accent} />
                <Text style={[styles.heroDetailLabel, { color: colors.textPrimary }]}>Privacy requests</Text>
              </View>
              <Text style={[styles.heroDetailValue, { color: colors.textSecondary }]}>Download data and manage blocked contacts</Text>
            </View>
          </View>
        </View>

        <ProfileDetailsGroup
          title="ACCOUNT SAFETY"
          actionRows={PRIVACY_ACTIONS.map((item) => ({
            title: item.title,
            subtitle: item.subtitle,
            icon: item.icon,
            badge: item.badge,
            badgeTone: item.badge === 'Off' ? 'warning' : 'accent',
          }))}
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
    paddingBottom: 24,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  heroHint: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '500',
  },
  heroDetailsCard: {
    borderWidth: 1,
    borderRadius: 14,
    marginTop: 14,
  },
  heroDetailRow: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  heroDetailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  heroDetailLabel: {
    fontSize: 13,
    fontWeight: '800',
  },
  heroDetailValue: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  heroInlineDivider: {
    height: 1,
    marginLeft: 12,
  },
});
