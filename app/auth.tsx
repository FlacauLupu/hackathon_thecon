import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Redirect } from 'expo-router';

import { LoadingIndicator } from '@/components/loading-indicator';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const { login, register, user, isReady } = useAuth();
  const { tokens } = useAppTheme();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isReady) {
    return (
      <ThemedView style={styles.loading}>
        <LoadingIndicator />
      </ThemedView>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)" />;
  }

  const handleSubmit = async () => {
    if (!email || !password || (mode === 'register' && !name)) {
      Alert.alert('Completează toate câmpurile');
      return;
    }

    try {
      setIsSubmitting(true);
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
        Alert.alert('Cont creat', 'Te poți autentifica folosind credențialele tale.');
        setMode('login');
        setPassword('');
      }
    } catch (error) {
      Alert.alert('Eroare', error instanceof Error ? error.message : 'Autentificare eșuată');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={64}>
        <View style={[styles.container, { padding: tokens.spacing.lg }]}>
          <ThemedText type="title" style={{ marginBottom: tokens.spacing.sm }}>
            {mode === 'login' ? 'Bine ai revenit!' : 'Creează-ți contul'}
          </ThemedText>
          <ThemedText style={{ color: tokens.colors.mutedText, marginBottom: tokens.spacing.lg }}>
            {mode === 'login'
              ? 'Autentifică-te pentru a salva locații și a lăsa recenzii.'
              : 'Completează datele pentru a începe să îți construiești jurnalul gastronomic.'}
          </ThemedText>

          {mode === 'register' && (
            <TextInput
              placeholder="Nume complet"
              value={name}
              onChangeText={setName}
              style={[styles.input, { borderColor: tokens.colors.border, color: tokens.colors.text }]}
              placeholderTextColor={tokens.colors.mutedText}
              autoCapitalize="words"
            />
          )}
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={[styles.input, { borderColor: tokens.colors.border, color: tokens.colors.text }]}
            placeholderTextColor={tokens.colors.mutedText}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            placeholder="Parolă"
            value={password}
            onChangeText={setPassword}
            style={[styles.input, { borderColor: tokens.colors.border, color: tokens.colors.text }]}
            placeholderTextColor={tokens.colors.mutedText}
            secureTextEntry
          />

          <Pressable
            disabled={isSubmitting}
            onPress={handleSubmit}
            style={[
              styles.button,
              {
                backgroundColor: tokens.colors.accent,
                marginTop: tokens.spacing.md,
              },
            ]}>
            {isSubmitting ? (
              <LoadingIndicator size="small" />
            ) : (
              <ThemedText style={{ color: '#fff' }}>
                {mode === 'login' ? 'Autentifică-te' : 'Înregistrează-te'}
              </ThemedText>
            )}
          </Pressable>

          <Pressable onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
            <ThemedText
              type="link"
              style={{ textAlign: 'center', marginTop: tokens.spacing.md, color: tokens.colors.accent }}>
              {mode === 'login'
                ? 'Nu ai cont? Creează unul'
                : 'Ai deja cont? Autentifică-te'}
            </ThemedText>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
});

