import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import {
  addFavorite,
  listFavoriteIds,
  listReviewsByUser,
  listVisits,
  recordVisit,
  removeFavorite,
  saveReview,
} from '@/services/user-data-service';
import { Review } from '@/types/review';
import { Visit } from '@/types/visit';

type UserDataContextValue = {
  favoriteIds: string[];
  visits: Visit[];
  reviews: Review[];
  isLoading: boolean;
  refresh: () => Promise<void>;
  toggleFavorite: (locationId: string) => Promise<void>;
  markVisit: (locationId: string) => Promise<void>;
  submitReview: (locationId: string, rating: number, comment: string) => Promise<void>;
};

const initialValue: UserDataContextValue = {
  favoriteIds: [],
  visits: [],
  reviews: [],
  isLoading: false,
  refresh: async () => undefined,
  toggleFavorite: async () => undefined,
  markVisit: async () => undefined,
  submitReview: async () => undefined,
};

const UserDataContext = createContext<UserDataContextValue>(initialValue);

export function UserDataProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setFavoriteIds([]);
      setVisits([]);
      setReviews([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [favoriteList, visitsList, reviewsList] = await Promise.all([
        listFavoriteIds(user.id),
        listVisits(user.id),
        listReviewsByUser(user.id),
      ]);
      setFavoriteIds(favoriteList);
      setVisits(visitsList);
      setReviews(reviewsList);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFavorite = useCallback(
    async (locationId: string) => {
      if (!user) return;
      const isFavorite = favoriteIds.includes(locationId);
      if (isFavorite) {
        await removeFavorite(user.id, locationId);
      } else {
        await addFavorite(user.id, locationId);
      }
      await load();
    },
    [favoriteIds, load, user],
  );

  const markVisit = useCallback(
    async (locationId: string) => {
      if (!user) return;
      await recordVisit(user.id, locationId);
      await load();
    },
    [load, user],
  );

  const submitReview = useCallback(
    async (locationId: string, rating: number, comment: string) => {
      if (!user) return;
      await saveReview(user.id, locationId, rating, comment);
      await load();
    },
    [load, user],
  );

  const value = useMemo(
    () => ({
      favoriteIds,
      visits,
      reviews,
      isLoading,
      refresh: load,
      toggleFavorite,
      markVisit,
      submitReview,
    }),
    [favoriteIds, visits, reviews, isLoading, load, toggleFavorite, markVisit, submitReview],
  );

  return <UserDataContext.Provider value={value}>{children}</UserDataContext.Provider>;
}

export const useUserData = () => useContext(UserDataContext);

