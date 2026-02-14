# Karnet — Carnet d'entraînement

Application mobile de suivi d'entraînement, disponible en tant que PWA et APK Android.

---

## Fonctionnalités

- **Journal d'entraînement** — Enregistrez vos séances avec exercices, séries, répétitions, poids, durée et temps de repos
- **Bibliothèque d'exercices** — Plus de 100 exercices pré-chargés (musculation classique + appareils MATRIX) répartis en 16 groupes musculaires
- **3 modes de suivi** — Poids × reps (force), durée seule (isométrique), durée + distance (cardio)
- **Minuteur de repos** — Minuteur intégré avec alertes sonores et vibrations
- **Programmes** — Créez et gérez des programmes d'entraînement périodisés avec plusieurs séances par semaine
- **Analyses** — Courbes de volume, fréquence hebdomadaire, répartition musculaire, estimation du 1RM (formule d'Epley)
- **Records personnels** — Suivi automatique du poids max, des reps max et du volume max
- **Objectifs** — Définissez des objectifs de performance, de fréquence ou de composition corporelle avec suivi de progression
- **Mensurations** — Suivez le poids, la masse grasse et les tours de mensuration
- **Hors ligne** — Toutes les données sont stockées localement dans IndexedDB (aucune connexion requise)
- **Synchronisation cloud** — Sauvegarde optionnelle via Supabase
- **Multilingue** — Français (par défaut) et anglais, détection automatique de la langue
- **Thème Material Design 3** — Mode clair/sombre/système avec couleur d'accentuation personnalisable

---

## Stack technique

| Catégorie | Technologie |
|---|---|
| Framework | React 19 + TypeScript 5 |
| Build | Vite 7 |
| UI | Material UI 7 (MUI) — Material Design 3 |
| Routage | React Router 7 |
| Base de données | IndexedDB via Dexie 4 |
| Graphiques | Recharts 3 |
| i18n | i18next 25 |
| Mobile/PWA | Capacitor 8 + vite-plugin-pwa |
| Cloud (optionnel) | Supabase |

---

## Installation

**Prérequis** : Node.js 22+

```bash
git clone <url-du-repo>
cd Karnet
npm install
```

### Configuration Supabase (optionnel)

La synchronisation cloud nécessite un projet Supabase. Sans configuration, l'application fonctionne entièrement en local.

```bash
cp .env.example .env
```

Renseignez ensuite `.env` :

```env
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre-cle-anonyme
```

---

## Développement

```bash
# Serveur de développement avec hot-reload
npm run dev
# → http://localhost:5173

# Lint
npm run lint

# Build de production
npm run build

# Prévisualiser le build
npm run preview
```

---

## Build Android

**Prérequis supplémentaires** : Java 21, Android SDK

```bash
# APK de debug
npm run android:debug
# → android/app/build/outputs/apk/debug/Karnet-*.apk

# APK de release (nécessite un keystore configuré)
npm run android:release

# Synchroniser Capacitor après modification du code web
npm run cap:sync
```

Un APK de debug est automatiquement généré à chaque push via GitHub Actions.

---

## Structure du projet

```
src/
├── pages/          # Écrans principaux (accueil, séance, historique, analyses…)
├── components/     # Composants réutilisables (shell, timer de repos…)
├── data/           # Schéma IndexedDB, bibliothèque d'exercices, Supabase
├── hooks/          # Hooks React (thème, timer)
├── utils/          # Calculs (volume, 1RM, formatage)
├── theme/          # Générateur de thème Material Design 3
├── types/          # Interfaces TypeScript
└── i18n/           # Traductions FR / EN
android/            # Projet natif Android (Capacitor)
```

---

## Données locales

L'application utilise IndexedDB (via Dexie) avec les collections suivantes :

| Collection | Contenu |
|---|---|
| `exercises` | Exercices pré-chargés et personnalisés |
| `workoutSessions` | Séances enregistrées |
| `programs` | Programmes d'entraînement |
| `objectives` | Objectifs et progression |
| `bodyMeasurements` | Mensurations corporelles |
| `personalRecords` | Records personnels |
| `userSettings` | Préférences utilisateur |

---

## Informations

- **Version** : 0.2.x
- **ID application** : `com.karnet.app`
- **Langue par défaut** : Français
- **Licence** : Privée
