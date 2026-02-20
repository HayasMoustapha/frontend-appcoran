# Documentation Frontend — AppCoran

Cette documentation est la référence complète du frontend basé uniquement sur le code actuel. Elle est structurée pour permettre à un débutant de reconstruire l’interface et les fonctionnalités sans ambiguïté.

## 1. Vue d’ensemble
- Application web de récitations coraniques.
- Frontend Vite + React + MUI + React Router + i18next.
- Thème “Nuit céleste” avec animations Three.js et motifs SVG.
- Lecture audio persistante avec MiniPlayer déplaçable.

## 2. Structure du projet
Racine frontend: `frontend-appcoran/`

Chemins principaux:
- `src/main.tsx` — point d’entrée React.
- `src/app/App.tsx` — thème global, VisualLayers, Router.
- `src/app/routes.tsx` — routes applicatives.
- `src/app/components/` — composants partagés.
- `src/app/pages/` — pages (Home, Player, Record, Dashboard, Login, Profile).
- `src/app/api/` — client HTTP et endpoints.
- `src/app/i18n/` — traduction FR/EN/AR.
- `src/styles/` — CSS global, variables et polices.

## 3. Démarrage rapide (reproduire à zéro)
1. Créer un projet Vite React TypeScript.
2. Installer les dépendances:
```
npm i @mui/material @mui/icons-material @emotion/react @emotion/styled
npm i react-router react-router-dom i18next react-i18next
npm i three
```
3. Ajouter la structure de dossiers `src/app`, `src/styles`.
4. Créer `src/main.tsx` et monter `App`.
5. Importer `styles/index.css`.
6. Créer le thème global dans `src/app/App.tsx`.
7. Ajouter `RouterProvider` et routes.
8. Ajouter `AudioPlayerProvider` pour lecture persistante.
9. Ajouter `VisualLayers` pour le fond animé.
10. Implémenter les pages une par une.

## 4. Charte graphique et thème
Fichiers:
- `src/app/App.tsx`
- `src/styles/theme.css`
- `src/styles/fonts.css`

Palette principale (extraits):
- Fond principal: `#0B1F2A`
- Or: `#D4AF37`
- Vert sarcelle: `#0F766E`
- Texte clair: `#F8F6F1`
- Texte secondaire: `rgba(248,246,241,0.7)`

Variables CSS:
- `--app-bg` et `--app-pattern` pour le fond.
- `--primary`, `--secondary`, `--border`, `--muted` pour la cohérence visuelle.

Typographies:
- Corps: `Source Serif 4` → `--font-body`
- Titres: `Cormorant Garamond` → `--font-display`
- Arabe: `Amiri` + `Noto Naskh Arabic` → `--font-arabic`

Mode Nuit:
- Toggle via `Navbar` (classe `body.night-mode`).
- Modifie gradients et pattern dans `theme.css`.

## 5. Architecture des pages
Routes définies dans `src/app/routes.tsx`:
- `/` → `HomePage`
- `/login` → `LoginPage`
- `/recitation/:id` → `RecitationPlayer`
- `/record` → `RecordPage`
- `/dashboard` → `DashboardPage`
- `/profile` → `ImamProfilePage`

`AppShell`:
- Contient `Outlet` + `MiniPlayer`.
- Garantit que le MiniPlayer est toujours dans le contexte Router.

## 6. Animations et Three.js
Fichier clé: `src/app/components/VisualLayers.tsx`

Contenu:
- Three.js (canvas plein écran).
- Nuage d’étoiles (`PointsMaterial`) animé en rotation.
- Dunes en wireframe (`PlaneGeometry`) animées par sinusoïdes.
- SVG pattern d’arabesques en fond.
- Calligraphies flottantes (CSS `@keyframes floatY`).
- Watermark “HBM” aux bords, masqué au centre (mask radial).

Animations CSS (dans `theme.css`):
- `floatY` pour flottement vertical.
- `fadeUp` pour apparition douce.
- `glowPulse` pour halo lumineux.
- `starDrift` pour mouvement du ciel étoilé.
- `shimmer` pour gradient en mouvement.

Intégration:
- `VisualLayers` est injecté dans `App.tsx`.
- Le canvas est fixe avec `zIndex: 0` et `pointerEvents: none`.

## 7. Couche audio (lecture persistante)
Fichier clé: `src/app/components/AudioPlayerProvider.tsx`

Rôle:
- Centralise un `<audio>` unique.
- Conserve la lecture entre les pages.
- Expose l’état via un context.

Fonctionnalités:
- Play/pause, seek, volume.
- Playlist globale.
- Modes de lecture:
  - `sequence` (par défaut).
  - `repeat-all`.
  - `repeat-one`.
  - `shuffle`.
- Arrêt automatique:
  - Si `sequence` et fin de playlist → stop et mini-player disparaît.

Extrait clé:
```tsx
const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("sequence");
```

## 8. MiniPlayer
Fichier clé: `src/app/components/MiniPlayer.tsx`

Caractéristiques:
- Visible uniquement hors page `/recitation/:id`.
- Déplaçable (drag fluide, sans sélection de texte).
- Redimensionnable via poignée en bas-droite.
- Compact, discret, avec progression.
- Boutons: prev / play-pause / next / mode.

## 9. RecitationPlayer
Fichier clé: `src/app/pages/RecitationPlayer.tsx`

Fonctionnalités:
- Lecture audio via `AudioPlayerProvider`.
- Contrôles complets (play/pause, seek, volume, next/prev).
- Mode de lecture (icône cycle).
- Partage, téléchargement.
- Gestion conversion (badge).
- MediaSession API (lockscreen controls).

## 10. HomePage
Fichier clé: `src/app/pages/HomePage.tsx`

Fonctionnalités:
- Héros + statistiques (écoutes, téléchargements).
- Recherche intelligente (sourate, numéro, titre).
- Tabs (Tous, Récent, Populaire).
- Affichage en mode cartes ou liste.
- Carousel “constellations” sans doublons.

## 11. RecordPage
Fichier clé: `src/app/pages/RecordPage.tsx`

Fonctionnalités:
- Formulaire de création audio.
- Sélection sourate + versets dynamique.
- Upload MP3/MP4/OGG.
- Option basmala.

## 12. DashboardPage
Fichier clé: `src/app/pages/DashboardPage.tsx`

Fonctionnalités:
- Statistiques globales.
- Table de récitations.
- Actions CRUD.
- Graphiques (chart component).

## 13. Internationalisation (i18n)
Fichier clé: `src/app/i18n/index.ts`

Langues:
- Français, Anglais, Arabe.
- Direction RTL pour arabe.
- Nombres localisés via `formatNumber`.

## 14. Exemples de code (points clés)
Mode lecture:
```tsx
cyclePlaybackMode();
```

MiniPlayer conditionnel:
```tsx
if (!currentRecitation || isPlayerPage) return null;
```

## 15. Prompts IA (exemples)
Prompt UI:
```
Crée une card MUI dans le thème Nuit Céleste (#0B1F2A) avec bordures translucides,
texte clair, accent or (#D4AF37) et animation de survol douce.
```

Prompt Audio:
```
Implémente un MiniPlayer persistant dans React avec contrôles play/pause, next, previous,
mode de lecture (sequence, repeat, shuffle) et un design discret compatible RTL.
```

Prompt Three.js:
```
Ajoute un fond Three.js avec étoiles en points lumineux et dunes wireframe animées.
Le canvas doit être fixé en arrière-plan et non interactif.
```

## 16. Checklist reproduction complète
- Thème global MUI + variables CSS.
- i18n + RTL.
- VisualLayers (Three.js + SVG).
- Pages + routes.
- API client + mappers.
- AudioPlayerProvider + MiniPlayer.
- Tests (Vitest).

Fin de documentation.
