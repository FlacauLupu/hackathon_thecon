import * as ExpoLocation from 'expo-location';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';

import { AIRecommender } from '@/components/ai-recommender';
import { LoadingIndicator } from '@/components/loading-indicator';
import { LocationCard } from '@/components/location-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ViewModeToggle } from '@/components/view-mode-toggle';
import { useAuth } from '@/contexts/auth-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useUserData } from '@/contexts/user-data-context';
import { useLocations } from '@/hooks/use-locations';
import { Location } from '@/types/location';

type ViewMode = 'list' | 'map';

export default function ExploreScreen() {
  const { user, isReady } = useAuth();
  const { locations, isLoading, error, refetch } = useLocations();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; long: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const router = useRouter();
  const {
    tokens: { colors, spacing, components },
  } = useAppTheme();
  const { favoriteIds, toggleFavorite } = useUserData();
  const scrollY = useRef(new Animated.Value(0)).current;

  const handleNavigate = (locationId: string) => {
    router.push(`/location/${locationId}`);
  };

  const requestLocationAccess = useCallback(async () => {
    try {
      setIsRequestingLocation(true);
      const { status } = await ExpoLocation.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('denied');
        return;
      }

      setLocationStatus('granted');
      const position = await ExpoLocation.getCurrentPositionAsync({
        accuracy: ExpoLocation.Accuracy.Balanced,
      });
      setUserLocation({ lat: position.coords.latitude, long: position.coords.longitude });
    } catch (error) {
      console.warn('Failed to get current location', error);
      setLocationStatus('denied');
    } finally {
      setIsRequestingLocation(false);
    }
  }, []);

  useEffect(() => {
    requestLocationAccess();
  }, [requestLocationAccess]);

  const region = useMemo(() => computeRegion(locations, userLocation), [locations, userLocation]);

  const filteredLocations = useMemo(
    () => (ratingFilter === 0 ? locations : locations.filter((loc) => loc.rating >= ratingFilter)),
    [locations, ratingFilter],
  );

  const { closestLocations, furtherLocations, distanceByLocationId } = useMemo(() => {
    const distanceMap = new Map<string, number>();

    if (userLocation) {
      filteredLocations.forEach((location) => {
        distanceMap.set(location.id, calculateDistance(userLocation, location.coordinates));
      });
    }

    const sorted = userLocation
      ? [...filteredLocations].sort((a, b) => {
          const distanceA = distanceMap.get(a.id) ?? Number.POSITIVE_INFINITY;
          const distanceB = distanceMap.get(b.id) ?? Number.POSITIVE_INFINITY;
          return distanceA - distanceB;
        })
      : filteredLocations;

    const closest = userLocation ? sorted.slice(0, Math.min(3, sorted.length)) : [];
    const closestIds = new Set(closest.map((location) => location.id));
    const others = userLocation ? sorted.filter((location) => !closestIds.has(location.id)) : sorted;

    return {
      closestLocations: closest,
      furtherLocations: others,
      distanceByLocationId: distanceMap,
    };
  }, [filteredLocations, userLocation]);

  const heroOpacity = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const heroTranslateY = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [0, -24],
    extrapolate: 'clamp',
  });

  const heroContent = (
    <View style={{ gap: spacing.xs }}>
      <ThemedText type="title">Explorează vibe-ul locațiilor</ThemedText>
      <ThemedText style={{ color: colors.mutedText }}>
        Schimbă modul de vizualizare și descoperă unde îți bei următoarea cafea sau unde mănânci ceva autentic.
      </ThemedText>
    </View>
  );

  const controls = (
    <View style={[styles.controls, { gap: spacing.sm }]}>
      <ViewModeToggle value={viewMode} onChange={setViewMode} />
      <RatingFilter value={ratingFilter} onChange={setRatingFilter} />
    </View>
  );

  const locationHelper =
    locationStatus === 'denied' ? (
      <Pressable
        onPress={requestLocationAccess}
        style={[
          styles.locationCta,
          {
            borderColor: colors.accent,
            borderRadius: components.cardRadius,
          },
        ]}>
        <ThemedText type="defaultSemiBold" style={{ color: colors.accent }}>
          Activează locația pentru a vedea ce e aproape
        </ThemedText>
      </Pressable>
    ) : null;

  const locatingHint =
    isRequestingLocation && locationStatus !== 'denied' ? (
      <ThemedText style={{ color: colors.mutedText }}>Determinăm locația ta...</ThemedText>
    ) : null;

  const renderClosestSection = () => {
    if (!userLocation || !closestLocations.length) {
      return null;
    }

    return (
      <View
        style={[
          styles.closestSection,
          {
            borderColor: colors.border,
            borderRadius: components.cardRadius,
            padding: spacing.md,
          },
        ]}>
        <ThemedText type="subtitle" style={{ marginBottom: spacing.xs }}>
          Aproape de tine
        </ThemedText>
        <ThemedText style={{ color: colors.mutedText, marginBottom: spacing.md }}>
          Iată cele mai apropiate locuri pe baza poziției tale curente.
        </ThemedText>
        <View style={{ gap: spacing.md }}>
          {closestLocations.map((location) => (
            <LocationCard
              key={`closest-${location.id}`}
              location={location}
              onPress={handleNavigate}
              isFavorite={favoriteIds.includes(location.id)}
              onToggleFavorite={toggleFavorite}
              distanceKm={distanceByLocationId.get(location.id)}
            />
          ))}
        </View>
      </View>
    );
  };

  if (!isReady) {
    return (
      <ThemedView style={styles.loadingScreen}>
        <LoadingIndicator />
      </ThemedView>
    );
  }

  if (!user) {
    return <Redirect href="/auth" />;
  }

  const retryButton = (
    <Pressable onPress={refetch} style={[styles.retryButton, { borderColor: colors.accent }]}>
      <ThemedText type="defaultSemiBold" style={{ color: colors.accent }}>
        Reîncarcă locațiile
      </ThemedText>
    </Pressable>
  );

  const listHeader = (
    <View style={{ gap: spacing.lg }}>
      <Animated.View style={{ opacity: heroOpacity, transform: [{ translateY: heroTranslateY }] }}>
        {heroContent}
      </Animated.View>
      {controls}
      {locationHelper}
      {locatingHint}
      {renderClosestSection()}
      {error && (
        <View>
          <ThemedText style={{ color: colors.warning }}>{error}</ThemedText>
          {retryButton}
        </View>
      )}
    </View>
  );

  return (
    <ThemedView style={{ flex: 1, padding: spacing.lg }}>
      {viewMode === 'list' ? (
        <Animated.FlatList
          data={furtherLocations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LocationCard
              location={item}
              onPress={handleNavigate}
              isFavorite={favoriteIds.includes(item.id)}
              onToggleFavorite={toggleFavorite}
              distanceKm={distanceByLocationId.get(item.id)}
            />
          )}
          contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xl }}
          ListEmptyComponent={!isLoading ? <EmptyState /> : null}
          ListHeaderComponent={() => listHeader}
          ListFooterComponent={() => (
            <View style={{ gap: spacing.lg }}>
              {isLoading ? <LoadingIndicator /> : null}
              {!!filteredLocations.length && <AIRecommender locations={filteredLocations} />}
            </View>
          )}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={refetch}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
        />
      ) : (
        <View style={{ flex: 1, gap: spacing.lg }}>
          <View style={{ gap: spacing.lg }}>
            {heroContent}
            {controls}
            {locationHelper}
            {locatingHint}
            {error && (
              <View>
                <ThemedText style={{ color: colors.warning }}>{error}</ThemedText>
                {retryButton}
              </View>
            )}
          </View>
          <View
            style={[
              styles.mapContainer,
              {
                borderRadius: components.cardRadius,
                borderColor: colors.border,
                backgroundColor: colors.elevated,
              },
            ]}>
            {isLoading ? (
              <LoadingIndicator />
            ) : (
              <MapView
                key={`${region.latitude}-${region.longitude}`}
                style={StyleSheet.absoluteFill}
                initialRegion={region}
                zoomTapEnabled
                zoomControlEnabled={false}>
                {filteredLocations.map((location) => (
                  <Marker
                    key={location.id}
                    coordinate={{
                      latitude: location.coordinates.lat,
                      longitude: location.coordinates.long,
                    }}
                    pinColor={colors.mapMarker}>
                    <Callout onPress={() => handleNavigate(location.id)}>
                      <View
                        style={[
                          styles.callout,
                          {
                            borderColor: colors.border,
                            backgroundColor: colors.surface,
                          },
                        ]}>
                        <ThemedText type="defaultSemiBold">{location.name}</ThemedText>
                        <ThemedText style={{ color: colors.mutedText }}>{location.address}</ThemedText>
                        <ThemedText>{location.rating.toFixed(1)} ⭐</ThemedText>
                        <ThemedText type="link" style={{ color: colors.accent, marginTop: spacing.xs }}>
                          Vezi detalii
                        </ThemedText>
                      </View>
                    </Callout>
                  </Marker>
                ))}
              </MapView>
            )}
          </View>
          {!!filteredLocations.length && <AIRecommender locations={filteredLocations} />}
        </View>
      )}
    </ThemedView>
  );
}

function EmptyState() {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 64 }}>
      <ThemedText type="subtitle">Nu am găsit locații</ThemedText>
      <ThemedText>Încearcă să reîncarci pentru a vedea locațiile.</ThemedText>
    </View>
  );
}

const computeRegion = (locations: Location[], userLocation?: { lat: number; long: number } | null) => {
  if (userLocation) {
    return {
      latitude: userLocation.lat,
      longitude: userLocation.long,
      latitudeDelta: 0.3,
      longitudeDelta: 0.3,
    };
  }

  if (!locations.length) {
    return {
      latitude: 45.9432,
      longitude: 24.9668,
      latitudeDelta: 7,
      longitudeDelta: 7,
    };
  }

  const latitudes = locations.map((location) => location.coordinates.lat);
  const longitudes = locations.map((location) => location.coordinates.long);

  const minLat = Math.min(...latitudes);
  const maxLat = Math.max(...latitudes);
  const minLong = Math.min(...longitudes);
  const maxLong = Math.max(...longitudes);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLong + maxLong) / 2,
    latitudeDelta: (maxLat - minLat || 0.5) * 1.4,
    longitudeDelta: (maxLong - minLong || 0.5) * 1.4,
  };
};

const calculateDistance = (
  origin: { lat: number; long: number },
  destination: { lat: number; long: number },
) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;

  const dLat = toRad(destination.lat - origin.lat);
  const dLon = toRad(destination.long - origin.long);
  const lat1 = toRad(origin.lat);
  const lat2 = toRad(destination.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round((earthRadiusKm * c + Number.EPSILON) * 10) / 10;
};

const RATING_OPTIONS = [
  { label: 'Toate', value: 0 },
  { label: '4.0+', value: 4 },
  { label: '4.5+', value: 4.5 },
];

type RatingFilterProps = {
  value: number;
  onChange: (nextValue: number) => void;
};

function RatingFilter({ value, onChange }: RatingFilterProps) {
  const {
    tokens: { colors, spacing, components },
  } = useAppTheme();

  return (
    <View style={[styles.ratingFilter, { gap: spacing.xs }]}>
      {RATING_OPTIONS.map((option) => {
        const isActive = value === option.value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            style={[
              styles.ratingChip,
              {
                borderColor: isActive ? colors.accent : colors.border,
                backgroundColor: isActive ? colors.accent : 'transparent',
                borderRadius: components.buttonRadius,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.sm,
              },
            ]}>
            <ThemedText
              type="defaultSemiBold"
              style={{ color: isActive ? '#ffffff' : colors.text }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    justifyContent: 'center',
  },
  mapContainer: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
  },
  controls: {
    flexDirection: 'column',
    gap: 12,
  },
  locationCta: {
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closestSection: {
    borderWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  callout: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    maxWidth: 220,
  },
  ratingFilter: {
    flexDirection: 'row',
  },
  ratingChip: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
