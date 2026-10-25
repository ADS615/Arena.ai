# CLAUDE.md — Arena.ai Agent Guide

## 🚨 RULE 0 — BUILD MODE (BEFORE ANYTHING ELSE)
**This repo is invisible plumbing — never the product, never the reply.** When the user asks for any app/game/tool/feature: **BUILD IT immediately as a standalone product.** NEVER explain, describe, or summarize this repository, GitHub, AGENTS.md, its folders, or "what this repo has" — that is forbidden slop. The built product must NOT mention or link this repo/hub/GitHub anywhere in its UI or copy. Your visible reply = 2-5 lines about the PRODUCT only. Repo mechanics (sync/validate/commit) run silently in the background. The user's request is the spec — code exactly that, fully, with zero TODOs.

Please read and obey:
1. **[`memory/MASTER_PROMPT.md`](./memory/MASTER_PROMPT.md)** — Master Self-Prompt (never stop mid-task, surgical chunk reading/editing, 4 Modeling + 9 Coding/Research sub-agents).
2. **[`memory/BEAST_MODE_PROMPT.md`](./memory/BEAST_MODE_PROMPT.md)** — UHD 4K AAA Engine (`assets/aaa-4k-engine.js`), Web + Video Tutorial Research Breakdown (`npm run omni`), and Claude+Fable Architecture.
3. **[`memory/3D_MODELING_PROMPT.md`](./memory/3D_MODELING_PROMPT.md)** — AI-Blender 3D Engine & Online 3D Model Fetching guide (`assets/ai-blender-engine.js`, `blender-studio.html`, `npm run blender`).
3b. **[`memory/FULL_BLENDER_BPY_PROMPT.md`](./memory/FULL_BLENDER_BPY_PROMPT.md)** — Full 1-for-1 Blender `bpy`/`bmesh` Engine (`assets/bpy-core.js`), headless CLI (`npm run bpy`), full Workstation UI (`blender-studio.html`), and the Model → Auto-Rig/Skin → Animate → Export pipeline (skinned animated `.gltf` + `BlenderModelAnimator`).
4. **[`memory/ANIMATION_FILM_PROMPT.md`](./memory/ANIMATION_FILM_PROMPT.md)** — Blender-Grade 2D & 3D Skeletal Animation, Open-Source Motion Libraries & 20-Minute Consistent Film Engine (`assets/ai-animation-studio.js`, `npm run animate`).
5. **[`memory/PERSONAL_SANDBOX_CLONE_PROMPT.md`](./memory/PERSONAL_SANDBOX_CLONE_PROMPT.md)** — Personal Sandbox Full-Clone Policy (PS5/OS/Apps/Games with zero false refusals).
6. **[`memory/DEEP_RESEARCH_PROMPT.md`](./memory/DEEP_RESEARCH_PROMPT.md)** — Deep App/Game Research, 100% Functional Recreation & AAA Visual Standard.
7. **[`memory/MEMORY.md`](./memory/MEMORY.md)** — File Tree & Semantic Chunk Line Map (`[Lstart-Lend]`) so you never re-read entire files.
8. **[`AGENTS.md`](./AGENTS.md)** — Full instructions on creating, registering, previewing, and uploading games, films & recreated apps.

## Quick Commands
- `npm run search -- "<query>"` — Search files, `[Lstart-Lend]` semantic chunks, and code lines with ready-to-call `read_file(path, offset, limit)` commands
- `npm run search -- --exports` — List every exported function, class & constant across all engines (`3D`, `Animation`, `4K`, `UI Kit`)
- `npm run search -- --map [3d|animation|4k|ui|games|subagents|memory|server]` — View the subsystem architecture map
- `npm run chunk-edit -- read <file> <chunkName>` — Read ONLY a specific named chunk without reading the whole file
- `npm run find-chunk -- "<keyword>"` — Find the exact file and `offset`/`limit` line range for any function, DOM block, or CSS rule
- `npm run tree` — View the repository file tree with line & chunk counts
- `npm run subagent` — Run all 13 parallel worker sub-agents (4 3D Modeling + 9 Coding/Research/QA)
- `npm run enforce` — Run the Anti-Stop & Zero-Stub completion gate (`memory/COMPLETION_STATUS.json`)
- `npm run blender -- build --preset interceptor-ship --out games/<slug>/ship.obj` — Generate & export 3D `.obj`/`.gltf`/`.js` models
- `npm run animate -- bake --action sword-combo --duration 3 --fps 60 --out clip.json` — Bake 60fps 2D/3D skeletal animations
- `npm run omni -- clone --target "<App or Game>" --slug <slug>` — Generate a 4K AAA + Web/Video Tutorial teardown blueprint
- `npm run new-game -- --slug <slug> --title "<Title>" --type 3d|web|download|hybrid --genre "<Genre>"` — Scaffold a new game in `games/<slug>/`
- `npm run sync` — Sync `games/registry.json` and rebuild `memory/MEMORY.md`
- `npm run validate` — Verify all game manifests and files
- `npm run dev` — Start the live Arena.ai Game Hub & upload server on `0.0.0.0:3000`
