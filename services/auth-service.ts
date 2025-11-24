import * as Crypto from 'expo-crypto';

import { queryAll, runQuery } from '@/services/database';
import { User } from '@/types/user';

type UserRow = {
  id: number;
  name: string;
  email: string;
  password_hash: string;
};

const hashPassword = async (password: string) => {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password.trim());
};

const mapUser = (row: UserRow): User => ({
  id: row.id,
  name: row.name,
  email: row.email,
});

export const registerUser = async (name: string, email: string, password: string): Promise<User> => {
  const normalizedEmail = email.trim().toLowerCase();
  const hashedPassword = await hashPassword(password);

  try {
    await runQuery('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)', [
      name.trim(),
      normalizedEmail,
      hashedPassword,
    ]);
  } catch (error) {
    if (error instanceof Error && /UNIQUE constraint failed/.test(error.message)) {
      throw new Error('Adresa de email este deja folosită.');
    }
    throw error;
  }

  const [userRow] = await queryAll<UserRow>('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

  return mapUser(userRow);
};

export const loginUser = async (email: string, password: string): Promise<User> => {
  const normalizedEmail = email.trim().toLowerCase();
  const [userRow] = await queryAll<UserRow>('SELECT * FROM users WHERE email = ?', [normalizedEmail]);

  if (!userRow) {
    throw new Error('User not found');
  }

  const hashedPassword = await hashPassword(password);

  if (hashedPassword !== userRow.password_hash) {
    throw new Error('Invalid credentials');
  }

  await runQuery(
    'INSERT INTO session (id, user_id) VALUES (0, ?) ON CONFLICT(id) DO UPDATE SET user_id = excluded.user_id',
    [userRow.id],
  );

  return mapUser(userRow);
};

export const getActiveSession = async (): Promise<User | null> => {
  const [sessionRow] = await queryAll<{ user_id: number }>('SELECT user_id FROM session WHERE id = 0');

  if (!sessionRow) {
    return null;
  }

  const [userRow] = await queryAll<UserRow>('SELECT * FROM users WHERE id = ?', [sessionRow.user_id]);

  return userRow ? mapUser(userRow) : null;
};

export const logoutUser = async () => {
  await runQuery('DELETE FROM session WHERE id = 0');
};

