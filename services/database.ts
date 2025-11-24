import { openDatabaseSync } from 'expo-sqlite';

const DATABASE_NAME = 'tourism_app.db';

export const db = openDatabaseSync(DATABASE_NAME);

type SQLArgs = (string | number | null)[];

const execute = async (query: string, params: SQLArgs = []) => {
  await db.runAsync(query, ...params);
};

export const initDatabase = async () => {
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
};

export const queryAll = async <T = Record<string, unknown>>(
  query: string,
  params: SQLArgs = [],
): Promise<T[]> => {
  const rows = await db.getAllAsync(query, ...params);
  return rows as T[];
};

export const runQuery = execute;

