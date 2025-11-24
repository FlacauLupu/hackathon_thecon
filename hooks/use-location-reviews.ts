import { useCallback, useEffect, useState } from 'react';

import { listReviewsByLocation } from '@/services/user-data-service';
import { Review } from '@/types/review';

export const useLocationReviews = (locationId?: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = useCallback(async () => {
    if (!locationId) {
      setReviews([]);
      return;
    }
    setIsLoading(true);
    try {
      const result = await listReviewsByLocation(locationId);
      setReviews(result);
    } finally {
      setIsLoading(false);
    }
  }, [locationId]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    reviews,
    isLoading,
    refresh: load,
  };
};

