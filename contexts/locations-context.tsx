import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { fetchLocations } from '@/services/location-service';
import { Location } from '@/types/location';

type LocationsContextValue = {
  locations: Location[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

const LocationsContext = createContext<LocationsContextValue>({
  locations: [],
  isLoading: false,
  error: null,
  refetch: async () => undefined,
});

export function LocationsProvider({ children }: PropsWithChildren) {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadLocations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = await fetchLocations();
      setLocations(payload);
    } catch (err) {
      console.error('Failed to load locations', err);
      setError('Nu am reușit să încarc locațiile. Încearcă din nou.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const value = useMemo(
    () => ({
      locations,
      isLoading,
      error,
      refetch: loadLocations,
    }),
    [locations, isLoading, error, loadLocations],
  );

  return <LocationsContext.Provider value={value}>{children}</LocationsContext.Provider>;
}

export const useLocationsContext = () => useContext(LocationsContext);

