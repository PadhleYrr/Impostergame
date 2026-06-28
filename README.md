# 🎭 Imposter Party

A viral **Find the Imposter** party game for 3–10 friends with 4 game modes. Built with React + Vite frontend, Vercel serverless API, and MongoDB Atlas.

## 🎮 Game Modes

| Mode | Description |
|------|-------------|
| 🎭 **Classic** | Everyone gets a word. Imposter gets a similar decoy — they don't know they're the imposter. |
| 🃏 **Bluff** | Imposter knows they're the imposter AND sees the real word. They must blend in with lies. |
| 🔗 **Chain** | After each round the imposter secretly picks who's next. Paranoia builds round by round. |
| 💀 **Chain + Bluff** | Imposter knows + picks the next imposter. Maximum chaos. |

## 🚀 Deploy to Vercel (5 minutes)

### Option A — Vercel Dashboard (easiest)
1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo
3. Add environment variable: `MONGO_URL` = `mongodb+srv://xaayux:xaayux@cluster0.mojpz.mongodb.net/?appName=Cluster0/`
4. Click **Deploy** — done!

### Option B — GitHub Actions (auto-deploy on push)
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel login` then `vercel link` in this directory
3. Get your tokens: `vercel env pull` shows your project/org IDs
4. Add these **GitHub Secrets** (Settings → Secrets → Actions):
   - `VERCEL_TOKEN` — from [vercel.com/account/tokens](https://vercel.com/account/tokens)
   - `VERCEL_ORG_ID` — from `.vercel/project.json` after `vercel link`
   - `VERCEL_PROJECT_ID` — from `.vercel/project.json` after `vercel link`
5. Push to `main` → GitHub Actions auto-deploys to Vercel ✅

## 💻 Local Development

```bash
# Install frontend deps
npm install

# Install API deps  
cd api && npm install && cd ..

# Copy env file
cp .env.example .env

# Run frontend (port 5173)
npm run dev

# In a separate terminal, run API locally with Vercel CLI
npx vercel dev --listen 3001
```

> **Note:** For local dev, the Vite proxy forwards `/api/*` to `localhost:3001` automatically.

## 🗂 Project Structure

```
imposter-party/
├── api/                    # Vercel serverless functions (MongoDB)
│   ├── _db.js              # Shared MongoDB connection + word pairs
│   ├── rooms/
│   │   ├── create.js       # POST /api/rooms/create
│   │   ├── join.js         # POST /api/rooms/join
│   │   ├── [code].js       # GET  /api/rooms/:code  (poll for state)
│   │   └── mode.js         # POST /api/rooms/mode
│   ├── rounds/
│   │   ├── start.js        # POST /api/rounds/start
│   │   ├── voting.js       # POST /api/rounds/voting
│   │   ├── vote.js         # POST /api/rounds/vote
│   │   ├── tally.js        # POST /api/rounds/tally
│   │   └── chain.js        # POST /api/rounds/chain
│   └── players/
│       └── leave.js        # POST /api/players/leave
│
├── src/
│   ├── lib/
│   │   ├── api.ts          # Typed API client
│   │   └── player.ts       # Local identity + stats
│   ├── routes/
│   │   ├── Landing.tsx     # Home: profile + create/join room
│   │   └── RoomPage.tsx    # Game: lobby, reveal, voting, results
│   ├── components/
│   │   └── Toaster.tsx     # Toast notifications
│   └── App.tsx             # Router
│
├── .github/workflows/
│   └── deploy.yml          # Auto-deploy to Vercel on push to main
├── vercel.json             # Vercel routing config
└── .env.example            # Environment variable template
```

## 🔧 How It Works

- **Realtime:** The frontend polls `/api/rooms/:code` every 1.8 seconds for state updates (replaces Supabase realtime). This works perfectly for 3–10 players.
- **Database:** MongoDB Atlas — rooms, players, rounds collections with auto-seeded word pairs.
- **Auth:** No auth needed — identity stored in `localStorage` per device.
- **Scores:** +3 if imposter escapes, +1 if crew correctly identifies imposter, +1 bonus for voting correctly.

## 📱 Sharing with Friends

Once deployed, share the URL. Friends open it, pick a nickname, and join with your room code. Works on any device with a browser — no app install needed.
