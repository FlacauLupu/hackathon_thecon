import { Pressable, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/contexts/theme-context';
import { ThemedText } from '@/components/themed-text';

type ViewMode = 'list' | 'map';

type Props = {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
};

const OPTIONS: { label: string; value: ViewMode }[] = [
  { label: 'Listă', value: 'list' },
  { label: 'Hartă', value: 'map' },
];

export function ViewModeToggle({ value, onChange }: Props) {
  const {
    tokens: { colors, spacing, components },
  } = useAppTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: components.buttonRadius,
          borderColor: colors.border,
          padding: spacing.xs,
        },
      ]}>
      {OPTIONS.map((option) => {
        const isActive = option.value === value;
        return (
          <Pressable
            key={option.value}
            style={[
              styles.option,
              {
                backgroundColor: isActive ? colors.accent : 'transparent',
                borderRadius: components.buttonRadius,
                paddingVertical: spacing.sm,
              },
            ]}
            onPress={() => onChange(option.value)}>
            <ThemedText
              type="defaultSemiBold"
              style={{ color: isActive ? '#ffffff' : colors.text, textAlign: 'center' }}>
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  option: {
    flex: 1,
  },
});

