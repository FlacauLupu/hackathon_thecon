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

const SEED_ACCOUNTS = [
  { name: 'Local Guide', email: 'guide@foodio.app' },
  { name: 'Food Explorer', email: 'foodie@foodio.app' },
  { name: 'City Nomad', email: 'nomad@foodio.app' },
  { name: 'Night Owl', email: 'nightowl@foodio.app' },
];

const seedDemoContent = async () => {
  const reviewRows = await db.getAllAsync<{ count: number }>('SELECT COUNT(*) as count FROM reviews');
  const reviewCount = reviewRows?.[0]?.count ?? 0;

  if (reviewCount > 0) {
    return;
  }

  const userIds = await ensureSeedUsers();
  await insertSeedReviews(userIds);
};

const ensureSeedUsers = async () => {
  const ids: number[] = [];

  for (const account of SEED_ACCOUNTS) {
    const existing = await db.getAllAsync<{ id: number }>('SELECT id FROM users WHERE email = ?', account.email);

    if (existing?.[0]?.id) {
      ids.push(existing[0].id);
      continue;
    }

    const passwordHash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, 'demo123!');
    await execute('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [
      account.name,
      account.email,
      passwordHash,
    ]);

    const [created] =
      (await db.getAllAsync<{ id: number }>('SELECT id FROM users WHERE email = ?', account.email)) ?? [];
    if (created?.id) {
      ids.push(created.id);
    }
  }

  return ids;
};

const insertSeedReviews = async (userIds: number[]) => {
  const locations = rawLocations as RawLocation[];
  const now = Date.now();

  for (let index = 0; index < locations.length; index += 1) {
    const location = locations[index];
    const locationId = `${slugify(location.name)}-${index}`;
    const reviewersCount = Math.min(userIds.length, 4 + (index % 2));
    const selectedUsers = shuffleArray(userIds).slice(0, reviewersCount);

    for (let order = 0; order < selectedUsers.length; order += 1) {
      const userId = selectedUsers[order];
      const rating = Math.min(
        5,
        Math.max(3.7, Number((location.rating + randomFloat(-0.4, 0.3) + order * 0.05).toFixed(1))),
      );
      const comment = buildSeedComment(location, order);
      const createdAt = new Date(now - (index * 60 + order * 5) * 60 * 1000).toISOString();

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
  }
};

const adjectives = ['vibrantă', 'caldă', 'prietenoasă', 'relaxantă', 'energică', 'intimă', 'urbană', 'boemă'];
const highlights = ['serviciul', 'meniul', 'muzica', 'designul', 'lumina', 'personalul', 'desertul', 'barista'];

const buildSeedComment = (location: RawLocation, variantIndex: number) => {
  const adjective = adjectives[variantIndex % adjectives.length];
  const highlight = highlights[(variantIndex + 2) % highlights.length];
  const city = getCityFromAddress(location.address);
  const leadIn = variantIndex % 2 === 0 ? 'Îmi place' : 'Ne-a cucerit';
  return `${leadIn} vibe-ul ${adjective} de la ${location.name} din ${city}. ${
    highlight.charAt(0).toUpperCase() + highlight.slice(1)
  } rezonează perfect cu descrierea: ${location.short_description}.`;
};

const getCityFromAddress = (address: string) => {
  const parts = address.split(',');
  return parts[parts.length - 1]?.trim() ?? 'oraș';
};

const randomFloat = (min: number, max: number) => Math.random() * (max - min) + min;

const shuffleArray = <T,>(array: T[]): T[] => {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

