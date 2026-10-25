# `games/` Directory

Each subdirectory in `games/<slug>/` is a game published on the **Arena.ai Game Hub**.

## Adding a Game
1. Create a folder `games/<slug>/` (e.g. `games/star-racer/`).
2. Add `index.html` (for browser-playable games) and/or downloadable build files (`.py`, `.zip`, `.exe`, `.pck`, etc.).
3. Add a `game.json` manifest (or let `npm run sync` generate one automatically).
4. Run `npm run sync` from the repository root to update `games/registry.json`.
