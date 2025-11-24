import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { initDatabase } from '@/services/database';
import { getActiveSession, loginUser, logoutUser, registerUser } from '@/services/auth-service';
import { User } from '@/types/user';

type AuthContextValue = {
  user: User | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isReady: false,
  login: async () => undefined,
  register: async () => undefined,
  logout: async () => undefined,
});

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      await initDatabase();
      const session = await getActiveSession();
      setUser(session);
      setIsReady(true);
    };

    bootstrap();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const authenticatedUser = await loginUser(email, password);
    setUser(authenticatedUser);
  }, []);

  const register = useCallback(
    async (name: string, email: string, password: string) => registerUser(name, email, password),
    [],
  );

  const logout = useCallback(async () => {
    await logoutUser();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isReady,
      login,
      register,
      logout,
    }),
    [user, isReady, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

