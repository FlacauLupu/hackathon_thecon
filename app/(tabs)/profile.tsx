import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useMemo } from 'react';
import { Redirect, useRouter } from 'expo-router';

import { LoadingIndicator } from '@/components/loading-indicator';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { availableThemes } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/contexts/language-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useLocations } from '@/hooks/use-locations';
import { useUserData } from '@/contexts/user-data-context';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout, isReady } = useAuth();
  const { theme, setTheme, tokens } = useAppTheme();
  const { locations } = useLocations();
  const { favoriteIds, visits, reviews } = useUserData();
  const { t, language, setLanguage, availableLanguages } = useTranslation();

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
              {t('profile.greeting', { name: user?.name ?? t('profile.explorer') })}
            </ThemedText>
            <ThemedText style={{ color: tokens.colors.mutedText }}>{user?.email}</ThemedText>
          </View>
          <Pressable style={styles.logoutButton} onPress={logout}>
            <ThemedText type="defaultSemiBold">{t('profile.logout')}</ThemedText>
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
          <ThemedText type="subtitle">{t('profile.statsTitle')}</ThemedText>
          <View style={styles.statRow}>
            <ThemedText type="defaultSemiBold">{t('profile.stats.favorites')}</ThemedText>
            <ThemedText type="title">{favoriteIds.length}</ThemedText>
          </View>
          <View style={styles.statRow}>
            <ThemedText type="defaultSemiBold">{t('profile.stats.visits')}</ThemedText>
            <ThemedText type="title">{visits.length}</ThemedText>
          </View>
          <View style={styles.statRow}>
            <ThemedText type="defaultSemiBold">{t('profile.stats.reviews')}</ThemedText>
            <ThemedText type="title">{reviews.length}</ThemedText>
          </View>
        </View>

        <View style={{ gap: tokens.spacing.sm }}>
          <ThemedText type="subtitle">{t('profile.themeTitle')}</ThemedText>
          <ThemedText style={{ color: tokens.colors.mutedText }}>
            {t('profile.themeSubtitle')}
          </ThemedText>
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
              <ThemedText type="defaultSemiBold">
                {t(`profile.theme.${name}.title` as const)}
              </ThemedText>
              <ThemedText style={{ color: tokens.colors.mutedText }}>
                {t(`profile.theme.${name}.description` as const)}
              </ThemedText>
              <ThemedText
                type="defaultSemiBold"
                style={{
                  color: name === theme ? tokens.colors.accent : tokens.colors.mutedText,
                  marginTop: tokens.spacing.xs,
                }}>
                {name === theme ? t('profile.theme.statusActive') : t('profile.theme.statusInactive')}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        <View style={{ gap: tokens.spacing.sm }}>
          <ThemedText type="subtitle">{t('profile.languageTitle')}</ThemedText>
          <ThemedText style={{ color: tokens.colors.mutedText }}>
            {t('profile.languageSubtitle')}
          </ThemedText>
          {availableLanguages.map(({ code, label }) => (
            <Pressable
              key={code}
              style={[
                styles.card,
                {
                  borderColor: code === language ? tokens.colors.accent : tokens.colors.border,
                  backgroundColor: code === language ? tokens.colors.elevated : tokens.colors.surface,
                  borderRadius: tokens.components.cardRadius,
                },
              ]}
              onPress={() => setLanguage(code)}>
              <ThemedText type="defaultSemiBold">{label}</ThemedText>
              <ThemedText style={{ color: tokens.colors.mutedText }}>
                {code === language ? t('profile.languageActive') : t('profile.languageInactive')}
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
          <ThemedText type="subtitle">{t('profile.favoritesTitle')}</ThemedText>
          {favoritesDetailed.length === 0 ? (
            <ThemedText style={{ color: tokens.colors.mutedText }}>
              {t('profile.favoritesEmpty')}
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
          <ThemedText type="subtitle">{t('profile.visitsTitle')}</ThemedText>
          {visitedDetailed.length === 0 ? (
            <ThemedText style={{ color: tokens.colors.mutedText }}>
              {t('profile.visitsEmpty')}
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
          <ThemedText type="subtitle">{t('profile.reviewsTitle')}</ThemedText>
          {reviews.length === 0 ? (
            <ThemedText style={{ color: tokens.colors.mutedText }}>
              {t('profile.reviewsEmpty')}
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
            {t('profile.feedbackTitle')}
          </ThemedText>
          <ThemedText style={{ color: tokens.colors.mutedText, marginBottom: tokens.spacing.sm }}>
            {t('profile.feedbackSubtitle')}
          </ThemedText>
          <WhatsAppButton
            message={
              language === 'en'
                ? 'Hi! Here is my feedback for the tourism app.'
                : 'Salut! Uite feedback-ul meu pentru aplicația de turism.'
            }
          />
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
