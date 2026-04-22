import React from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function SupportHelpScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.heading}>Support & Help</Text>
        <Text style={styles.subheading}>Get help for rides, billing, and safety.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Safety center</Text>
          <Text style={styles.value}>Emergency tools and ride safety support</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>24/7 chat support</Text>
          <Text style={styles.value}>Available in app for urgent issues</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>FAQ and guides</Text>
          <Text style={styles.value}>Payments, rides, profile and account help</Text>
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
