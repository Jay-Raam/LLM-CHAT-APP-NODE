# Nexus AI ✦ Full-Stack Conversational Intelligence Platform

[![CI](https://github.com/Jay-Raam/LLM-CHAT-APP-NODE/actions/workflows/ci.yml/badge.svg)](https://github.com/Jay-Raam/LLM-CHAT-APP-NODE/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socket.io)](https://socket.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb)](https://www.mongodb.com/)

A production-ready full-stack AI chat application with real-time streaming, JWT authentication with secure HTTP-only refresh tokens, multi-model OpenRouter integration, and server-proxied prompt suggestions.

---

## 🌟 Key Architecture Highlights

- **Full-Stack Monorepo**: Decoupled Express.js backend and modern Vite React frontend.
- **Real-Time Streaming**: Low-latency token streaming over Socket.IO and server-sent streaming channels.
- **Stateless & Secure Auth**: Dual-token JWT system (short-lived access tokens + HTTP-only rotation refresh tokens) with bcrypt password hashing and rate limiting via `express-rate-limit`.
- **Security-First API Proxy**: All third-party services (OpenRouter LLM, NewsData suggestions) are strictly proxied through the Express backend—no private API keys are ever leaked into the client bundle.
- **Observability & Safety**: Helmet security headers, Morgan request logging, and graceful offline fallback prompt suggestions.

---

## 🏗️ Repository Structure

```
LLM-CHAT-APP-NODE/
├── Backend/                 # Express.js API & Socket.IO Server
│   ├── src/
│   │   ├── config/          # Database, JWT & CORS configuration
│   │   ├── controllers/     # Auth, Chat, and AI prompt handlers
│   │   ├── middleware/      # JWT verification & rate limiters
│   │   ├── models/          # User, Conversation, Message schemas
│   │   ├── routes/          # Express API route definitions & news proxy
│   │   ├── services/        # OpenRouter AI & external integrations
│   │   ├── app.js           # Express app setup & middleware pipeline
│   │   ├── server.js        # Server bootstrap & MongoDB connection
│   │   └── socket.js        # Socket.IO connection & event handlers
│   └── package.json
│
├── frontend/                # React 18 + Vite Web Application
│   ├── src/
│   │   ├── api/             # Axios/fetch API clients (auth, chat, news proxy)
│   │   ├── components/      # UI components (Chat, Sidebar, Header)
│   │   ├── pages/           # Dashboard, Login, Register views
│   │   ├── store/           # Redux Toolkit state management
│   │   └── App.tsx          # Main routing & protected view gate
│   └── package.json
│
└── .github/workflows/ci.yml # Automated CI validation pipeline
```

---

## 🚀 Quickstart & Local Setup

### 1. Prerequisites
- Node.js `>= 18.x`
- MongoDB running locally or a MongoDB Atlas URI

### 2. Backend Setup
```bash
cd Backend
npm install
cp .env.example .env   # Configure PORT, MONGO_URI, JWT_SECRET, OPENROUTER_API_KEY
npm run dev
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
cp .env.example .env   # Configure VITE_API_BASE_URL (http://localhost:4000)
npm run dev
```

The frontend will run at `http://localhost:5173` and communicate with the backend on `http://localhost:4000`.

---

## 🔒 Security & Best Practices

- **Zero Client Token Leakage**: Private vendor API keys (`OPENROUTER_API_KEY`, `NEWSDATA_API_KEY`) reside purely on the backend.
- **Helmet Headers**: Protection against clickjacking, MIME-sniffing, and cross-site scripting.
- **Automated CI Validation**: Every push and PR is verified via GitHub Actions across both backend syntax and frontend production compilation.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
