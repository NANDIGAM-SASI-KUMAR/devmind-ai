# DevMind - Backend Server

This is the Node.js/Express backend for DevMind. It handles authentication, database operations with MongoDB, and orchestrates the AI agents using Langchain/Anthropic API and ChromaDB for RAG (Retrieval-Augmented Generation).

## Features
- **Express API**: RESTful routes for authentication, projects, and chat history.
- **AI Agent Orchestration**: Logic to route requests between Planner, Coder, Debugger, and Docs agents.
- **RAG System**: Uses ChromaDB for vector storage and semantic search across project files.
- **Streaming Responses**: Uses Server-Sent Events (SSE) to stream AI responses to the frontend.
- **Local Reranker**: Enhances search result relevance for the AI context.

## Prerequisites
- Node.js (v18+)
- Python (for ChromaDB)
- MongoDB Atlas (or local MongoDB)
- Anthropic API Key (or OpenAI key, if configured)

## Setup & Running

1. **Install Node dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Copy `.env.example` to `.env` and fill in the required values (MongoDB URI, JWT Secret, Anthropic Key).

3. **Start ChromaDB Server** (Required for RAG):
   ```bash
   npm run chroma
   ```
   *(Note: Ensure you have `chromadb` installed via Python: `pip install chromadb` or `pip install -r ../requirements.txt`)*

4. **Start Backend Server**:
   ```bash
   # Development with auto-reload
   npm run dev

   # Production
   npm start
   ```

## Directory Structure
- `/src/routes/` - API endpoint definitions
- `/src/controllers/` - Request handling logic
- `/src/models/` - Mongoose schemas (User, Project, Conversation, etc.)
- `/src/agents/` - AI Agent implementation and orchestration
- `/src/rag/` - RAG configuration, embeddings, and local reranker logic
- `/chroma_data/` - Local storage for ChromaDB vector embeddings
- `/uploads/` - Temporary storage for uploaded user files

