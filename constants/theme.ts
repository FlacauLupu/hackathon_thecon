import { Platform } from 'react-native';

export type ThemeName = 'light' | 'dark' | 'pastel';

type ColorTokens = {
  background: string;
  surface: string;
  elevated: string;
  text: string;
  mutedText: string;
  border: string;
  accent: string;
  accentSoft: string;
  icon: string;
  tabIconDefault: string;
  tabIconSelected: string;
  success: string;
  warning: string;
  mapMarker: string;
  mapTint: string;
};

type TypographyTokens = {
  fontFamily: string;
  heading: number;
  subheading: number;
  body: number;
  small: number;
  weight: {
    regular: '400';
    medium: '500';
    bold: '700';
  };
};

type SpacingTokens = {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
};

export type ThemeTokens = {
  name: ThemeName;
  colors: ColorTokens;
  spacing: SpacingTokens;
  typography: TypographyTokens;
  components: {
    cardRadius: number;
    buttonRadius: number;
    borderWidth: number;
  };
  map: {
    tileTemplate: string;
    zoomTapEnabled: boolean;
  };
};

const baseSpacing: SpacingTokens = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const baseTypography: TypographyTokens = {
  fontFamily:
    Platform.select({
      ios: 'SF Pro Display',
      android: 'Roboto',
      default: 'System',
    }) ?? 'System',
  heading: 24,
  subheading: 18,
  body: 15,
  small: 13,
  weight: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
};

export const themeConfig: Record<ThemeName, ThemeTokens> = {
  light: {
    name: 'light',
    colors: {
      background: '#F9FAFB',
      surface: '#FFFFFF',
      elevated: '#EEF2FF',
      text: '#0F172A',
      mutedText: '#64748B',
      border: '#E2E8F0',
      accent: '#4C6EF5',
      accentSoft: '#A5B4FC',
      icon: '#475569',
      tabIconDefault: '#94A3B8',
      tabIconSelected: '#4C6EF5',
      success: '#22C55E',
      warning: '#FBBF24',
      mapMarker: '#2563EB',
      mapTint: '#E0E7FF',
    },
    spacing: baseSpacing,
    typography: baseTypography,
    components: {
      cardRadius: 18,
      buttonRadius: 14,
      borderWidth: 1,
    },
    map: {
      tileTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      zoomTapEnabled: true,
    },
  },
  dark: {
    name: 'dark',
    colors: {
      background: '#05070F',
      surface: '#0F172A',
      elevated: '#1E293B',
      text: '#F8FAFC',
      mutedText: '#94A3B8',
      border: '#1E3A8A',
      accent: '#22D3EE',
      accentSoft: '#38BDF8',
      icon: '#CBD5F5',
      tabIconDefault: '#64748B',
      tabIconSelected: '#22D3EE',
      success: '#34D399',
      warning: '#FACC15',
      mapMarker: '#38BDF8',
      mapTint: '#082F49',
    },
    spacing: baseSpacing,
    typography: baseTypography,
    components: {
      cardRadius: 18,
      buttonRadius: 14,
      borderWidth: 1,
    },
    map: {
      tileTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      zoomTapEnabled: true,
    },
  },
  pastel: {
    name: 'pastel',
    colors: {
      background: '#F8F1FF',
      surface: '#FFFFFF',
      elevated: '#F1E8FF',
      text: '#2D1B4E',
      mutedText: '#6B4AA5',
      border: '#E3D0FF',
      accent: '#C084FC',
      accentSoft: '#E9D5FF',
      icon: '#8B5CF6',
      tabIconDefault: '#C4B5FD',
      tabIconSelected: '#A855F7',
      success: '#A3E635',
      warning: '#F472B6',
      mapMarker: '#8B5CF6',
      mapTint: '#F5E8FF',
    },
    spacing: baseSpacing,
    typography: baseTypography,
    components: {
      cardRadius: 20,
      buttonRadius: 16,
      borderWidth: 1,
    },
    map: {
      tileTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      zoomTapEnabled: false,
    },
  },
};

export const availableThemes: ThemeName[] = ['light', 'dark', 'pastel'];

export const Colors: Record<ThemeName, ColorTokens> = {
  light: themeConfig.light.colors,
  dark: themeConfig.dark.colors,
  pastel: themeConfig.pastel.colors,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
