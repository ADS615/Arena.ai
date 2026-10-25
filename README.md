# 🎮 Arena.ai Game Hub (`ADS615/Arena.ai`)

Welcome to the **Arena.ai Game Hub**! This repository is set up so that any **Arena.ai Agent** (or developer) can build, upload, preview, and publish both **playable HTML5 browser games** and **downloadable game builds** (Python, Godot, Unity, archives, desktop binaries).

---

## ✨ What's Included

- **Playable Web Arcade Hub (`index.html`, `assets/`)**:
  - Browse, search, and filter games by format (**Browser Playable** vs **Downloadable Builds**) and genre.
  - **Built-in Theatre Player**: Play HTML5 games inside an embedded arcade viewport with Fullscreen, Restart, and New Tab controls.
  - **Direct Build Downloads**: Download standalone game scripts and archives (`.py`, `.zip`, `.exe`, `.pck`, etc.) with automatic file-size and platform badges.
  - **In-Browser Upload Studio (`+ Upload / New Game`)**: Drag-and-drop game files or scaffold a new game directly from the browser when running `npm run dev`.
  - **Arena Prompt Generator (`🤖 Agent Setup`)**: Generate a ready-to-paste prompt for any Arena.ai chat session to build and publish a new game.
- **Zero-Dependency CLI & Auto-Discovery (`scripts/`)**:
  - Instant startup (`npm run dev`, `npm run sync`, `npm run new-game`, `npm run validate`) using native Node.js APIs — no `npm install` wait time required in new Arena sandboxes.
- **Agent Instructions (`AGENTS.md` & `CLAUDE.md`)**:
  - Tells every future Arena session how to create, structure, validate, and publish games in `games/<slug>/`.
- **GitHub Pages Auto-Deploy (`.github/workflows/deploy-pages.yml`)**:
  - Automatically syncs `games/registry.json`, validates all games, and deploys the hub to GitHub Pages on push to `main`.

---

## 🚀 Quick Start (For Arena Agents & Developers)

### 1. Start the Live Arcade Hub & Upload Server
```bash
npm run dev
```
Starts the server at `http://0.0.0.0:3000` with live file uploading and automatic catalog syncing.

### 2. Scaffold a New Game
```bash
# Browser HTML5 / Canvas game
npm run new-game -- --slug space-dodger --title "Space Dodger" --type web --genre "Arcade"

# Downloadable Python / Desktop build
npm run new-game -- --slug star-quest-py --title "Star Quest" --type download --genre "RPG"
```

### 3. Sync & Validate the Game Catalog
Even if you manually create `games/<slug>/index.html` or drop a downloadable file into `games/<slug>/`, running:
```bash
npm run sync
npm run validate
```
will automatically infer metadata, generate a default `thumbnail.svg` and `game.json` if missing, and update `games/registry.json`.

---

## 📂 Repository Structure

```text
Arena.ai/
├── AGENTS.md                  # Instructions automatically read by Arena.ai agents
├── CLAUDE.md                  # Agent instructions pointer
├── index.html                 # Main Arena.ai Game Hub web portal
├── assets/
│   ├── styles.css             # Arcade Hub styling
│   └── app.js                 # Frontend catalog, theatre player, upload studio & prompt generator
├── scripts/
│   ├── dev-server.mjs         # Live preview & upload server (0.0.0.0:3000)
│   ├── sync-games.mjs         # Auto-discovers games/* and builds games/registry.json
│   ├── new-game.mjs           # Scaffolds new games from templates/
│   └── validate-games.mjs     # Validates manifests, entry files, and downloads
├── templates/
│   ├── web-canvas/            # Starter template for HTML5 Canvas games
│   └── downloadable/          # Starter template for downloadable builds
└── games/
    ├── registry.json          # Auto-generated game catalog
    ├── neon-blaster/          # Playable HTML5 twin-stick space shooter
    ├── cyber-serpent/         # Playable HTML5 cyberpunk grid game
    └── dungeon-crawler-py/    # Hybrid Browser + Downloadable Python 3 Roguelike
```
