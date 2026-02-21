# Web app for Imam's recitations

This is a code bundle for Web app for Imam's recitations. The original project is available at https://www.figma.com/design/LDkJH4ybNhOy0mH7yUuywa/Web-app-for-Imam-s-recitations.

## Configuration

Create a `.env` file based on `.env.example`:

- `VITE_API_BASE_URL` — URL of the backend API (Express server)
- `VITE_PUBLIC_APP_URL` — URL of the frontend app (used for share links)

## Streaming

Audio playback relies on the backend streaming endpoints. If an uploaded file
is not browser‑compatible, the backend converts it to MP3 for streaming.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Docker (Full Stack)

Use the compose file in this folder to run frontend and backend with custom domains.

1. Add local domain mapping (desktop only):

```
127.0.0.1 appcoran.com api.appcoran.com
```

2. Start from this folder:

```bash
docker compose up --build
```

3. Access:

```
Frontend: http://appcoran.com
Backend:  http://api.appcoran.com
```

## Access From Phone (Android / iOS) With appcoran.com

You can keep the domain **appcoran.com** on your phone using your router DNS
(recommended). This works on Android and iOS, no app install required.

### Recommended (Router DNS)
1. Find your PC IP (example: `192.168.1.25`).
2. In your router admin UI, add local DNS records:
   - `appcoran.com` → `192.168.1.25`
   - `api.appcoran.com` → `192.168.1.25`
3. Make sure your phone uses the router DNS (automatic is fine).
4. Open on phone: `http://appcoran.com`

### If Router Has No DNS (Optional dnsmasq)
You can run a lightweight DNS server on your PC and set it as the phone DNS.

1. Create a file `dnsmasq.conf`:

```conf
address=/appcoran.com/192.168.1.25
address=/api.appcoran.com/192.168.1.25
```

2. Run dnsmasq in Docker:

```bash
docker run -d --name appcoran-dns \
  -p 53:53/udp \
  -v "$PWD/dnsmasq.conf":/etc/dnsmasq.conf \
  --restart unless-stopped \
  andyshinn/dnsmasq:2.85
```

3. On the phone, set DNS manually to your PC IP.

### Notes
- Phone and PC must be on the **same Wi‑Fi network**.
- Keep `docker compose up --build` running.

## Installable (PWA)

Once running, open the app in a browser and choose “Install” to add it to your device.

## Tests

Run `npm run test` to execute the frontend tests.

## Security & Production
See `docs/SECURITY_PRODUCTION_GUIDE.md`

## Déploiement Production (DigitalOcean)
Voir `deploy/production/README.md`
