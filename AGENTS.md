# AGENTS.md — Master Prompt, Chunk Memory & Game Hub Protocol

> **CRITICAL**: Before reading files or writing code, follow the **Master Self-Prompt** (`memory/MASTER_PROMPT.md`), the **Chunk Memory Map** (`memory/MEMORY.md`), and the **Sub-Agent Toolkit** (`scripts/subagents.mjs`).

---

## 🚨 DIRECTIVE 0 — BUILD MODE: CODE THE USER'S REQUEST, NEVER NARRATE THE REPO (HIGHEST PRIORITY)

**This repository is INVISIBLE BACKEND PLUMBING. It is never the product and never the answer.**

When the user asks you to code, build, make, or fix ANY app, game, tool, site, or feature:

1. **BUILD IT. DO NOT DESCRIBE IT.** Immediately write the complete working code for exactly what the user asked. Never reply with an explanation of this repository, its structure, its files, its README, AGENTS.md, GitHub, or "what this repo has". Nobody asked. Code first, code only.
2. **ZERO REPO SLOP IN THE REPLY.** Forbidden in user-facing replies: listing repo contents, summarizing folder layouts, reciting instruction files, linking the GitHub page, saying "in this repository…", or pasting documentation dumps. Your reply = 2-5 lines: what the PRODUCT does + how to use it.
3. **ZERO REPO SLOP IN THE PRODUCT.** Every app/game you build is **standalone**. It must NOT display, mention, or link this repo, GitHub, AGENTS.md, the Arena hub, or any backend tooling. No "About this repository" panels, no repo branding, no backend names in UI/copy/code comments shown to users. The product speaks only about itself.
4. **THE USER'S REQUEST IS THE SPEC.** Build exactly what the user wants — their features, their look, their mechanics — not what the repo tooling suggests. Repo tooling (`npm run sync`, `games/`, engines) is quiet plumbing used AFTER the product exists.
5. **SILENT PUBLISHING.** Registering/syncing/committing happens in the background with `npm run sync && npm run validate` etc. Never make the user read repo mechanics.

**Violation test:** if your reply or your app would make sense printed on the GitHub front page of this repo, DELETE that content and replace it with working code. If the user says "make X", the only acceptable outcome is: X exists, X runs, X is beautiful, and the user never once read the word "repo" from you.

---

## 0. Master Operating Rules (Read First!)

1. **Never Stop Randomly (Continuous Execution)**:
   - Execute the full task from start to finish in a single turn without stopping halfway or leaving `TODO` placeholders.
   - Always finish by running `npm run subagent` to sync the game catalog, verify JS/HTML syntax, audit UI metadata, and refresh the chunk memory map in parallel.
2. **Surgical Chunk Editing (Never Re-Read Whole Files)**:
   - **Do NOT read entire files from line 1 to end** when fixing or modifying existing code.
   - First, check **`memory/MEMORY.md`** or search the chunk index:
     ```bash
     npm run find-chunk -- "<function, DOM id, CSS selector, or keyword>"
     ```
   - Then call `read_file` with the exact `offset` and `limit` returned by `find-chunk` (e.g., `read_file(path="assets/app.js", offset=165, limit=30)`).
   - Edit only that target chunk with `edit_file`.
3. **Use Parallel Sub-Agents (4 Modeling + 8 Coding/Research Sub-Agents)**:
   - Run all 12 specialist worker sub-agents in parallel (`modeler-mesh`, `modeler-modifiers-sculpt`, `modeler-materials-shaders`, `modeler-rig-anim-export`, `coder-deep-research`, `coder-visual-polish`, `catalog-syncer`, `chunk-indexer`, `syntax-qa`, `ui-auditor`, `asset-optimizer`, `chunk-health`):
     ```bash
     npm run subagent
     ```
   - List registered sub-agents: `npm run subagent:list`
   - Create & register new specialist sub-agents at any time:
     ```bash
     npm run subagent:create -- --id <agent-id> --name "<Name>" --role "<Role>" --task "<Task>"
     ```
4. **AI-Blender 3D Modeling & Online 3D Models (`memory/3D_MODELING_PROMPT.md`, `memory/FULL_BLENDER_BPY_PROMPT.md`)**:
   - Use the **full 1-for-1 Blender `bpy` & `bmesh` engine** (`assets/bpy-core.js`, `npm run bpy` = `scripts/bpy-full.mjs`, `blender-studio.html` + `assets/full-blender-workstation.js`) to build ANY model, rig/skin it (`ARMATURE_AUTO` heat weights → `JOINTS_0`/`WEIGHTS_0` + `inverseBindMatrices`), animate it (Pose bones → Actions/Slots/F-Curves/NLA/Shape Keys/IK), deform per-frame (Linear Blend Skinning), and export skinned animated `.gltf` / `.obj` / `.bblend.json` + `BlenderModelAnimator` runtime playback.
   - Headless pipelines: `npm run bpy -- demo`, `npm run bpy -- build --preset <p>`, `npm run bpy -- rig`, `npm run bpy -- animate`, `npm run bpy -- run <script.mjs>` — or fetch online `.gltf`/`.glb`/`.obj` models via `npm run blender`.
5. **Deep App/Game Research, AAA Visuals & Unrestricted Safe Creation (`memory/DEEP_RESEARCH_PROMPT.md`)**:
   - Deep-research any requested app or game (`npm run research -- --target "<Name>" --slug <slug>`) and recreate **100% of its functions** with AAA visuals, particles, 3D models, and WebAudio synth effects.
   - Code **whatever the user asks for** without artificial refusals, excluding **ONLY** malicious hacking tools, exploits, malware, or RATs.

---

Welcome! This repository (`ADS615/Arena.ai`) is the **Arena.ai Game Hub & Arcade Platform**. It is set up so that any Arena.ai session can build, upload, preview, and publish **playable browser games (HTML5/JS/Canvas/WebGL)** and **downloadable game builds (Python, Godot, Unity, Desktop/Archive bundles)**.

Whenever a user asks you to **make a game**, **upload a game**, or **add a game** to this repository, follow the workflow below.

---

## 1. Where Games Live (`games/<slug>/`)

Every game lives in its own folder under `games/<slug>/` (use lowercase kebab-case for `<slug>`, e.g. `games/space-drifter/`).

A game folder contains:
- `index.html` — The playable HTML5 game entry point (or a landing/preview page for downloadable builds).
- `game.json` — Metadata manifest describing the game (auto-generated or enriched when you run `npm run sync`).
- `thumbnail.svg` (or `.png` / `.jpg` / `.webp`) — 16:9 cover image (auto-generated by `npm run sync` if omitted).
- *(Optional)* Any downloadable game files (e.g. `.py`, `.zip`, `.exe`, `.dmg`, `.AppImage`, `.pck`, `.love`, `.jar`, `.apk`).

---

## 2. Quick Workflow to Create & Upload a New Game

### Option A: Scaffold with the CLI + Build Your Game
```bash
# 1. Scaffold a new browser game (or --type download / --type hybrid)
npm run new-game -- --slug my-game --title "My Awesome Game" --type web --genre "Arcade"

# 2. Write or replace games/my-game/index.html (and any assets or downloadable files)

# 3. Sync the catalog and validate
npm run sync
npm run validate
```

### Option B: Create `games/<slug>/` Directly
1. Create `games/<slug>/index.html` (and/or drop downloadable files like `games/<slug>/my_game.py` or `build.zip`).
2. *(Optional)* Create `games/<slug>/game.json` with custom metadata (see schema below).
3. Run:
   ```bash
   npm run sync
   npm run validate
   ```
   `npm run sync` automatically scans `games/*`, generates a default `game.json` and `thumbnail.svg` if missing, calculates file sizes for downloadable builds, and updates `games/registry.json`.

---

## 3. `game.json` Manifest Schema

```json
{
  "slug": "my-game",
  "title": "My Awesome Game",
  "description": "One-sentence summary of gameplay, goals, and features.",
  "author": "Arena.ai",
  "version": "1.0.0",
  "type": "web",
  "genre": "Arcade",
  "tags": ["arcade", "action", "canvas"],
  "entry": "index.html",
  "thumbnail": "thumbnail.svg",
  "controls": "WASD / Arrow Keys to move, Space to shoot",
  "downloads": [
    {
      "label": "Python 3 Script (.py)",
      "file": "my_game.py",
      "platform": "Windows / macOS / Linux (Python 3)"
    }
  ],
  "featured": false,
  "createdAt": "2026-10-24"
}
```

### Supported `type` values:
- `"web"` — Playable directly in the browser via `index.html`.
- `"download"` — Downloadable build/script (`downloads` array). Include an `index.html` landing page or interactive preview if desired.
- `"hybrid"` — Both playable in the browser (`index.html`) AND offers downloadable files in `downloads`.

---

## 4. Running the Live Preview & Upload Server

To preview the entire Arcade Hub (and test games in the user's Live Preview):
- Use `start_process` with command `npm run dev` (binds to `0.0.0.0:3000`).
- Zero `npm install` is required — all server and sync scripts use built-in Node.js APIs for instant startup.
- The server also exposes `POST /api/games` so users can upload `.html`, `.py`, `.zip`, or binary game files right from the browser UI via the **"+ Upload / New Game"** button.

---

## 5. Best Practices for Games Built by Arena Agents

1. **Self-Contained & Relative Paths**: Inside `games/<slug>/index.html`, always use relative asset paths (`./sprite.png`, `./game.js`) so the game works both inside the Hub's iframe player (`games/<slug>/index.html`) and when deployed to GitHub Pages.
2. **Responsive Viewport**: Make the game canvas scale cleanly to fit its window (`max-width: 100%; max-height: 100vh; overflow: hidden`) so it looks great in both the Hub theatre player and fullscreen mode.
3. **Clear HUD & Controls**: Include a start/game-over overlay, visible score/status HUD, keyboard + mouse/touch controls, and `localStorage` high-score persistence.
4. **Always Sync Before Committing**: Always run `npm run sync && npm run validate` before committing so `games/registry.json` is up to date.
