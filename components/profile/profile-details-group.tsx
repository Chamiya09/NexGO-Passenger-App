import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';

export type ProfileDetailRow = {
  label: string;
  value: string;
};

export type ProfileDetailActionRow = {
  title: string;
  subtitle: string;
  icon?: keyof typeof Ionicons.glyphMap;
  badge?: string;
  badgeTone?: 'accent' | 'warning';
  onPress?: () => void;
};

type ProfileDetailsGroupProps = {
  title: string;
  rows?: ProfileDetailRow[];
  actionRows?: ProfileDetailActionRow[];
};

export function ProfileDetailsGroup({ title, rows, actionRows }: ProfileDetailsGroupProps) {
  const colors = {
    title: useThemeColor({ light: '#6A807D', dark: '#A3B1AE' }, 'icon'),
    card: useThemeColor({ light: '#FFFFFF', dark: '#1F2327' }, 'background'),
    border: useThemeColor({ light: '#DFE9E7', dark: '#33383D' }, 'icon'),
    divider: useThemeColor({ light: '#EAF0EF', dark: '#3A4147' }, 'icon'),
    textPrimary: useThemeColor({}, 'text'),
    textSecondary: useThemeColor({ light: '#6A807D', dark: '#A3B1AE' }, 'icon'),
    accent: useThemeColor({ light: '#14988F', dark: '#48C4BA' }, 'tint'),
    accentSoft: useThemeColor({ light: '#E7F5F3', dark: '#293538' }, 'background'),
    warning: '#A16207',
    warningSoft: '#FFF6E3',
  };

  const hasActionRows = Boolean(actionRows?.length);
  const simpleRows = rows ?? [];
  const detailedRows = actionRows ?? [];

  return (
    <>
      <Text style={[styles.groupTitle, { color: colors.title }]}>{title}</Text>
      <View style={[styles.groupCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {hasActionRows
          ? detailedRows.map((row, index) => (
              <View key={`${title}-${row.title}`}>
                <Pressable style={styles.actionRow} disabled={!row.onPress} onPress={row.onPress}>
                  <View style={styles.rowLeft}>
                    {row.icon ? (
                      <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
                        <Ionicons name={row.icon} size={17} color={colors.accent} />
                      </View>
                    ) : null}

                    <View style={styles.rowTextWrap}>
                      <View style={styles.titleBadgeRow}>
                        <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>{row.title}</Text>
                        {row.badge ? (
                          <View
                            style={[
                              styles.inlineBadge,
                              {
                                backgroundColor:
                                  row.badgeTone === 'warning' ? colors.warningSoft : colors.accentSoft,
                              },
                            ]}>
                            <Text
                              style={[
                                styles.inlineBadgeText,
                                { color: row.badgeTone === 'warning' ? colors.warning : colors.accent },
                              ]}>
                              {row.badge}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>{row.subtitle}</Text>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </Pressable>
                {index < detailedRows.length - 1 ? (
                  <View style={[styles.actionDivider, { backgroundColor: colors.divider }]} />
                ) : null}
              </View>
            ))
          : simpleRows.map((row, index) => (
              <View key={`${title}-${row.label}`}>
                <View style={styles.row}>
                  <Text style={[styles.label, { color: colors.textPrimary }]}>{row.label}</Text>
                  <Text style={[styles.value, { color: colors.textSecondary }]}>{row.value}</Text>
                </View>
                {index < simpleRows.length - 1 ? (
                  <View style={[styles.divider, { backgroundColor: colors.divider }]} />
                ) : null}
              </View>
            ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  groupTitle: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
    letterSpacing: 0.4,
  },
  groupCard: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  row: {
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    marginLeft: 14,
  },
  label: {
    fontSize: 15,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
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
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 2,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  actionSubtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
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
  actionDivider: {
    height: 1,
    marginLeft: 60,
  },
});
