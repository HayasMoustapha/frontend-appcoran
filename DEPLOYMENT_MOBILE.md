# Mobile Access Guide (Android / iOS)

This guide explains how to access **appcoran.com** from your phone on the same Wi‑Fi network.

## 1) Requirements
- Phone and PC are on the **same Wi‑Fi**.
- Backend running on `http://0.0.0.0:4000`
- Frontend running on `http://0.0.0.0:5173`

Note: this guide is **without Docker**.

Make sure frontend env points to reachable addresses:
- If DNS is not configured, use IP:
  - `VITE_API_BASE_URL=http://192.168.1.179:4000`
  - `VITE_PUBLIC_APP_URL=http://192.168.1.179:5173`
  - `VITE_PUBLIC_BASE_URL=http://192.168.1.179:4000`
- If DNS is configured, use domains:
  - `VITE_API_BASE_URL=http://api.appcoran.com`
  - `VITE_PUBLIC_APP_URL=http://appcoran.com`
  - `VITE_PUBLIC_BASE_URL=http://api.appcoran.com`

## iPhone (style stable) - recommandé
Le mode `dev` de Vite peut provoquer des styles qui disparaissent lors d’un reload iOS.
Utilise le build de production pour une stabilité parfaite.

1) Build frontend
```bash
npm run build
```

2) Démarrer Caddy en mode production
```bash
caddy run --config /home/hbelkassim/dev/isca/app-coran/frontend-appcoran/deploy/Caddyfile.local.prod
```

3) Accès depuis l’iPhone
- `http://appcoran.com`

4) Si les données backend ne chargent pas
- Vérifie que `VITE_API_BASE_URL` pointe vers `http://api.appcoran.com`
- Rebuild obligatoire après modification de `.env`:
```bash
npm run build
```

5) Cache iOS
- Vider l’historique Safari ou ouvrir en navigation privée

## Configuration téléphone (DNS manuel)
Comme la HomeBox T30PLUS ne gère pas les hostnames locaux, il faut forcer le DNS sur chaque appareil.

### Android
1) Wi‑Fi → Modifier réseau → Options avancées  
2) DNS 1 : `192.168.1.179`  
3) DNS 2 : (laisser vide)

### iPhone
1) Wi‑Fi → (i) → Configurer DNS → Manuel  
2) Ajouter : `192.168.1.179`

### Vérification
Ouvrir :
- `http://api.appcoran.com/health`
- `http://appcoran.com`

## QR Code Wi‑Fi (optionnel)
Un script est fourni pour générer un QR Code Wi‑Fi (incluant DNS).

```bash
python3 /home/hbelkassim/dev/isca/app-coran/frontend-appcoran/deploy/generate_wifi_qr.py \
  --ssid "ISCAI 4G" \
  --password "VOTRE_MOT_DE_PASSE_WIFI" \
  --dns "192.168.1.179"
```

Le QR est généré ici :
`frontend-appcoran/deploy/wifi-setup.png`

## 2) Reverse proxy local (Caddy)
Use the local proxy config:
- `frontend-appcoran/deploy/Caddyfile.local`

Install prerequisites (Linux Mint 22.3):
```bash
sudo apt-get update
sudo apt-get install -y caddy dnsmasq
```

Run (frontend must listen on all interfaces):
```bash
caddy run --config /home/hbelkassim/dev/isca/app-coran/frontend-appcoran/deploy/Caddyfile.local
```

Note: if styles don’t load on phone, ensure Vite is started with:
```bash
npm run dev -- --host 0.0.0.0
```

### Script automatique (recommandé)
Un script est fourni pour tout configurer d’un coup (Caddy + dnsmasq).
```bash
sudo bash /home/hbelkassim/dev/isca/app-coran/frontend-appcoran/deploy/setup-local-domain.sh 192.168.1.50
```
Remplace `192.168.1.50` par l’IP de ton PC.

## 3) Recommended: Router DNS (Best Option)
This keeps the domain **appcoran.com** and **api.appcoran.com**.

1. Find your PC IP (example `192.168.1.25`).
2. Open your router admin interface.
3. Add local DNS entries:
   - `appcoran.com` → `192.168.1.25`
   - `api.appcoran.com` → `192.168.1.25`
4. On your phone, keep DNS on **Automatic**.
5. Open in phone browser:
   - `http://appcoran.com`

## 4) If Router DNS Is Not Available (dnsmasq)
You can run a local DNS server on the PC and set it on the phone.

1. Create a file `dnsmasq.conf` (same folder as this guide):

```conf
address=/appcoran.com/192.168.1.25
address=/api.appcoran.com/192.168.1.25
```

2. Install dnsmasq:

```bash
sudo apt-get install dnsmasq
```

3. Add the config to dnsmasq:
```bash
sudo cp dnsmasq.conf /etc/dnsmasq.d/appcoran.conf
sudo systemctl restart dnsmasq
```

4. Set your phone DNS to your PC IP (manual DNS).
5. Open: `http://appcoran.com`

## 5) Notes
- Keep backend + frontend running.
- If the phone can’t resolve the domain, check DNS settings or router cache.
