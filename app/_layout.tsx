import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { Keyboard, Modal, StyleSheet, Text, View } from 'react-native';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/auth-context';
import ActiveRideOverlays from '@/components/ActiveRideOverlays';
import passengerSocket from '@/lib/passengerSocket';

export const unstable_settings = {
  anchor: '(tabs)',
};

function KeyboardDismissView({ children }: PropsWithChildren) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  return (
    <View
      style={{ flex: 1 }}
      onStartShouldSetResponderCapture={() => {
        if (keyboardVisible) {
          Keyboard.dismiss();
        }

        return false;
      }}>
      {children}
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider value={DefaultTheme}>
        <KeyboardDismissView>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="promotions"
              options={{ headerShown: false }}
            />
            <Stack.Screen name="active-ride/[id]" options={{ headerShown: false }} />
            <Stack.Screen
              name="ride-details/[id]"
              options={{ headerShown: false, presentation: 'transparentModal', animation: 'fade' }}
            />
            <Stack.Screen
              name="driver-profile/[id]"
              options={{
                headerShown: false,
                presentation: 'transparentModal',
                animation: 'fade',
                contentStyle: { backgroundColor: 'transparent' },
              }}
            />
            <Stack.Screen name="profile" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
          <ActiveRideOverlays />
          <SuspendedOverlay />
          <StatusBar style="dark" />
        </KeyboardDismissView>
      </ThemeProvider>
    </AuthProvider>
  );
}

function SuspendedOverlay() {
  const { user, initializing, applyStatus } = useAuth();

  useEffect(() => {
    const handleStatus = (payload: { passengerId: string; status: string }) => {
      if (!user?.id || payload.passengerId !== user.id) return;
      applyStatus(payload.status);
    };

    if (user?.id && passengerSocket.connected) {
      passengerSocket.emit('registerPassenger', user.id);
    }

    passengerSocket.on('connect', () => {
      if (user?.id) {
        passengerSocket.emit('registerPassenger', user.id);
      }
    });
    passengerSocket.on('passenger_account_status', handleStatus);

    return () => {
      passengerSocket.off('passenger_account_status', handleStatus);
    };
  }, [user?.id, applyStatus]);

  if (initializing || user?.status !== 'suspended') {
    return null;
  }

  return (
    <Modal transparent visible animationType="fade">
      <View style={styles.suspendedOverlay}>
        <View style={styles.suspendedCard}>
          <Text style={styles.suspendedTitle}>Account Suspended</Text>
          <Text style={styles.suspendedText}>
            Your account has been suspended by NexGO support. Please contact support for help.
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  suspendedOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 21, 19, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  suspendedCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D9E9E6',
    backgroundColor: '#FFFFFF',
    padding: 18,
    alignItems: 'center',
  },
  suspendedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#102A28',
    marginBottom: 6,
  },
  suspendedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#617C79',
    textAlign: 'center',
  },
});
