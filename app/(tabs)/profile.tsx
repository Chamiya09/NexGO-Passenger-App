import React from 'react';
import {
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

  const onLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.card}>
          <Text style={styles.name}>{user?.fullName || 'Passenger'}</Text>
          <Text style={styles.meta}>{user?.email || '-'}</Text>
          <Text style={styles.meta}>{user?.phoneNumber || '-'}</Text>
        </View>

        <Pressable style={styles.logoutButton} onPress={onLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>
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
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 28,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#102A28',
    marginBottom: 16,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E3EBEA',
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: '#102A28',
    marginBottom: 8,
  },
  meta: {
    fontSize: 14,
    color: '#607170',
    marginBottom: 3,
  },
  logoutButton: {
    marginTop: 18,
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
});
