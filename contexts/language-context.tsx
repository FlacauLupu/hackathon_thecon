import { PropsWithChildren, createContext, useCallback, useContext, useMemo, useState } from 'react';

import { LANGUAGE_OPTIONS, type LanguageCode } from '@/constants/language';

type TranslationRecord = typeof translations.ro;
type TranslationKey = keyof TranslationRecord;

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (code: LanguageCode) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  availableLanguages: typeof LANGUAGE_OPTIONS;
};

const LanguageContext = createContext<LanguageContextValue>({
  language: 'ro',
  setLanguage: () => undefined,
  t: (key) => translations.ro[key] ?? key,
  availableLanguages: LANGUAGE_OPTIONS,
});

const translations = {
  ro: {
    'view.list': 'Listă',
    'view.map': 'Hartă',
    'view.assistant': 'Asistent',
    'explore.heroTitle': 'Explorează vibe-ul locațiilor',
    'explore.heroSubtitle':
      'Schimbă modul de vizualizare și descoperă unde îți bei următoarea cafea sau unde mănânci ceva autentic.',
    'explore.activateLocation': 'Activează locația pentru a vedea ce e aproape',
    'explore.locating': 'Determinăm locația ta...',
    'explore.closestTitle': 'Aproape de tine',
    'explore.closestSubtitle': 'Iată cele mai apropiate locuri pe baza poziției tale curente.',
    'explore.retry': 'Reîncarcă locațiile',
    'explore.noLocationsTitle': 'Nu am găsit locații',
    'explore.noLocationsSubtitle': 'Încearcă să reîncarci pentru a vedea locațiile.',
    'explore.calloutDetails': 'Vezi detalii',
    'explore.calloutButton': 'Vezi mai mult',
    'explore.rating.all': 'Toate',
    'explore.rating.4': '4.0+',
    'explore.rating.45': '4.5+',
    'explore.assistantTitle': 'Asistent AI',
    'explore.assistantSubtitle': 'Spune-i ce vibe cauți, iar el îți recomandă un loc potrivit ție.',
    'explore.assistantPlaceholder': 'Ex: Vreau un coffee shop liniștit cu prăjituri',
    'explore.assistantButton': 'Recomandă-mi un loc',
    'explore.assistantLoading': 'Se gândește...',
    'explore.assistantEmpty': 'Nu ai început conversația încă.',
    'explore.assistantError': 'Nu am reușit să vorbesc cu asistentul. Încearcă din nou.',
    'distance.meters': '{{meters}} m distanță',
    'distance.kilometers': '{{km}} km distanță',
    'location.reserve': 'Rezervă',
    'profile.greeting': 'Salut, {{name}} 👋',
    'profile.explorer': 'Explorator',
    'profile.logout': 'Ieși',
    'profile.statsTitle': 'Statistici rapide',
    'profile.stats.favorites': 'Locații favorite',
    'profile.stats.visits': 'Vizite înregistrate',
    'profile.stats.reviews': 'Recenzii',
    'profile.themeTitle': 'Teme vizuale',
    'profile.themeSubtitle': 'Personalizează UI-ul în funcție de vibe-ul tău.',
    'profile.theme.statusActive': 'Tema curentă',
    'profile.theme.statusInactive': 'Tap pentru a activa',
    'profile.theme.light.title': 'Light',
    'profile.theme.light.description': 'Accent pe claritate și fotografii luminoase.',
    'profile.theme.dark.title': 'Dark',
    'profile.theme.dark.description': 'Contrast ridicat ideal pentru sesiuni nocturne.',
    'profile.theme.pastel.title': 'Pastel Mov',
    'profile.theme.pastel.description': 'Vibe creativ inspirat din moodboard-urile de hackathon.',
    'profile.favoritesTitle': 'Locații favorite',
    'profile.favoritesEmpty': 'Încă nu ai salvat nimic. Deschide tab-ul Explore și apasă pe inimioară.',
    'profile.visitsTitle': 'Ultimele vizite',
    'profile.visitsEmpty': 'Când deschizi o locație, o vom adăuga aici automat.',
    'profile.reviewsTitle': 'Recenziile mele',
    'profile.reviewsEmpty': 'Scrie o recenzie din ecranul unei locații și o vezi aici.',
    'profile.feedbackTitle': 'Feedback rapid',
    'profile.feedbackSubtitle': 'Trimite pe WhatsApp întrebări sau resurse extra pentru echipa de hackathon.',
    'profile.languageTitle': 'Limba aplicației',
    'profile.languageSubtitle': 'Alege limba în care vrei să vezi interfața și recomandările.',
    'profile.languageActive': 'Limba curentă',
    'profile.languageInactive': 'Tap pentru a activa',
    'assistant.fallback': 'Nu am suficiente date încă pentru a oferi o recomandare.',
    'assistant.userPrompt': 'Preferințele mele: {{prompt}}\n\nLocații disponibile:\n{{locations}}',
    'assistant.systemPrompt':
      'Ești un concierge culinar din România. Recomanzi localuri folosindu-te de descrierile și recenziile disponibile. Ține cont de locația utilizatorului dacă este furnizată și răspunde exclusiv în limba română. Oferă maxim două alternative.',
    'assistant.reviewPrefix': 'Recenzii',
  },
  en: {
    'view.list': 'List',
    'view.map': 'Map',
    'view.assistant': 'Assistant',
    'explore.heroTitle': 'Explore new city vibes',
    'explore.heroSubtitle': 'Switch between views to find your next coffee break or authentic meal.',
    'explore.activateLocation': 'Enable location services to see what is nearby',
    'explore.locating': 'Fetching your location...',
    'explore.closestTitle': 'Near you',
    'explore.closestSubtitle': 'Here are the closest places based on your current position.',
    'explore.retry': 'Reload locations',
    'explore.noLocationsTitle': 'No locations found',
    'explore.noLocationsSubtitle': 'Pull to refresh and try again.',
    'explore.calloutDetails': 'See details',
    'explore.calloutButton': 'Show more',
    'explore.rating.all': 'All',
    'explore.rating.4': '4.0+',
    'explore.rating.45': '4.5+',
    'explore.assistantTitle': 'AI concierge',
    'explore.assistantSubtitle': 'Tell it what vibe you need and it will suggest a perfect spot.',
    'explore.assistantPlaceholder': 'Eg: Looking for a calm coffee shop with pastries',
    'explore.assistantButton': 'Recommend a place',
    'explore.assistantLoading': 'Thinking...',
    'explore.assistantEmpty': 'You have not started the conversation yet.',
    'explore.assistantError': 'Could not reach the assistant. Please try again.',
    'distance.meters': '{{meters}} m away',
    'distance.kilometers': '{{km}} km away',
    'location.reserve': 'Book',
    'profile.greeting': 'Hello, {{name}} 👋',
    'profile.explorer': 'Explorer',
    'profile.logout': 'Log out',
    'profile.statsTitle': 'Quick stats',
    'profile.stats.favorites': 'Favorite spots',
    'profile.stats.visits': 'Visits logged',
    'profile.stats.reviews': 'Reviews',
    'profile.themeTitle': 'Themes',
    'profile.themeSubtitle': 'Pick the visual style that fits your vibe.',
    'profile.theme.statusActive': 'Current theme',
    'profile.theme.statusInactive': 'Tap to activate',
    'profile.theme.light.title': 'Light',
    'profile.theme.light.description': 'Focus on clarity and bright photography.',
    'profile.theme.dark.title': 'Dark',
    'profile.theme.dark.description': 'High contrast that feels great at night.',
    'profile.theme.pastel.title': 'Pastel Purple',
    'profile.theme.pastel.description': 'Creative vibe inspired by hackathon moodboards.',
    'profile.favoritesTitle': 'Favorite locations',
    'profile.favoritesEmpty': 'Nothing saved yet. Open Explore and tap the heart icon.',
    'profile.visitsTitle': 'Latest visits',
    'profile.visitsEmpty': 'Whenever you open a location we will log it here.',
    'profile.reviewsTitle': 'My reviews',
    'profile.reviewsEmpty': 'Write a review from any location screen to see it here.',
    'profile.feedbackTitle': 'Quick feedback',
    'profile.feedbackSubtitle': 'Send feedback on WhatsApp to help the hackathon team improve.',
    'profile.languageTitle': 'App language',
    'profile.languageSubtitle': 'Choose the language for the interface and recommendations.',
    'profile.languageActive': 'Current language',
    'profile.languageInactive': 'Tap to switch',
    'assistant.fallback': 'I do not have enough data yet to recommend a place.',
    'assistant.userPrompt': 'My preferences: {{prompt}}\n\nAvailable locations:\n{{locations}}',
    'assistant.systemPrompt':
      'You are a culinary concierge in Romania. Recommend venues using the provided descriptions and reviews. Consider the user location when available and respond only in English. Offer at most two alternatives.',
    'assistant.reviewPrefix': 'Reviews',
  },
} as const;

const interpolate = (template: string, vars?: Record<string, string | number>) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars?.[key] ?? ''));

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<LanguageCode>('ro');

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      interpolate(translations[language][key] ?? translations.ro[key] ?? key, vars),
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
      availableLanguages: LANGUAGE_OPTIONS,
    }),
    [language, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useTranslation = () => useContext(LanguageContext);

