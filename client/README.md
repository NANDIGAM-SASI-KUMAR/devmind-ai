# DevMind - Frontend Client

This is the React frontend for DevMind, built with Vite and Tailwind CSS. It provides a modern, developer-focused UI to interact with the multi-agent AI system.

## Features
- **React 18 & Vite**: Fast development server and optimized production build.
- **Tailwind CSS**: Utility-first styling for a sleek, responsive dark-mode interface.
- **Real-time AI Chat**: Handles Server-Sent Events (SSE) to stream AI responses seamlessly.
- **Markdown & Code Highlighting**: Uses `react-markdown` and `react-syntax-highlighter` to display formatted code blocks beautifully.
- **State Management**: React Context for Auth and local state for chat/projects.

## Setup & Running

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env`. Ensure `VITE_API_URL` points to your backend server (usually `http://localhost:5000/api`).

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

## Directory Structure
- `/src/api/` - Axios API wrappers (auth, projects, etc.)
- `/src/components/` - Reusable UI components (buttons, modals, chat bubbles)
- `/src/pages/` - Main route views (Dashboard, Chat interface, Login)
- `/src/context/` - React Context providers (AuthContext)
- `/public/` - Static assets

