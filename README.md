# Nexus AI (Full Project)

Full-stack AI chat application with authentication, chat sessions, realtime assistant messages, mobile-friendly UI, and dynamic prompt suggestions.

## Project Structure

```text
New Chat AI/
  Backend/    # Express + MongoDB + Socket.IO API
  frontend/   # React + Vite client
```

## Tech Stack

Frontend:

- React 19 + TypeScript
- Vite
- Redux Toolkit
- Tailwind CSS
- Socket.IO Client

Backend:

- Node.js + Express
- MongoDB + Mongoose
- JWT auth (access/refresh)
- Socket.IO
- OpenRouter API integration

## Features

- Register/login/logout with protected routes
- Persistent chat sessions and message history
- AI response generation via backend
- Realtime assistant delivery through Socket.IO
- Session token usage indicator
- News-powered prompt suggestions
- Mobile-optimized chat interface

## Prerequisites

- Node.js 18+
- npm 9+
- MongoDB database
- OpenRouter API key
- NewsData API key (for suggestion cards)

## 1. Backend Setup

```bash

cd Backend
npm install

```

Create env file:

- Copy `Backend/.env.example` to `Backend/.env`
- Fill real values

Required backend env keys:

```env

PORT=4000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/nexus_ai
JWT_SECRET=replace_with_strong_secret
FRONTEND_ORIGIN=http://localhost:5173
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_MODEL=gpt-4o-mini
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions

```

Run backend:

```bash

npm run dev

```

Backend default URL: `http://localhost:4000`

## 2. Frontend Setup

```bash

cd ../frontend
npm install

```

Create env file:

- Copy `frontend/.env.example` to `frontend/.env`
- Fill real values

Required frontend env keys:

```env

VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
VITE_NEWSDATA_API_KEY=your_newsdata_api_key

```

Run frontend:

```bash

npm run dev

```

Frontend default URL: `http://localhost:5173`

## API Overview

Base path: `/api/v1`

Auth:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

Chat:

- `GET /chat/sessions`
- `POST /chat/messages`
- `GET /chat/:id`
- `DELETE /chat/session/:id`

AI:

- `POST /ai/ask` (auth required)

## Realtime

- Backend emits `newMessage` events via Socket.IO.
- Assistant responses are persisted to chat session when `sessionId` is provided.

## Prompt Suggestions Source

Dashboard suggestions use NewsData directly from frontend:

- Endpoint: `https://newsdata.io/api/1/latest`
- Filters:
  - `country=in,cn,au,wo`
  - `language=ta,en,ml`
  - `category=technology,education,food,health,lifestyle`

## Development Commands

Backend (`Backend` folder):

- `npm run dev`
- `npm start`

Frontend (`frontend` folder):

- `npm run dev`
- `npm run build`
- `npm run preview`
- `npm run lint`

## Security Notes

- Do not commit `.env` files with real secrets.
- Rotate secrets immediately if they are ever exposed.
- Keep only placeholder values in `*.env.example`.

## Additional Docs

- Backend details: `Backend/README.md`
- Frontend details: `frontend/README.md`
