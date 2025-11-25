import * as ExpoLocation from 'expo-location';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MapView, { Callout, Marker } from 'react-native-maps';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AIRecommender } from '@/components/ai-recommender';
import { LoadingIndicator } from '@/components/loading-indicator';
import { LocationCard } from '@/components/location-card';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ViewModeToggle } from '@/components/view-mode-toggle';
import { useAuth } from '@/contexts/auth-context';
import { useTranslation } from '@/contexts/language-context';
import { useAppTheme } from '@/contexts/theme-context';
import { useUserData } from '@/contexts/user-data-context';
import { useLocations } from '@/hooks/use-locations';
import { listAllReviews } from '@/services/user-data-service';
import { Location } from '@/types/location';
import { Review } from '@/types/review';

type ViewMode = 'list' | 'map' | 'assistant';

export default function ExploreScreen() {
  const { user, isReady } = useAuth();
  const { locations, isLoading, error, refetch } = useLocations();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [ratingFilter, setRatingFilter] = useState(0);
  const [userLocation, setUserLocation] = useState<{ lat: number; long: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'unknown' | 'granted' | 'denied'>('unknown');
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [reviewsByLocation, setReviewsByLocation] = useState<Record<string, Review[]>>({});
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight?.() ?? 0;
  const {
    tokens: { colors, spacing, components },
  } = useAppTheme();
  const { favoriteIds, toggleFavorite } = useUserData();
  const { t } = useTranslation();
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

  useEffect(() => {
    if (!isReady) {
      return;
    }

    let isMounted = true;
    const loadReviews = async () => {
      try {
        setIsLoadingReviews(true);
        const allReviews = await listAllReviews();
        if (!isMounted) {
          return;
        }
        const grouped = allReviews.reduce<Record<string, Review[]>>((acc, review) => {
          if (!acc[review.locationId]) {
            acc[review.locationId] = [];
          }
          acc[review.locationId].push(review);
          return acc;
        }, {});
        setReviewsByLocation(grouped);
      } catch (loadError) {
        console.warn('Failed to load reviews for assistant', loadError);
      } finally {
        if (isMounted) {
          setIsLoadingReviews(false);
        }
      }
    };

    loadReviews();
    return () => {
      isMounted = false;
    };
  }, [isReady]);

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

  const viewOptions = useMemo(
    () => [
      { label: t('view.list'), value: 'list' as ViewMode },
      { label: t('view.map'), value: 'map' as ViewMode },
      { label: t('view.assistant'), value: 'assistant' as ViewMode },
    ],
    [t],
  );

  const heroContent = (
    <View style={{ gap: spacing.xs }}>
      <ThemedText type="title">{t('explore.heroTitle')}</ThemedText>
      <ThemedText style={{ color: colors.mutedText }}>{t('explore.heroSubtitle')}</ThemedText>
    </View>
  );

  const controls = (
    <View style={[styles.controls, { gap: spacing.sm }]}>
      <ViewModeToggle value={viewMode} onChange={setViewMode} options={viewOptions} />
      {viewMode !== 'assistant' && <RatingFilter value={ratingFilter} onChange={setRatingFilter} />}
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
          {t('explore.activateLocation')}
        </ThemedText>
      </Pressable>
    ) : null;

  const locatingHint =
    isRequestingLocation && locationStatus !== 'denied' ? (
      <ThemedText style={{ color: colors.mutedText }}>{t('explore.locating')}</ThemedText>
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
          {t('explore.closestTitle')}
        </ThemedText>
        <ThemedText style={{ color: colors.mutedText, marginBottom: spacing.md }}>
          {t('explore.closestSubtitle')}
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
        {t('explore.retry')}
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

  const mapHeader = (
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
  );

  let content: JSX.Element;

  if (viewMode === 'list') {
    content = (
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
        ListHeaderComponent={listHeader}
        ListFooterComponent={isLoading ? <LoadingIndicator /> : null}
        showsVerticalScrollIndicator={false}
        refreshing={isLoading}
        onRefresh={refetch}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: true,
        })}
        scrollEventThrottle={16}
      />
    );
  } else if (viewMode === 'map') {
    content = (
      <View style={{ flex: 1, gap: spacing.lg }}>
        {mapHeader}
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
                  pinColor={colors.mapMarker}
                  onPress={() => handleNavigate(location.id)}>
                  <Callout tooltip onPress={() => handleNavigate(location.id)}>
                    <View
                      style={[
                        styles.calloutBubble,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.surface,
                        },
                      ]}>
                      <ThemedText type="defaultSemiBold" numberOfLines={1} style={styles.calloutTitle}>
                        {location.name}
                      </ThemedText>
                      <ThemedText style={{ color: colors.mutedText }}>
                        ⭐ {location.rating.toFixed(1)}
                      </ThemedText>
                      <ThemedText numberOfLines={2} style={styles.calloutDescription}>
                        {location.shortDescription}
                      </ThemedText>
                    </View>
                  </Callout>
                </Marker>
              ))}
            </MapView>
          )}
        </View>
      </View>
    );
  } else {
    const keyboardVerticalOffset =
      Platform.OS === 'ios'
        ? tabBarHeight + insets.bottom + 24
        : tabBarHeight + insets.bottom;
    content = (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardVerticalOffset}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            gap: spacing.lg,
            paddingBottom: spacing.xl * 2 + tabBarHeight + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
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
          {isLoadingReviews ? (
            <LoadingIndicator size="small" />
          ) : filteredLocations.length === 0 ? (
            <EmptyState />
          ) : (
            <AIRecommender
              locations={filteredLocations}
              reviewsByLocation={reviewsByLocation}
              userLocation={userLocation}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ThemedView style={{ flex: 1, padding: spacing.lg }}>
      {content}
    </ThemedView>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <View style={{ alignItems: 'center', paddingVertical: 64 }}>
      <ThemedText type="subtitle">{t('explore.noLocationsTitle')}</ThemedText>
      <ThemedText>{t('explore.noLocationsSubtitle')}</ThemedText>
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
  { labelKey: 'explore.rating.all', value: 0 },
  { labelKey: 'explore.rating.4', value: 4 },
  { labelKey: 'explore.rating.45', value: 4.5 },
] as const;

type RatingFilterProps = {
  value: number;
  onChange: (nextValue: number) => void;
};

function RatingFilter({ value, onChange }: RatingFilterProps) {
  const {
    tokens: { colors, spacing, components },
  } = useAppTheme();
  const { t } = useTranslation();

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
              {t(option.labelKey)}
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
  calloutBubble: {
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    maxWidth: 220,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  calloutTitle: {
    marginBottom: 2,
  },
  calloutDescription: {
    marginTop: 4,
  },
  ratingFilter: {
    flexDirection: 'row',
  },
  ratingChip: {
    borderWidth: StyleSheet.hairlineWidth,
  },
});
