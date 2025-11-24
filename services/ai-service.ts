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

type RecommendationOptions = {
  language: LanguageCode;
  reviewsByLocation?: Record<string, Review[]>;
  userLocation?: { lat: number; long: number } | null;
};

export const recommendLocation = async (
  userPrompt: string,
  locations: Location[],
  _history: ChatMessage[] = [],
  options?: RecommendationOptions,
): Promise<string> => {
  const language = options?.language ?? 'ro';
  const trimmedPrompt = userPrompt.trim();
  return buildKeywordRecommendation(
    trimmedPrompt,
    locations,
    language,
    options?.reviewsByLocation,
    options?.userLocation,
  );
};

const buildKeywordRecommendation = (
  prompt: string,
  locations: Location[],
  language: LanguageCode,
  reviewMap: Record<string, Review[]> = {},
  userLocation?: { lat: number; long: number } | null,
) => {
  const keywords = extractKeywords(prompt);
  const normalizedPrompt = keywords.join(', ');
  const scored = locations.map((location, index) => {
    const reviewTexts = (reviewMap[location.id] ?? []).map((review) => normalizeText(review.comment));
    const searchableText = normalizeText(
      [location.name, location.address, location.shortDescription, ...reviewTexts].join(' '),
    );
    const matches = new Set<string>();
    let score = location.rating + (5 - Math.min(5, index * 0.02));

    keywords.forEach((keyword) => {
      if (!keyword) return;
      if (searchableText.includes(keyword)) {
        score += 3;
        matches.add(keyword);
      }
    });

    let proximityText: string | undefined;
    if (userLocation) {
      const distance = calculateDistanceKm(
        userLocation.lat,
        userLocation.long,
        location.coordinates.lat,
        location.coordinates.long,
      );
      score += Math.max(0, 2 - distance / 30);
      proximityText =
        language === 'ro'
          ? `La aproximativ ${distance.toFixed(1)} km de tine`
          : `Roughly ${distance.toFixed(1)} km away`;
    }

    const topReview = reviewMap[location.id]?.[0];
    return {
      location,
      score,
      matches: Array.from(matches),
      reviewSnippet: topReview ? summarizeReview(topReview, language) : null,
      proximityText,
    };
  });

  const filtered = keywords.length ? scored.filter((item) => item.matches.length > 0) : scored;

  if (!filtered.length) {
    return getFallbackMessage(language);
  }

  const topSuggestions = filtered.sort((a, b) => b.score - a.score).slice(0, 2);

  const intro =
    language === 'en'
      ? keywords.length
        ? `Based on "${normalizedPrompt}", here is what I found:`
        : 'Here are a couple of spots you might like:'
      : keywords.length
        ? `Ținând cont de "${normalizedPrompt}", iată ce ți se potrivește:`
        : 'Iată câteva locuri care ți-ar plăcea:';

  const recommendationLines = topSuggestions.map((item) => {
    const { location, matches, reviewSnippet, proximityText } = item;
    const city = getCityFromAddress(location.address);
    const summary =
      language === 'en'
        ? `${location.name} (${city}) – ${location.shortDescription}`
        : `${location.name} (${city}) – ${location.shortDescription}`;
    const matchLine =
      matches.length > 0
        ? language === 'en'
          ? `Matches: ${matches.join(', ')}`
          : `Potrivit pentru: ${matches.join(', ')}`
        : null;
    const reviewLine =
      reviewSnippet && language === 'en'
        ? `Local tip: ${reviewSnippet}`
        : reviewSnippet
          ? `Părere locală: ${reviewSnippet}`
          : null;
    const proximityLine = proximityText ?? null;

    return [summary, matchLine, reviewLine, proximityLine].filter(Boolean).join('\n');
  });

  return [intro, ...recommendationLines].join('\n\n');
};

const STOP_WORDS = new Set([
  'si',
  'sau',
  'the',
  'and',
  'for',
  'with',
  'din',
  'lang',
  'este',
  'care',
  'in',
  'into',
  'about',
  'want',
  'looking',
  'caut',
  'vreau',
  'unde',
  'pentru',
  'cu',
  'despre',
  'some',
  'something',
  'near',
  'close',
  'aproape',
]);

const extractKeywords = (prompt: string) =>
  normalizeText(prompt)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');

const summarizeReview = (review: Review, language: LanguageCode) => {
  const snippet =
    review.comment.length > 90 ? `${review.comment.slice(0, 87).trim()}…` : review.comment.trim();
  const author = review.userName ?? (language === 'ro' ? 'Anonim' : 'Guest');
  return language === 'en'
    ? `"${snippet}" — ${author}`
    : `"${snippet}" — ${author}`;
};

const FALLBACK_MESSAGES = {
  ro: [
    'Nu am găsit nimic relevant pentru descrierea ta. Îți recomand să menționezi tipul de local sau orașul.',
    'Pare că nu avem încă un loc potrivit pentru vibe-ul descris. Încearcă alte cuvinte cheie.',
    'Nu am identificat o potrivire clară. Spune-mi dacă vrei cafea, burgeri, desert sau orașul dorit.',
  ],
  en: [
    'I could not find a clear match for that description. Try mentioning the food type or city.',
    'Nothing stood out yet. Add a bit more context—coffee, burgers, brunch, or city name.',
    'No direct match this time. Describe the vibe (quiet, lively, seaside) and I will try again.',
  ],
};

const getFallbackMessage = (language: LanguageCode) => {
  const pool = FALLBACK_MESSAGES[language] ?? FALLBACK_MESSAGES.ro;
  return pool[Math.floor(Math.random() * pool.length)];
};

const getCityFromAddress = (address: string) => {
  const parts = address.split(',');
  return parts[parts.length - 1]?.trim() ?? address;
};

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

