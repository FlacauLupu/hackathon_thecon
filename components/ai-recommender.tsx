import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { useAppTheme } from '@/contexts/theme-context';
import { recommendLocation, type ChatMessage } from '@/services/ai-service';
import { Location } from '@/types/location';

import { LoadingIndicator } from './loading-indicator';
import { ThemedText } from './themed-text';

type Props = {
  locations: Location[];
};

export function AIRecommender({ locations }: Props) {
  const {
    tokens: { colors, spacing, components },
  } = useAppTheme();
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
      const reply = await recommendLocation(userMessage.content, locations, history);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (error) {
      console.error('AI chat failed', error);
      setErrorMessage('Nu am reușit să vorbesc cu asistentul. Încearcă din nou.');
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
        <ThemedText type="subtitle">Asistent AI</ThemedText>
        <ThemedText style={{ color: colors.mutedText }}>
          Spune-i ce fel de vibe cauți, iar el îți recomandă un loc care ți se potrivește.
        </ThemedText>
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
          <ThemedText style={{ color: colors.mutedText }}>Nu ai început conversația încă.</ThemedText>
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
          placeholder="Ex: Vreau un coffee shop liniștit cu prăjituri"
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
            {isThinking ? 'Se gândește...' : 'Recomandă-mi un loc'}
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

