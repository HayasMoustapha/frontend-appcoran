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

1. Add local domain mapping:

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

## Installable (PWA)

Once running, open the app in a browser and choose “Install” to add it to your device.

## Tests

Run `npm run test` to execute the frontend tests.
