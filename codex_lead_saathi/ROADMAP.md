# Lead Saathi Roadmap

## Short answer

Yes, this is fully possible:

- Frontend
- Node.js backend for API integration
- Sarvam AI for voice
- MongoDB Atlas for storage

This is a solid MVP stack and does **not** have major drawbacks if you keep one rule:

**Sarvam must be called only from the backend, never from the frontend.**

---

## Final architecture

```text
Frontend (React / Next.js / plain JS)
        |
        v
Node.js API (Express / Fastify)
        |
        +--> MongoDB Atlas
        |
        +--> Sarvam AI APIs
```

### What each layer should do

- Frontend
  - user login or session handling
  - forms and dashboard
  - microphone recording
  - audio playback
  - calling your Node.js API

- Node.js backend
  - validate requests
  - store and fetch data from MongoDB
  - call Sarvam APIs securely
  - convert audio/text payloads
  - handle retries, errors, and logging

- MongoDB
  - users
  - profiles
  - sessions
  - transcripts
  - AI request history
  - task records / app records / lead records
  - audio metadata

- Sarvam AI
  - speech to text
  - text to speech
  - optional translation / language detection later

---

## Biggest decision

Do **not** let the missing Sarvam API key block the whole project.

Build the project in 2 layers:

1. Core product flow without Sarvam
2. Plug Sarvam into a voice service wrapper as soon as the key is available

That means your app keeps moving even if Sarvam dashboard access is delayed.

---

## Best solution for the Sarvam API key issue

### What the official docs say

Sarvam requires you to manually create an API key from the dashboard and use it as an `api-subscription-key` header. Their docs also point developers to Discord and `developer@sarvam.ai` for support if there are platform issues.

### Practical plan

- Build a `voiceProvider` abstraction in Node.js
- Add 2 modes:
  - `sarvam`
  - `mock`
- Default to `mock` until the key is working

### In `mock` mode

- frontend can still record audio
- backend can accept audio uploads
- backend stores file metadata and placeholder transcript
- you can also allow manual text input for demo continuity
- UI and DB flow get completed now

### When the Sarvam key starts working

- add `SARVAM_API_KEY` in backend env
- switch provider from `mock` to `sarvam`
- keep the same frontend and backend route contracts

This is the cleanest approach because it removes rework.

---

## Recommended roadmap

## Phase 1: Frontend foundation

Goal: complete UI and user flow first.

### Build screens

- landing page
- user form / onboarding page
- dashboard
- record voice button
- transcript view
- response audio player
- history page

### Frontend responsibilities

- capture mic audio
- send audio to backend
- show transcript
- show generated response
- play returned audio
- show loading and failure states

### Output of Phase 1

- fully clickable product UI
- dummy data support
- no backend dependency for basic UI progress

---

## Phase 2: Node.js backend foundation

Goal: create one clean API layer for everything.

### Recommended backend stack

- Node.js
- Express
- Mongoose
- Multer for audio upload
- dotenv
- cors
- axios or built-in `fetch`

### Suggested backend folders

```text
backend/
  src/
    config/
    controllers/
    routes/
    models/
    services/
      voice/
        sarvamProvider.js
        mockProvider.js
        index.js
    middleware/
    utils/
    app.js
    server.js
```

### First backend routes

- `POST /api/voice/transcribe`
- `POST /api/voice/respond`
- `POST /api/voice/text-to-speech`
- `POST /api/leads`
- `GET /api/leads`
- `GET /api/history/:userId`

---

## Phase 3: MongoDB storage

Goal: make MongoDB the main source of truth.

### Use MongoDB Atlas Free first

Good for MVP, demos, and hackathons.

### Important free-tier limits from MongoDB docs

- max total data storage: `0.5 GB`
- max connections: `500`
- one free cluster per project

### Collections to create first

- `users`
- `profiles`
- `voice_sessions`
- `transcripts`
- `ai_responses`
- `leads`

### What to store

- user basic info
- captured form data
- transcript text
- Sarvam request id
- AI output text
- generated audio metadata
- timestamps and status

### Important advice

Use MongoDB for:

- structured app data
- transcripts
- response text
- voice metadata

Avoid storing long raw audio files directly in MongoDB on day one.

For MVP:

- keep short temp files on backend disk during processing
- store only path / status / duration / request id in MongoDB

If later needed:

- use GridFS
- or add object storage later

---

## Phase 4: Sarvam AI integration

Goal: add real voice capability without changing product structure.

### Install

Use Sarvam's JavaScript SDK or call their REST APIs from Node.js.

### Backend-only integration

- `SARVAM_API_KEY` stays only in backend `.env`
- frontend never sees the secret

### Sarvam features to integrate first

1. Speech to text
2. Text to speech

### Keep version 1 simple

- user records voice
- backend sends audio to Sarvam STT
- backend gets transcript
- backend creates response text
- backend sends response text to Sarvam TTS
- frontend receives audio and transcript

### Best MVP voice flow

```text
User speech
-> frontend records audio
-> backend upload route
-> Sarvam STT
-> backend business logic
-> Sarvam TTS
-> frontend playback
```

### If API key still does not generate

Do this immediately:

- complete all backend routes with `mockProvider`
- add one env flag like `VOICE_PROVIDER=mock`
- let demo continue with:
  - typed text input
  - placeholder transcript
  - pre-generated sample audio

Then raise the Sarvam issue through:

- Sarvam Discord
- `developer@sarvam.ai`

---

## Phase 5: Integration sequence

Follow this exact order:

1. Finish frontend UI with dummy responses
2. Build Node.js backend routes
3. Connect MongoDB Atlas
4. Save all form and transcript data in MongoDB
5. Add audio upload endpoint
6. Add `mockProvider`
7. Connect frontend to real backend
8. Add Sarvam STT
9. Add Sarvam TTS
10. Test complete voice flow
11. Add logs, retries, and error handling

This order is important because it avoids getting blocked by Sarvam access.

---

## Minimum viable database schema

### `users`

- `name`
- `phone`
- `email`
- `language`
- `createdAt`

### `voice_sessions`

- `userId`
- `status`
- `startedAt`
- `endedAt`

### `transcripts`

- `sessionId`
- `source`
- `transcriptText`
- `languageCode`
- `provider`
- `requestId`
- `createdAt`

### `ai_responses`

- `sessionId`
- `inputText`
- `responseText`
- `audioUrlOrPath`
- `provider`
- `createdAt`

### `leads`

- `userId`
- `category`
- `summary`
- `status`
- `notes`
- `createdAt`

---

## What can go wrong and how to avoid it

### 1. Sarvam key delay

Fix:

- use provider wrapper
- keep `mock` fallback
- do not hardcode Sarvam into route handlers

### 2. MongoDB free tier limits

Fix:

- store text and metadata, not heavy media
- keep audio temporary
- archive old records if needed

### 3. Audio upload bugs

Fix:

- accept only supported file formats
- validate size and mime type
- keep upload size small for MVP

### 4. Slow response time

Fix:

- show loading state
- process STT and TTS as separate steps
- save every stage in DB so retries are easy

### 5. API key exposure

Fix:

- backend only
- environment variables only
- never put Sarvam key in frontend code

---

## Recommended env variables

```env
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
VOICE_PROVIDER=mock
SARVAM_API_KEY=
CLIENT_URL=http://localhost:3000
```

Later change:

```env
VOICE_PROVIDER=sarvam
SARVAM_API_KEY=your_real_key
```

---

## Best project strategy for you

If your main target is to finish this without major drawbacks, use this exact priority:

1. Frontend complete
2. Node.js API complete
3. MongoDB integration complete
4. Voice provider wrapper complete
5. Sarvam real integration last

This is the safest route because only step 5 depends on external platform access.

---

## Final recommendation

Yes, your proposed stack is correct and practical:

- Frontend
- Node.js backend
- Sarvam AI for voice
- MongoDB Atlas for storage

It is a good architecture for an MVP and hackathon build.

The only thing I would change is this:

**Do not make Sarvam a hard blocker. Make it a pluggable backend service.**

That single decision will save the project if the key generation issue continues.
