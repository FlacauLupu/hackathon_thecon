import { StyleSheet, Text, type TextProps } from 'react-native';
import { useMemo } from 'react';

import { useThemeColor } from '@/hooks/use-theme-color';
import { useAppTheme } from '@/contexts/theme-context';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const {
    tokens: { typography, colors: themeColors },
  } = useAppTheme();

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        default: {
          fontSize: typography.body,
          lineHeight: typography.body * 1.4,
          fontFamily: typography.fontFamily,
          fontWeight: typography.weight.regular,
        },
        defaultSemiBold: {
          fontSize: typography.body,
          lineHeight: typography.body * 1.4,
          fontFamily: typography.fontFamily,
          fontWeight: typography.weight.medium,
        },
        title: {
          fontSize: typography.heading,
          fontWeight: typography.weight.bold,
        },
        subtitle: {
          fontSize: typography.subheading,
          fontWeight: typography.weight.bold,
        },
        link: {
          lineHeight: typography.body * 1.4,
          fontSize: typography.body,
          color: themeColors.accent,
          textDecorationLine: 'underline',
        },
      }),
    [typography, themeColors],
  );

  return (
    <Text
      style={[
        { color },
        type === 'default' ? dynamicStyles.default : undefined,
        type === 'title' ? dynamicStyles.title : undefined,
        type === 'defaultSemiBold' ? dynamicStyles.defaultSemiBold : undefined,
        type === 'subtitle' ? dynamicStyles.subtitle : undefined,
        type === 'link' ? dynamicStyles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}
