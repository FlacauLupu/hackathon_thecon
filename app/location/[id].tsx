import { Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { LoadingIndicator } from '@/components/loading-indicator';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { WhatsAppButton } from '@/components/whatsapp-button';
import { useAppTheme } from '@/contexts/theme-context';
import { useLocations } from '@/hooks/use-locations';
import { generateLocationVibe } from '@/services/ai-service';

export default function LocationDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { locations } = useLocations();
  const [vibe, setVibe] = useState<string>('');
  const [isLoadingVibe, setIsLoadingVibe] = useState<boolean>(true);
  const location = locations.find((item) => item.id === id);
  const {
    tokens: { colors, spacing, components },
  } = useAppTheme();

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
          <ThemedText type="subtitle">{location.name}</ThemedText>
          <ThemedText style={{ color: colors.mutedText }}>{location.address}</ThemedText>
          <ThemedText style={{ marginTop: spacing.sm }}>{location.shortDescription}</ThemedText>
          <View style={[styles.rating, { marginTop: spacing.sm }]}>
            <ThemedText type="defaultSemiBold">Rating</ThemedText>
            <ThemedText type="title">{location.rating.toFixed(1)}</ThemedText>
          </View>
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
          {isLoadingVibe ? (
            <LoadingIndicator size="small" />
          ) : (
            <ThemedText>{vibe}</ThemedText>
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
});

