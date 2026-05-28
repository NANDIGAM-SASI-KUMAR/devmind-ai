# 🧠 DevMind — AI-Powered Developer Assistant

A full-stack MERN platform where multiple AI agents (Planner, Coder, Debugger, Docs) collaborate to help developers plan, build, and debug software projects.

![Stack](https://img.shields.io/badge/stack-MERN-blueviolet) ![AI](https://img.shields.io/badge/AI-Claude%20%2F%20OpenAI-orange) ![Auth](https://img.shields.io/badge/auth-JWT-green)

## ✨ Features

- 🔐 **JWT Authentication** — Secure signup/login with bcrypt password hashing
- 🤖 **Multi-Agent AI System** — 4 specialized agents working together
  - **Planner Agent** — Breaks down ideas into tasks and milestones
  - **Coder Agent** — Generates code, components, and APIs
  - **Debugger Agent** — Analyzes errors and suggests fixes
  - **Docs Agent** — Writes README files and code documentation
- 💬 **Real-time Streaming** — Agent responses stream live with Server-Sent Events
- 📁 **Project Workspaces** — Save and resume conversations per project
- 🎨 **Modern UI** — Dark, developer-focused design inspired by Linear & Vercel
- 📊 **Conversation History** — Full message history saved to MongoDB

## 🏗️ Tech Stack

**Frontend:** React 18 · Vite · Tailwind CSS · React Router · Axios · Lucide Icons
**Backend:** Node.js · Express · MongoDB · Mongoose · JWT · bcrypt
**AI:** Anthropic Claude API (works with OpenAI too — just swap the SDK)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (free tier: https://www.mongodb.com/atlas)
- Anthropic API key (https://console.anthropic.com) OR OpenAI key

### 1. Clone & install

```bash
# Install backend
cd server
npm install

# Install frontend
cd ../client
npm install
```

### 2. Configure environment variables

**Backend (`server/.env`):**
```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/devmind
JWT_SECRET=your-super-secret-key-change-this
ANTHROPIC_API_KEY=sk-ant-xxxxx
CLIENT_URL=http://localhost:5173
```

**Frontend (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run the app

**Terminal 1 — Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd client
npm run dev
```

Open http://localhost:5173 🎉

## 📁 Project Structure

```
devmind-ai/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── components/      # UI components (auth, chat, dashboard)
│   │   ├── pages/           # Route pages
│   │   ├── context/         # Auth context
│   │   ├── api/             # Axios API calls
│   │   └── utils/           # Helpers
│   └── package.json
│
└── server/                  # Express + MongoDB backend
    ├── src/
    │   ├── routes/          # API routes
    │   ├── controllers/     # Business logic
    │   ├── models/          # Mongoose schemas
    │   ├── agents/          # ⭐ AI agent system
    │   │   ├── orchestrator.js
    │   │   ├── plannerAgent.js
    │   │   ├── coderAgent.js
    │   │   ├── debuggerAgent.js
    │   │   └── docsAgent.js
    │   ├── middleware/      # Auth + error handling
    │   └── server.js
    └── package.json
```

## 🎯 How the Agents Work

1. User sends a message in the chat
2. The **Orchestrator** analyzes the intent and routes it to the right agent
3. The chosen agent processes the request (may call tools or other agents)
4. The response streams back to the UI in real time
5. Full conversation is saved to MongoDB under the project

## 🌐 Deployment

- **Frontend** → Vercel / Netlify
- **Backend** → Render / Railway / Fly.io
- **Database** → MongoDB Atlas

## 📝 License

MIT — feel free to use this in your portfolio!

---

Built as a portfolio project to showcase GenAI + LLM Agents + MERN integration.
