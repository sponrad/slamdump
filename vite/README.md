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

Dokploy: build from `vite/` with the included Dockerfile. Persist `/data` for the leaderboard.
