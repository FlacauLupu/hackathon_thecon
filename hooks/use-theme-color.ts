/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { ThemeName, ThemeTokens } from '@/constants/theme';
import { useAppTheme } from '@/contexts/theme-context';

export function useThemeColor(
  props: Partial<Record<ThemeName, string>>,
  colorName: keyof ThemeTokens['colors']
) {
  const { theme, tokens } = useAppTheme();
  const colorFromProps = props[theme];

  if (colorFromProps) {
    return colorFromProps;
  }

  return tokens.colors[colorName];
}
