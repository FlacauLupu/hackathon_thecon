# Aplicație Mobilă Turism

Aplicația Expo prezintă locații de interes (restaurante, cafenele, bistrouri) din România folosind datele furnizate în `locatii.json`. Utilizatorii pot alterna instant între listă și hartă OSM, pot deschide un ecran de detalii cu o descriere generată de AI și au butoane rapide către WhatsApp pentru rezervări.

## Funcționalități principale
- **Explore (tab implicit):** listă performantă (`FlatList`) cu carduri ilustrate, rating, adresă și CTA WhatsApp + modul Hartă (`react-native-maps` + `UrlTile` pentru OpenStreetMap) cu markere interactive.
- **Detalii locație:** afișează informațiile locației, ratingul și un text „vibe” generat de serviciul AI (`generateLocationVibe`). Se afișează un loader dedicat cât timp se așteaptă răspunsul.
- **Profil (tab secundar):** permite alegerea temei (Light, Dark, Pastel Mov) și oferă statistici + feedback rapid prin WhatsApp.
- **Teme dinamice:** Context global cu design tokens (culori, spacing, radii) pentru trei teme. Navigația și componentele ThemedText/View se actualizează instant.
- **Management date:** `LocationsProvider` încarcă și memorează locațiile din JSON pentru a fi reutilizate în toate ecranele.

## Pornire rapidă
```bash
npm install
npx expo start
```
Aplicația rulează în Expo Go, emulator Android/iOS sau web. Pentru build-uri dedicate folosiți `eas build` (vezi documentația Expo).

## Configurarea serviciului AI
Funcția `generateLocationVibe` folosește modelul OpenAI (implicit `gpt-4o-mini`). Pentru rezultate reale seteză variabilele de mediu (în `app.json` > `extra` sau `app.config.js`). Prefixul `EXPO_PUBLIC_` permite expunerea valorilor către client.

```bash
EXPO_PUBLIC_OPENAI_API_KEY="cheia_voastră"
EXPO_PUBLIC_OPENAI_BASE_URL="https://api.openai.com/v1" # opțional
EXPO_PUBLIC_OPENAI_MODEL="gpt-4o-mini" # opțional
```
În lipsa cheii se folosește un fallback local astfel încât aplicația să rămână demonstrabilă.

## Structură relevantă
```
app/
  (tabs)/index.tsx        # Ecran Explore (listă + hartă)
  (tabs)/profile.tsx      # Ecran Profil cu setări de temă
  location/[id].tsx       # Ecran detalii cu descriere AI
components/
  location-card.tsx
  whatsapp-button.tsx
  view-mode-toggle.tsx
contexts/
  locations-context.tsx
  theme-context.tsx
services/
  location-service.ts     # citește locatii.json
  ai-service.ts           # integrare OpenAI (fallback inclus)
```

## Scripturi utile
- `npm run lint` – verifică regulile ESLint Expo.
- `npm run android` / `npm run ios` – pornește Expo pe emulator dedicat.

## Ce urmează (idei din documentație)
- Filtre/ căutare în ecranul Explore.
- Autentificare și profiluri reale de utilizator.
- Ecrane suplimentare (chatbot AI, recenzii, favourite) + trimitere evenimente analytics.

Documentația PDF „Aplicație Mobilă Turism (React Native + Expo + AI)” din repo rămâne referința completă pentru roadmap și best practises.
