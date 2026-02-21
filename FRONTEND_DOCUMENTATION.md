# Documentation Frontend — AppCoran (version débutant)

Ce document explique **comment le frontend fonctionne**, **pourquoi il est organisé ainsi**, et **comment le reconstruire** pas à pas.

> Objectif : qu’un débutant puisse comprendre et relancer l’interface sans assistance.

---

## 1) Vue d’ensemble (en mots simples)
- Le frontend est une application web (React + Vite).
- Il affiche les récitations, le lecteur audio et les pages admin.
- Il communique avec un serveur (backend) via une API.

### Ce que l’utilisateur final voit
- Page d’accueil avec recherche, tabs et carrousel.
- Page de lecture complète.
- MiniPlayer qui reste visible en dehors de la page de lecture.
- Pages admin : login, dashboard, profil, enregistrement.

---

## 2) Glossaire rapide
- **React** : librairie pour créer des interfaces.
- **Vite** : outil qui lance l’app en dev et construit la version finale.
- **MUI** : bibliothèque de composants (boutons, cards…)
- **i18n** : traduction (français, anglais, arabe).
- **RTL** : affichage de droite à gauche (arabe).

---

## 3) Structure du projet (où est quoi)
Dossier racine : `frontend-appcoran/`

- `src/main.tsx` : point d’entrée de l’app.
- `src/app/App.tsx` : thème global + routes + couches visuelles.
- `src/app/routes.tsx` : définition des pages (routes).
- `src/app/pages/` : pages complètes (Home, Player, Record…).
- `src/app/components/` : composants réutilisables (Navbar, MiniPlayer…).
- `src/app/api/` : appels au backend.
- `src/app/i18n/` : traductions FR / EN / AR.
- `src/styles/` : CSS global (thème, polices).

**Résultat attendu :** on sait où modifier chaque partie.

---

## 4) Charte graphique (thème Nuit Céleste)
Objectif : un style islamique moderne, lisible et cohérent.

### Couleurs principales
- Fond principal : `#0B1F2A`
- Or (accent) : `#D4AF37`
- Texte clair : `#F8F6F1`

### Polices
- Titres : `Cormorant Garamond`
- Texte : `Source Serif 4`
- Arabe : `Amiri` / `Noto Naskh Arabic`

### Où c’est défini
- `src/styles/theme.css`
- `src/styles/fonts.css`

**Résultat attendu :** chaque page respecte le même style.

---

## 5) Routes principales
Définies dans `src/app/routes.tsx` :
- `/` → HomePage
- `/login` → LoginPage
- `/recitation/:id` → RecitationPlayer
- `/record` → RecordPage
- `/dashboard` → DashboardPage
- `/profile` → ImamProfilePage

**Résultat attendu :** chaque lien mène à la bonne page.

---

## 6) Lecture audio (logique centrale)
Le cœur audio est géré par un **AudioPlayerProvider**.

### Pourquoi un Provider ?
- La lecture continue même si l’utilisateur change de page.
- Un seul “player” pour toute l’app.

### Modes de lecture
- `sequence` (par défaut)
- `repeat-all`
- `repeat-one`
- `shuffle`

**Résultat attendu :** lecture fluide et continue.

---

## 7) MiniPlayer
- Visible uniquement hors page de lecture.
- Toujours synchronisé avec l’audio en cours.
- Boutons : play/pause, prev, next, mode.

**Résultat attendu :** le mini‑player reflète la récitation en cours.

---

## 8) Page d’accueil (HomePage)
- Barre de recherche intelligente.
- Tabs : Toutes / Récentes / Populaires.
- Carrousel “constellations”.
- Cartes de récitations avec action rapide.

**Résultat attendu :** navigation rapide et claire.

---

## 9) Page d’enregistrement (RecordPage)
- Formulaire complet.
- Sélection de sourate + versets.
- Upload ou enregistrement direct.
- Option basmala.

**Résultat attendu :** création d’une récitation sans erreur.

---

## 10) Internationalisation (FR / EN / AR)
- Fichier principal : `src/app/i18n/index.ts`
- Le texte est traduit automatiquement.
- En arabe, l’interface passe en **RTL**.

**Résultat attendu :** 100% du texte s’adapte à la langue choisie.

---

## 11) Reproduire l’interface (pas à pas)
1) Créer un projet Vite React.
2) Installer MUI, React Router, i18next, Three.js.
3) Créer la structure `src/app` et `src/styles`.
4) Ajouter le thème global et les variables CSS.
5) Créer les pages principales.
6) Ajouter le provider audio + mini‑player.
7) Ajouter les routes.
8) Connecter l’API (backend).

**Résultat attendu :** une app identique au projet actuel.

---

## 12) Conseils simples pour éviter les bugs
- Ne jamais changer l’ordre des hooks React.
- Toujours vérifier que les données existent avant de les afficher.
- Ne pas mettre de logique complexe directement dans le JSX.

---

## 13) Prompts IA utiles (exemples)
**Pour une carte de récitation :**
```
Crée une carte MUI dans un thème nuit céleste, fond sombre, texte clair,
accent or, hover doux, et un bouton play discret.
```

**Pour le mini-player :**
```
Implémente un mini-player React persistant avec play/pause, next/prev,
progression et mode de lecture. Design discret et compatible RTL.
```

---

Fin de la documentation.
