# Déploiement VPS (Ubuntu 22.04) — Frontend + NGINX

Ce guide déploie le frontend statique **sans modifier le design**.
Il explique **pourquoi**, **comment**, et **le résultat attendu**.

## 1) Pré‑requis
- Ubuntu 22.04
- Le backend tourne déjà sur `127.0.0.1:4000` (PM2)
- Domaine `appcoran.com` et `api.appcoran.com` pointés vers l’IP du VPS

## 2) Installer NGINX + Brotli
```bash
sudo apt-get update
sudo apt-get install -y nginx
sudo apt-get install -y libnginx-mod-brotli
```

**Résultat attendu :** `nginx -v` fonctionne.

## 3) Déployer le frontend
```bash
sudo mkdir -p /var/www/appcoran
sudo chown -R $USER:$USER /var/www/appcoran
cd /var/www/appcoran
git clone <URL_FRONTEND> frontend
cd frontend
cp .env.production.example .env.production
```

**Dans `.env.production`**, renseigne :
- `VITE_API_BASE_URL=https://api.appcoran.com`
- `VITE_PUBLIC_APP_URL=https://appcoran.com`
- `VITE_PUBLIC_BASE_URL=https://api.appcoran.com`

Build :
```bash
npm ci
npm run build
```

**Résultat attendu :** le dossier `dist/` existe.

## 4) Configurer NGINX
Copie la config fournie :
```bash
sudo cp /var/www/appcoran/frontend/deploy/vps/nginx.appcoran.conf /etc/nginx/sites-available/appcoran.conf
sudo ln -s /etc/nginx/sites-available/appcoran.conf /etc/nginx/sites-enabled/appcoran.conf
sudo nginx -t
sudo systemctl reload nginx
```

**Résultat attendu :** NGINX reload sans erreur.

## 5) HTTPS (Let’s Encrypt)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d appcoran.com -d api.appcoran.com
```

**Résultat attendu :** HTTPS actif sur les 2 domaines.

## 6) Test rapide
```bash
curl -i https://api.appcoran.com/health
```

Le frontend doit charger et récupérer les données sans erreur CORS.

## 7) Optimisations NGINX incluses
- HTTP/2 (via Let’s Encrypt)
- GZIP + Brotli
- Cache des assets `/assets/`
- Headers sécurité (X-Frame-Options, nosniff, etc.)

## 8) Dépannage
- **502** : backend down → `pm2 status`
- **CORS** : vérifier `.env.production` côté backend + NGINX
- **CSS manquant** : vérifier `dist/` et `root` NGINX
