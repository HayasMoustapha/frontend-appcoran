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

## Tests

Run `npm run test` to execute the frontend tests.
