# Guide Sécurité & Production — Frontend (version simple)

Ce document explique **quoi faire**, **pourquoi**, **comment**, et **le résultat attendu**.

## 1) Pourquoi ce guide ?
En production, on veut :
- Un site rapide et stable
- Des données protégées
- Un comportement fiable sur mobile et ordinateur

## 2) Mots techniques expliqués
- **Production** : version finale utilisée par les vrais utilisateurs.
- **Build** : compilation du site pour le rendre rapide.
- **HTTPS** : version sécurisée du site (cadenas 🔒).
- **CORS** : règle qui dit quels sites peuvent appeler l’API.

## 3) Configuration recommandée
Créer un fichier `.env` (ou `.env.production`) avec :
- `VITE_API_BASE_URL` : l’adresse du backend
- `VITE_PUBLIC_APP_URL` : l’adresse du frontend
- `VITE_PUBLIC_BASE_URL` : souvent identique au backend

**Résultat attendu :** le frontend parle au bon backend.

## 4) Build propre (obligatoire en production)
```bash
npm run build
```

**Résultat attendu :** un dossier `dist/` prêt à servir.

## 5) Servir `dist/` correctement
Le fichier `index.html` doit être **toujours frais**.
Pourquoi ? Parce que c’est lui qui indique les bons fichiers CSS/JS.

Dans Caddy/Nginx, il faut :
- `Cache-Control: no-store` pour `index.html`
- cache normal pour les assets (css/js)

**Résultat attendu :** plus de “styles qui disparaissent” après rechargement (surtout iOS).

## 6) Sécurité côté frontend (bonnes pratiques)
- Ne mettez jamais de mot de passe en dur dans le code.
- Ne stockez pas de secrets dans le frontend.
- Utilisez toujours le backend pour les actions sensibles.

## 7) Sécurité côté backend (rappel)
Le backend doit :
- Limiter les origines avec **CORS**
- Utiliser des tokens JWT sécurisés
- Utiliser HTTPS

**Résultat attendu :** le frontend reste simple, la sécurité est gérée côté serveur.
