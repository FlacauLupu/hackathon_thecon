import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { LoadingIndicator } from '@/components/loading-indicator';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from '@/contexts/language-context';
import { useAppTheme } from '@/contexts/theme-context';
import { recommendLocation, type ChatMessage } from '@/services/ai-service';
import { Location } from '@/types/location';
import { Review } from '@/types/review';

type Props = {
  locations: Location[];
  reviewsByLocation: Record<string, Review[]>;
  userLocation: { lat: number; long: number } | null;
};

export function AIRecommender({ locations, reviewsByLocation, userLocation }: Props) {
  const {
    tokens: { colors, spacing, components },
  } = useAppTheme();
  const { t, language } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleAsk = async () => {
    if (!prompt.trim() || isThinking) {
      return;
    }

    const userMessage: ChatMessage = {
      role: 'user',
      content: prompt.trim(),
    };

    const history = [...messages, userMessage];
    setMessages(history);
    setPrompt('');
    setIsThinking(true);
    setErrorMessage(null);

    try {
      const reply = await recommendLocation(userMessage.content, locations, history, {
        language,
        reviewsByLocation,
        userLocation,
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('AI chat failed', error);
      setErrorMessage(t('explore.assistantError'));
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
          backgroundColor: colors.surface,
          borderRadius: components.cardRadius,
          padding: spacing.lg,
          gap: spacing.md,
        },
      ]}>
      <View style={{ gap: spacing.xs }}>
        <ThemedText type="subtitle">{t('explore.assistantTitle')}</ThemedText>
        <ThemedText style={{ color: colors.mutedText }}>{t('explore.assistantSubtitle')}</ThemedText>
      </View>

      <View
        style={[
          styles.history,
          {
            borderColor: colors.border,
            backgroundColor: colors.elevated,
            borderRadius: components.cardRadius,
            padding: spacing.md,
          },
        ]}>
        {messages.length === 0 && (
          <ThemedText style={{ color: colors.mutedText }}>{t('explore.assistantEmpty')}</ThemedText>
        )}
        {messages.map((message, index) => (
          <View
            key={`${message.role}-${index}`}
            style={[
              styles.messageBubble,
              {
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: message.role === 'user' ? colors.accent : colors.surface,
                borderRadius: components.buttonRadius,
                padding: spacing.sm,
              },
            ]}>
            <ThemedText
              style={{
                color: message.role === 'user' ? '#ffffff' : colors.text,
              }}>
              {message.content}
            </ThemedText>
          </View>
        ))}
        {isThinking && <LoadingIndicator size="small" />}
        {errorMessage && <ThemedText style={{ color: colors.warning }}>{errorMessage}</ThemedText>}
      </View>

      <View style={{ gap: spacing.sm }}>
        <TextInput
          placeholder={t('explore.assistantPlaceholder')}
          value={prompt}
          onChangeText={setPrompt}
          placeholderTextColor={colors.mutedText}
          style={[
            styles.input,
            {
              borderColor: colors.border,
              color: colors.text,
              borderRadius: components.buttonRadius,
              padding: spacing.md,
            },
          ]}
          multiline
        />
        <Pressable
          onPress={handleAsk}
          disabled={isThinking}
          style={[
            styles.button,
            {
              backgroundColor: colors.accent,
              borderRadius: components.buttonRadius,
              opacity: isThinking ? 0.7 : 1,
              paddingVertical: spacing.sm,
            },
          ]}>
          <ThemedText type="defaultSemiBold" style={{ color: '#ffffff', textAlign: 'center' }}>
            {isThinking ? t('explore.assistantLoading') : t('explore.assistantButton')}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  history: {
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 120,
    gap: 8,
  },
  messageBubble: {
    maxWidth: '90%',
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

