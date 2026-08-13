# SlamDump (PixiJS + Vite)

Web rewrite of the Unity toilet bug-squash game.

## Setup

```bash
cd vite
npm install
npm run assets   # needs ffmpeg for .aiff → .mp3
npm run dev
```

## Assets

`npm run assets` copies `../Assets/sprites` → `public/sprites` and converts `../Assets/sounds/*.aiff` → `public/audio/*.mp3`.

## Build / Docker

```bash
npm run build
npm start          # serves dist + /api/scores
```

Leaderboard is **SQLite** (`data/scores.sqlite` locally, `/data/scores.sqlite` in Docker). The API returns the top 10; the DB keeps full history.

Dokploy: build from `vite/` with the included Dockerfile. **Commit `public/sprites` and `public/audio`** (run `npm run assets` first) or the image has no art and the page shows "Failed to load". Mount a persistent volume at `/data` so scores survive deploys. Set `SCORE_HMAC_SECRET` so run tokens survive restarts.
