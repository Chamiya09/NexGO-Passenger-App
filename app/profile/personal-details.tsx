import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/context/auth-context';

export default function PersonalDetailsScreen() {
  const { user } = useAuth();
  const fullName = user?.fullName || 'Passenger';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Personal Details</Text>
        <Text style={styles.subheading}>Manage your core account information.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Full name</Text>
          <Text style={styles.value}>{fullName}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user?.email || 'Not set'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Phone number</Text>
          <Text style={styles.value}>{user?.phoneNumber || 'Not set'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Saved places</Text>
          <Text style={styles.value}>Home, Work, Airport</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F3F8F7',
  },
  container: {
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '800',
    color: '#153F3A',
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: '#5A7471',
    marginBottom: 14,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DEE9E8',
    backgroundColor: '#FFFFFF',
    padding: 14,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    color: '#65817D',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: '#163F3B',
  },
});
