# Guide Production (Frontend)

## 1) Environnements
Utiliser `.env.production.example` et injecter via CI/CD.

Variables clés:
- `VITE_API_BASE_URL`
- `VITE_PUBLIC_APP_URL`
- `VITE_PUBLIC_BASE_URL`

## 2) Build & Serve
```bash
npm run build
```
Servir `dist/` via Nginx ou Caddy.

## 3) Cache & iOS
- `index.html` doit être servi avec `Cache-Control: no-store`.
- Éviter `background-attachment: fixed` sur iOS.

## 4) Sécurité
- Bloquer les origins via CORS côté backend.
- Toujours utiliser HTTPS.
