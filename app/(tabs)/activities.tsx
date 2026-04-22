import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform, StatusBar as RNStatusBar, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons } from '@expo/vector-icons';

import { CategoryTabs } from '@/components/ui/category-tabs';

const CATEGORIES = ['All', 'Rides', 'Payments', 'Promos'];

const ACTIVITIES = [
  {
    id: 'a1',
    category: 'Rides',
    title: 'Ride completed to Uptown Terminal',
    subtitle: 'Driver: Alex M.',
    time: 'Today, 08:42 AM',
    meta: 'PHP 189.00',
    icon: 'car-outline',
  },
  {
    id: 'a2',
    category: 'Payments',
    title: 'Wallet top-up successful',
    subtitle: 'Added via card ending in 2408',
    time: 'Yesterday, 05:10 PM',
    meta: 'PHP 500.00',
    icon: 'wallet-outline',
  },
  {
    id: 'a3',
    category: 'Promos',
    title: 'Promo unlocked: City Saver',
    subtitle: 'Use code CITYSAVE for 15% off',
    time: 'Yesterday, 11:30 AM',
    meta: 'Valid for 5 days',
    icon: 'pricetag-outline',
  },
  {
    id: 'a4',
    category: 'Rides',
    title: 'Ride canceled',
    subtitle: 'No cancellation fee applied',
    time: 'Apr 19, 09:27 PM',
    meta: 'Downtown to Central Park',
    icon: 'close-circle-outline',
  },
];

export default function ActivitiesScreen() {
  const [activeCategory, setActiveCategory] = useState('All');

  const filteredActivities = useMemo(() => {
    if (activeCategory === 'All') {
      return ACTIVITIES;
    }

    return ACTIVITIES.filter((item) => item.category === activeCategory);
  }, [activeCategory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Activity Center</Text>
        <Text style={styles.subtitle}>Track your rides, payments, and offers in one place.</Text>

        <CategoryTabs
          categories={CATEGORIES}
          activeCategory={activeCategory}
          onChange={setActiveCategory}
        />

        <View style={styles.listContainer}>
          {filteredActivities.map((activity) => (
            <View style={styles.card} key={activity.id}>
              <View style={styles.iconWrap}>
                <Ionicons name={activity.icon as keyof typeof Ionicons.glyphMap} size={18} color="#169F95" />
              </View>

              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>{activity.title}</Text>
                <Text style={styles.cardSubtitle}>{activity.subtitle}</Text>

                <View style={styles.metaRow}>
                  <Feather name="clock" size={12} color="#7B9391" />
                  <Text style={styles.cardTime}>{activity.time}</Text>
                </View>
              </View>

              <Text style={styles.cardMeta}>{activity.meta}</Text>
            </View>
          ))}

          {filteredActivities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No activity yet</Text>
              <Text style={styles.emptyStateText}>Try choosing another category to view entries.</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#102A28',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
    color: '#698280',
    marginBottom: 18,
  },
  listContainer: {
    marginTop: 18,
    gap: 12,
  },
  card: {
    backgroundColor: '#F7FBFA',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E5F5F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#143634',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#647A78',
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTime: {
    fontSize: 12,
    color: '#7B9391',
    fontWeight: '500',
  },
  cardMeta: {
    fontSize: 12,
    color: '#169F95',
    fontWeight: '700',
    maxWidth: 90,
    textAlign: 'right',
    lineHeight: 18,
  },
  emptyState: {
    backgroundColor: '#F4FAF9',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCEBE9',
    padding: 16,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 14,
    color: '#173B38',
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 12,
    color: '#6C8482',
    fontWeight: '500',
  },
});
