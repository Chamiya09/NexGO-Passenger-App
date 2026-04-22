import React from 'react';
import { Stack } from 'expo-router';

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#F0F1F3' },
        headerTintColor: '#153F3A',
      }}>
      <Stack.Screen name="personal-details" options={{ headerShown: false }} />
      <Stack.Screen name="membership" options={{ title: 'Membership' }} />
      <Stack.Screen name="saved-addresses" options={{ title: 'Saved Addresses' }} />
      <Stack.Screen name="payment-details" options={{ title: 'Payment Details' }} />
      <Stack.Screen name="earn-with-nexgo" options={{ title: 'Earn with NexGO' }} />
      <Stack.Screen name="about-us" options={{ title: 'About Us' }} />
      <Stack.Screen name="privacy-security" options={{ title: 'Privacy & Security' }} />
      <Stack.Screen name="support-help" options={{ title: 'Support & Help' }} />
    </Stack>
  );
}
