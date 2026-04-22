import React from 'react';
import { Stack } from 'expo-router';

export default function ProfileStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: '#F3F8F7' },
        headerTintColor: '#153F3A',
      }}>
      <Stack.Screen name="personal-details" options={{ title: 'Personal Details' }} />
      <Stack.Screen name="payment-details" options={{ title: 'Payment Details' }} />
      <Stack.Screen name="privacy-security" options={{ title: 'Privacy & Security' }} />
      <Stack.Screen name="support-help" options={{ title: 'Support & Help' }} />
    </Stack>
  );
}
