import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

          <View style={styles.heroStatsRow}>
            <View style={[styles.heroStatCard, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
              <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>4</Text>
              <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Privacy checks</Text>
            </View>

            <View style={[styles.heroStatCard, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
              <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>2</Text>
              <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Alerts enabled</Text>
            </View>

            <View style={[styles.heroStatCard, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
              <Text style={[styles.heroStatValue, { color: colors.textPrimary }]}>45d</Text>
              <Text style={[styles.heroStatLabel, { color: colors.textSecondary }]}>Password age</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ACCOUNT SAFETY</Text>
        <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {PRIVACY_ACTIONS.map((item, index) => (
            <View key={item.title}>
              <Pressable style={styles.actionRow}>
                <View style={styles.rowLeft}>
                  <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                    <Ionicons name={item.icon} size={17} color={colors.accent} />
                  </View>

                  <View style={styles.rowTextWrap}>
                    <View style={styles.titleBadgeRow}>
                      <Text style={[styles.rowTitle, { color: colors.textPrimary }]}>{item.title}</Text>
                      {item.badge ? (
                        <View
                          style={[
                            styles.inlineBadge,
                            {
                              backgroundColor: item.badge === 'Off' ? colors.warningSoft : colors.accentSoft,
                            },
                          ]}>
                          <Text
                            style={[
                              styles.inlineBadgeText,
                              { color: item.badge === 'Off' ? colors.warning : colors.accent },
                            ]}>
                            {item.badge}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.rowSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </Pressable>

              {index < PRIVACY_ACTIONS.length - 1 ? (
                <View style={[styles.divider, { backgroundColor: colors.divider }]} />
              ) : null}
            </View>
          ))}
        </View>
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
  heroStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  heroStatCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  heroStatLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 2,
  },
  groupCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  actionRow: {
    minHeight: 78,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  inlineBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  inlineBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginLeft: 60,
  },
});
