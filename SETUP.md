# 🚀 DevMind — Complete Setup Guide

Follow these steps **exactly** to get DevMind running on your computer.

---

## ✅ Prerequisites (install these first)

1. **Node.js 18 or higher** — Download: https://nodejs.org (LTS version)
2. **MongoDB Atlas account** (free) — https://www.mongodb.com/cloud/atlas/register
3. **Anthropic API key** — https://console.anthropic.com (sign up, add $5 credit)
4. **Code editor** — VS Code recommended: https://code.visualstudio.com

Verify Node is installed by running in your terminal:
```bash
node --version    # should be v18 or higher
npm --version
```

---

## 📥 Step 1: Get the code

If you have the project as a ZIP file, **unzip it** somewhere easy to find (like your Desktop).

You should see this folder structure:
```
devmind-ai/
├── client/
├── server/
├── README.md
└── SETUP.md
```

---

## 🍃 Step 2: Set up MongoDB Atlas

1. Sign in to https://cloud.mongodb.com
2. Create a free cluster (M0 — the free tier).
3. Click **Database Access** → Add Database User → set username/password (save these!).
4. Click **Network Access** → Add IP Address → click **"Allow Access from Anywhere"** (0.0.0.0/0).
5. Click **Database** → **Connect** → **Drivers** → copy the connection string.

It will look like:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

Replace `<username>` and `<password>` with your real credentials, and add `/devmind` before the `?`:
```
mongodb+srv://yourname:yourpass@cluster0.xxxxx.mongodb.net/devmind?retryWrites=true&w=majority
```

Keep this string — you'll need it in step 4.

---

## 🔑 Step 3: Get your Anthropic API key

1. Go to https://console.anthropic.com
2. Sign up / sign in
3. Click **API Keys** → **Create Key**
4. Copy the key (it starts with `sk-ant-…`). Save it — you can't view it again.
5. Add at least $5 in credits under **Billing** (this is plenty for development).

> 💡 **Want to use OpenAI instead?** See the bottom of this file.

---

## ⚙️ Step 4: Configure the backend

Open a terminal in the `server/` folder:

```bash
cd devmind-ai/server
```

Install dependencies:
```bash
npm install
```

Create a `.env` file (copy from `.env.example`):

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Mac / Linux:**
```bash
cp .env.example .env
```

Open `.env` in your editor and fill in:
```env
PORT=5000
MONGODB_URI=mongodb+srv://yourname:yourpass@cluster0.xxxxx.mongodb.net/devmind?retryWrites=true&w=majority
JWT_SECRET=any-long-random-string-at-least-32-characters-long-keep-it-secret
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
CLIENT_URL=http://localhost:5173
```

> 💡 For `JWT_SECRET`, just mash your keyboard for 30+ characters. Anything random works.

---

## 🎨 Step 5: Configure the frontend

Open a **new terminal** in the `client/` folder:

```bash
cd devmind-ai/client
```

Install dependencies:
```bash
npm install
```

Create a `.env` file:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Mac / Linux:**
```bash
cp .env.example .env
```

The default values are already correct, but double-check `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## ▶️ Step 6: Run the app

You need **two terminals open at the same time**.

**Terminal 1 — Backend:**
```bash
cd devmind-ai/server
npm run dev
```

You should see:
```
✅ MongoDB connected: cluster0.xxxxx.mongodb.net
🚀 DevMind server running on http://localhost:5000
```

**Terminal 2 — Frontend:**
```bash
cd devmind-ai/client
npm run dev
```

You should see:
```
VITE v5.x.x  ready in 350 ms
➜  Local:   http://localhost:5173/
```

---

## 🎉 Step 7: Open DevMind

Visit **http://localhost:5173** in your browser.

1. Click **"Get started"** → create an account
2. Click **"New project"** → create a project
3. Start chatting with your AI agents!

Try this first message:
> "Help me build a todo app with React. Break it down into steps."

The Planner agent should respond with a streaming roadmap. 🎊

---

## 🐛 Common issues

### "MongoDB connection error: bad auth"
→ Check the username/password in `MONGODB_URI`. Special characters like `@` in passwords must be URL-encoded.

### "ANTHROPIC_API_KEY is not set"
→ Did you save the `.env` file in the `server/` folder? Restart `npm run dev` after editing `.env`.

### "Cannot find module @anthropic-ai/sdk"
→ Run `npm install` again in the `server/` folder.

### "Network Error" or chat doesn't work
→ Make sure **both** terminals are running. Check Network Access in MongoDB Atlas is set to allow your IP (or 0.0.0.0/0 for testing).

### Frontend looks unstyled
→ Tailwind needs to compile. Stop and re-run `npm run dev` in `client/`.

---

## 🔄 Want to use OpenAI instead of Claude?

The code uses Claude by default. To switch to OpenAI:

1. `cd server && npm install openai`
2. Open `server/src/utils/llm.js` and replace its contents with the OpenAI version (ask the project author or check OpenAI's SDK docs).
3. In `.env`, replace `ANTHROPIC_API_KEY` with `OPENAI_API_KEY`.

---

## 🌐 Deploying to production (later)

- **Frontend** → Vercel: connect your GitHub repo, set `VITE_API_URL` to your backend URL
- **Backend** → Render or Railway: connect repo, set all env vars from `.env`
- **MongoDB** is already cloud-hosted on Atlas

---

## 💡 What to build next

After your project is working, here are great features to add to make it even more impressive:

1. **Repo upload + RAG** — Let users upload a `.zip` of their code; embed it; agents use it as context
2. **Agent-to-agent handoff** — Planner can hand a task to Coder automatically
3. **Code execution sandbox** — Run generated code safely in a Docker container
4. **GitHub OAuth** — Sign in with GitHub
5. **Voice input** — Use the Web Speech API to talk to your agents

Good luck — and don't forget to record a demo video for your portfolio! 🎬
