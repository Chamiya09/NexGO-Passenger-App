import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const PERMISSIONS_BOOTSTRAP_KEY = 'nexgo.passenger.permissions.bootstrapped.v2';

type PermissionName = 'foregroundLocation' | 'mediaLibrary';

type PermissionSummary = Record<PermissionName, boolean | null>;

const initialSummary: PermissionSummary = {
  foregroundLocation: null,
  mediaLibrary: null,
};

function showSettingsAlert(title: string, message: string) {
  Alert.alert(title, message, [
    { text: 'Not now', style: 'cancel' },
    {
      text: 'Go to Settings',
      onPress: () => {
        void Linking.openSettings();
      },
    },
  ]);
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

      await AsyncStorage.setItem(PERMISSIONS_BOOTSTRAP_KEY, new Date().toISOString());

      const nextSummary: PermissionSummary = { ...initialSummary };

      const locationResult = await Location.requestForegroundPermissionsAsync();
      nextSummary.foregroundLocation = locationResult.granted;

      if (!locationResult.granted && !locationResult.canAskAgain) {
        showSettingsAlert(
          'Location access is needed',
          'NexGO needs your current location to set pickup and drop-off points accurately. Please enable Location permission in settings.'
        );
      }

      const mediaResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      nextSummary.mediaLibrary = mediaResult.granted;

      if (!mediaResult.granted && !mediaResult.canAskAgain) {
        showSettingsAlert(
          'Photo access is needed',
          'NexGO needs photo access so you can choose a profile image from your gallery. Please enable Photos permission in settings.'
        );
      }

      setSummary(nextSummary);
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
