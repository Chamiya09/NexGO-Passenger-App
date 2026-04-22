import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import AuthShell from '@/components/auth/auth-shell';
import { useAuth } from '@/context/auth-context';

export default function LoginScreen() {
  const { login, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please enter email and password.');
      return;
    }

    try {
      await login({ email: email.trim(), password });
      router.replace('/(tabs)');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      Alert.alert('Login failed', message);
    }
  };

  return (
    <AuthShell title="Sign in" subtitle="Access your NexGO passenger account">
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        placeholderTextColor="#9AA6A5"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="Enter password"
        secureTextEntry
        placeholderTextColor="#9AA6A5"
      />

      <Pressable style={[styles.button, loading && styles.buttonDisabled]} disabled={loading} onPress={onSubmit}>
        <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign in'}</Text>
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>No account yet?</Text>
        <Pressable onPress={() => router.push('/register' as never)}>
          <Text style={styles.footerLink}>Create account</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 13,
    color: '#2E4644',
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7E1E0',
    backgroundColor: '#FCFDFD',
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#102A28',
  },
  button: {
    marginTop: 12,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#169F95',
  },
  buttonDisabled: {
    opacity: 0.65,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  footerRow: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  footerText: {
    color: '#607170',
    fontSize: 14,
  },
  footerLink: {
    color: '#0C7B73',
    fontSize: 14,
    fontWeight: '700',
  },
});
