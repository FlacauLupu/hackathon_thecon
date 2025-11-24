import { queryAll, runQuery } from '@/services/database';
import { Favorite } from '@/types/favorite';
import { Review } from '@/types/review';
import { Visit } from '@/types/visit';

export const addFavorite = async (userId: number, locationId: string) => {
  await runQuery(
    'INSERT OR IGNORE INTO favorites (user_id, location_id, created_at) VALUES (?, ?, ?)',
    [userId, locationId, new Date().toISOString()],
  );
};

export const removeFavorite = async (userId: number, locationId: string) => {
  await runQuery('DELETE FROM favorites WHERE user_id = ? AND location_id = ?', [userId, locationId]);
};

export const listFavoriteIds = async (userId: number): Promise<string[]> => {
  const rows = await queryAll<{ location_id: string }>('SELECT location_id FROM favorites WHERE user_id = ?', [
    userId,
  ]);
  return rows.map((row) => row.location_id);
};

export const recordVisit = async (userId: number, locationId: string) => {
  await runQuery('INSERT INTO visits (user_id, location_id, visited_at) VALUES (?, ?, ?)', [
    userId,
    locationId,
    new Date().toISOString(),
  ]);
};

export const listVisits = async (userId: number): Promise<Visit[]> => {
  const rows = await queryAll<Visit>(
    'SELECT id, user_id as userId, location_id as locationId, visited_at as visitedAt FROM visits WHERE user_id = ? ORDER BY visited_at DESC',
    [userId],
  );
  return rows;
};

export const saveReview = async (userId: number, locationId: string, rating: number, comment: string) => {
  await runQuery(
    `
    INSERT INTO reviews (user_id, location_id, rating, comment, created_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(user_id, location_id)
    DO UPDATE SET rating = excluded.rating, comment = excluded.comment, created_at = excluded.created_at
  `,
    [userId, locationId, rating, comment, new Date().toISOString()],
  );
};

export const listReviewsByLocation = async (locationId: string): Promise<Review[]> => {
  const rows = await queryAll<Review>(
    `
    SELECT
      reviews.id,
      reviews.user_id as userId,
      reviews.location_id as locationId,
      reviews.rating,
      reviews.comment,
      reviews.created_at as createdAt,
      users.name as userName
    FROM reviews
    JOIN users ON users.id = reviews.user_id
    WHERE reviews.location_id = ?
    ORDER BY reviews.created_at DESC
  `,
    [locationId],
  );
  return rows;
};

export const listReviewsByUser = async (userId: number): Promise<Review[]> => {
  const rows = await queryAll<Review>(
    `
    SELECT
      id,
      user_id as userId,
      location_id as locationId,
      rating,
      comment,
      created_at as createdAt
    FROM reviews
    WHERE user_id = ?
    ORDER BY created_at DESC
  `,
    [userId],
  );
  return rows;
};

export const listAllReviews = async (): Promise<Review[]> => {
  const rows = await queryAll<Review>(
    `
    SELECT
      reviews.id,
      reviews.user_id as userId,
      reviews.location_id as locationId,
      reviews.rating,
      reviews.comment,
      reviews.created_at as createdAt,
      users.name as userName
    FROM reviews
    JOIN users ON users.id = reviews.user_id
    ORDER BY reviews.created_at DESC
  `,
  );
  return rows;
};

export const getReviewForLocation = async (userId: number, locationId: string): Promise<Review | null> => {
  const [row] = await queryAll<Review>(
    `
    SELECT
      id,
      user_id as userId,
      location_id as locationId,
      rating,
      comment,
      created_at as createdAt
    FROM reviews
    WHERE user_id = ? AND location_id = ?
  `,
    [userId, locationId],
  );
  return row ?? null;
};

