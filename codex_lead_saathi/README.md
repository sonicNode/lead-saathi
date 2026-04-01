# Lead Saathi

Lead Saathi is scaffolded as a full-stack MVP with:

- `frontend`: React + Vite
- `backend`: Node.js + Express
- MongoDB Atlas for persistence
- Sarvam AI integration behind a provider wrapper

## Project structure

```text
frontend/   React client
backend/    Express API, MongoDB models, voice providers
ROADMAP.md  delivery roadmap
```

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Copy environment templates:

```bash
copy backend\\.env.example backend\\.env
copy frontend\\.env.example frontend\\.env
```

3. Start the project:

```bash
npm run dev
```

## Backend environment

See [backend/.env.example](C:\Users\ankit\Desktop\programme\hack%20a%20war%20ecell\lead%20saathi\codex_lead_saathi\backend\.env.example).

## Frontend environment

See [frontend/.env.example](C:\Users\ankit\Desktop\programme\hack%20a%20war%20ecell\lead%20saathi\codex_lead_saathi\frontend\.env.example).

## Notes

- The backend runs with `VOICE_PROVIDER=mock` until Sarvam credentials are available.
- If `MONGODB_URI` is not set, the backend falls back to in-memory storage for local development.
- Sarvam API keys should only be placed in the backend env file.

