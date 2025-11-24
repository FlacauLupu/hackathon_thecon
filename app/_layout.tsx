import { DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PropsWithChildren, useMemo } from 'react';
import 'react-native-reanimated';

import { LocationsProvider } from '@/contexts/locations-context';
import { ThemeProvider, useAppTheme } from '@/contexts/theme-context';

export const unstable_settings = {
  anchor: '(tabs)',
};

function NavigationTheme({ children }: PropsWithChildren) {
  const { theme, tokens } = useAppTheme();

  const navigationTheme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: theme === 'dark',
      colors: {
        ...DefaultTheme.colors,
        primary: tokens.colors.accent,
        background: tokens.colors.background,
        text: tokens.colors.text,
        border: tokens.colors.border,
        card: tokens.colors.surface,
        notification: tokens.colors.warning,
      },
    }),
    [theme, tokens],
  );

  return <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>;
}

function AppNavigatorShell() {
  const { theme } = useAppTheme();

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="location/[id]" options={{ title: 'Detalii locație' }} />
      </Stack>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <NavigationTheme>
        <LocationsProvider>
          <AppNavigatorShell />
        </LocationsProvider>
      </NavigationTheme>
    </ThemeProvider>
  );
}
