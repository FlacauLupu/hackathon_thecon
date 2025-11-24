import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { LoadingIndicator } from '@/components/loading-indicator';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useLocations } from '@/hooks/use-locations';
import { useUserData } from '@/contexts/user-data-context';
import { useLocationReviews } from '@/hooks/use-location-reviews';
import { generateLocationVibe } from '@/services/ai-service';

export default function LocationDetailsScreen() {
  const { user, isReady } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locations } = useLocations();
  const [vibe, setVibe] = useState<string>('');
  const [isLoadingVibe, setIsLoadingVibe] = useState<boolean>(true);
  const [rating, setRating] = useState(4);
  const [comment, setComment] = useState('');
  const location = locations.find((item) => item.id === id);
  const {
    tokens: { colors, spacing, components },
  } = useAppTheme();
  const { favoriteIds, toggleFavorite, markVisit, submitReview } = useUserData();
  const { reviews, refresh: refreshReviews, isLoading: isLoadingReviews } = useLocationReviews(location?.id);
  const isFavorite = location ? favoriteIds.includes(location.id) : false;

  useEffect(() => {
    let isMounted = true;

    const fetchVibe = async () => {
      if (!location) {
        return;
      }
      setIsLoadingVibe(true);
      const description = await generateLocationVibe(location);
      if (isMounted) {
        setVibe(description);
        setIsLoadingVibe(false);
      }
    };

    fetchVibe();

    return () => {
      isMounted = false;
    };
  }, [location]);

  useEffect(() => {
    if (location) {
      markVisit(location.id);
    }
  }, [location, markVisit]);

  const handleFavorite = () => {
    if (!location) return;
    toggleFavorite(location.id);
  };

  const handleReview = async () => {
    if (!location) return;
    if (!comment.trim()) {
      Alert.alert('Adaugă câteva impresii înainte de a trimite recenzia.');
      return;
    }
    await submitReview(location.id, rating, comment.trim());
    setComment('');
    refreshReviews();
  };

  const averageReviewScore = useMemo(() => {
    if (!reviews.length) return null;
    const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
    return (sum / reviews.length).toFixed(1);
  }, [reviews]);

  if (!isReady) {
    return (
      <ThemedView style={styles.centered}>
        <LoadingIndicator />
      </ThemedView>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  if (!location) {
    return (
      <ThemedView style={styles.centered}>
        <ThemedText>Locația nu a fost regăsită în listă.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Stack.Screen options={{ title: location.name }} />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        <Image source={{ uri: location.imageUrl }} style={styles.cover} />

        <View
          style={[
            styles.card,
            {
              marginTop: -spacing.lg,
              marginHorizontal: spacing.lg,
              padding: spacing.lg,
              borderRadius: components.cardRadius,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <ThemedText type="subtitle">{location.name}</ThemedText>
              <ThemedText style={{ color: colors.mutedText }}>{location.address}</ThemedText>
            </View>
            <Pressable style={styles.iconButton} onPress={handleFavorite}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={22}
                color={isFavorite ? colors.warning : colors.icon}
              />
            </Pressable>
          </View>
          <ThemedText style={{ marginTop: spacing.sm }}>{location.shortDescription}</ThemedText>
          <View style={[styles.rating, { marginTop: spacing.sm }]}>
            <ThemedText type="defaultSemiBold">Rating oficial</ThemedText>
            <ThemedText type="title">{location.rating.toFixed(1)}</ThemedText>
          </View>
          {averageReviewScore && (
            <View style={[styles.rating, { marginTop: spacing.xs }]}>
              <ThemedText type="defaultSemiBold">Rating comunitate</ThemedText>
              <ThemedText type="defaultSemiBold">{averageReviewScore} ⭐</ThemedText>
            </View>
          )}
          <WhatsAppButton
            label="Mesaj rapid"
            message={`Salut! Aș vrea o rezervare pentru ${location.name} (${location.address}).`}
          />
        </View>

        <View
          style={[
            styles.card,
            {
              marginTop: spacing.lg,
              marginHorizontal: spacing.lg,
              padding: spacing.lg,
              borderRadius: components.cardRadius,
              backgroundColor: colors.elevated,
              borderColor: colors.border,
            },
          ]}>
          <ThemedText type="subtitle" style={{ marginBottom: spacing.sm }}>
            Descriere AI
          </ThemedText>
          {isLoadingVibe ? <LoadingIndicator size="small" /> : <ThemedText>{vibe}</ThemedText>}
        </View>

        <View
          style={[
            styles.card,
            {
              marginTop: spacing.lg,
              marginHorizontal: spacing.lg,
              padding: spacing.lg,
              borderRadius: components.cardRadius,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}>
          <ThemedText type="subtitle">Jurnalul tău</ThemedText>
          <ThemedText style={{ color: colors.mutedText }}>
            Marchează vizita și lasă o recenzie. Datele ajung în istoricul și profilul tău.
          </ThemedText>

          <View style={styles.reviewRow}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable key={value} onPress={() => setRating(value)}>
                <Ionicons
                  name={value <= rating ? 'star' : 'star-outline'}
                  size={26}
                  color={value <= rating ? colors.warning : colors.icon}
                />
              </Pressable>
            ))}
          </View>
          <TextInput
            placeholder="Cum a fost experiența?"
            value={comment}
            onChangeText={setComment}
            style={[
              styles.input,
              {
                borderColor: colors.border,
                color: colors.text,
                borderRadius: components.cardRadius,
              },
            ]}
            placeholderTextColor={colors.mutedText}
            multiline
          />
          <Pressable style={[styles.submitButton, { backgroundColor: colors.accent }]} onPress={handleReview}>
            <ThemedText style={{ color: '#fff' }}>Salvează recenzia</ThemedText>
          </Pressable>
        </View>

        <View
          style={[
            styles.card,
            {
              marginTop: spacing.lg,
              marginHorizontal: spacing.lg,
              padding: spacing.lg,
              borderRadius: components.cardRadius,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}>
          <ThemedText type="subtitle">Recenzii comunitate</ThemedText>
          {isLoadingReviews ? (
            <LoadingIndicator size="small" />
          ) : reviews.length === 0 ? (
            <ThemedText style={{ color: colors.mutedText }}>Fii primul care scrie despre locație.</ThemedText>
          ) : (
            reviews.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <ThemedText type="defaultSemiBold">{review.userName ?? 'Anonim'}</ThemedText>
                  <ThemedText type="defaultSemiBold">{'⭐'.repeat(review.rating)}</ThemedText>
                </View>
                <ThemedText>{review.comment}</ThemedText>
                <ThemedText style={{ color: colors.mutedText, marginTop: 4 }}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </ThemedText>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    height: 320,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButton: {
    padding: 6,
  },
  headerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reviewRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  reviewCard: {
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
});

