# Déploiement Production (DigitalOcean + Docker)

Objectif: déployer **frontend + backend** avec **Caddy** (HTTPS), **Redis**, et **PostgreSQL managé**.

## 1) Pré‑requis
- Un Droplet DigitalOcean (Ubuntu 22.04+)
- Domaine `appcoran.com` pointé vers l’IP du Droplet
- PostgreSQL managé (DO Managed DB)
- Accès SSH au serveur

## 2) DNS
Créer deux enregistrements A:
- `appcoran.com` → IP du Droplet
- `api.appcoran.com` → IP du Droplet

## 3) Préparer le serveur
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

## 4) Construire les images
Sur ta machine ou CI:
```bash
docker build -t appcoran-backend:latest /path/to/backend-appcoran
docker build -t appcoran-frontend:latest /path/to/frontend-appcoran
```

Puis pousse dans un registry (Docker Hub / DO Registry).

## 5) Déployer
Copier le dossier `deploy/production` sur le serveur, puis:
```bash
cp .env.prod.example .env.prod
```
Éditer `.env.prod` et mettre les vraies valeurs (DB, secrets).

Lancer:
```bash
docker compose -f docker-compose.prod.yml up -d
```

## 6) Vérifications
- Backend: `https://api.appcoran.com/health`
- Frontend: `https://appcoran.com`

## 7) Stockage (DigitalOcean Spaces)
Option recommandé: déplacer les uploads audio vers Spaces.
Implémentation future: adapter le backend pour S3 compatible.

## 8) Monitoring
Recommandé:
- UptimeRobot sur `/health`
- Logs centralisés (Loki / ELK)

### Monitoring local (Prometheus + Grafana)
Fichiers prêts dans `deploy/production/monitoring`:

```bash
cd deploy/production/monitoring
docker compose -f docker-compose.monitoring.yml up -d
```

Accès:
- Prometheus: `http://<SERVER_IP>:9090`
- Grafana: `http://<SERVER_IP>:3000`
