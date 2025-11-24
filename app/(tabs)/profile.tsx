import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { availableThemes } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';
import { useLocations } from '@/hooks/use-locations';

const THEME_LABELS: Record<string, { title: string; description: string }> = {
  light: {
    title: 'Light',
    description: 'Accent pe claritate și fotografii luminoase.',
  },
  dark: {
    title: 'Dark',
    description: 'Contrast ridicat ideal pentru sesiuni nocturne.',
  },
  pastel: {
    title: 'Pastel Mov',
    description: 'Vibe creativ inspirat din moodboard-urile de hackathon.',
  },
};

export default function ProfileScreen() {
  const { theme, setTheme, tokens } = useAppTheme();
  const { locations } = useLocations();

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: tokens.spacing.lg, gap: tokens.spacing.lg }}>
        <View>
          <ThemedText type="title" style={{ marginBottom: tokens.spacing.xs }}>
            Profilul meu
          </ThemedText>
          <ThemedText style={{ color: tokens.colors.mutedText }}>
            Controlează tema aplicației și contactele rapide.
          </ThemedText>
        </View>

        <View style={[styles.card, { borderColor: tokens.colors.border, borderRadius: tokens.components.cardRadius, backgroundColor: tokens.colors.surface }]}>
          <ThemedText type="subtitle">Statistici rapide</ThemedText>
          <View style={styles.statRow}>
            <ThemedText type="defaultSemiBold">Locații încărcate</ThemedText>
            <ThemedText type="title">{locations.length}</ThemedText>
          </View>
          <ThemedText style={{ color: tokens.colors.mutedText }}>
            Datele provin din fișierul JSON livrat în brief.
          </ThemedText>
        </View>

        <View style={{ gap: tokens.spacing.sm }}>
          <ThemedText type="subtitle">Teme vizuale</ThemedText>
          {availableThemes.map((name) => (
            <Pressable
              key={name}
              style={[
                styles.card,
                {
                  borderColor: name === theme ? tokens.colors.accent : tokens.colors.border,
                  backgroundColor: name === theme ? tokens.colors.elevated : tokens.colors.surface,
                  borderRadius: tokens.components.cardRadius,
                },
              ]}
              onPress={() => setTheme(name)}>
              <ThemedText type="defaultSemiBold">{THEME_LABELS[name].title}</ThemedText>
              <ThemedText style={{ color: tokens.colors.mutedText }}>
                {THEME_LABELS[name].description}
              </ThemedText>
              <ThemedText
                type="defaultSemiBold"
                style={{
                  color: name === theme ? tokens.colors.accent : tokens.colors.mutedText,
                  marginTop: tokens.spacing.xs,
                }}>
                {name === theme ? 'Tema curentă' : 'Tap pentru a activa'}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={[styles.card, { borderColor: tokens.colors.border, borderRadius: tokens.components.cardRadius, backgroundColor: tokens.colors.surface }]}> 
          <ThemedText type="subtitle" style={{ marginBottom: tokens.spacing.sm }}>
            Feedback rapid
          </ThemedText>
          <ThemedText style={{ color: tokens.colors.mutedText, marginBottom: tokens.spacing.sm }}>
            Trimite pe WhatsApp întrebări sau resurse extra pentru echipa de hackathon.
          </ThemedText>
          <WhatsAppButton message="Salut! Uite feedback-ul meu pentru aplicația de turism." />
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
