# AppCoran — Frontend (guide très simple)

Bienvenue ! Ce guide explique **pas à pas** comment lancer l’interface web, même si vous débutez.

## 1) Ce que fait le frontend (en mots simples)
Le **frontend** est l’interface visible : pages, boutons, formulaires, lecture audio, etc.
Il parle avec le **backend** (le serveur) pour récupérer les récitations, se connecter, publier, etc.

Si le backend ne tourne pas, le frontend s’ouvre mais **les données n’apparaissent pas**.

## Formats audio supportés (upload)
Le formulaire d’upload accepte :
`mp3`, `mp4`, `m4a`, `ogg`, `wav`, `flac`, `aac`, `webm`

**Note mobile :** sur iOS/Android, l’enregistrement direct peut nécessiter **HTTPS**.  
Si l’enregistrement n’est pas supporté, l’upload reste disponible.

## 2) Petit glossaire (mots techniques expliqués)
- **Frontend** : la partie que vous voyez dans le navigateur.
- **Backend** : le serveur qui stocke et envoie les données.
- **API** : une “porte” du backend pour envoyer/recevoir des données.
- **.env** : un fichier de configuration (adresses, clés, options).
- **Port** : un numéro qui fait partie de l’adresse (ex. : `:5173`).
- **localhost** : votre propre ordinateur.
- **Build** : version “finale” plus stable, utilisée en production ou sur iPhone.

## 3) Prérequis (ce qu’il faut installer)
- **Node.js** (version 18+)
- **npm** (installé avec Node.js)

Vérifiez que c’est installé :
```bash
node -v
npm -v
```

## 4) Installation (première fois)
Depuis le dossier `frontend-appcoran` :
```bash
npm install
```

**Résultat attendu :** les dépendances s’installent sans erreur.

## 5) Configuration `.env`
Copiez le modèle :
```bash
cp .env.example .env
```

Puis ouvrez `.env` et renseignez :
- `VITE_API_BASE_URL` : l’adresse du backend (ex. : `http://localhost:4000`)
- `VITE_PUBLIC_APP_URL` : l’adresse du frontend (ex. : `http://localhost:5173`)
- `VITE_PUBLIC_BASE_URL` : souvent identique au backend

**Important :** si vous changez `.env`, **relancez** le frontend.

## 6) Démarrer en mode développement (PC)
```bash
npm run dev
```

Ouvrez : `http://localhost:5173`

**Résultat attendu :** la page d’accueil s’affiche avec le thème.

## 7) Mode production local (recommandé pour iPhone et mobile)
Le mode dev de Vite peut être instable sur iOS (styles qui disparaissent après rechargement).
Le mode production local est plus stable et garantit la connexion au backend via proxy.

1) Construire le frontend :
```bash
npm run build
```

2) Lancer le serveur Caddy (fourni) :
```bash
caddy run --config /home/hbelkassim/dev/isca/app-coran/frontend-appcoran/deploy/Caddyfile.local.prod
```

**Résultat attendu :** l’interface est stable après rechargement et les données backend se chargent.

## 8) Accès depuis téléphone (Android / iPhone)
Suivez le guide pas à pas ici :
- `frontend-appcoran/DEPLOYMENT_MOBILE.md`

Ce guide explique :
- comment garder le domaine `appcoran.com`
- comment configurer le DNS
- comment éviter les problèmes de style sur iPhone

## 9) Tests
```bash
npm run test
```

## 10) Développement vs production (important)
Si vous modifiez le code, vous avez **deux choix** :

### Option A — Mode dev (recommandé pour coder)
- Rechargement instantané
- Pas besoin de rebuild
```bash
npm run dev -- --host 0.0.0.0
```

### Option B — Mode prod local (stable mobile)
- Vous devez rebuild à chaque changement
```bash
npm run build
sudo caddy stop
sudo caddy run --config /home/hbelkassim/dev/isca/app-coran/frontend-appcoran/deploy/Caddyfile.local.prod
```

## 10) Dépannage rapide
- **Les données n’apparaissent pas** : vérifiez `VITE_API_BASE_URL` et que le backend tourne.
- **Styles manquants sur iPhone** : utilisez le build + Caddy (section 7).
- **Changement .env** : redémarrez le frontend.

## 11) Production et sécurité
- Guide sécurité : `frontend-appcoran/docs/SECURITY_PRODUCTION_GUIDE.md`
- Déploiement complet : `frontend-appcoran/deploy/production/README.md`
