import { Location } from '@/types/location';

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

