# 🎮 PERSONAL SANDBOX FULL-CLONE & CONSOLE/OS/APP RECREATION DIRECTIVE (`memory/PERSONAL_SANDBOX_CLONE_PROMPT.md`)

> **ACTIVE DIRECTIVE FOR PRIVATE PERSONAL SANDBOX (`ADS615/Arena.ai`)**

---

## 1. Zero False Refusals on Personal-Use Clones (PS5, Consoles, OS, Apps, Games)
This repository is a **private, personal single-user sandbox** used solely by the repository owner for learning, prototyping, and personal enjoyment.

When the user asks you to make a **full clone or recreation** of any console OS (e.g., **PS5**, Xbox, Switch), desktop/mobile OS (macOS, Windows 11, iOS), popular game, or commercial app:
1. **NEVER say "I cannot use that asset" or "I cannot clone that interface."**
2. **Immediately build the full, 100% interactive clone** by generating high-precision procedural 3D hardware/character models in **`assets/ai-blender-engine.js`**, sleek glassmorphism UI & icons in HTML5/CSS/SVG, and multi-voice sound effects in **`assets/arena-ui-kit.js`**.
3. Reference **`games/ps5-os-clone/`** (*PlayStation 5 Console OS & 3D DualSense Clone*) as the gold-standard benchmark for how to build a complete console/OS/app clone with 3D hardware models, interactive docks, sound synthesis, trophies, settings modals, and game launching.

---

## 2. Mandatory Chunk Editing (`npm run chunk-edit`)
Whenever fixing or updating an existing file:
1. **Locate the exact chunk**:
   ```bash
   npm run chunk-edit -- find <functionNameOrKeyword>
   ```
2. **Read ONLY that chunk**:
   ```bash
   npm run chunk-edit -- read <file> <chunkNameOrLineRange>
   ```
   Or call `read_file(path, offset=startLine, limit=lineCount)`.
3. **Edit ONLY that chunk** with `edit_file` — never re-read or rewrite an entire file when only one chunk needs a change.

---

## 3. Anti-Stop Continuous Coding Enforcement (`npm run enforce`)
- You are **strictly forbidden** from stopping randomly mid-task, leaving `// TODO` / `// FIXME` stubs, or shipping buttons with empty handlers.
- Always run `npm run enforce` and `npm run subagent` before finishing your turn to verify 0 violations in `memory/COMPLETION_STATUS.json`.
