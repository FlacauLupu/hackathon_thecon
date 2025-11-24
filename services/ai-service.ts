import { Location } from '@/types/location';

export type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const OPENAI_BASE_URL = process.env.EXPO_PUBLIC_OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_MODEL = process.env.EXPO_PUBLIC_OPENAI_MODEL ?? 'gpt-4o-mini';

const buildPrompt = (location: Location) =>
  [
    `Scrie o descriere cu vibe modern pentru o locație turistică din România.`,
    `Locație: ${location.name}.`,
    `Adresă: ${location.address}.`,
    `Descriere scurtă: ${location.shortDescription}.`,
    `Include ton cald, două propoziții și o recomandare de activitate.`,
  ].join(' ');

const fallbackDescription = (location: Location) =>
  `${location.name} păstrează energia locului descris prin "${location.shortDescription}". Imaginează-ți mirosul și sunetele cartierului ${location.address}.`;

export const generateLocationVibe = async (location: Location): Promise<string> => {
  if (!OPENAI_API_KEY) {
    return fallbackDescription(location);
  }

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.8,
        messages: [
          {
            role: 'system',
            content:
              'Ești un ghid turistic AI care descrie experiențe culinare și culturale într-un stil prietenos și concret.',
          },
          {
            role: 'user',
            content: buildPrompt(location),
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('AI request failed', await response.text());
      return fallbackDescription(location);
    }

    const payload = await response.json();
    const content: string | undefined = payload?.choices?.[0]?.message?.content;

    return content?.trim() ?? fallbackDescription(location);
  } catch (error) {
    console.error('AI vibe generation failed', error);
    return fallbackDescription(location);
  }
};

const shortlistLocations = (locations: Location[], limit = 8) =>
  locations
    .slice(0, limit)
    .map(
      (location) =>
        `${location.name} (${location.rating.toFixed(1)}⭐) · ${location.address} · ${location.shortDescription}`,
    )
    .join('\n');

const fallbackRecommendation = (locations: Location[]): string => {
  if (!locations.length) {
    return 'Nu am suficiente date încă pentru a oferi o recomandare.';
  }
  const [bestMatch] = [...locations].sort((a, b) => b.rating - a.rating);
  return `Îți recomand ${bestMatch.name} (rating ${bestMatch.rating.toFixed(
    1,
  )}⭐) pentru că ${bestMatch.shortDescription.toLowerCase()}.`;
};

export const recommendLocation = async (
  userPrompt: string,
  locations: Location[],
  history: ChatMessage[] = [],
): Promise<string> => {
  const trimmedPrompt = userPrompt.trim();
  if (!trimmedPrompt) {
    return 'Spune-mi ce îți dorești — cafea, restaurant, vibe — și îți recomand ceva.';
  }

  const shortlist = shortlistLocations(locations);
  const fallback = fallbackRecommendation(locations);

  if (!OPENAI_API_KEY) {
    return fallback;
  }

  try {
    const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content:
              'Ești un concierge culinar din România care recomandă localuri folosindu-se de lista disponibilă. Argumentează de ce locația este potrivită și oferă maxim două alternative.',
          },
          ...history.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: 'user',
            content: `Preferințele mele: ${trimmedPrompt}\n\nLocații disponibile:\n${shortlist}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.warn('AI recommendation request failed', await response.text());
      return fallback;
    }

    const payload = await response.json();
    const content: string | undefined = payload?.choices?.[0]?.message?.content;

    return content?.trim() ?? fallback;
  } catch (error) {
    console.error('AI recommendation generation failed', error);
    return fallback;
  }
};

