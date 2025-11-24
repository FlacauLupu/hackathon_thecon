import { Ionicons } from '@expo/vector-icons';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/contexts/theme-context';
import { Location } from '@/types/location';
import { ThemedText } from '@/components/themed-text';
import { WhatsAppButton } from '@/components/whatsapp-button';

type Props = {
  location: Location;
  onPress: (locationId: string) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (locationId: string) => void;
  distanceKm?: number;
};

export function LocationCard({ location, onPress, isFavorite = false, onToggleFavorite, distanceKm }: Props) {
  const {
    tokens: { colors, components, spacing },
  } = useAppTheme();

  return (
    <Pressable
      onPress={() => onPress(location.id)}
      style={[
        styles.container,
        {
          borderRadius: components.cardRadius,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: spacing.md,
        },
      ]}>
      <View>
        <Image
          source={{ uri: location.imageUrl }}
          style={[
            styles.image,
            {
              borderRadius: components.cardRadius,
              marginBottom: spacing.md,
            },
          ]}
        />
        {onToggleFavorite && (
          <Pressable
            hitSlop={12}
            style={[
              styles.favoriteButton,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderRadius: 999,
              },
            ]}
            onPress={() => onToggleFavorite(location.id)}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? colors.warning : colors.icon}
            />
          </Pressable>
        )}
      </View>
      <View style={styles.content}>
        <ThemedText type="subtitle" style={{ marginBottom: spacing.xs }}>
          {location.name}
        </ThemedText>
        {distanceKm != null && (
          <ThemedText style={{ color: colors.mutedText, marginBottom: spacing.xs }}>
            {formatDistance(distanceKm)}
          </ThemedText>
        )}
        <View style={styles.addressRow}>
          <Ionicons name="location-outline" size={18} color={colors.mutedText} />
          <ThemedText style={{ color: colors.mutedText }} numberOfLines={1}>
            {location.address}
          </ThemedText>
        </View>
        <ThemedText style={{ marginBottom: spacing.md }} numberOfLines={2}>
          {location.shortDescription}
        </ThemedText>
        <View style={styles.footer}>
          <View style={styles.rating}>
            <Ionicons name="star" size={18} color={colors.warning} />
            <ThemedText type="defaultSemiBold" style={{ marginLeft: spacing.xs }}>
              {location.rating.toFixed(1)}
            </ThemedText>
          </View>
          <WhatsAppButton
            variant="ghost"
            message={`Salut! Aș dori o rezervare / mai multe detalii pentru ${location.name}.`}
            label="Rezervă"
          />
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  image: {
    width: '100%',
    height: 180,
  },
  content: {
    width: '100%',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

const formatDistance = (value: number) => {
  if (value < 1) {
    return `${Math.round(value * 1000)} m distanță`;
  }
  return `${value.toFixed(1)} km distanță`;
};

