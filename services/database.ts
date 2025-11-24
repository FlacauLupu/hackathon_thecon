import * as Crypto from 'expo-crypto';
import { openDatabaseSync } from 'expo-sqlite';

import rawLocations from '@/locatii.json';
import { slugify } from '@/utils/string';

const DATABASE_NAME = 'tourism_app.db';

export const db = openDatabaseSync(DATABASE_NAME);

type SQLArgs = (string | number | null)[];

let isInitialized = false;

const execute = async (query: string, params: SQLArgs = []) => {
  await db.runAsync(query, ...params);
};

export const initDatabase = async () => {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  await execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      location_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE (user_id, location_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS visits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      location_id TEXT NOT NULL,
      visited_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      location_id TEXT NOT NULL,
      rating INTEGER NOT NULL,
      comment TEXT,
      created_at TEXT NOT NULL,
      UNIQUE (user_id, location_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await execute(`
    CREATE TABLE IF NOT EXISTS session (
      id INTEGER PRIMARY KEY CHECK (id = 0),
      user_id INTEGER,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await seedDemoContent();
};

export const queryAll = async <T = Record<string, unknown>>(
  query: string,
  params: SQLArgs = [],
): Promise<T[]> => {
  const rows = await db.getAllAsync(query, ...params);
  return rows as T[];
};

export const runQuery = execute;

type RawLocation = {
  name: string;
  address: string;
  short_description: string;
  rating: number;
};

const SEED_USER_EMAIL = 'guide@foodio.app';

const seedDemoContent = async () => {
  const reviewRows = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM reviews');
  const reviewCount = reviewRows?.[0]?.count ?? 0;

  if (reviewCount > 0) {
    return;
  }

  const userId = await ensureSeedUser();
  await insertSeedReviews(userId);
};

const ensureSeedUser = async () => {
  const existing = await db.getAllAsync<{ id: number }>('SELECT id FROM users WHERE email = ?', SEED_USER_EMAIL);

  if (existing?.[0]?.id) {
    return existing[0].id;
  }

  const passwordHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, 'demo123!');
  await execute('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [
    'Local Guide',
    SEED_USER_EMAIL,
    passwordHash,
  ]);

  const [created] =
    (await db.getAllAsync<{ id: number }>('SELECT id FROM users WHERE email = ?', SEED_USER_EMAIL)) ?? [];
  return created?.id ?? 1;
};

const insertSeedReviews = async (userId: number) => {
  const locations = rawLocations as RawLocation[];
  const now = Date.now();

  for (let index = 0; index < locations.length; index += 1) {
    const location = locations[index];
    const locationId = `${slugify(location.name)}-${index}`;
    const rating = Math.min(5, Math.max(3.8, Number((location.rating + randomFloat(-0.3, 0.2)).toFixed(1))));
    const comment = buildSeedComment(location);
    const createdAt = new Date(now - index * 60 * 60 * 1000).toISOString();

    await execute(
      `
        INSERT INTO reviews (user_id, location_id, rating, comment, created_at)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id, location_id)
        DO UPDATE SET rating = excluded.rating, comment = excluded.comment, created_at = excluded.created_at
      `,
      [userId, locationId, rating, comment, createdAt],
    );
  }
};

const adjectives = ['vibrantă', 'caldă', 'prietenoasă', 'relaxantă', 'energică'];
const highlights = ['serviciul', 'meniul', 'muzica', 'designul', 'lumina'];

const buildSeedComment = (location: RawLocation) => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const highlight = highlights[Math.floor(Math.random() * highlights.length)];
  return `Atmosfera de la ${location.name} este ${adjective}, iar ${highlight} completează perfect descrierea: ${location.short_description}.`;
};

const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

