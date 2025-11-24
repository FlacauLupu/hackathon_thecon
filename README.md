<<<<<<< HEAD
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
=======
# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
>>>>>>> dd50818629a45c74d84332579bbaa8d46d00a1df
