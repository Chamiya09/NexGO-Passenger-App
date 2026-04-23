import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { API_BASE_URL, parseApiResponse } from '@/lib/api';

type AuthUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  profileImageUrl?: string;
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

type UpdateProfilePayload = {
  fullName: string;
  email: string;
  phoneNumber: string;
  profileImageUrl?: string;
};

type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  initializing: boolean;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  deleteAccount: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_STORAGE_KEY = 'nexgo-passenger-auth';

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

        const data = await parseApiResponse<{ user: AuthUser }>(response);
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

      const data = await parseApiResponse<{ token: string; user: AuthUser }>(response);
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

      const data = await parseApiResponse<{ token: string; user: AuthUser }>(response);
      setUser(data.user);
      setToken(data.token);
      await persistSession(data.token, data.user);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async ({ fullName, email, phoneNumber, profileImageUrl }: UpdateProfilePayload) => {
    if (!token) {
      throw new Error('You need to be logged in to update your profile.');
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, email, phoneNumber, profileImageUrl }),
      });

      const data = await parseApiResponse<{ user: AuthUser }>(response);
      setUser(data.user);
      await persistSession(token, data.user);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async ({
    currentPassword,
    newPassword,
    confirmNewPassword,
  }: ChangePasswordPayload) => {
    if (!token) {
      throw new Error('You need to be logged in to change your password.');
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me/password`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmNewPassword,
        }),
      });

      await parseApiResponse<{ message: string }>(response);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async () => {
    if (!token) {
      throw new Error('You need to be logged in to delete your account.');
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      await parseApiResponse<{ message: string }>(response);
      setUser(null);
      setToken(null);
      await clearSession();
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
    () => ({
      user,
      token,
      initializing,
      loading,
      login,
      register,
      updateProfile,
      changePassword,
      deleteAccount,
      logout,
    }),
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
