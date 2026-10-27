# Core Rush Arena

Fast 2D mobile PvP arena prototype built with Phaser 3 + TypeScript. Portrait mobile-first, procedural art only, no backend required for the MVP.

## Run

```bash
npm install
npm run dev
```

Open the Vite URL on your phone or simulator.

## Prototype loop

- Instant match start from the main menu
- Top-down arena with player circle, bot, and destroyable cores
- Virtual joystick movement on the left side
- Auto-attacks every 0.5s
- XP orbs spawn every 2 seconds
- Level-up pauses for 3 upgrade choices
- Post-match gold + loot drop + equip button
- Free chest every 3 matches
- Starter pack offer after match 2
- Premium currency packs and paid chest button

## Architecture

- `scenes/` — menu, arena match, results, shop, inventory
- `systems/ProgressionManager.ts` — local save, inventory, match rewards
- `systems/LootSystem.ts` — rarity rolls, gear generation, near-miss previews
- `systems/CombatSystem.ts` — reusable combat math and upgrade application
- `systems/UIManager.ts` — shared mobile-friendly UI helpers
- `config/balance.ts` — gameplay and economy tuning
- `types/index.ts` — shared interfaces

## Reset save

Use the `RESET` button on the main menu, or run `localStorage.clear()` in devtools.
