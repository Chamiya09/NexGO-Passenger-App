import React, { useCallback, useEffect, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar as RNStatusBar,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '@/context/auth-context';
import { loadPassengerActiveRide, PassengerActiveRideParams } from '@/lib/activeRideStorage';
import { API_BASE_URL, parseApiResponse } from '@/lib/api';

const palette = {
  background: '#F4F8F7',
  card: '#FFFFFF',
  elevated: '#F7FBFA',
  primary: '#123532',
  secondary: '#617C79',
  muted: '#8CA1A0',
  accent: '#169F95',
  accentDark: '#017270',
  accentMuted: '#E7F5F3',
  border: '#D9E9E6',
  warning: '#D97706',
  warningBg: '#FFF8EC',
};

type QuickAction = {
  label: string;
  caption: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

type ServiceCard = {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: 'primary' | 'light';
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

const serviceCards: ServiceCard[] = [
  {
    title: 'City Ride',
    subtitle: 'Fast daily rides around town',
    icon: 'car-sport-outline',
    tone: 'primary',
  },
  {
    title: 'Airport Drop',
    subtitle: 'Plan reliable airport travel',
    icon: 'airplane-outline',
    tone: 'light',
  },
  {
    title: 'Family Trip',
    subtitle: 'Spacious cars for group rides',
    icon: 'people-outline',
    tone: 'light',
  },
];

function getFirstName(fullName?: string) {
  return fullName?.trim().split(/\s+/)[0] || 'Passenger';
}

function ActiveRideCard({
  ride,
  onResume,
}: {
  ride: PassengerActiveRideParams;
  onResume: () => void;
}) {
  return (
    <Pressable style={styles.activeRideCard} onPress={onResume}>
      <View style={styles.activeRideIcon}>
        <Ionicons name="navigate" size={20} color="#FFFFFF" />
      </View>

      <View style={styles.activeRideCopy}>
        <Text style={styles.activeRideEyebrow}>ACTIVE RIDE</Text>
        <Text style={styles.activeRideTitle} numberOfLines={1}>
          {ride.driverName ? `${ride.driverName} is on the way` : 'Resume your current ride'}
        </Text>
        <Text style={styles.activeRideMeta} numberOfLines={1}>
          {ride.vehicleType || 'NexGO ride'} {ride.status ? `- ${ride.status}` : ''}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={22} color={palette.accentDark} />
    </Pressable>
  );
}

function QuickActionButton({ action }: { action: QuickAction }) {
  return (
    <Pressable style={styles.quickAction} onPress={action.onPress}>
      <View style={styles.quickIconWrap}>
        <Ionicons name={action.icon} size={21} color={palette.accentDark} />
      </View>
      <Text style={styles.quickLabel}>{action.label}</Text>
      <Text style={styles.quickCaption}>{action.caption}</Text>
    </Pressable>
  );
}

function ServiceTile({ service, onPress }: { service: ServiceCard; onPress: () => void }) {
  const isPrimary = service.tone === 'primary';

  return (
    <Pressable
      style={[styles.serviceTile, isPrimary ? styles.serviceTilePrimary : styles.serviceTileLight]}
      onPress={onPress}>
      <View style={[styles.serviceIcon, isPrimary ? styles.serviceIconPrimary : styles.serviceIconLight]}>
        <Ionicons name={service.icon} size={23} color={isPrimary ? '#FFFFFF' : palette.accentDark} />
      </View>
      <Text style={[styles.serviceTitle, isPrimary ? styles.serviceTitlePrimary : styles.serviceTitleLight]}>
        {service.title}
      </Text>
      <Text style={[styles.serviceSubtitle, isPrimary ? styles.serviceSubtitlePrimary : styles.serviceSubtitleLight]}>
        {service.subtitle}
      </Text>
    </Pressable>
  );
}

function PromotionCard({
  promotion,
  index,
  getPromoCaption,
  onUse,
}: {
  promotion: PromotionSummary;
  index: number;
  getPromoCaption: (promotion: PromotionSummary) => string;
  onUse: () => void;
}) {
  const cardAnim = React.useRef(new Animated.Value(0)).current;
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  const ctaPulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    cardAnim.setValue(0);
    const intro = Animated.timing(cardAnim, {
      toValue: 1,
      duration: 520,
      delay: index * 90,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });

    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(1100),
      ])
    );

    const ctaPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(ctaPulseAnim, {
          toValue: 1.04,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(ctaPulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    intro.start();
    shimmer.start();
    ctaPulse.start();

    return () => {
      intro.stop();
      shimmer.stop();
      ctaPulse.stop();
    };
  }, [cardAnim, ctaPulseAnim, index, shimmerAnim]);

  const cardStyle = {
    opacity: cardAnim,
    transform: [
      {
        translateY: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
      {
        scale: cardAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.96, 1],
        }),
      },
    ],
  };

  const shimmerStyle = {
    opacity: shimmerAnim.interpolate({
      inputRange: [0, 0.18, 0.48, 1],
      outputRange: [0, 0.22, 0, 0],
    }),
    transform: [
      { rotate: '18deg' },
      {
        translateX: shimmerAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [-80, 340],
        }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.promoCard, cardStyle]}>
      <View style={styles.promoMedia}>
        {promotion.imageUrl ? (
          <Image
            source={{ uri: promotion.imageUrl }}
            style={styles.promoImage}
          />
        ) : (
          <View style={styles.promoMediaFallback}>
            <Ionicons name="pricetag" size={34} color="#FFFFFF" />
          </View>
        )}
        <Animated.View pointerEvents="none" style={[styles.promoShimmer, shimmerStyle]} />
        <View style={styles.promoBadge}>
          <Text style={styles.promoBadgeText}>{promotion.code}</Text>
        </View>
      </View>
      <View style={styles.promoBody}>
        <Text style={styles.promoTitle} numberOfLines={2}>{promotion.name}</Text>
        <Text style={styles.promoText} numberOfLines={2}>{getPromoCaption(promotion)}</Text>
        <View style={styles.promoFooter}>
          <View style={styles.promoMetaPill}>
            <Ionicons name="sparkles" size={12} color="#017270" />
            <Text style={styles.promoMetaText}>Limited offer</Text>
          </View>
          <Animated.View style={{ transform: [{ scale: ctaPulseAnim }] }}>
            <Pressable style={styles.promoCta} onPress={onUse}>
              <Text style={styles.promoCtaText}>Use code</Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeRide, setActiveRide] = useState<PassengerActiveRideParams | null>(null);
  const [promotions, setPromotions] = useState<PromotionSummary[]>([]);
  const promoScrollRef = React.useRef<ScrollView>(null);
  const promoAutoIndexRef = React.useRef(0);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      loadPassengerActiveRide().then((ride) => {
        if (mounted) {
          setActiveRide(ride);
        }
      });

      return () => {
        mounted = false;
      };
    }, [])
  );

  useEffect(() => {
    let mounted = true;

    fetch(`${API_BASE_URL}/promotions`)
      .then(parseApiResponse<{ promotions: PromotionSummary[] }>)
      .then((data) => {
        if (!mounted) return;
        const now = Date.now();
        const activePromotions = (data.promotions ?? []).filter((item) => {
          if (!item.active || item.status !== 'Active') return false;
          if (!item.endDate || item.endDate === 'No end date') return true;
          const endDate = new Date(item.endDate).getTime();
          return Number.isFinite(endDate) && endDate >= now;
        });
        setPromotions(activePromotions);
      })
      .catch(() => {
        if (mounted) setPromotions([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (promotions.length <= 1) return undefined;

    const cardWidthWithGap = 312;
    const interval = setInterval(() => {
      promoAutoIndexRef.current = (promoAutoIndexRef.current + 1) % promotions.length;
      promoScrollRef.current?.scrollTo({
        x: promoAutoIndexRef.current * cardWidthWithGap,
        animated: true,
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [promotions.length]);

  const getPromoCaption = (promotion: PromotionSummary) => (
    promotion.discountType === 'Percentage'
      ? `Use code ${promotion.code} to get ${Math.min(100, Math.max(0, Number(promotion.discountValue)))}% off your next ride.`
      : `Use code ${promotion.code} to save LKR ${Math.max(0, Math.round(Number(promotion.discountValue)))} on your next ride.`
  );

  const quickActions: QuickAction[] = [
    {
      label: 'Saved',
      caption: 'Places',
      icon: 'location-outline',
      onPress: () => router.push('/profile/saved-addresses'),
    },
    {
      label: 'Wallet',
      caption: 'Payments',
      icon: 'wallet-outline',
      onPress: () => router.push('/profile/payment-details'),
    },
    {
      label: 'Trips',
      caption: 'History',
      icon: 'time-outline',
      onPress: () => router.push('/(tabs)/activities'),
    },
    {
      label: 'Support',
      caption: 'Help',
      icon: 'chatbubble-ellipses-outline',
      onPress: () => router.push('/profile/support-help'),
    },
  ];

  const resumeActiveRide = () => {
    if (!activeRide?.id) {
      return;
    }

    router.push({
      pathname: '/active-ride/[id]',
      params: activeRide,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.greeting}>Hi, {getFirstName(user?.fullName)}</Text>
            <Text style={styles.subtext}>Ready for your next NexGO ride?</Text>
          </View>

          <Pressable style={styles.notificationButton} onPress={() => router.push('/(tabs)/activities')}>
            <View style={styles.notificationDot} />
            <Ionicons name="notifications-outline" size={23} color={palette.primary} />
          </Pressable>
        </View>

        {activeRide ? <ActiveRideCard ride={activeRide} onResume={resumeActiveRide} /> : null}

        <View style={styles.quickGrid}>
          {quickActions.map((action) => (
            <QuickActionButton key={action.label} action={action} />
          ))}
        </View>

        {promotions.length > 0 ? (
          <>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Ride Promotions</Text>
                <Text style={styles.sectionCaption}>Limited-time offers from NexGO</Text>
              </View>
            </View>

            <ScrollView
              ref={promoScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promoScroll}
              decelerationRate="fast"
              snapToInterval={312}
              snapToAlignment="start"
              onMomentumScrollEnd={(event) => {
                promoAutoIndexRef.current = Math.round(event.nativeEvent.contentOffset.x / 312);
              }}>
              {promotions.map((promotion, index) => (
                <PromotionCard
                  key={promotion.id}
                  promotion={promotion}
                  index={index}
                  getPromoCaption={getPromoCaption}
                  onUse={() => router.push('/(tabs)/ride')}
                />
              ))}
            </ScrollView>
          </>
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Ride Options</Text>
            <Text style={styles.sectionCaption}>Choose what fits today</Text>
          </View>
          <Pressable style={styles.sectionAction} onPress={() => router.push('/(tabs)/ride')}>
            <Text style={styles.sectionActionText}>Book</Text>
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.servicesScroll}>
          {serviceCards.map((service) => (
            <ServiceTile key={service.title} service={service} onPress={() => router.push('/(tabs)/ride')} />
          ))}
        </ScrollView>

        <View style={styles.safetyCard}>
          <View style={styles.safetyIcon}>
            <Ionicons name="shield-outline" size={22} color={palette.warning} />
          </View>
          <View style={styles.safetyCopy}>
            <Text style={styles.safetyTitle}>Safety reminder</Text>
            <Text style={styles.safetyText}>
              Check the driver name, vehicle color, and plate number before starting your trip.
            </Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.background,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  headerCopy: {
    flex: 1,
  },
  greeting: {
    color: palette.primary,
    fontSize: 25,
    fontWeight: '900',
  },
  subtext: {
    color: palette.secondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },
  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF5D5D',
    borderWidth: 1.5,
    borderColor: palette.card,
    zIndex: 1,
  },
  activeRideCard: {
    backgroundColor: palette.accentMuted,
    borderWidth: 1,
    borderColor: '#BFE2DD',
    borderRadius: 18,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeRideIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: palette.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeRideCopy: {
    flex: 1,
  },
  activeRideEyebrow: {
    color: palette.accentDark,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 3,
  },
  activeRideTitle: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  activeRideMeta: {
    color: palette.secondary,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  quickAction: {
    flex: 1,
    minHeight: 98,
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 18,
    padding: 11,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.accentMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  quickLabel: {
    color: palette.primary,
    fontSize: 13,
    fontWeight: '900',
  },
  quickCaption: {
    color: palette.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 2,
  },
  sectionTitle: {
    color: palette.primary,
    fontSize: 20,
    fontWeight: '900',
  },
  sectionCaption: {
    color: palette.secondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionAction: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: palette.accentMuted,
  },
  sectionActionText: {
    color: palette.accentDark,
    fontSize: 12,
    fontWeight: '900',
  },
  servicesScroll: {
    gap: 12,
    paddingRight: 20,
  },
  serviceTile: {
    width: 180,
    minHeight: 150,
    borderRadius: 20,
    padding: 16,
    gap: 9,
    borderWidth: 1,
  },
  serviceTilePrimary: {
    backgroundColor: palette.accent,
    borderColor: palette.accent,
  },
  serviceTileLight: {
    backgroundColor: palette.card,
    borderColor: palette.border,
  },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconPrimary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  serviceIconLight: {
    backgroundColor: palette.accentMuted,
  },
  serviceTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 4,
  },
  serviceTitlePrimary: {
    color: '#FFFFFF',
  },
  serviceTitleLight: {
    color: palette.primary,
  },
  serviceSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },
  serviceSubtitlePrimary: {
    color: 'rgba(255,255,255,0.88)',
  },
  serviceSubtitleLight: {
    color: palette.secondary,
  },
  promoScroll: {
    gap: 12,
    paddingRight: 20,
  },
  promoCard: {
    width: 300,
    borderRadius: 22,
    backgroundColor: '#0F3431',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  promoMedia: {
    height: 128,
    backgroundColor: '#1C5B56',
    overflow: 'hidden',
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  promoMediaFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoShimmer: {
    position: 'absolute',
    top: -38,
    bottom: -38,
    width: 58,
    backgroundColor: '#FFFFFF',
  },
  promoBadge: {
    position: 'absolute',
    left: 14,
    bottom: 12,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(15,52,49,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
  },
  promoBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  promoBody: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  promoTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },
  promoText: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
  },
  promoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 6,
  },
  promoMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#E7F5F3',
  },
  promoMetaText: {
    color: '#017270',
    fontSize: 10,
    fontWeight: '800',
  },
  promoCta: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F59E0B',
  },
  promoCtaText: {
    color: '#1F1300',
    fontSize: 11,
    fontWeight: '900',
  },
  safetyCard: {
    backgroundColor: palette.warningBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F3E5C8',
    padding: 15,
    flexDirection: 'row',
    gap: 12,
  },
  safetyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyCopy: {
    flex: 1,
  },
  safetyTitle: {
    color: palette.primary,
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 4,
  },
  safetyText: {
    color: palette.secondary,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 24,
  },
});
