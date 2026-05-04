import React, { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';

import { useAuth } from '@/context/auth-context';
import { PassengerLoadingScreen } from '@/components/PassengerLoadingScreen';

export default function IndexScreen() {
  const { user, initializing } = useAuth();
  const [minLoadingComplete, setMinLoadingComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMinLoadingComplete(true);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  if (initializing || !minLoadingComplete) {
    return <PassengerLoadingScreen />;
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
