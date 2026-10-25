# 🔥 ARENA BEAST MODE: UHD 4K AAA ENGINE, WEB/VIDEO RESEARCH & CLAUDE+FABLE PROTOCOL (`memory/BEAST_MODE_PROMPT.md`)

> **ACTIVE DIRECTIVE FOR BUILDING UHD 4K AAA GAMES, WATCHING/READING TUTORIALS & RECREATING ANY SYSTEM**

---

## 1. Web Search & Video/Tutorial Breakdown Protocol (`npm run omni`)
Whenever the user asks you to build a complex game, 3D system, shader, physics mechanic, or full clone of an existing game/app/console:
1. **Search the Web & Extract Tutorial Workflows**:
   - Use `web_search` and `fetch_page` to research official documentation, open-source repositories, technical articles, and video tutorial transcripts/breakdowns on how the requested mechanic, UI, or app works.
   - Run:
     ```bash
     npm run omni -- learn --topic "<Topic or Mechanic>" --slug <slug>
     npm run omni -- clone --target "<App, Console, or Game to Clone>" --slug <slug>
     ```
     to generate `games/<slug>/AAA_BLUEPRINT.json`.
2. **Synthesize Complete Mechanics**:
   - Extract exact camera math, control feel, UI layout hierarchies, 3D model silhouettes, and animation curves before writing code.

---

## 2. UHD 4K (3840×2160) AAA Graphics & Gameplay Standard (`assets/aaa-4k-engine.js`)
Every flagship game built in this repository can import **`assets/aaa-4k-engine.js`** alongside **`assets/ai-blender-engine.js`**, **`assets/ai-animation-studio.js`**, and **`assets/arena-ui-kit.js`** to deliver:
- **Native UHD 4K (3840×2160) / 1440p QHD / 1080p FHD Resolution Scaling (`UHD4KCanvasManager`)** with live resolution switching and real-time FPS telemetry.
- **ACES Filmic HDR Tone Mapping & Volumetric God-Rays (`renderAtmosphericSky4K`, `acesFilmicToneMap`)** with dynamic Time-of-Day presets (`sunset`, `dawn`, `midnight`).
- **3D Rigid-Body Physics (`PhysicsWorld3D`)** & **SSS-Rank Combat Style Meter (`CombatStyleMeter`)**.
- **Reference Implementation**: See **`games/valkyrie-4k-horizon/`** (*Valkyrie 4K: Horizon Protocol*) for a complete UHD 4K 3D Action-RPG combining AI-Blender 3D Mechs/Starfighters, 24-bone skeletal sword combos, volumetric god-rays, and AAA glassmorphism HUD.

---

## 3. Claude-Grade Code Architecture + Fable-Grade Interactive Storytelling
- **Claude-Grade Engineering**:
  - Surgical chunk-based reading/editing (`npm run chunk-edit`), zero `TODO` stubs (`npm run enforce`), modular ES imports, and 13 parallel worker sub-agents (`npm run subagent`).
- **Fable-Grade World & Character Simulation**:
  - Persistent Character Bibles (`createCharacterBible`), 24-bone IK/FK skeletal animation, phoneme lip-sync, 5-Act 20-minute film timelines, and reactive AI NPCs/bosses.
