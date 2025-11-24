import { Redirect, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';

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
  const router = useRouter();
  const {
    tokens: { colors, spacing, components, map },
  } = useAppTheme();
  const { favoriteIds, toggleFavorite } = useUserData();

  const region = useMemo(() => computeRegion(locations), [locations]);

  const handleNavigate = (locationId: string) => {
    router.push(`/location/${locationId}`);
  };

  const renderHeader = () => (
    <View style={{ marginBottom: spacing.lg }}>
      <ThemedText type="title" style={{ marginBottom: spacing.xs }}>
        Explorează vibe-ul locațiilor
      </ThemedText>
      <ThemedText style={{ color: colors.mutedText, marginBottom: spacing.md }}>
        Schimbă modul de vizualizare și descoperă unde îți bei următoarea cafea sau unde mănânci
        ceva autentic.
      </ThemedText>
      <ViewModeToggle value={viewMode} onChange={setViewMode} />
    </View>
  );

  const retryButton = (
    <Pressable onPress={refetch} style={[styles.retryButton, { borderColor: colors.accent }]}>
      <ThemedText type="defaultSemiBold" style={{ color: colors.accent }}>
        Reîncarcă locațiile
      </ThemedText>
    </Pressable>
  );

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

  return (
    <ThemedView style={{ flex: 1, padding: spacing.lg }}>
      {renderHeader()}

      {error && (
        <View style={{ marginBottom: spacing.md }}>
          <ThemedText style={{ color: colors.warning }}>{error}</ThemedText>
          {retryButton}
        </View>
      )}

      {viewMode === 'list' ? (
        <FlatList
          data={locations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LocationCard
              location={item}
              onPress={handleNavigate}
              isFavorite={favoriteIds.includes(item.id)}
              onToggleFavorite={toggleFavorite}
            />
          )}
          contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xl }}
          ListEmptyComponent={!isLoading ? <EmptyState /> : null}
          ListFooterComponent={isLoading ? <LoadingIndicator /> : null}
          showsVerticalScrollIndicator={false}
          refreshing={isLoading}
          onRefresh={refetch}
        />
      ) : (
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
              zoomTapEnabled={map.zoomTapEnabled}
              zoomControlEnabled={false}>
              <UrlTile urlTemplate={map.tileTemplate} maximumZ={19} />
              {locations.map((location) => (
                <Marker
                  key={location.id}
                  coordinate={{
                    latitude: location.coordinates.lat,
                    longitude: location.coordinates.long,
                  }}
                  pinColor={colors.mapMarker}
                  title={location.name}
                  description={location.shortDescription}
                  onCalloutPress={() => handleNavigate(location.id)}
                />
              ))}
            </MapView>
          )}
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

const computeRegion = (locations: Location[]) => {
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
});
