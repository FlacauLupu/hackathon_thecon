import React, {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Appearance } from 'react-native';

import { ThemeName, ThemeTokens, availableThemes, themeConfig } from '@/constants/theme';

type ThemeContextValue = {
  theme: ThemeName;
  tokens: ThemeTokens;
  setTheme: (theme: ThemeName) => void;
  cycleTheme: () => void;
  themes: ThemeName[];
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  tokens: themeConfig.light,
  setTheme: () => undefined,
  cycleTheme: () => undefined,
  themes: availableThemes,
});

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setTheme] = useState<ThemeName>('light');

  useEffect(() => {
    const colorScheme = Appearance.getColorScheme();
    if (colorScheme === 'dark') {
      setTheme('dark');
    }
  }, []);

  const cycleTheme = useCallback(() => {
    setTheme((current) => {
      const currentIndex = availableThemes.indexOf(current);
      const nextIndex = (currentIndex + 1) % availableThemes.length;
      return availableThemes[nextIndex];
    });
  }, []);

  const value = useMemo(
    () => ({
      theme,
      tokens: themeConfig[theme],
      setTheme,
      cycleTheme,
      themes: availableThemes,
    }),
    [theme, cycleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useAppTheme = () => useContext(ThemeContext);

