import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Platform } from 'react-native';

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
};

type LoginPayload = {
  email: string;
  password: string;
};

type RegisterPayload = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  initializing: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_STORAGE_KEY = 'nexgo-passenger-auth';

const resolveApiBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  }

  const hostUri =
    (Constants as any)?.expoConfig?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any)?.manifest?.debuggerHost;

  if (typeof hostUri === 'string' && hostUri.length > 0) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:5000/api`;
    }
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
};

const API_BASE_URL = resolveApiBaseUrl();

async function parseResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
}

async function persistSession(nextToken: string, nextUser: AuthUser) {
  await AsyncStorage.setItem(
    AUTH_STORAGE_KEY,
    JSON.stringify({ token: nextToken, user: nextUser })
  );
}

async function clearSession() {
  await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hydrateAuth = async () => {
      try {
        const sessionRaw = await AsyncStorage.getItem(AUTH_STORAGE_KEY);

        if (!sessionRaw) {
          return;
        }

        const parsedSession = JSON.parse(sessionRaw) as { token?: string; user?: AuthUser };

        if (!parsedSession?.token) {
          await clearSession();
          return;
        }

        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${parsedSession.token}`,
          },
        });

        const data = await parseResponse(response);
        setToken(parsedSession.token);
        setUser(data.user);
        await persistSession(parsedSession.token, data.user);
      } catch {
        setToken(null);
        setUser(null);
        await clearSession();
      } finally {
        setInitializing(false);
      }
    };

    void hydrateAuth();
  }, []);

  const login = async ({ email, password }: LoginPayload) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await parseResponse(response);
      setUser(data.user);
      setToken(data.token);
      await persistSession(data.token, data.user);
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ fullName, email, phoneNumber, password }: RegisterPayload) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fullName, email, phoneNumber, password }),
      });

      const data = await parseResponse(response);
      setUser(data.user);
      setToken(data.token);
      await persistSession(data.token, data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    void clearSession();
  };

  const value = useMemo(
    () => ({ user, token, initializing, loading, login, register, logout }),
    [user, token, initializing, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
