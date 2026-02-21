# Déploiement Production (guide très simple)

Ce guide explique comment mettre **frontend + backend** en production avec Docker.
Il est écrit **pour débutants**, avec le **pourquoi**, le **comment** et le **résultat attendu**.

## 1) À quoi sert ce dossier ?
Il contient tout ce qu’il faut pour lancer l’application en production :
- un reverse‑proxy (Caddy)
- le frontend
- le backend
- Redis (file d’attente audio)

## 2) Mots techniques expliqués
- **Domaine** : adresse du site (ex. : `appcoran.com`).
- **DNS** : système qui relie un domaine à une IP.
- **Docker** : outil qui “emballe” une app pour la lancer facilement.
- **Reverse‑proxy** : un serveur qui route les requêtes (Caddy/Nginx).

## 3) Ce qu’il faut AVANT
- Un serveur Linux (ex. : DigitalOcean, Ubuntu 22.04+).
- Un nom de domaine pointé vers l’IP du serveur.
- Une base PostgreSQL (managée ou locale).

## 4) Étape DNS (obligatoire)
Dans votre registrar DNS, **créez** :
- `appcoran.com` → IP du serveur
- `api.appcoran.com` → IP du serveur

**Résultat attendu :** quand vous tapez ces domaines, ils arrivent sur votre serveur.

## 5) Installer Docker sur le serveur
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

**Résultat attendu :** `docker version` fonctionne.

## 6) Préparer le fichier d’environnement
Copier puis remplir :
```bash
cp .env.prod.example .env.prod
```

Dans `.env.prod`, renseignez :
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`…
- `JWT_SECRET` (mot de passe secret)
- `CORS_ORIGIN=https://appcoran.com`

**Résultat attendu :** le backend démarre avec la bonne configuration.

## 7) Lancer la production
Depuis ce dossier :
```bash
docker compose -f docker-compose.prod.yml up -d
```

**Résultat attendu :** tous les services démarrent.

**Si le build backend échoue sur `npm ci --omit=dev` :**  
Vérifiez que l’image backend installe les outils de compilation (`python3`, `make`, `g++`) avant `npm ci`.

## 8) Vérifier que tout fonctionne
- Backend : `https://api.appcoran.com/health`
- Frontend : `https://appcoran.com`

**Résultat attendu :**
- `/health` renvoie `{"status":"ok"}`
- Le site s’affiche correctement

## 9) Monitoring (optionnel mais recommandé)
Un dossier `monitoring/` est prêt pour Prometheus + Grafana.
```bash
cd monitoring
docker compose -f docker-compose.monitoring.yml up -d
```

Accès :
- Prometheus : `http://<IP>:9090`
- Grafana : `http://<IP>:3000`

## 10) Dépannage rapide
- **Page blanche** : vérifiez que le backend est en ligne.
- **CSS manquant** : assurez-vous que Caddy sert `index.html` sans cache.
- **Pas de données** : vérifiez `CORS_ORIGIN` et l’URL de l’API.
- **Upload audio** : formats supportés `mp3`, `mp4`, `m4a`, `ogg`, `wav`, `flac`, `aac`, `webm`.
