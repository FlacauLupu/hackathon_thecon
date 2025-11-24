import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAppTheme } from '@/contexts/theme-context';

type ViewMode = 'list' | 'map' | 'assistant';

type Props = {
  value: ViewMode;
  options: { label: string; value: ViewMode }[];
  onChange: (mode: ViewMode) => void;
};

export function ViewModeToggle({ value, onChange, options }: Props) {
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
      {options.map((option) => {
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

