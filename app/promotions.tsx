import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { API_BASE_URL, parseApiResponse } from '@/lib/api';

const palette = {
  background: '#F4F7F6',
  card: '#FFFFFF',
  primary: '#123532',
  secondary: '#6A807D',
  muted: '#8CA1A0',
  accent: '#14988F',
  accentMuted: '#E7F5F3',
  border: '#DFE9E7',
  divider: '#EAF0EF',
  warning: '#D97706',
  warningSoft: '#FFF6E3',
};

type PromotionSummary = {
  id: string;
  name: string;
  code: string;
  discountType: 'Percentage' | 'Fixed';
  discountValue: string;
  imageUrl: string;
  endDate: string;
  status: string;
  active: boolean;
};

function isActivePromotion(promotion: PromotionSummary) {
  if (!promotion.active || promotion.status !== 'Active') return false;
  if (!promotion.endDate || promotion.endDate === 'No end date') return true;
  const endDate = new Date(promotion.endDate).getTime();
  return Number.isFinite(endDate) && endDate >= Date.now();
}

function getPromoCaption(promotion: PromotionSummary) {
  const discountValue = Number(promotion.discountValue);
  if (promotion.discountType === 'Percentage') {
    return `${Math.min(100, Math.max(0, discountValue))}% off your next ride.`;
  }

  return `Save LKR ${Math.max(0, Math.round(discountValue))} on your next ride.`;
}

export default function PromotionsScreen() {
  const router = useRouter();
  const [promotions, setPromotions] = useState<PromotionSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    fetch(`${API_BASE_URL}/promotions`)
      .then(parseApiResponse<{ promotions: PromotionSummary[] }>)
      .then((data) => {
        if (!mounted) return;
        setPromotions((data.promotions ?? []).filter(isActivePromotion));
      })
      .catch(() => {
        if (mounted) setPromotions([]);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="small" color={palette.accent} />
          <Text style={styles.centerText}>Loading promotions...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles" size={15} color={palette.accent} />
              <Text style={styles.heroBadgeText}>NexGO offers</Text>
            </View>
            <Text style={styles.heroHint}>
              Browse all active ride promotions and use the code when booking your next trip.
            </Text>
          </View>

          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>ACTIVE PROMOTIONS</Text>
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{promotions.length}</Text>
            </View>
          </View>

          {promotions.length > 0 ? (
            promotions.map((promotion) => (
              <View key={promotion.id} style={styles.promotionCard}>
                <View style={styles.promotionMedia}>
                  {promotion.imageUrl ? (
                    <Image source={{ uri: promotion.imageUrl }} style={styles.promotionImage} />
                  ) : (
                    <View style={styles.promotionFallback}>
                      <Ionicons name="pricetag" size={32} color="#FFFFFF" />
                    </View>
                  )}
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeText}>{promotion.code}</Text>
                  </View>
                </View>

                <View style={styles.promotionBody}>
                  <View style={styles.promotionCopy}>
                    <Text style={styles.promotionTitle} numberOfLines={2}>{promotion.name}</Text>
                    <Text style={styles.promotionText}>{getPromoCaption(promotion)}</Text>
                    <View style={styles.metaRow}>
                      <View style={styles.metaPill}>
                        <Ionicons name="time-outline" size={13} color={palette.secondary} />
                        <Text style={styles.promotionMeta}>
                          {promotion.endDate === 'No end date' ? 'No end date' : `Valid until ${promotion.endDate}`}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <Pressable style={styles.useButton} onPress={() => router.push('/(tabs)/ride')}>
                    <Text style={styles.useButtonText}>Use code</Text>
                    <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                  </Pressable>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="sparkles-outline" size={24} color={palette.accent} />
              </View>
              <Text style={styles.emptyTitle}>No active promotions</Text>
              <Text style={styles.emptyText}>Check back later for new NexGO ride offers.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
  },
  container: {
    padding: 20,
    paddingBottom: 30,
  },
  heroCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
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
    backgroundColor: palette.accentMuted,
  },
  heroBadgeText: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: '700',
  },
  heroHint: {
    color: palette.secondary,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
    marginTop: 4,
  },
  sectionTitle: {
    color: palette.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  countPill: {
    minWidth: 28,
    height: 24,
    borderRadius: 999,
    backgroundColor: palette.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countPillText: {
    color: palette.accent,
    fontSize: 12,
    fontWeight: '900',
  },
  promotionCard: {
    backgroundColor: palette.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 14,
  },
  promotionMedia: {
    height: 138,
    backgroundColor: '#1C5B56',
  },
  promotionImage: {
    width: '100%',
    height: '100%',
  },
  promotionFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeBadge: {
    position: 'absolute',
    left: 14,
    bottom: 12,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 6,
    backgroundColor: 'rgba(18,53,50,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  codeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  promotionBody: {
    padding: 16,
    gap: 12,
  },
  promotionCopy: {
    gap: 6,
  },
  promotionTitle: {
    color: palette.primary,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },
  promotionText: {
    color: palette.secondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 2,
  },
  metaPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: '#F7FBFA',
    borderWidth: 1,
    borderColor: palette.divider,
  },
  promotionMeta: {
    color: palette.secondary,
    fontSize: 11,
    fontWeight: '700',
  },
  useButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: palette.accent,
  },
  useButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  centerText: {
    color: palette.secondary,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyState: {
    minHeight: 280,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.border,
    backgroundColor: palette.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: palette.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    color: palette.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  emptyText: {
    color: palette.secondary,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 5,
  },
});
