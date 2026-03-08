# Nexus AI Backend

Express + MongoDB backend for auth, chat sessions/messages, AI responses, and Socket.IO realtime events.

## Stack

- Node.js
- Express
- MongoDB + Mongoose
- JWT (access + refresh)
- Socket.IO

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB instance

## Getting Started

```bash

cd Backend
npm install

```

Create `Backend/.env`:

```env

PORT=4000
NODE_ENV=development

MONGO_URI=mongodb://127.0.0.1:27017/nexus_ai
JWT_SECRET=replace_with_strong_secret

FRONTEND_ORIGIN=http://localhost:5173

OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=gpt-4o-mini
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions

```

You can copy and edit the template:

```bash
cp .env.example .env
```

Run development server:

```bash

npm run dev

```

Production:

```bash

npm start
```

Default port is `4000`. If busy, server automatically tries the next ports.

## Available Scripts

- `npm run dev` - start with nodemon
- `npm start` - start with node

## Architecture

- Routes are modularized under `src/routes`
- `src/routes/index.js` aggregates route modules
- Controllers keep request handling logic
- Middleware enforces auth where needed

## API Base URL

`/api/v1`

## Endpoints

Auth:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`

Chat:

- `GET /api/v1/chat/sessions`
- `POST /api/v1/chat/messages`
- `GET /api/v1/chat/:id`
- `DELETE /api/v1/chat/session/:id`

AI:

- `POST /api/v1/ai/ask` (auth required)

## Realtime

- Socket.IO emits `newMessage` to connected clients.
- Assistant responses are persisted to the selected chat session when `sessionId` is sent.

## Directory Overview

- `src/app.js` - express app, middleware, route mounting
- `src/server.js` - HTTP server boot + Socket.IO init
- `src/routes` - route modules
- `src/controllers` - endpoint handlers
- `src/models` - Mongoose models
- `src/services` - AI and JWT services
- `src/middleware` - auth middleware

## Notes

- CORS is credential-enabled and restricted by `FRONTEND_ORIGIN`.
- Auth uses HTTP-only cookies and token verification middleware.
- AI requires a valid `OPENROUTER_API_KEY`.
- Never commit `.env` with real secrets.
