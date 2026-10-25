# 🧊 3D MODELING & AI-BLENDER MASTER PROMPT (`memory/3D_MODELING_PROMPT.md`)

> **ACTIVE DIRECTIVE FOR 3D MODELING, ONLINE 3D ASSET FETCHING, AND AI-BLENDER CREATION**
> Whenever a game or app needs 3D models, vehicles, characters, weapons, props, environments, or visual assets, use the **AI-Blender 3D Engine** (`assets/ai-blender-engine.js` & `scripts/ai-blender.mjs`) and the **4 Dedicated Modeling Sub-Agents**.

---

## 1. Two Ways to Get High-Detail 3D Models

### Path A: Fetch Online 3D Model Files (`.gltf`, `.glb`, `.obj`)
Use the AI-Blender CLI fetcher (or `web_search` / `fetch_page` + GitHub raw URLs) to pull real 3D model files directly into `games/<slug>/models/`:
```bash
# Fetch from curated Khronos / GitHub 3D repositories or any raw GitHub .gltf/.glb/.obj URL
npm run blender -- fetch --model duck --out games/<slug>/models/duck.gltf
npm run blender -- fetch --model damagedHelmet --out games/<slug>/models/helmet.glb
npm run blender -- fetch --url "https://raw.githubusercontent.com/<org>/<repo>/main/model.gltf" --out games/<slug>/models/model.gltf
```

### Path B: Design & Build Models in the AI-Blender Engine (`assets/ai-blender-engine.js`)
The AI has its own code-driven + visual **Blender Studio** (`blender-studio.html`, `assets/ai-blender-engine.js`, `scripts/ai-blender.mjs`) with **zero limitations**:
- **Mesh Primitives**:
  - `createCube({ size })`
  - `createSphere({ radius, segments, rings })`
  - `createCylinder({ radiusTop, radiusBottom, height, segments })`
  - `createCone({ radius, height, segments })`
  - `createTorus({ radius, tube, radialSegments, tubularSegments })`
  - `createLatheMesh({ profile, segments })` (Revolve 2D curves into thrusters, vases, pillars, barrels)
- **High-Detail Multi-Part Presets**:
  - `createPresetModel('interceptor-ship' | 'cyber-mech' | 'hyper-car' | 'plasma-sword' | 'crystal-cluster' | 'asteroid')`
- **Edit Mode Mesh Operations**:
  - `transformMesh(mesh, { translate, rotate, scale })`
  - `mergeMeshes([meshA, meshB, ...], name)`
  - `extrudeFaces(mesh, { distance, scale, filterNormalY })`
  - `subdivideMesh(mesh, { levels, smooth })` (Catmull-Clark style subdivision smoothing)
  - `computeVertexNormals(mesh)`
- **Non-Destructive Modifiers Stack**:
  - `modifierMirror(mesh, { axis: 'x'|'y'|'z', offset })`
  - `modifierArray(mesh, { count, offset, radial })`
  - `modifierDeform(mesh, { mode: 'twist'|'taper'|'bend', factor })`
  - `modifierDisplaceNoise(mesh, { amplitude, frequency, seed })` (3D Fractional Brownian Motion terrain/rock/organic displacement)
  - `modifierSolidify(mesh, { thickness })`
- **Sculpt Mode Brushes**:
  - `sculptBrush(mesh, { mode: 'inflate'|'grab'|'pinch', center, radius, strength, delta, symmetryX })`
- **Principled BSDF PBR Materials**:
  - `createPrincipledBSDF({ baseColor, metallic, roughness, emissive, emissiveIntensity, clearcoat, transmission, ior, wireframe })`
- **Exporters**:
  - `exportToOBJ(mesh)` — Wavefront `.obj`
  - `exportToGLTF(mesh)` — glTF 2.0 `.gltf`
  - `exportToJSModule(mesh)` — ES module `.js` ready to `import` in any browser game

---

## 2. The 4 Dedicated 3D Modeling Sub-Agents

Out of the sub-agent pool, **4 sub-agents are dedicated exclusively to 3D Modeling**:
1. **`modeler-mesh`** (*3D Base Mesh & Topology Sub-Agent*): Builds base primitives, multi-part kitbashed assemblies, lathe profiles, and face extrusions.
2. **`modeler-modifiers-sculpt`** (*Modifiers, Deform & Sculpt Sub-Agent*): Applies Subdivision Surface smoothing, X/Y/Z Mirroring, Radial/Linear Arrays, Twist/Taper/Bend deformations, Noise Displacement, and Sculpt brushes.
3. **`modeler-materials-shaders`** (*Principled BSDF & Lighting Sub-Agent*): Configures metallic/roughness PBR shaders, emissive neon glow, clearcoat car paint, and 3-point studio lighting.
4. **`modeler-rig-anim-export`** (*Rigging, Animation & Asset Export Sub-Agent*): Exports `.obj`, `.gltf`, and `.js` model bundles into `games/<slug>/models/` and validates vertex/face counts.
