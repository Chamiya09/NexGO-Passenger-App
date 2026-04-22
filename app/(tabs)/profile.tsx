import React from 'react';
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

import { useAuth } from '@/context/auth-context';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const fullName = user?.fullName || 'Passenger';
  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');

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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Phone</Text>
            <Text style={styles.tileValue}>{user?.phoneNumber || 'Not set'}</Text>
          </View>

          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Payment method</Text>
            <Text style={styles.tileValue}>Card ending 1024</Text>
          </View>

          <View style={styles.tile}>
            <Text style={styles.tileLabel}>Saved places</Text>
            <Text style={styles.tileValue}>Home, Work</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Quiet ride</Text>
            <Text style={styles.preferenceState}>Enabled</Text>
          </View>

          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Promo notifications</Text>
            <Text style={styles.preferenceState}>Enabled</Text>
          </View>

          <View style={styles.preferenceRow}>
            <Text style={styles.preferenceText}>Emergency contacts</Text>
            <Text style={styles.preferenceState}>2 added</Text>
          </View>
        </View>

        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>

        <Text style={styles.versionText}>NexGO Passenger v1.0</Text>
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
    paddingTop: 20,
    paddingBottom: 30,
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    backgroundColor: '#0F9A8F',
    marginBottom: 20,
    overflow: 'hidden',
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
    width: 74,
    height: 74,
    borderRadius: 37,
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
    marginBottom: 16,
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
  section: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E3EBEA',
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#102A28',
    marginBottom: 12,
  },
  tile: {
    borderRadius: 12,
    backgroundColor: '#F8FBFB',
    borderWidth: 1,
    borderColor: '#E8F0EF',
    padding: 12,
    marginBottom: 10,
  },
  tileLabel: {
    color: '#607170',
    fontSize: 14,
    marginBottom: 4,
  },
  tileValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#133A37',
  },
  preferenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EFF4F3',
  },
  preferenceText: {
    fontSize: 15,
    color: '#274B49',
    fontWeight: '500',
  },
  preferenceState: {
    fontSize: 13,
    fontWeight: '700',
    color: '#607170',
  },
  logoutButton: {
    marginTop: 4,
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
