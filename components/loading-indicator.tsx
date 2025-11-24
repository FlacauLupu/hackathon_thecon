import { ActivityIndicator, View } from 'react-native';

import { useAppTheme } from '@/contexts/theme-context';

type Props = {
  size?: 'small' | 'large';
};

export function LoadingIndicator({ size = 'large' }: Props) {
  const {
    tokens: { colors, spacing },
  } = useAppTheme();

  return (
    <View
      style={{
        paddingVertical: spacing.lg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <ActivityIndicator size={size} color={colors.accent} />
    </View>
  );
}

