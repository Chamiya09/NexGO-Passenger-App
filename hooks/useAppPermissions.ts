import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Camera from 'expo-camera';
import * as Location from 'expo-location';
import * as MediaLibrary from 'expo-media-library';

const PERMISSIONS_BOOTSTRAP_KEY = 'nexgo.permissions.bootstrapped.v1';

type PermissionName = 'foregroundLocation' | 'backgroundLocation' | 'mediaLibrary' | 'camera';

type PermissionSummary = Record<PermissionName, boolean | null>;

const initialSummary: PermissionSummary = {
  foregroundLocation: null,
  backgroundLocation: null,
  mediaLibrary: null,
  camera: null,
};

function showSettingsAlert(title: string, message: string) {
  Alert.alert(title, message, [
    { text: 'Not now', style: 'cancel' },
    {
      text: 'Open Settings',
      onPress: () => {
        void Linking.openSettings();
      },
    },
  ]);
}

function showBackgroundLocationIntro() {
  return new Promise<void>((resolve) => {
    Alert.alert(
      'Allow background location',
      'NexGO needs background location during active trips so your ride tracking, pickup progress, and trip status stay accurate even if the app is not on screen.',
      [{ text: 'Continue', onPress: () => resolve() }]
    );
  });
}

export function useAppPermissions() {
  const hasStartedRef = useRef(false);
  const [checking, setChecking] = useState(true);
  const [summary, setSummary] = useState<PermissionSummary>(initialSummary);

  const requestAllPermissions = useCallback(async ({ force = false } = {}) => {
    if (hasStartedRef.current && !force) {
      return;
    }

    hasStartedRef.current = true;
    setChecking(true);

    try {
      const hasBootstrapped = await AsyncStorage.getItem(PERMISSIONS_BOOTSTRAP_KEY);
      if (hasBootstrapped && !force) {
        setChecking(false);
        return;
      }

      const nextSummary: PermissionSummary = { ...initialSummary };

      const foreground = await Location.getForegroundPermissionsAsync();
      const foregroundResult = foreground.granted
        ? foreground
        : await Location.requestForegroundPermissionsAsync();
      nextSummary.foregroundLocation = foregroundResult.granted;

      if (!foregroundResult.granted) {
        showSettingsAlert(
          'Location permission needed',
          'NexGO needs location access to show your position on the map, match nearby rides, and keep pickup/drop-off details accurate. Please allow location access in settings.'
        );
      }

      if (foregroundResult.granted) {
        const backgroundAvailable = await Location.isBackgroundLocationAvailableAsync();
        if (backgroundAvailable) {
          const background = await Location.getBackgroundPermissionsAsync();
          if (background.granted) {
            nextSummary.backgroundLocation = true;
          } else {
            await showBackgroundLocationIntro();
            const backgroundResult = await Location.requestBackgroundPermissionsAsync();
            nextSummary.backgroundLocation = backgroundResult.granted;

            if (!backgroundResult.granted) {
              showSettingsAlert(
                'Background location helps live rides',
                'NexGO uses background location during active rides so tracking stays accurate if you lock your phone or switch apps. Please allow background location in settings.'
              );
            }
          }
        } else {
          nextSummary.backgroundLocation = false;
        }
      } else {
        nextSummary.backgroundLocation = false;
      }

      const media = await MediaLibrary.getPermissionsAsync();
      const mediaResult = media.granted
        ? media
        : await MediaLibrary.requestPermissionsAsync(false);
      nextSummary.mediaLibrary = mediaResult.granted;

      if (!mediaResult.granted) {
        showSettingsAlert(
          'Photo access needed',
          'NexGO needs photo access so you can upload profile pictures and transport documents. Please allow photo access in settings.'
        );
      }

      const camera = await Camera.Camera.getCameraPermissionsAsync();
      const cameraResult = camera.granted
        ? camera
        : await Camera.Camera.requestCameraPermissionsAsync();
      nextSummary.camera = cameraResult.granted;

      if (!cameraResult.granted) {
        showSettingsAlert(
          'Camera permission needed',
          'NexGO needs camera access when you capture profile photos or required documents inside the app. Please allow camera access in settings.'
        );
      }

      setSummary(nextSummary);
      await AsyncStorage.setItem(PERMISSIONS_BOOTSTRAP_KEY, new Date().toISOString());
    } finally {
      setChecking(false);
      hasStartedRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setChecking(false);
      return;
    }

    void requestAllPermissions();
  }, [requestAllPermissions]);

  return {
    checking,
    summary,
    requestAllPermissions,
  };
}
