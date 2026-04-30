import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AuthProvider } from '@/context/auth-context';
import ActiveRideOverlays from '@/components/ActiveRideOverlays';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="register" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="promotions"
            options={{
              title: 'Promotions',
              headerShown: true,
              headerTitleAlign: 'center',
              headerShadowVisible: false,
              headerStyle: { backgroundColor: '#F0F1F3' },
              headerTintColor: '#153F3A',
              headerBackButtonDisplayMode: 'minimal',
            }}
          />
          <Stack.Screen name="active-ride/[id]" options={{ headerShown: false }} />
          <Stack.Screen
            name="ride-details/[id]"
            options={{ headerShown: false, presentation: 'transparentModal', animation: 'fade' }}
          />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <ActiveRideOverlays />
        <StatusBar style="dark" />
      </ThemeProvider>
    </AuthProvider>
  );
}
