# SkyRaid Royale

Flappy-Bird-inspired F2P mobile arcade prototype. Phaser 3 + TypeScript, portrait iPhone first.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints on your phone (same Wi-Fi). Add to Home Screen for fullscreen PWA mode.

## Build

```bash
npm run build
npm run preview
```

## Tuning

All gameplay, economy, and difficulty numbers live in `src/config/balance.ts`. Edit there, never in scene code.

## Architecture

- `scenes/` — Title, Game, Results, Upgrade, Shop, Leaderboard, Boot, TutorialOverlay
- `systems/` — Progression (save), Shop (mock IAP), Ghost (record/playback), ObstacleSpawner, Juice, UI
- `entities/` — Player, Obstacle, Coin, Shard
- `config/balance.ts` — every tunable number
- `types/index.ts` — shared interfaces

## Reset save

In browser devtools: `localStorage.clear()` then reload.
