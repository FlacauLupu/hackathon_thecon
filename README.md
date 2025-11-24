# Aplicație Mobilă Turism

Aplicația Expo prezintă locații de interes (restaurante, cafenele, bistrouri) din România folosind datele furnizate în `locatii.json`. Utilizatorii pot alterna între modurile Listă și Hartă, pot salva locații favorite, își pot urmări istoricul vizitelor și pot adăuga recenzii cu vibe personal. Toate datele de utilizator sunt memorate local în SQLite.

## Funcționalități principale
- **Autentificare locală (SQLite):** formular de login/register cu parole hash-uite (`expo-crypto`). Utilizatorul rămâne logat prin sesiunea salvată în tabela `session`.
- **Explore:** listă performantă (`FlatList`) cu carduri ilustrate, rating, adresă, CTA WhatsApp și comutare rapidă în modul Hartă (`react-native-maps` + `UrlTile` pentru OpenStreetMap). Favoritele sunt marcate și pot fi schimbate direct din card.
- **Detalii locație:** afișează informațiile locației, descriere AI (`generateLocationVibe`), butoane de favorite/istoric și formular de recenzie (rating + comentariu). Vizitele sunt salvate automat în momentul deschiderii ecranului.
- **Profil:** dashboard cu statistici (favorite, vizite, recenzii), listă cu ultimele locații vizitate, recenziile mele, selecție temă (Light/Dark/Pastel) și shortcut WhatsApp pentru feedback.
- **Teme dinamice:** context cu design tokens pentru cele trei teme; navigația și componentele ThemedText/View se actualizează instant.

## Pornire rapidă
```bash
npm install
npx expo start
```
1. Pornește aplicația în Expo Go / emulator.
2. Creează-ți un cont din ecranul de autentificare (numai email și parolă, datele rămân local).
3. Explorează locațiile, salvează favorite și lasă recenzii – datele tale vor fi persistate în baza SQLite (`services/database.ts`).

## Configurarea serviciului AI
Funcția `generateLocationVibe` folosește modelul OpenAI (implicit `gpt-4o-mini`). Pentru rezultate reale setează variabilele de mediu (în `app.json` > `extra` sau `app.config.js`). Prefixul `EXPO_PUBLIC_` permite expunerea valorilor către client.

```bash
EXPO_PUBLIC_OPENAI_API_KEY="cheia_voastră"
EXPO_PUBLIC_OPENAI_BASE_URL="https://api.openai.com/v1" # opțional
EXPO_PUBLIC_OPENAI_MODEL="gpt-4o-mini" # opțional
```
În lipsa cheii se folosește un fallback local astfel încât aplicația să rămână demonstrabilă.

## Structură relevantă
```
app/
  auth.tsx                 # Login/Register screen
  (tabs)/index.tsx         # Explore (listă + hartă)
  (tabs)/profile.tsx       # Profil + statistici
  location/[id].tsx        # Detalii, favorite, recenzii
components/
  location-card.tsx, whatsapp-button.tsx, view-mode-toggle.tsx, loading-indicator.tsx
contexts/
  auth-context.tsx, user-data-context.tsx, locations-context.tsx, theme-context.tsx
services/
  database.ts              # Setup SQLite + tabele (users, favorites, visits, reviews, session)
  auth-service.ts          # Înregistrare / login / sesiune
  user-data-service.ts     # Favorite, istorice, recenzii
  location-service.ts      # Citește `locatii.json`
```

## Scripturi utile
- `npm run lint` – verifică regulile ESLint Expo.
- `npm run android` / `npm run ios` – pornește Expo pe emulator dedicat.

## Idei viitoare
- Căutare + filtre avansate în ecranul Explore.
- Sincronizare cloud / backend real pentru listele personale.
- Notificări (ex. remindere pentru locațiile salvate) + analytics.

Documentația PDF „Aplicație Mobilă Turism (React Native + Expo + AI)” din repo rămâne referința completă pentru roadmap și best practises.
