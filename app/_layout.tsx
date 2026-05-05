import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import * as Font from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { Keyboard, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-reanimated';

import { AuthProvider, useAuth } from '@/context/auth-context';
import ActiveRideOverlays from '@/components/ActiveRideOverlays';
import { useAppPermissions } from '@/hooks/useAppPermissions';
import passengerSocket from '@/lib/passengerSocket';

void SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('[Startup] Unable to keep splash screen visible:', error);
});

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
  const { checking: permissionsChecking } = useAppPermissions();
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function prepareStartup() {
      try {
        await Font.loadAsync({
          ...Ionicons.font,
          ...Feather.font,
          ...MaterialCommunityIcons.font,
          ...MaterialIcons.font,
        });
      } catch (error) {
        console.warn('[Startup] Font loading failed:', error);
      } finally {
        if (isMounted) {
          setFontsLoaded(true);
        }
      }
    }

    void prepareStartup();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    async function hideSplashWhenReady() {
      if (!fontsLoaded || permissionsChecking) {
        return;
      }

      try {
        await SplashScreen.hideAsync();
      } catch (error) {
        console.warn('[Startup] Unable to hide splash screen:', error);
      }
    }

    void hideSplashWhenReady();
  }, [fontsLoaded, permissionsChecking]);

  if (!fontsLoaded || permissionsChecking) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary FallbackComponent={RootErrorFallback}>
        <SafeAreaProvider>
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
        </SafeAreaProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

function RootErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  const errorMessage = error instanceof Error ? error.message : String(error);

  return (
    <View style={styles.errorScreen}>
      <View style={styles.errorIcon}>
        <Ionicons name="alert-circle" size={34} color="#008080" />
      </View>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorText}>
        NexGO Passenger ran into a problem while starting. Please try again, or reopen the app if the issue continues.
      </Text>
      {__DEV__ && (
        <Text selectable style={styles.errorDetails}>
          {errorMessage}
        </Text>
      )}
      <Pressable style={styles.errorButton} onPress={resetErrorBoundary}>
        <Text style={styles.errorButtonText}>Try Again</Text>
      </Pressable>
    </View>
  );
}

function SuspendedOverlay() {
  const { user, initializing, applyStatus } = useAuth();

  useEffect(() => {
    const handleStatus = (payload: { passengerId: string; status: string }) => {
      if (!user?.id || String(payload.passengerId) !== String(user.id)) return;
      applyStatus(payload.status);
    };

    const registerCurrentPassenger = () => {
      if (user?.id) {
        passengerSocket.emit('registerPassenger', user.id);
      }
    };

    if (user?.id && passengerSocket.connected) {
      registerCurrentPassenger();
    }

    passengerSocket.on('connect', registerCurrentPassenger);
    passengerSocket.on('passenger_account_status', handleStatus);

    return () => {
      passengerSocket.off('connect', registerCurrentPassenger);
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
  errorScreen: {
    flex: 1,
    backgroundColor: '#F7FBFA',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E7F5F3',
    borderWidth: 1,
    borderColor: '#CDE9E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#102A28',
    textAlign: 'center',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#617C79',
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 360,
  },
  errorDetails: {
    marginTop: 14,
    color: '#9A4A3F',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorButton: {
    minHeight: 50,
    borderRadius: 18,
    backgroundColor: '#008080',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: 22,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
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
