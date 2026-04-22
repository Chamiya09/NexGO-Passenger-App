import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import AuthShell from '@/components/auth/auth-shell';
import { useAuth } from '@/context/auth-context';

export default function RegisterScreen() {
  const { register, loading } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async () => {
    if (!fullName.trim() || !email.trim() || !phoneNumber.trim() || !password.trim()) {
      Alert.alert('Missing details', 'Please complete all fields.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
      });
      Alert.alert('Account created', 'Your account has been created. Please sign in.', [
        { text: 'OK', onPress: () => router.replace('/login') },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      Alert.alert('Registration failed', message);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Register to start booking with NexGO">
      <Text style={styles.label}>Full name</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Your full name"
        autoCapitalize="words"
        placeholderTextColor="#9AA6A5"
      />

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

      <Text style={styles.label}>Phone number</Text>
      <TextInput
        style={styles.input}
        value={phoneNumber}
        onChangeText={setPhoneNumber}
        placeholder="07X XXX XXXX"
        keyboardType="phone-pad"
        placeholderTextColor="#9AA6A5"
      />

      <Text style={styles.label}>Password</Text>
      <TextInput
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        secureTextEntry
        placeholderTextColor="#9AA6A5"
      />

      <Pressable style={[styles.button, loading && styles.buttonDisabled]} disabled={loading} onPress={onSubmit}>
        <Text style={styles.buttonText}>{loading ? 'Creating account...' : 'Create account'}</Text>
      </Pressable>

      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Pressable onPress={() => router.push('/login' as never)}>
          <Text style={styles.footerLink}>Sign in</Text>
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
