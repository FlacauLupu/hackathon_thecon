import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useMemo } from 'react';
import { Redirect, useRouter } from 'expo-router';

import { LoadingIndicator } from '@/components/loading-indicator';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { availableThemes } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useLocations } from '@/hooks/use-locations';
import { useUserData } from '@/contexts/user-data-context';

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
  const router = useRouter();
  const { user, logout, isReady } = useAuth();
  const { theme, setTheme, tokens } = useAppTheme();
  const { locations } = useLocations();
  const { favoriteIds, visits, reviews } = useUserData();

  const isNotNull = <T,>(value: T | null | undefined): value is T => value != null;

  const favoritesDetailed = useMemo(
    () =>
      favoriteIds
        .map((id) => locations.find((loc) => loc.id === id) ?? null)
        .filter(isNotNull),
    [favoriteIds, locations],
  );

  const visitedDetailed = useMemo(
    () =>
      visits
        .map((visit) => {
          const location = locations.find((loc) => loc.id === visit.locationId) ?? null;
          if (!location) {
            return null;
          }
          return {
            ...visit,
            location,
          };
        })
        .filter(isNotNull)
        .slice(0, 5),
    [locations, visits],
  );

  if (!isReady) {
    return (
      <ThemedView style={styles.loading}>
        <LoadingIndicator />
      </ThemedView>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: tokens.spacing.lg, gap: tokens.spacing.lg }}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <ThemedText type="title" style={{ marginBottom: tokens.spacing.xs }}>
              Salut, {user?.name ?? 'Explorator'} 👋
            </ThemedText>
            <ThemedText style={{ color: tokens.colors.mutedText }}>{user?.email}</ThemedText>
          </View>
          <Pressable style={styles.logoutButton} onPress={logout}>
            <ThemedText type="defaultSemiBold">Ieși</ThemedText>
          </Pressable>
        </View>

        <View
          style={[
            styles.card,
            {
              borderColor: tokens.colors.border,
              borderRadius: tokens.components.cardRadius,
              backgroundColor: tokens.colors.surface,
            },
          ]}>
          <ThemedText type="subtitle">Statistici rapide</ThemedText>
          <View style={styles.statRow}>
            <ThemedText type="defaultSemiBold">Locații favorite</ThemedText>
            <ThemedText type="title">{favoriteIds.length}</ThemedText>
          </View>
          <View style={styles.statRow}>
            <ThemedText type="defaultSemiBold">Vizite înregistrate</ThemedText>
            <ThemedText type="title">{visits.length}</ThemedText>
          </View>
          <View style={styles.statRow}>
            <ThemedText type="defaultSemiBold">Recenzii</ThemedText>
            <ThemedText type="title">{reviews.length}</ThemedText>
          </View>
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

        <View
          style={[
            styles.card,
            {
              borderColor: tokens.colors.border,
              borderRadius: tokens.components.cardRadius,
              backgroundColor: tokens.colors.surface,
            },
          ]}>
          <ThemedText type="subtitle">Locații favorite</ThemedText>
          {favoritesDetailed.length === 0 ? (
            <ThemedText style={{ color: tokens.colors.mutedText }}>
              Încă nu ai salvat nimic. Deschide tab-ul Explore și apasă pe inimioară.
            </ThemedText>
          ) : (
            favoritesDetailed.map((location) => (
              <Pressable
                key={location.id}
                style={styles.listItem}
                onPress={() => router.push(`/location/${location.id}`)}>
                <View>
                  <ThemedText type="defaultSemiBold">{location.name}</ThemedText>
                  <ThemedText style={{ color: tokens.colors.mutedText }}>{location.address}</ThemedText>
                </View>
                <ThemedText type="defaultSemiBold">⭐ {location.rating.toFixed(1)}</ThemedText>
              </Pressable>
            ))
          )}
        </View>

        <View
          style={[
            styles.card,
            {
              borderColor: tokens.colors.border,
              borderRadius: tokens.components.cardRadius,
              backgroundColor: tokens.colors.surface,
            },
          ]}>
          <ThemedText type="subtitle">Ultimele vizite</ThemedText>
          {visitedDetailed.length === 0 ? (
            <ThemedText style={{ color: tokens.colors.mutedText }}>
              Când deschizi o locație, o vom adăuga aici automat.
            </ThemedText>
          ) : (
            visitedDetailed.map((visit) => (
              <ThemedText key={visit.id}>
                {visit.location.name} ·{' '}
                <ThemedText style={{ color: tokens.colors.mutedText }}>
                  {new Date(visit.visitedAt).toLocaleDateString()}
                </ThemedText>
              </ThemedText>
            ))
          )}
        </View>

        <View
          style={[
            styles.card,
            {
              borderColor: tokens.colors.border,
              borderRadius: tokens.components.cardRadius,
              backgroundColor: tokens.colors.surface,
            },
          ]}>
          <ThemedText type="subtitle">Recenziile mele</ThemedText>
          {reviews.length === 0 ? (
            <ThemedText style={{ color: tokens.colors.mutedText }}>
              Scrie o recenzie din ecranul unei locații și o vezi aici.
            </ThemedText>
          ) : (
            reviews.slice(0, 3).map((review) => {
              const location = locations.find((loc) => loc.id === review.locationId);
              return (
                <View key={review.id} style={styles.listItem}>
                  <View>
                    <ThemedText type="defaultSemiBold">{location?.name ?? review.locationId}</ThemedText>
                    <ThemedText style={{ color: tokens.colors.mutedText }}>{review.comment}</ThemedText>
                  </View>
                  <ThemedText type="defaultSemiBold">{review.rating} ⭐</ThemedText>
                </View>
              );
            })
          )}
        </View>

        <View
          style={[
            styles.card,
            {
              borderColor: tokens.colors.border,
              borderRadius: tokens.components.cardRadius,
              backgroundColor: tokens.colors.surface,
            },
          ]}>
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
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  listItem: {
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
});
