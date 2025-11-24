import { LanguageCode } from '@/constants/language';
import { Location } from '@/types/location';
import { Review } from '@/types/review';

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

const shortlistLocations = (
  locations: Location[],
  language: LanguageCode,
  reviewMap?: Record<string, Review[]>,
  limit = 8,
) =>
  locations
    .slice(0, limit)
    .map((location) => {
      const baseLine =
        language === 'ro'
          ? `${location.name} (${location.rating.toFixed(1)}⭐) · ${location.address} · ${location.shortDescription}`
          : `${location.name} (${location.rating.toFixed(1)}⭐) · ${location.address} · ${location.shortDescription}`;
      const reviews = reviewMap?.[location.id]?.slice(0, 2);
      if (!reviews || reviews.length === 0) {
        return baseLine;
      }
      const reviewLabel = language === 'ro' ? 'Recenzii' : 'Reviews';
      const snippets = reviews
        .map((review) => {
          const author = review.userName ?? (language === 'ro' ? 'Anonim' : 'Guest');
          return `${author}: "${review.comment}" (${review.rating}⭐)`;
        })
        .join(' | ');
      return `${baseLine}\n${reviewLabel}: ${snippets}`;
    })
    .join('\n');

const fallbackRecommendation = (locations: Location[], language: LanguageCode): string => {
  if (!locations.length) {
    return language === 'ro'
      ? 'Nu am suficiente date încă pentru a oferi o recomandare.'
      : 'I do not have enough data yet to recommend a place.';
  }
  const [bestMatch] = [...locations].sort((a, b) => b.rating - a.rating);
  return language === 'ro'
    ? `Îți recomand ${bestMatch.name} (rating ${bestMatch.rating.toFixed(
        1,
      )}⭐) pentru că ${bestMatch.shortDescription.toLowerCase()}.`
    : `You should try ${bestMatch.name} (rated ${bestMatch.rating.toFixed(
        1,
      )}⭐) because ${bestMatch.shortDescription.toLowerCase()}.`;
};

type RecommendationOptions = {
  language: LanguageCode;
  reviewsByLocation?: Record<string, Review[]>;
  userLocation?: { lat: number; long: number } | null;
};

const SYSTEM_PROMPTS: Record<LanguageCode, string> = {
  ro: 'Ești un concierge culinar din România. Recomanzi localuri folosindu-te de descrierile și recenziile disponibile. Ține cont de locația utilizatorului dacă este furnizată și răspunde exclusiv în limba română. Oferă maxim două alternative.',
  en: 'You are a culinary concierge in Romania. Recommend venues using the provided descriptions and reviews. Consider the user location when available and respond only in English. Offer at most two alternatives.',
};

const USER_PROMPT_TEMPLATE: Record<LanguageCode, string> = {
  ro: 'Preferințele mele: {{prompt}}\n{{locationHint}}\nLocații disponibile:\n{{locations}}',
  en: 'My preferences: {{prompt}}\n{{locationHint}}\nAvailable locations:\n{{locations}}',
};

const formatUserPrompt = (
  prompt: string,
  locations: string,
  language: LanguageCode,
  userLocation?: { lat: number; long: number } | null,
) => {
  const locationHint = userLocation
    ? language === 'ro'
      ? `Coordonatele mele aproximative: (${userLocation.lat.toFixed(3)}, ${userLocation.long.toFixed(3)}).`
      : `My approximate coordinates: (${userLocation.lat.toFixed(3)}, ${userLocation.long.toFixed(3)}).`
    : language === 'ro'
      ? 'Nu am oferit coordonate precise.'
      : 'I did not provide coordinates.';

  return USER_PROMPT_TEMPLATE[language]
    .replace('{{prompt}}', prompt)
    .replace('{{locations}}', locations)
    .replace('{{locationHint}}', locationHint);
};

export const recommendLocation = async (
  userPrompt: string,
  locations: Location[],
  history: ChatMessage[] = [],
  options?: RecommendationOptions,
): Promise<string> => {
  const trimmedPrompt = userPrompt.trim();
  if (!trimmedPrompt) {
    return options?.language === 'en'
      ? 'Tell me what kind of vibe you are looking for and I will suggest something.'
      : 'Spune-mi ce îți dorești — cafea, restaurant, vibe — și îți recomand ceva.';
  }

  const language = options?.language ?? 'ro';
  const shortlist = shortlistLocations(locations, language, options?.reviewsByLocation);
  const fallback = fallbackRecommendation(locations, language);

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
            content: SYSTEM_PROMPTS[language],
          },
          ...history.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
          {
            role: 'user',
            content: formatUserPrompt(trimmedPrompt, shortlist, language, options?.userLocation),
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

