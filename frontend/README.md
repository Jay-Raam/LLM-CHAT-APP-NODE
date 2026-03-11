# Nexus AI Frontend

React + Vite client application for chat, authentication, session history, realtime assistant updates, and mobile-friendly messaging UI.

## Stack

- React 19 + TypeScript
- Vite
- Redux Toolkit
- Tailwind CSS
- Socket.IO Client
- Axios

## Prerequisites

- Node.js 18+
- npm 9+

## Getting Started

```bash

cd frontend
npm install

```

Create `.env` from your own values:

```env

VITE_API_BASE_URL=http://localhost:4000/api/v1
VITE_SOCKET_URL=http://localhost:4000
VITE_NEWSDATA_API_KEY=your_newsdata_api_key

```

You can copy and edit the template:

```bash
cp .env.example .env
```

Run development server:

```bash

npm run dev

```

App runs on `http://localhost:5173` by default.

## Available Scripts

- `npm run dev` - start Vite dev server
- `npm run build` - production build
- `npm run preview` - preview production build locally
- `npm run lint` - TypeScript type-check (`tsc --noEmit`)

## Environment Variables

- `VITE_API_BASE_URL`: backend REST base URL
- `VITE_SOCKET_URL`: Socket.IO server origin
- `VITE_NEWSDATA_API_KEY`: NewsData API key for dashboard suggestions

## Features

- User authentication (login/register)
- Chat sessions and message history
- Assistant typing preview while response is pending
- Socket-based realtime assistant messages
- Session token usage indicator (approximate)
- Mobile-optimized chat layout
- News-powered prompt suggestions from NewsData (frontend only)

## News Suggestions

Dashboard suggestion cards fetch from:

- `https://newsdata.io/api/1/latest`

Applied filters:

- `country=in,cn,au,wo`
- `language=ta,en,ml`
- `category=technology,education,food,health,lifestyle`

When NewsData is unavailable or key is missing, fallback suggestions are shown.

## Project Structure

- `src/pages` - page components (`Dashboard`, `Login`, `Register`)
- `src/layouts` - app shell and sidebar
- `src/store` - Redux slices and store setup
- `src/api` - API clients (`auth`, `chat`, `ai`, `news`)
- `src/types` - shared TypeScript types

## Notes

- Frontend calls NewsData directly, not through backend.
- Ensure backend CORS allows `http://localhost:5173` during local development.
- Never commit `.env` with real secrets.
