import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet, Text } from 'react-native';

import { useAppTheme } from '@/contexts/theme-context';

type WhatsAppButtonProps = {
  message: string;
  label?: string;
  variant?: 'solid' | 'ghost';
};

export function WhatsAppButton({ message, label = 'WhatsApp', variant = 'solid' }: WhatsAppButtonProps) {
  const {
    tokens: { colors, components, spacing },
  } = useAppTheme();

  const isSolidVariant = variant === 'solid';

  const handlePress = async () => {
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    const canOpen = await Linking.canOpenURL(url);

    if (canOpen) {
      Linking.openURL(url);
    }
  };

  return (
    <Pressable
      accessibilityLabel="Contact via WhatsApp"
      style={[
        styles.button,
        {
          borderRadius: components.buttonRadius,
          backgroundColor: isSolidVariant ? colors.accent : 'transparent',
          borderColor: colors.accent,
          borderWidth: isSolidVariant ? 0 : components.borderWidth,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
      ]}
      onPress={handlePress}>
      <Ionicons
        name="logo-whatsapp"
        size={18}
        color={isSolidVariant ? '#ffffff' : colors.accent}
        style={{ marginRight: spacing.xs }}
      />
      <Text
        style={{
          color: isSolidVariant ? '#ffffff' : colors.accent,
          fontWeight: '600',
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

