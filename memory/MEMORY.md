# 🧠 Repository File Memory & Chunk Map (`memory/MEMORY.md`)

> **CHUNK EDITING PROTOCOL FOR AGENTS**:
> Do **NOT** read entire files from line 1 to end when fixing or updating code.
> 1. Locate the target file and exact `[Lstart-Lend]` line range below (or run `npm run find-chunk -- <keyword>`).
> 2. Call `read_file` with `offset: startLine` and `limit: (endLine - startLine + 1)`.
> 3. Apply surgical edits using `edit_file`, then run `npm run sync` to refresh this memory map.

---

## 1. File Tree Overview

| File Path | Lines | Chunks | Purpose |
| :--- | :---: | :---: | :--- |
| `.gitignore` | 0 | 0 | Repository file |
| `AGENTS.md` | 148 | 14 | Primary instructions, Master Prompt, Chunk Editing protocol & Sub-Agent guide for Arena agents |
| `assets/aaa-4k-engine.js` | 251 | 6 | Repository file |
| `assets/ai-animation-studio.js` | 602 | 9 | Repository file |
| `assets/ai-blender-engine.js` | 1189 | 56 | Repository file |
| `assets/app.js` | 590 | 42 | Frontend application state, catalog filtering, iframe player, file uploader, and prompt generator |
| `assets/arena-ui-kit.js` | 339 | 4 | Repository file |
| `assets/bpy-core.js` | 4656 | 173 | Repository file |
| `assets/full-blender-workstation.js` | 1261 | 62 | Repository file |
| `assets/styles.css` | 802 | 111 | Dark arcade UI styles, responsive grid, theatre modal, and dialog styles |
| `blender-studio.html` | 368 | 28 | Repository file |
| `CLAUDE.md` | 33 | 3 | Agent instructions mirror pointing to AGENTS.md & Master Prompt |
| `games/astra-3d-overdrive/cyber-mech.gltf` | 0 | 0 | Game asset/source for astra-3d-overdrive |
| `games/astra-3d-overdrive/game.json` | 28 | 1 | Game asset/source for astra-3d-overdrive |
| `games/astra-3d-overdrive/index.html` | 486 | 16 | Game asset/source for astra-3d-overdrive |
| `games/astra-3d-overdrive/interceptor-ship.obj` | 0 | 0 | Game asset/source for astra-3d-overdrive |
| `games/astra-3d-overdrive/thumbnail.svg` | 25 | 1 | Game asset/source for astra-3d-overdrive |
| `games/astral-odyssey-film/game.json` | 23 | 1 | Game asset/source for astral-odyssey-film |
| `games/astral-odyssey-film/index.html` | 519 | 19 | Game asset/source for astral-odyssey-film |
| `games/astral-odyssey-film/sword-combo.json` | 6344 | 1 | Game asset/source for astral-odyssey-film |
| `games/astral-odyssey-film/thumbnail.svg` | 25 | 1 | Game asset/source for astral-odyssey-film |
| `games/cyber-serpent/game.json` | 17 | 1 | Game asset/source for cyber-serpent |
| `games/cyber-serpent/index.html` | 286 | 12 | Game asset/source for cyber-serpent |
| `games/cyber-serpent/thumbnail.svg` | 25 | 1 | Game asset/source for cyber-serpent |
| `games/dungeon-crawler-py/dungeon_crawler.py` | 141 | 6 | Game asset/source for dungeon-crawler-py |
| `games/dungeon-crawler-py/game.json` | 23 | 1 | Game asset/source for dungeon-crawler-py |
| `games/dungeon-crawler-py/index.html` | 304 | 11 | Game asset/source for dungeon-crawler-py |
| `games/dungeon-crawler-py/thumbnail.svg` | 25 | 1 | Game asset/source for dungeon-crawler-py |
| `games/neon-blaster/game.json` | 17 | 1 | Game asset/source for neon-blaster |
| `games/neon-blaster/index.html` | 502 | 19 | Game asset/source for neon-blaster |
| `games/neon-blaster/thumbnail.svg` | 25 | 1 | Game asset/source for neon-blaster |
| `games/ps5-os-clone/dualsense-controller.gltf` | 0 | 0 | Game asset/source for ps5-os-clone |
| `games/ps5-os-clone/game.json` | 28 | 1 | Game asset/source for ps5-os-clone |
| `games/ps5-os-clone/index.html` | 846 | 25 | Game asset/source for ps5-os-clone |
| `games/ps5-os-clone/ps5-console.obj` | 0 | 0 | Game asset/source for ps5-os-clone |
| `games/ps5-os-clone/thumbnail.svg` | 25 | 1 | Game asset/source for ps5-os-clone |
| `games/README.md` | 10 | 2 | Game asset/source for README.md |
| `games/registry.json` | 250 | 1 | Game asset/source for registry.json |
| `games/valkyrie-4k-horizon/AAA_BLUEPRINT.json` | 32 | 1 | Game asset/source for valkyrie-4k-horizon |
| `games/valkyrie-4k-horizon/game.json` | 23 | 1 | Game asset/source for valkyrie-4k-horizon |
| `games/valkyrie-4k-horizon/index.html` | 510 | 17 | Game asset/source for valkyrie-4k-horizon |
| `games/valkyrie-4k-horizon/plasma-sword.obj` | 0 | 0 | Game asset/source for valkyrie-4k-horizon |
| `games/valkyrie-4k-horizon/thumbnail.svg` | 25 | 1 | Game asset/source for valkyrie-4k-horizon |
| `index.html` | 282 | 21 | Main Arena.ai Game Hub frontend layout (navbar, hero, filters, theatre modal, upload modal) |
| `memory/3D_MODELING_PROMPT.md` | 60 | 6 | Repository file |
| `memory/ANIMATION_FILM_PROMPT.md` | 49 | 8 | Repository file |
| `memory/BEAST_MODE_PROMPT.md` | 36 | 4 | Repository file |
| `memory/COMPLETION_STATUS.json` | 9 | 1 | Repository file |
| `memory/DEEP_RESEARCH_PROMPT.md` | 36 | 4 | Repository file |
| `memory/FULL_BLENDER_BPY_PROMPT.md` | 117 | 11 | Repository file |
| `memory/MASTER_PROMPT.md` | 88 | 7 | Master Self-Prompt enforcing continuous execution, chunk-only reading, and sub-agent usage |
| `memory/PERSONAL_SANDBOX_CLONE_PROMPT.md` | 35 | 4 | Repository file |
| `memory/subagents.json` | 111 | 1 | Registry of specialist sub-agents available to the main agent |
| `package.json` | 32 | 1 | NPM scripts for dev server, game sync, chunk memory, and sub-agents |
| `README.md` | 75 | 9 | Repository overview, CLI documentation, and structure guide |
| `scripts/ai-animator.mjs` | 116 | 4 | Repository file |
| `scripts/ai-blender.mjs` | 210 | 6 | Repository file |
| `scripts/anti-stop-enforcer.mjs` | 95 | 2 | Repository file |
| `scripts/bpy-full.mjs` | 303 | 11 | Repository file |
| `scripts/chunk-editor.mjs` | 143 | 3 | Repository file |
| `scripts/chunk-tool.mjs` | 486 | 11 | File Memory & Semantic Chunk Indexer for surgical line-range reading and chunk editing |
| `scripts/deep-research.mjs` | 72 | 2 | Repository file |
| `scripts/dev-server.mjs` | 290 | 12 | Zero-dependency HTTP server (0.0.0.0:3000) with static file serving and REST upload API |
| `scripts/new-game.mjs` | 153 | 5 | CLI generator that scaffolds new browser or downloadable games from templates/ |
| `scripts/omni-intelligence.mjs` | 83 | 2 | Repository file |
| `scripts/repo-search.mjs` | 356 | 6 | Repository file |
| `scripts/subagents.mjs` | 418 | 11 | Parallel Sub-Agent Orchestrator, QA syntax verifier, game blueprinter, and custom sub-agent creator |
| `scripts/sync-games.mjs` | 299 | 9 | Auto-discovers games/* folders, generates missing manifests/thumbnails, and updates registry + memory |
| `scripts/validate-games.mjs` | 57 | 1 | Validator checking all game manifests, entry points, thumbnails, and downloads |
| `subagents/asset-optimizer.mjs` | 26 | 1 | Repository file |
| `subagents/chunk-health.mjs` | 24 | 1 | Repository file |
| `subagents/coder-deep-research.mjs` | 15 | 1 | Repository file |
| `subagents/coder-visual-polish.mjs` | 18 | 1 | Repository file |
| `subagents/modeler-materials-shaders.mjs` | 16 | 1 | Repository file |
| `subagents/modeler-mesh.mjs` | 14 | 1 | Repository file |
| `subagents/modeler-modifiers-sculpt.mjs` | 24 | 1 | Repository file |
| `subagents/modeler-rig-anim-export.mjs` | 22 | 1 | Repository file |
| `templates/downloadable/game.json` | 21 | 1 | Starter template file (templates/downloadable/game.json) |
| `templates/downloadable/index.html` | 74 | 1 | Starter template file (templates/downloadable/index.html) |
| `templates/downloadable/main.py` | 38 | 1 | Starter template file (templates/downloadable/main.py) |
| `templates/web-3d-blender/game.json` | 15 | 1 | Starter template file (templates/web-3d-blender/game.json) |
| `templates/web-3d-blender/index.html` | 73 | 3 | Starter template file (templates/web-3d-blender/index.html) |
| `templates/web-canvas/game.json` | 15 | 1 | Starter template file (templates/web-canvas/game.json) |
| `templates/web-canvas/index.html` | 117 | 10 | Starter template file (templates/web-canvas/index.html) |

---

## 2. Semantic Chunk Index (Line Ranges by File)

### `AGENTS.md`
- **`L1-L6`** (`md-h1`): `AGENTS.md — Master Prompt, Chunk Memory & Game Hub Protocol`
- **`L7-L22`** (`md-h2`): `🚨 DIRECTIVE 0 — BUILD MODE: CODE THE USER'S REQUEST, NEVER NARRATE THE REPO (HIGHEST PRIORITY)`
- **`L23-L60`** (`md-h2`): `0. Master Operating Rules (Read First!)`
- **`L61-L72`** (`md-h2`): `1. Where Games Live (`games/<slug>/`)`
- **`L73-L74`** (`md-h2`): `2. Quick Workflow to Create & Upload a New Game`
- **`L75-L76`** (`md-h3`): `Option A: Scaffold with the CLI + Build Your Game`
- **`L77-L79`** (`md-h1`): `1. Scaffold a new browser game (or --type download / --type hybrid)`
- **`L80-L81`** (`md-h1`): `2. Write or replace games/my-game/index.html (and any assets or downloadable files)`
- **`L82-L86`** (`md-h1`): `3. Sync the catalog and validate`
- **`L87-L98`** (`md-h3`): `Option B: Create `games/<slug>/` Directly`
- **`L99-L125`** (`md-h2`): `3. `game.json` Manifest Schema`
- **`L126-L132`** (`md-h3`): `Supported `type` values:`
- **`L133-L141`** (`md-h2`): `4. Running the Live Preview & Upload Server`
- **`L142-L148`** (`md-h2`): `5. Best Practices for Games Built by Arena Agents`

### `assets/aaa-4k-engine.js`
- **`L13-L66`** (`state`): `RESOLUTION_PRESETS`
- **`L67-L67`** (`function`): `acesFilmicToneMap`
- **`L68-L75`** (`const-fn`): `mapChannel`
- **`L76-L105`** (`state`): `TIME_OF_DAY_PRESETS`
- **`L106-L168`** (`function`): `renderAtmosphericSky4K`
- **`L169-L251`** (`state`): `b`

### `assets/ai-animation-studio.js`
- **`L12-L33`** (`state`): `AnimCurves`
- **`L34-L57`** (`function`): `evaluateFCurve`
- **`L58-L85`** (`function`): `createCharacterBible`
- **`L86-L92`** (`function`): `evaluateCharacterPose`
- **`L93-L183`** (`state`): `pose`
- **`L238-L256`** (`function`): `renderRiggedCharacter`
- **`L257-L347`** (`function`): `drawLimbSegment`
- **`L486-L575`** (`state`): `ASTRAL_ODYSSEY_20MIN_FILM`
- **`L576-L602`** (`function`): `sampleFilmStateAtTime`

### `assets/ai-blender-engine.js`
- **`L11-L14`** (`function`): `vec3`
- **`L15-L18`** (`function`): `add3`
- **`L19-L22`** (`function`): `sub3`
- **`L23-L26`** (`function`): `scale3`
- **`L27-L30`** (`function`): `dot3`
- **`L31-L38`** (`function`): `cross3`
- **`L39-L42`** (`function`): `len3`
- **`L43-L47`** (`function`): `norm3`
- **`L48-L52`** (`function`): `hashNoise3D`
- **`L53-L67`** (`function`): `fbmNoise3D`
- **`L68-L84`** (`function`): `createEmptyMesh`
- **`L85-L101`** (`function`): `cloneMesh`
- **`L102-L122`** (`function`): `computeVertexNormals`
- **`L123-L142`** (`function`): `createPrincipledBSDF`
- **`L143-L164`** (`function`): `createCube`
- **`L165-L195`** (`function`): `createSphere`
- **`L196-L243`** (`function`): `createCylinder`
- **`L244-L247`** (`function`): `createCone`
- **`L248-L283`** (`function`): `createTorus`
- **`L284-L319`** (`function`): `createLatheMesh`
- **`L320-L351`** (`function`): `transformMesh`
- **`L352-L366`** (`function`): `mergeMeshes`
- **`L367-L403`** (`function`): `extrudeFaces`
- **`L404-L410`** (`function`): `subdivideMesh`
- **`L411-L461`** (`function`): `getMidpoint`
- **`L462-L481`** (`function`): `modifierMirror`
- **`L482-L500`** (`function`): `modifierArray`
- **`L501-L521`** (`function`): `modifierDeform`
- **`L522-L531`** (`function`): `modifierDisplaceNoise`
- **`L532-L551`** (`function`): `modifierSolidify`
- **`L552-L588`** (`function`): `sculptBrush`
- **`L589-L679`** (`function`): `createPresetModel`
- **`L776-L797`** (`function`): `createIcoSphere`
- **`L798-L806`** (`function`): `createCapsule`
- **`L807-L830`** (`function`): `createPlaneGrid`
- **`L831-L847`** (`function`): `createRingMesh`
- **`L848-L880`** (`function`): `createTubeSpline`
- **`L881-L909`** (`function`): `createSuzanneHead`
- **`L910-L946`** (`function`): `createPS5ConsoleMesh`
- **`L947-L979`** (`function`): `createDualSenseMesh`
- **`L980-L983`** (`function`): `insetFaces`
- **`L984-L987`** (`function`): `bevelMesh`
- **`L988-L1013`** (`function`): `mergeVerticesByDistance`
- **`L1014-L1019`** (`function`): `decimateMesh`
- **`L1020-L1035`** (`function`): `computeBoundingBox`
- **`L1036-L1040`** (`function`): `centerPivotToBounds`
- **`L1041-L1049`** (`function`): `modifierWave`
- **`L1050-L1057`** (`function`): `modifierShrinkwrap`
- **`L1058-L1077`** (`function`): `sculptSmoothBrush`
- **`L1078-L1090`** (`function`): `createArmatureRig`
- **`L1091-L1104`** (`function`): `solveTwoBoneIK`
- **`L1105-L1117`** (`function`): `sampleProceduralAnimation`
- **`L1118-L1144`** (`function`): `exportToOBJ`
- **`L1145-L1146`** (`function`): `exportToGLTF`
- **`L1147-L1181`** (`state`): `gltf`
- **`L1182-L1189`** (`function`): `exportToJSModule`

### `assets/app.js`
- **`L1-L58`** (`state`): `state`
- **`L59-L66`** (`function`): `slugify`
- **`L67-L84`** (`function`): `checkServerStatus`
- **`L85-L98`** (`function`): `loadGames`
- **`L99-L110`** (`function`): `updateStats`
- **`L111-L123`** (`function`): `renderGenrePills`
- **`L124-L131`** (`listener`): `btn.on(click)`
- **`L132-L171`** (`function`): `getFilteredGames`
- **`L172-L177`** (`function`): `badgeForType`
- **`L178-L227`** (`function`): `renderGames`
- **`L228-L237`** (`listener`): `el.on(click)`
- **`L238-L265`** (`function`): `openPlayer`
- **`L266-L271`** (`function`): `closePlayer`
- **`L272-L278`** (`listener`): `reloadGameBtn.on(click)`
- **`L279-L284`** (`listener`): `fullscreenGameBtn.on(click)`
- **`L285-L285`** (`listener`): `closePlayerBtn.on(click)`
- **`L286-L291`** (`listener`): `playerModal.on(click)`
- **`L292-L299`** (`listener`): `tab.on(click)`
- **`L300-L305`** (`listener`): `searchInput.on(input)`
- **`L306-L313`** (`listener`): `heroPlayFeaturedBtn.on(click)`
- **`L314-L329`** (`function`): `openBlenderStudio`
- **`L330-L349`** (`function`): `openFilmStudio`
- **`L350-L354`** (`function`): `openModalWithTab`
- **`L355-L355`** (`listener`): `openUploadBtn.on(click)`
- **`L356-L356`** (`listener`): `openAgentGuideBtn.on(click)`
- **`L357-L358`** (`listener`): `heroPromptBtn.on(click)`
- **`L359-L363`** (`function`): `closeUploadModal`
- **`L364-L364`** (`listener`): `closeUploadBtn.on(click)`
- **`L365-L365`** (`listener`): `cancelUploadBtn.on(click)`
- **`L366-L371`** (`listener`): `uploadModal.on(click)`
- **`L372-L376`** (`listener`): `tabBtn.on(click)`
- **`L377-L386`** (`function`): `switchDialogTab`
- **`L387-L424`** (`function`): `runLiveRepoSearch`
- **`L425-L429`** (`listener`): `gameTitleInput.on(input)`
- **`L430-L434`** (`listener`): `gameSlugInput.on(input)`
- **`L435-L443`** (`listener`): `gameFilesInput.on(change)`
- **`L444-L476`** (`function`): `readFileForUpload`
- **`L477-L528`** (`listener`): `uploadForm.on(submit)`
- **`L529-L559`** (`state`): `manifest`
- **`L560-L573`** (`function`): `updateArenaPrompt`
- **`L574-L576`** (`listener`): `promptIdeaInput.on(input)`
- **`L577-L590`** (`listener`): `copyPromptBtn.on(click)`

### `assets/arena-ui-kit.js`
- **`L88-L170`** (`state`): `Easing`
- **`L171-L174`** (`listener`): `window.on(keydown)`
- **`L175-L255`** (`listener`): `window.on(keyup)`
- **`L256-L339`** (`function`): `findGridPathAStar`

### `assets/bpy-core.js`
- **`L19-L31`** (`state`): `V`
- **`L32-L87`** (`state`): `M4`
- **`L88-L92`** (`function`): `hash3`
- **`L93-L96`** (`function`): `noise3`
- **`L97-L97`** (`const-fn`): `n`
- **`L98-L102`** (`const-fn`): `lerp`
- **`L103-L107`** (`function`): `fbm3`
- **`L108-L108`** (`function`): `clamp`
- **`L109-L199`** (`function`): `uid`
- **`L217-L257`** (`state`): `b`
- **`L258-L268`** (`state`): `l`
- **`L269-L272`** (`function`): `sock`
- **`L273-L273`** (`function`): `make_node`
- **`L274-L274`** (`state`): `n`
- **`L275-L275`** (`const-fn`): `I`
- **`L276-L366`** (`const-fn`): `O`
- **`L372-L375`** (`function`): `sock_value`
- **`L376-L383`** (`function`): `eval_socket`
- **`L384-L384`** (`function`): `eval_node`
- **`L385-L475`** (`const-fn`): `I`
- **`L538-L558`** (`function`): `eval_shader_tree`
- **`L559-L574`** (`state`): `e`
- **`L575-L622`** (`state`): `f`
- **`L623-L713`** (`state`): `v`
- **`L782-L872`** (`const-fn`): `getCut`
- **`L911-L921`** (`const-fn`): `map`
- **`L922-L926`** (`function`): `face_center`
- **`L927-L930`** (`function`): `face_normal`
- **`L931-L941`** (`function`): `rot_matrix_axis`
- **`L942-L946`** (`function`): `convexHullPoints`
- **`L947-L1010`** (`const-fn`): `key`
- **`L1011-L1022`** (`function`): `primitive_cube`
- **`L1023-L1047`** (`function`): `primitive_uv_sphere`
- **`L1048-L1058`** (`function`): `primitive_ico_sphere`
- **`L1059-L1079`** (`const-fn`): `mid`
- **`L1080-L1102`** (`function`): `primitive_cylinder`
- **`L1103-L1110`** (`function`): `primitive_plane`
- **`L1111-L1132`** (`function`): `primitive_cone`
- **`L1133-L1157`** (`function`): `primitive_torus`
- **`L1158-L1173`** (`function`): `primitive_grid`
- **`L1174-L1261`** (`function`): `primitive_monkey`
- **`L1262-L1352`** (`function`): `resolve_path`
- **`L1366-L1418`** (`state`): `pt`
- **`L1419-L1423`** (`state`): `m`
- **`L1424-L1514`** (`function`): `interpolate`
- **`L1540-L1544`** (`function`): `evaluate_object_animation`
- **`L1545-L1559`** (`state`): `poseState`
- **`L1560-L1567`** (`function`): `apply_action_frame`
- **`L1568-L1568`** (`function`): `write_path`
- **`L1569-L1595`** (`const-fn`): `blend`
- **`L1596-L1604`** (`function`): `commit_pose_state`
- **`L1605-L1606`** (`function`): `idCollection`
- **`L1607-L1623`** (`state`): `col`
- **`L1624-L1677`** (`state`): `data`
- **`L1678-L1680`** (`function`): `get_scene`
- **`L1681-L1705`** (`state`): `context`
- **`L1706-L1715`** (`function`): `new_object`
- **`L1716-L1733`** (`function`): `poseEnsureBones`
- **`L1734-L1752`** (`function`): `update_pose_matrices`
- **`L1753-L1761`** (`function`): `quatToMatrix`
- **`L1762-L1822`** (`function`): `eulerToQuat`
- **`L1823-L1828`** (`function`): `add_modifier`
- **`L1829-L1844`** (`function`): `apply_modifier_stack`
- **`L1845-L1886`** (`function`): `apply_one_modifier`
- **`L1887-L1904`** (`function`): `modArray`
- **`L1905-L1906`** (`function`): `modMirror`
- **`L1907-L1922`** (`state`): `src`
- **`L1923-L1942`** (`function`): `modSolidify`
- **`L1943-L1953`** (`function`): `vertexNormal`
- **`L1954-L1958`** (`function`): `modSubsurf`
- **`L1959-L1962`** (`function`): `subsurfOnce`
- **`L1963-L1986`** (`const-fn`): `getMid`
- **`L1987-L1992`** (`function`): `modBevel`
- **`L1993-L2000`** (`function`): `modTriangulate`
- **`L2001-L2022`** (`function`): `modDecimate`
- **`L2023-L2046`** (`function`): `modWireframe`
- **`L2047-L2057`** (`function`): `modEdgeSplit`
- **`L2058-L2061`** (`function`): `modBoolean`
- **`L2062-L2083`** (`const-fn`): `insideOther`
- **`L2084-L2087`** (`function`): `evaluated_points`
- **`L2088-L2095`** (`function`): `pointInMesh`
- **`L2096-L2112`** (`function`): `rayHitsTriangle`
- **`L2113-L2118`** (`function`): `modRemesh`
- **`L2119-L2151`** (`const-fn`): `key`
- **`L2152-L2157`** (`function`): `modScrew`
- **`L2158-L2180`** (`function`): `modSkin`
- **`L2181-L2186`** (`function`): `modBuild`
- **`L2187-L2193`** (`function`): `modMask`
- **`L2194-L2198`** (`function`): `modGeometryNodes`
- **`L2199-L2205`** (`function`): `eval_geometry_tree`
- **`L2206-L2207`** (`function`): `eval_geo_node`
- **`L2208-L2223`** (`const-fn`): `I`
- **`L2224-L2233`** (`state`): `mesh`
- **`L2234-L2256`** (`state`): `mesh`
- **`L2257-L2267`** (`state`): `out`
- **`L2268-L2280`** (`state`): `out`
- **`L2281-L2301`** (`state`): `out`
- **`L2302-L2320`** (`state`): `out`
- **`L2321-L2343`** (`state`): `out`
- **`L2344-L2358`** (`state`): `out`
- **`L2359-L2368`** (`state`): `out`
- **`L2369-L2384`** (`state`): `out`
- **`L2385-L2392`** (`function`): `eval_geo_socket`
- **`L2393-L2423`** (`function`): `modSimpleDeform`
- **`L2424-L2433`** (`function`): `modWave`
- **`L2434-L2445`** (`function`): `modDisplace`
- **`L2446-L2460`** (`function`): `modSmooth`
- **`L2461-L2470`** (`function`): `modCast`
- **`L2471-L2487`** (`function`): `modShrinkwrap`
- **`L2488-L2492`** (`function`): `modArmature`
- **`L2493-L2506`** (`function`): `modHook`
- **`L2507-L2514`** (`function`): `modWarp`
- **`L2515-L2529`** (`function`): `modCurveDeform`
- **`L2530-L2544`** (`function`): `modLattice`
- **`L2545-L2572`** (`function`): `modCloth`
- **`L2573-L2575`** (`function`): `modSoftBody`
- **`L2576-L2584`** (`function`): `modOcean`
- **`L2585-L2593`** (`function`): `modFluid`
- **`L2594-L2615`** (`function`): `modParticles`
- **`L2616-L2620`** (`function`): `sculpt_stroke`
- **`L2621-L2711`** (`const-fn`): `falloff`
- **`L2754-L2772`** (`function`): `sculpt_dyntopo`
- **`L2773-L2782`** (`function`): `uv_mark_seam`
- **`L2783-L2813`** (`function`): `uv_unwrap`
- **`L2814-L2836`** (`function`): `uv_islands`
- **`L2837-L2850`** (`state`): `island`
- **`L2851-L2854`** (`function`): `uv_smart_project`
- **`L2855-L2871`** (`function`): `uv_cube_project`
- **`L2872-L2885`** (`function`): `uv_cylinder_project`
- **`L2886-L2899`** (`function`): `uv_sphere_project`
- **`L2900-L2935`** (`function`): `uv_pack_islands`
- **`L2936-L2968`** (`function`): `uv_texel_density`
- **`L2969-L2985`** (`function`): `build_joints`
- **`L2986-L3022`** (`function`): `auto_weights`
- **`L3023-L3068`** (`function`): `skin_deform_mesh`
- **`L3069-L3079`** (`function`): `bind_armature`
- **`L3080-L3090`** (`function`): `shape_key_add`
- **`L3091-L3107`** (`function`): `shape_key_eval`
- **`L3108-L3173`** (`function`): `constraint_apply`
- **`L3174-L3176`** (`function`): `find_pose_bone`
- **`L3177-L3202`** (`function`): `solve_ik`
- **`L3203-L3213`** (`function`): `quat_mul`
- **`L3214-L3214`** (`function`): `op_result`
- **`L3215-L3305`** (`state`): `ops`
- **`L3970-L4001`** (`function`): `render_scene`
- **`L4002-L4016`** (`state`): `img`
- **`L4017-L4018`** (`function`): `raster_tri`
- **`L4019-L4084`** (`const-fn`): `proj`
- **`L4085-L4087`** (`function`): `edge`
- **`L4088-L4093`** (`function`): `collect_export_objects`
- **`L4094-L4120`** (`function`): `export_obj`
- **`L4121-L4123`** (`function`): `export_bblend`
- **`L4124-L4140`** (`state`): `doc`
- **`L4141-L4194`** (`state`): `rec`
- **`L4195-L4196`** (`function`): `export_gltf`
- **`L4197-L4211`** (`state`): `gltf`
- **`L4212-L4213`** (`const-fn`): `pushBuffer`
- **`L4214-L4223`** (`state`): `view`
- **`L4224-L4224`** (`const-fn`): `pushAccessor`
- **`L4225-L4245`** (`state`): `acc`
- **`L4246-L4275`** (`state`): `node`
- **`L4276-L4325`** (`state`): `prim`
- **`L4326-L4352`** (`state`): `skin`
- **`L4353-L4358`** (`state`): `anim`
- **`L4359-L4360`** (`state`): `interpMap`
- **`L4361-L4367`** (`state`): `sampler`
- **`L4368-L4404`** (`state`): `pathMap`
- **`L4405-L4433`** (`function`): `import_gltf`
- **`L4434-L4441`** (`function`): `decode_data_uri`
- **`L4442-L4453`** (`function`): `import_obj`
- **`L4454-L4524`** (`function`): `import_bblend`
- **`L4525-L4592`** (`state`): `pose`
- **`L4593-L4656`** (`state`): `bpy`

### `assets/full-blender-workstation.js`
- **`L12-L12`** (`const-fn`): `$`
- **`L13-L15`** (`const-fn`): `$$`
- **`L16-L32`** (`state`): `state`
- **`L33-L90`** (`function`): `boot`
- **`L91-L97`** (`function`): `resizeViewport`
- **`L98-L108`** (`function`): `camMatrix`
- **`L109-L123`** (`function`): `project`
- **`L124-L140`** (`function`): `evaluatedMesh`
- **`L141-L231`** (`function`): `drawViewport`
- **`L236-L245`** (`function`): `drawLine3d`
- **`L246-L273`** (`function`): `drawGizmo`
- **`L274-L280`** (`listener`): `vpCanvas.on(mousedown)`
- **`L281-L284`** (`listener`): `window.on(mouseup)`
- **`L285-L303`** (`listener`): `window.on(mousemove)`
- **`L304-L308`** (`listener`): `vpCanvas.on(wheel)`
- **`L309-L310`** (`listener`): `vpCanvas.on(contextmenu)`
- **`L311-L345`** (`function`): `sculptPointer`
- **`L346-L348`** (`function`): `renderOutliner`
- **`L349-L371`** (`const-fn`): `icon`
- **`L372-L387`** (`listener`): `row.on(click)`
- **`L388-L391`** (`function`): `renderProps`
- **`L392-L392`** (`const-fn`): `sect`
- **`L393-L393`** (`const-fn`): `row`
- **`L394-L394`** (`const-fn`): `num`
- **`L395-L484`** (`const-fn`): `txt`
- **`L485-L487`** (`function`): `rgbHex`
- **`L488-L490`** (`function`): `bindProps`
- **`L491-L581`** (`const-fn`): `on`
- **`L588-L595`** (`function`): `hexRgb`
- **`L596-L600`** (`function`): `resizeAnim`
- **`L601-L606`** (`function`): `drawAnimEditor`
- **`L607-L696`** (`const-fn`): `toX`
- **`L697-L705`** (`listener`): `animCanvas.on(mousedown)`
- **`L706-L717`** (`function`): `setFrame`
- **`L718-L739`** (`function`): `currentNodeTree`
- **`L740-L788`** (`function`): `drawNodeEditor`
- **`L789-L821`** (`function`): `drawUVEditor`
- **`L822-L840`** (`function`): `drawRenderPreview`
- **`L841-L848`** (`function`): `logConsole`
- **`L849-L856`** (`function`): `runConsole`
- **`L857-L873`** (`state`): `BMeshApi`
- **`L874-L886`** (`state`): `workspaceConfig`
- **`L887-L909`** (`function`): `setWorkspace`
- **`L910-L914`** (`state`): `modeLabels`
- **`L915-L926`** (`function`): `setMode`
- **`L927-L934`** (`listener`): `btn.on(click)`
- **`L935-L936`** (`listener`): `document.on(click)`
- **`L937-L940`** (`function`): `pushUndo`
- **`L941-L944`** (`function`): `exportSession`
- **`L945-L1035`** (`state`): `commands`
- **`L1114-L1128`** (`function`): `keyframe`
- **`L1129-L1149`** (`listener`): `document.on(click)`
- **`L1150-L1158`** (`function`): `togglePlay`
- **`L1159-L1170`** (`function`): `playLoop`
- **`L1171-L1183`** (`function`): `pickFile`
- **`L1184-L1193`** (`function`): `downloadFile`
- **`L1194-L1222`** (`listener`): `window.on(keydown)`
- **`L1223-L1225`** (`function`): `fillSculptTools`
- **`L1226-L1232`** (`listener`): `sel.on(change)`
- **`L1233-L1238`** (`function`): `resizeAll`
- **`L1239-L1250`** (`function`): `refreshAll`
- **`L1251-L1261`** (`listener`): `window.on(resize)`

### `assets/styles.css`
- **`L1-L23`** (`css-rule`): `:root`
- **`L24-L36`** (`css-rule`): `body`
- **`L37-L46`** (`css-rule`): `code`
- **`L47-L53`** (`css-rule`): `.container`
- **`L54-L57`** (`css-rule`): `.hidden`
- **`L58-L58`** (`css-section`): `Section: Navbar`
- **`L59-L67`** (`css-rule`): `.navbar`
- **`L68-L78`** (`css-rule`): `.nav-inner`
- **`L79-L86`** (`css-rule`): `.brand`
- **`L87-L98`** (`css-rule`): `.brand-logo`
- **`L99-L104`** (`css-rule`): `.brand-title`
- **`L105-L115`** (`css-rule`): `.brand-badge`
- **`L116-L121`** (`css-rule`): `.nav-search`
- **`L122-L133`** (`css-rule`): `.nav-search input`
- **`L134-L137`** (`css-rule`): `.nav-search input:focus`
- **`L138-L143`** (`css-rule`): `.nav-actions`
- **`L144-L153`** (`css-rule`): `.status-pill`
- **`L154-L154`** (`css-section`): `Section: Buttons`
- **`L155-L170`** (`css-rule`): `.btn`
- **`L171-L174`** (`css-rule`): `.btn:hover`
- **`L175-L179`** (`css-rule`): `.btn-lg`
- **`L180-L185`** (`css-rule`): `.btn-sm`
- **`L186-L191`** (`css-rule`): `.btn-primary`
- **`L192-L197`** (`css-rule`): `.btn-secondary`
- **`L198-L201`** (`css-rule`): `.btn-secondary:hover`
- **`L202-L207`** (`css-rule`): `.btn-danger`
- **`L208-L208`** (`css-section`): `Section: Main & Hero`
- **`L209-L214`** (`css-rule`): `.main-content`
- **`L215-L228`** (`css-rule`): `.hero`
- **`L229-L233`** (`css-rule`): `.hero-copy`
- **`L234-L241`** (`css-rule`): `.eyebrow`
- **`L242-L248`** (`css-rule`): `.hero h1`
- **`L249-L255`** (`css-rule`): `.hero p`
- **`L256-L261`** (`css-rule`): `.hero-buttons`
- **`L262-L267`** (`css-rule`): `.hero-stats`
- **`L268-L276`** (`css-rule`): `.stat-card`
- **`L277-L284`** (`css-rule`): `.stat-value`
- **`L285-L290`** (`css-rule`): `.stat-label`
- **`L291-L291`** (`css-section`): `Section: Dedicated Games & Recreated Apps Vault`
- **`L292-L298`** (`css-rule`): `.vault-section`
- **`L299-L309`** (`css-rule`): `.vault-header`
- **`L310-L315`** (`css-rule`): `.vault-header h2`
- **`L316-L321`** (`css-rule`): `.subagent-summary-pills`
- **`L322-L322`** (`css-section`): `Section: Filters Bar`
- **`L323-L331`** (`css-rule`): `.filters-bar`
- **`L332-L340`** (`css-rule`): `.type-tabs`
- **`L341-L351`** (`css-rule`): `.tab`
- **`L352-L357`** (`css-rule`): `.tab.active`
- **`L358-L363`** (`css-rule`): `.genre-pills`
- **`L364-L374`** (`css-rule`): `.genre-pill`
- **`L375-L380`** (`css-rule`): `.genre-pill.active`
- **`L381-L381`** (`css-section`): `Section: Games Grid`
- **`L382-L387`** (`css-rule`): `.games-grid`
- **`L388-L397`** (`css-rule`): `.game-card`
- **`L398-L403`** (`css-rule`): `.game-card:hover`
- **`L404-L411`** (`css-rule`): `.card-thumb-wrap`
- **`L412-L419`** (`css-rule`): `.card-thumb-wrap img`
- **`L420-L423`** (`css-rule`): `.game-card:hover .card-thumb-wrap img`
- **`L424-L433`** (`css-rule`): `.card-badges`
- **`L434-L445`** (`css-rule`): `.badge`
- **`L446-L450`** (`css-rule`): `.badge-web`
- **`L451-L455`** (`css-rule`): `.badge-download`
- **`L456-L460`** (`css-rule`): `.badge-hybrid`
- **`L461-L467`** (`css-rule`): `.card-body`
- **`L468-L473`** (`css-rule`): `.card-title`
- **`L474-L480`** (`css-rule`): `.card-desc`
- **`L481-L489`** (`css-rule`): `.card-meta`
- **`L490-L495`** (`css-rule`): `.card-actions`
- **`L496-L499`** (`css-rule`): `.card-actions .btn`
- **`L500-L500`** (`css-section`): `Section: Empty State`
- **`L501-L509`** (`css-rule`): `.empty-state`
- **`L510-L510`** (`css-section`): `Section: Modals`
- **`L511-L522`** (`css-rule`): `.modal-backdrop`
- **`L523-L535`** (`css-rule`): `.player-modal`
- **`L536-L546`** (`css-rule`): `.player-header`
- **`L547-L552`** (`css-rule`): `.player-title-wrap`
- **`L553-L557`** (`css-rule`): `.player-title-wrap h2`
- **`L558-L563`** (`css-rule`): `.player-actions`
- **`L564-L570`** (`css-rule`): `.player-viewport`
- **`L571-L577`** (`css-rule`): `.player-viewport iframe`
- **`L578-L588`** (`css-rule`): `.player-footer`
- **`L589-L593`** (`css-rule`): `.player-meta p`
- **`L594-L599`** (`css-rule`): `.player-downloads`
- **`L600-L600`** (`css-section`): `Section: Upload / Dialog Modal`
- **`L601-L611`** (`css-rule`): `.dialog-modal`
- **`L612-L619`** (`css-rule`): `.dialog-header`
- **`L620-L624`** (`css-rule`): `.dialog-header h2`
- **`L625-L632`** (`css-rule`): `.icon-close`
- **`L633-L638`** (`css-rule`): `.dialog-tabs`
- **`L639-L650`** (`css-rule`): `.dialog-tab`
- **`L651-L656`** (`css-rule`): `.dialog-tab.active`
- **`L657-L660`** (`css-rule`): `.dialog-body`
- **`L661-L672`** (`css-rule`): `.form-row`
- **`L673-L676`** (`css-rule`): `.form-group`
- **`L677-L686`** (`css-rule`): `.form-group label`
- **`L687-L700`** (`css-rule`): `.form-group textarea`
- **`L701-L704`** (`css-rule`): `.form-group textarea:focus`
- **`L705-L714`** (`css-rule`): `.dropzone`
- **`L715-L721`** (`css-rule`): `.dropzone input[type='file']`
- **`L722-L729`** (`css-rule`): `.dropzone-text`
- **`L730-L733`** (`css-rule`): `.dropzone-text strong`
- **`L734-L739`** (`css-rule`): `.selected-files`
- **`L740-L749`** (`css-rule`): `.form-status`
- **`L750-L755`** (`css-rule`): `.form-status.error`
- **`L756-L762`** (`css-rule`): `.dialog-footer`
- **`L763-L768`** (`css-rule`): `.helper-text`
- **`L769-L781`** (`css-rule`): `.code-box`
- **`L782-L787`** (`css-rule`): `.agent-cli-reference h4`
- **`L788-L788`** (`css-section`): `Section: Footer`
- **`L789-L795`** (`css-rule`): `.footer`
- **`L796-L802`** (`css-rule`): `.footer-inner`

### `blender-studio.html`
- **`L7-L125`** (`html-style`): `<style> block`
- **`L128-L163`** (`dom-section`): `#app (div)`
- **`L130-L165`** (`dom-section`): `#menubar (div)`
- **`L197-L232`** (`dom-section`): `#workspaces (div)`
- **`L212-L247`** (`dom-section`): `#main (div)`
- **`L213-L248`** (`dom-section`): `#outliner-col (div)`
- **`L215-L250`** (`dom-section`): `#outliner-tree (div)`
- **`L218-L253`** (`dom-section`): `#viewport-col (div)`
- **`L220-L255`** (`dom-section`): `#vp-wrap (div)`
- **`L222-L257`** (`dom-section`): `#vp-overlay (div)`
- **`L239-L274`** (`dom-section`): `#sculpt-tools (div)`
- **`L245-L280`** (`dom-section`): `#vp-stats (div)`
- **`L250-L285`** (`dom-section`): `#uv-wrap (div)`
- **`L263-L298`** (`dom-section`): `#node-wrap (div)`
- **`L278-L313`** (`dom-section`): `#render-wrap (div)`
- **`L280-L315`** (`dom-section`): `#render-actions (div)`
- **`L287-L322`** (`dom-section`): `#script-wrap (div)`
- **`L288-L323`** (`dom-section`): `#console-wrap (div)`
- **`L289-L324`** (`dom-section`): `#console-out (div)`
- **`L290-L325`** (`dom-section`): `#console-bar (div)`
- **`L299-L334`** (`dom-section`): `#compositor-wrap (div)`
- **`L304-L339`** (`dom-section`): `#props-col (div)`
- **`L305-L340`** (`dom-section`): `#props-tabs (div)`
- **`L321-L356`** (`dom-section`): `#props-content (div)`
- **`L326-L361`** (`dom-section`): `#timeline-col (div)`
- **`L352-L368`** (`dom-section`): `#statusbar (div)`
- **`L364-L364`** (`html-script`): `<script> block`
- **`L365-L365`** (`html-script`): `<script> block`

### `CLAUDE.md`
- **`L1-L2`** (`md-h1`): `CLAUDE.md — Arena.ai Agent Guide`
- **`L3-L16`** (`md-h2`): `🚨 RULE 0 — BUILD MODE (BEFORE ANYTHING ELSE)`
- **`L17-L33`** (`md-h2`): `Quick Commands`

### `games/astra-3d-overdrive/index.html`
- **`L7-L116`** (`html-style`): `<style> block`
- **`L119-L154`** (`dom-section`): `#viewport (div)`
- **`L132-L167`** (`dom-section`): `#overlay (div)`
- **`L140-L483`** (`html-script`): `<script> block`
- **`L170-L186`** (`function`): `synth`
- **`L187-L187`** (`state`): `keys`
- **`L188-L188`** (`listener`): `window.on(keydown)`
- **`L189-L191`** (`listener`): `window.on(keyup)`
- **`L192-L192`** (`listener`): `canvas.on(mousedown)`
- **`L193-L200`** (`listener`): `window.on(mouseup)`
- **`L201-L212`** (`state`): `state`
- **`L213-L225`** (`function`): `startGame`
- **`L226-L227`** (`listener`): `startBtn.on(click)`
- **`L228-L234`** (`function`): `project3D`
- **`L235-L290`** (`function`): `drawMesh3D`
- **`L291-L381`** (`function`): `loop`

### `games/astral-odyssey-film/index.html`
- **`L7-L186`** (`html-style`): `<style> block`
- **`L212-L247`** (`dom-section`): `#shotHudMeta (div)`
- **`L216-L251`** (`dom-section`): `#poseHudMeta (div)`
- **`L221-L256`** (`dom-section`): `#subSpeaker (div)`
- **`L222-L257`** (`dom-section`): `#subLine (div)`
- **`L235-L270`** (`dom-section`): `#actButtons (div)`
- **`L244-L279`** (`dom-section`): `#overridePoseButtons (div)`
- **`L257-L516`** (`html-script`): `<script> block`
- **`L289-L294`** (`function`): `formatMMSS`
- **`L295-L299`** (`listener`): `playPauseBtn.on(click)`
- **`L300-L306`** (`listener`): `renderModeBtn.on(click)`
- **`L307-L311`** (`listener`): `toggleBonesBtn.on(click)`
- **`L312-L316`** (`listener`): `toggleAudioBtn.on(click)`
- **`L317-L321`** (`listener`): `timelineSlider.on(input)`
- **`L322-L331`** (`listener`): `btn.on(click)`
- **`L332-L339`** (`listener`): `btn.on(click)`
- **`L340-L348`** (`listener`): `window.on(keydown)`
- **`L349-L382`** (`function`): `drawBackground3DProp`
- **`L383-L473`** (`function`): `loop`

### `games/cyber-serpent/index.html`
- **`L7-L88`** (`html-style`): `<style> block`
- **`L91-L126`** (`dom-section`): `#stage (div)`
- **`L98-L133`** (`dom-section`): `#modal (div)`
- **`L105-L283`** (`html-script`): `<script> block`
- **`L135-L144`** (`function`): `randomFreeCell`
- **`L145-L163`** (`function`): `startGame`
- **`L164-L168`** (`function`): `updateHud`
- **`L169-L175`** (`listener`): `window.on(keydown)`
- **`L176-L179`** (`listener`): `window.on(keyup)`
- **`L180-L182`** (`listener`): `playBtn.on(click)`
- **`L183-L200`** (`function`): `loop`
- **`L201-L282`** (`state`): `head`

### `games/dungeon-crawler-py/dungeon_crawler.py`
- **`L15-L15`** (`py-class`): `class Game`
- **`L16-L27`** (`py-def`): `def __init__`
- **`L28-L45`** (`py-def`): `def generate_floor`
- **`L46-L70`** (`py-def`): `def render`
- **`L71-L107`** (`py-def`): `def step`
- **`L108-L141`** (`py-def`): `def main`

### `games/dungeon-crawler-py/index.html`
- **`L7-L124`** (`html-style`): `<style> block`
- **`L139-L174`** (`dom-section`): `#map (div)`
- **`L146-L181`** (`dom-section`): `#log (div)`
- **`L160-L301`** (`html-script`): `<script> block`
- **`L164-L179`** (`function`): `initGame`
- **`L180-L201`** (`function`): `genFloor`
- **`L202-L206`** (`function`): `addLog`
- **`L207-L256`** (`function`): `move`
- **`L257-L268`** (`function`): `drink`
- **`L269-L291`** (`function`): `render`
- **`L292-L300`** (`listener`): `window.on(keydown)`

### `games/neon-blaster/index.html`
- **`L7-L109`** (`html-style`): `<style> block`
- **`L112-L147`** (`dom-section`): `#wrap (div)`
- **`L125-L160`** (`dom-section`): `#overlay (div)`
- **`L132-L499`** (`html-script`): `<script> block`
- **`L150-L166`** (`function`): `beep`
- **`L167-L167`** (`state`): `keys`
- **`L168-L169`** (`state`): `mouse`
- **`L170-L175`** (`listener`): `window.on(keydown)`
- **`L176-L177`** (`listener`): `window.on(keyup)`
- **`L178-L182`** (`listener`): `canvas.on(mousemove)`
- **`L183-L183`** (`listener`): `canvas.on(mousedown)`
- **`L184-L192`** (`listener`): `window.on(mouseup)`
- **`L193-L205`** (`state`): `state`
- **`L206-L228`** (`function`): `resetGame`
- **`L229-L237`** (`function`): `updateHud`
- **`L238-L256`** (`function`): `spawnEnemy`
- **`L257-L271`** (`function`): `burst`
- **`L272-L278`** (`listener`): `startBtn.on(click)`
- **`L279-L369`** (`function`): `loop`

### `games/ps5-os-clone/index.html`
- **`L7-L359`** (`html-style`): `<style> block`
- **`L365-L400`** (`dom-section`): `#trophyToast (div)`
- **`L369-L404`** (`dom-section`): `#trophyName (div)`
- **`L435-L470`** (`dom-section`): `#controlCenter (div)`
- **`L445-L480`** (`dom-section`): `#settingsModal (div)`
- **`L474-L509`** (`dom-section`): `#restModal (div)`
- **`L481-L843`** (`html-script`): `<script> block`
- **`L575-L585`** (`function`): `renderTiles`
- **`L586-L599`** (`listener`): `el.on(click)`
- **`L600-L605`** (`function`): `selectTile`
- **`L606-L612`** (`function`): `cycle3dModel`
- **`L613-L613`** (`function`): `updateModelLabel`
- **`L614-L626`** (`state`): `labels`
- **`L627-L638`** (`function`): `triggerTrophy`
- **`L639-L649`** (`listener`): `primaryPlayBtn.on(click)`
- **`L650-L657`** (`listener`): `switch3dModelBtn.on(click)`
- **`L658-L697`** (`function`): `toggleControlCenter`
- **`L698-L705`** (`listener`): `tab.on(click)`
- **`L706-L715`** (`listener`): `window.on(keydown)`
- **`L716-L730`** (`function`): `updateClock`
- **`L731-L736`** (`listener`): `window.on(mousedown)`
- **`L737-L737`** (`listener`): `window.on(mouseup)`
- **`L738-L753`** (`listener`): `window.on(mousemove)`
- **`L754-L760`** (`function`): `getActiveMesh`
- **`L761-L842`** (`function`): `renderLoop`

### `games/README.md`
- **`L1-L4`** (`md-h1`): ``games/` Directory`
- **`L5-L10`** (`md-h2`): `Adding a Game`

### `games/valkyrie-4k-horizon/index.html`
- **`L7-L135`** (`html-style`): `<style> block`
- **`L138-L173`** (`dom-section`): `#shell (div)`
- **`L151-L186`** (`dom-section`): `#bossTitle (div)`
- **`L153-L188`** (`dom-section`): `#bossHpFill (div)`
- **`L166-L201`** (`dom-section`): `#playerHpFill (div)`
- **`L182-L507`** (`html-script`): `<script> block`
- **`L220-L232`** (`state`): `player`
- **`L233-L256`** (`function`): `spawnWave`
- **`L257-L265`** (`state`): `names`
- **`L266-L266`** (`state`): `keys`
- **`L267-L272`** (`listener`): `window.on(keydown)`
- **`L273-L273`** (`listener`): `window.on(keyup)`
- **`L274-L275`** (`listener`): `canvas.on(mousedown)`
- **`L276-L303`** (`function`): `triggerSwordSlash`
- **`L304-L327`** (`function`): `triggerNovaSlam`
- **`L328-L369`** (`function`): `draw3DMeshOnStage`
- **`L370-L460`** (`function`): `loop`

### `index.html`
- **`L43-L78`** (`dom-section`): `#heroSection (section)`
- **`L60-L95`** (`dom-section`): `#statTotal (div)`
- **`L64-L99`** (`dom-section`): `#statWeb (div)`
- **`L68-L103`** (`dom-section`): `#statDownload (div)`
- **`L75-L110`** (`dom-section`): `#gamesVaultSection (section)`
- **`L89-L124`** (`dom-section`): `#typeTabs (div)`
- **`L95-L130`** (`dom-section`): `#genrePills (div)`
- **`L99-L134`** (`dom-section`): `#gamesGrid (div)`
- **`L100-L135`** (`dom-section`): `#emptyState (div)`
- **`L108-L143`** (`dom-section`): `#playerModal (div)`
- **`L123-L158`** (`dom-section`): `#playerViewport (div)`
- **`L132-L167`** (`dom-section`): `#playerDownloads (div)`
- **`L138-L173`** (`dom-section`): `#uploadModal (div)`
- **`L152-L187`** (`dom-section`): `#uploadTab (div)`
- **`L153-L188`** (`dom-section`): `#uploadForm (form)`
- **`L192-L227`** (`dom-section`): `#fileDropzone (div)`
- **`L198-L233`** (`dom-section`): `#selectedFilesList (div)`
- **`L202-L237`** (`dom-section`): `#uploadStatusMsg (div)`
- **`L212-L247`** (`dom-section`): `#arenaTab (div)`
- **`L249-L282`** (`dom-section`): `#repoSearchTab (div)`
- **`L279-L279`** (`html-script`): `<script> block`

### `memory/3D_MODELING_PROMPT.md`
- **`L1-L7`** (`md-h1`): `🧊 3D MODELING & AI-BLENDER MASTER PROMPT (`memory/3D_MODELING_PROMPT.md`)`
- **`L8-L9`** (`md-h2`): `1. Two Ways to Get High-Detail 3D Models`
- **`L10-L12`** (`md-h3`): `Path A: Fetch Online 3D Model Files (`.gltf`, `.glb`, `.obj`)`
- **`L13-L18`** (`md-h1`): `Fetch from curated Khronos / GitHub 3D repositories or any raw GitHub .gltf/.glb/.obj URL`
- **`L19-L52`** (`md-h3`): `Path B: Design & Build Models in the AI-Blender Engine (`assets/ai-blender-engine.js`)`
- **`L53-L60`** (`md-h2`): `2. The 4 Dedicated 3D Modeling Sub-Agents`

### `memory/ANIMATION_FILM_PROMPT.md`
- **`L1-L6`** (`md-h1`): `🎬 2D/3D BLENDER-GRADE ANIMATION & 20-MINUTE FILM CONTINUITY PROMPT (`memory/ANIMATION_FILM_PROMPT.md`)`
- **`L7-L19`** (`md-h2`): `1. Anti-Slop Animation Standard (The 12 Principles of Animation)`
- **`L20-L26`** (`md-h2`): `2. Dual 2D (Anime/Cel) & 3D (Blender PBR) Rendering`
- **`L27-L29`** (`md-h2`): `3. Open-Source Animation Libraries & 60fps Baking (`npm run animate`)`
- **`L30-L35`** (`md-h1`): `1. Fetch open-source rigged & animated 3D models from Khronos glTF Sample Repository`
- **`L36-L38`** (`md-h1`): `2. Bake a 60fps skeletal animation clip (walk, run, sword-combo, heroic-land, dialogue-acting, flight-soar)`
- **`L39-L44`** (`md-h1`): `3. Verify 20-minute (1,200s) 5-Act Film Continuity & Camera Cuts`
- **`L45-L49`** (`md-h2`): `4. Long-Form (20+ Minute) Animated Film Architecture`

### `memory/BEAST_MODE_PROMPT.md`
- **`L1-L6`** (`md-h1`): `🔥 ARENA BEAST MODE: UHD 4K AAA ENGINE, WEB/VIDEO RESEARCH & CLAUDE+FABLE PROTOCOL (`memory/BEAST_MODE_PROMPT.md`)`
- **`L7-L21`** (`md-h2`): `1. Web Search & Video/Tutorial Breakdown Protocol (`npm run omni`)`
- **`L22-L30`** (`md-h2`): `2. UHD 4K (3840×2160) AAA Graphics & Gameplay Standard (`assets/aaa-4k-engine.js`)`
- **`L31-L36`** (`md-h2`): `3. Claude-Grade Code Architecture + Fable-Grade Interactive Storytelling`

### `memory/DEEP_RESEARCH_PROMPT.md`
- **`L1-L6`** (`md-h1`): `🔬 DEEP APP/GAME RESEARCH, AAA VISUAL POLISH & UNRESTRICTED CREATION PROMPT (`memory/DEEP_RESEARCH_PROMPT.md`)`
- **`L7-L16`** (`md-h2`): `1. Deep Research & 100% Functional Recreation Protocol`
- **`L17-L29`** (`md-h2`): `2. Ultra-Nice AAA Visual & Audio Polish Standard`
- **`L30-L36`** (`md-h2`): `3. Unrestricted Creation Policy (Everything Except Hacks / Malware / RATs)`

### `memory/FULL_BLENDER_BPY_PROMPT.md`
- **`L1-L6`** (`md-h1`): `🎬 FULL BLENDER `bpy` SYSTEM — AI Build, Rig & Animate Directive (`memory/FULL_BLENDER_BPY_PROMPT.md`)`
- **`L7-L24`** (`md-h2`): `1. THE THREE ENTRY POINTS`
- **`L25-L28`** (`md-h2`): `2. `bpy.data` — FULL ID DATABLOCKS`
- **`L29-L41`** (`md-h2`): `3. `bpy.ops` — FULL OPERATOR SET`
- **`L42-L45`** (`md-h2`): `4. `bmesh` — TOPOLOGY ENGINE`
- **`L46-L49`** (`md-h2`): `5. MODIFIER STACK — 28+ TYPES`
- **`L50-L91`** (`md-h2`): `6. 🌉 SEAMLESS MODEL → RIG → ANIMATE PIPELINE (the whole point)`
- **`L92-L99`** (`md-h2`): `7. ANIMATION SYSTEM`
- **`L100-L105`** (`md-h2`): `8. EXPORTS (all self-contained)`
- **`L106-L109`** (`md-h2`): `9. WORKSTATION (`blender-studio.html`)`
- **`L110-L117`** (`md-h2`): `10. RULES FOR THE AI`

### `memory/MASTER_PROMPT.md`
- **`L1-L7`** (`md-h1`): `⚡ MASTER AGENT SYSTEM PROMPT (`memory/MASTER_PROMPT.md`)`
- **`L8-L17`** (`md-h2`): `DIRECTIVE 0: BUILD MODE — CODE FIRST, NEVER NARRATE THE REPO (HIGHEST PRIORITY, OVERRIDES ALL)`
- **`L18-L28`** (`md-h2`): `DIRECTIVE 1: NEVER STOP RANDOMLY (CONTINUOUS END-TO-END EXECUTION)`
- **`L29-L48`** (`md-h2`): `DIRECTIVE 2: SURGICAL CHUNK READING & EDITING (NO FULL-FILE RE-READS)`
- **`L49-L71`** (`md-h2`): `DIRECTIVE 3: SUB-AGENT ORCHESTRATION (4 MODELING + 8 CODING/RESEARCH SUB-AGENTS)`
- **`L72-L77`** (`md-h2`): `DIRECTIVE 4: AI-BLENDER 3D MODELING & ONLINE 3D ASSETS (`memory/3D_MODELING_PROMPT.md`)`
- **`L78-L88`** (`md-h2`): `DIRECTIVE 5: DEEP APP/GAME RESEARCH, PERSONAL SANDBOX FULL CLONES (PS5/OS/APPS) & AAA VISUALS (`memory/PERSONAL_SANDBOX_CLONE_PROMPT.md`)`

### `memory/PERSONAL_SANDBOX_CLONE_PROMPT.md`
- **`L1-L6`** (`md-h1`): `🎮 PERSONAL SANDBOX FULL-CLONE & CONSOLE/OS/APP RECREATION DIRECTIVE (`memory/PERSONAL_SANDBOX_CLONE_PROMPT.md`)`
- **`L7-L16`** (`md-h2`): `1. Zero False Refusals on Personal-Use Clones (PS5, Consoles, OS, Apps, Games)`
- **`L17-L31`** (`md-h2`): `2. Mandatory Chunk Editing (`npm run chunk-edit`)`
- **`L32-L35`** (`md-h2`): `3. Anti-Stop Continuous Coding Enforcement (`npm run enforce`)`

### `README.md`
- **`L1-L6`** (`md-h1`): `🎮 Arena.ai Game Hub (`ADS615/Arena.ai`)`
- **`L7-L23`** (`md-h2`): `✨ What's Included`
- **`L24-L25`** (`md-h2`): `🚀 Quick Start (For Arena Agents & Developers)`
- **`L26-L31`** (`md-h3`): `1. Start the Live Arcade Hub & Upload Server`
- **`L32-L33`** (`md-h3`): `2. Scaffold a New Game`
- **`L34-L36`** (`md-h1`): `Browser HTML5 / Canvas game`
- **`L37-L40`** (`md-h1`): `Downloadable Python / Desktop build`
- **`L41-L50`** (`md-h3`): `3. Sync & Validate the Game Catalog`
- **`L51-L75`** (`md-h2`): `📂 Repository Structure`

### `scripts/ai-animator.mjs`
- **`L20-L27`** (`state`): `OPEN_SOURCE_ANIMATED_RIGS`
- **`L28-L47`** (`function`): `bakeAnimationClip`
- **`L48-L75`** (`function`): `fetchAnimatedRig`
- **`L76-L116`** (`state`): `args`

### `scripts/ai-blender.mjs`
- **`L32-L38`** (`state`): `ONLINE_GITHUB_MODELS`
- **`L39-L121`** (`function`): `buildModelFromRecipe`
- **`L122-L136`** (`function`): `saveMeshToFile`
- **`L137-L164`** (`function`): `downloadOnlineModel`
- **`L165-L175`** (`state`): `args`
- **`L176-L210`** (`state`): `recipe`

### `scripts/anti-stop-enforcer.mjs`
- **`L23-L64`** (`function`): `runAntiStopEnforcement`
- **`L65-L95`** (`state`): `statusReport`

### `scripts/bpy-full.mjs`
- **`L39-L53`** (`state`): `PRESETS`
- **`L54-L91`** (`function`): `buildInterceptorShip`
- **`L92-L109`** (`function`): `buildHeroCharacter`
- **`L110-L130`** (`function`): `buildMech`
- **`L131-L136`** (`function`): `autoRigChain`
- **`L137-L166`** (`function`): `rigCurrentModel`
- **`L167-L187`** (`function`): `bakeWalkCycle`
- **`L188-L198`** (`function`): `printHelp`
- **`L199-L201`** (`function`): `main`
- **`L202-L259`** (`const-fn`): `flag`
- **`L260-L303`** (`state`): `writer`

### `scripts/chunk-editor.mjs`
- **`L16-L54`** (`function`): `locateChunk`
- **`L55-L77`** (`function`): `readChunkOnly`
- **`L78-L143`** (`function`): `replaceChunkOnly`

### `scripts/chunk-tool.mjs`
- **`L25-L45`** (`state`): `FILE_DESCRIPTIONS`
- **`L46-L64`** (`function`): `walkRepo`
- **`L65-L106`** (`function`): `extractJsChunks`
- **`L107-L156`** (`function`): `extractHtmlChunks`
- **`L157-L196`** (`function`): `extractCssChunks`
- **`L197-L226`** (`function`): `extractPythonChunks`
- **`L227-L255`** (`function`): `extractMarkdownChunks`
- **`L256-L327`** (`function`): `buildMemoryIndex`
- **`L328-L333`** (`state`): `treeData`
- **`L334-L390`** (`state`): `chunkData`
- **`L391-L481`** (`function`): `findChunks`

### `scripts/deep-research.mjs`
- **`L8-L51`** (`function`): `generateDeepResearchBlueprint`
- **`L52-L72`** (`state`): `args`

### `scripts/dev-server.mjs`
- **`L11-L33`** (`state`): `MIME_TYPES`
- **`L34-L41`** (`function`): `slugify`
- **`L42-L53`** (`function`): `sendJson`
- **`L54-L97`** (`function`): `readJsonBody`
- **`L98-L107`** (`route`): `route:/api/status`
- **`L108-L117`** (`route`): `route:/api/search`
- **`L118-L123`** (`route`): `route:/api/games`
- **`L124-L129`** (`route`): `route:/api/games/sync`
- **`L130-L215`** (`route`): `route:/api/games`
- **`L216-L250`** (`state`): `manifest`
- **`L251-L265`** (`route`): `route:/`
- **`L266-L290`** (`state`): `headers`

### `scripts/new-game.mjs`
- **`L8-L15`** (`function`): `slugify`
- **`L16-L16`** (`function`): `parseArgs`
- **`L17-L55`** (`state`): `args`
- **`L56-L112`** (`function`): `createNewGame`
- **`L113-L153`** (`state`): `manifest`

### `scripts/omni-intelligence.mjs`
- **`L13-L52`** (`function`): `createOmniBlueprint`
- **`L53-L83`** (`state`): `args`

### `scripts/repo-search.mjs`
- **`L17-L107`** (`state`): `SUBSYSTEM_MAP`
- **`L111-L143`** (`function`): `listExportedApis`
- **`L144-L173`** (`function`): `searchRepo`
- **`L174-L208`** (`state`): `mapResult`
- **`L209-L293`** (`function`): `matchesText`
- **`L294-L356`** (`state`): `opts`

### `scripts/subagents.mjs`
- **`L123-L127`** (`function`): `ensureSubagentRegistry`
- **`L128-L152`** (`state`): `initial`
- **`L153-L191`** (`function`): `runSyntaxQa`
- **`L192-L231`** (`function`): `runUiAuditor`
- **`L232-L292`** (`function`): `executeSingleAgent`
- **`L293-L304`** (`function`): `runAgentInWorker`
- **`L305-L323`** (`function`): `runParallelSubagents`
- **`L324-L343`** (`function`): `createCustomSubagent`
- **`L344-L356`** (`function`): `run`
- **`L357-L388`** (`state`): `entry`
- **`L389-L418`** (`state`): `args`

### `scripts/sync-games.mjs`
- **`L20-L25`** (`function`): `humanizeSlug`
- **`L26-L38`** (`function`): `extractHtmlTitle`
- **`L39-L44`** (`function`): `formatFileSize`
- **`L45-L77`** (`function`): `inferPlatformFromExt`
- **`L78-L129`** (`function`): `generateDefaultThumbnailSvg`
- **`L130-L220`** (`function`): `syncGames`
- **`L240-L263`** (`state`): `normalizedManifest`
- **`L264-L279`** (`state`): `toSave`
- **`L280-L299`** (`state`): `registry`

### `scripts/validate-games.mjs`
- **`L1-L57`** (`file`): `full-file`

### `subagents/asset-optimizer.mjs`
- **`L5-L26`** (`function`): `run`

### `subagents/chunk-health.mjs`
- **`L5-L24`** (`function`): `run`

### `subagents/coder-deep-research.mjs`
- **`L3-L15`** (`function`): `run`

### `subagents/coder-visual-polish.mjs`
- **`L4-L18`** (`function`): `run`

### `subagents/modeler-materials-shaders.mjs`
- **`L3-L16`** (`function`): `run`

### `subagents/modeler-mesh.mjs`
- **`L3-L14`** (`function`): `run`

### `subagents/modeler-modifiers-sculpt.mjs`
- **`L10-L24`** (`function`): `run`

### `subagents/modeler-rig-anim-export.mjs`
- **`L6-L22`** (`function`): `run`

### `templates/downloadable/index.html`
- **`L7-L62`** (`html-style`): `<style> block`

### `templates/downloadable/main.py`
- **`L11-L38`** (`py-def`): `def main`

### `templates/web-3d-blender/index.html`
- **`L7-L27`** (`html-style`): `<style> block`
- **`L31-L70`** (`html-script`): `<script> block`
- **`L38-L69`** (`function`): `loop`

### `templates/web-canvas/index.html`
- **`L7-L48`** (`html-style`): `<style> block`
- **`L51-L86`** (`dom-section`): `#hud (div)`
- **`L57-L114`** (`html-script`): `<script> block`
- **`L62-L62`** (`state`): `keys`
- **`L63-L63`** (`listener`): `window.on(keydown)`
- **`L64-L66`** (`listener`): `window.on(keyup)`
- **`L67-L67`** (`state`): `player`
- **`L68-L69`** (`state`): `orb`
- **`L70-L75`** (`function`): `respawnOrb`
- **`L76-L113`** (`function`): `loop`

