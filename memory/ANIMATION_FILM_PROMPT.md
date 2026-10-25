# 🎬 2D/3D BLENDER-GRADE ANIMATION & 20-MINUTE FILM CONTINUITY PROMPT (`memory/ANIMATION_FILM_PROMPT.md`)

> **ACTIVE DIRECTIVE FOR 2D/3D CHARACTER ANIMATION, OPEN-SOURCE MOTION LIBRARIES & LONG-FORM ANIMATED FILMS**

---

## 1. Anti-Slop Animation Standard (The 12 Principles of Animation)
Never produce stiff, sliding, or inconsistent animations. Every 2D and 3D character or vehicle animation must use **`assets/ai-animation-studio.js`** and follow Blender/Disney animation principles:
1. **Character Bible & Continuity Lock (`createCharacterBible`)**:
   - Lock exact character proportions (`headRatio`, `torsoRatio`, `armRatio`, `legRatio`), colors, PBR shaders, and skeleton topology (`BIPED_HUMANOID_24_BONE_V2`) across every shot from `00:00` to `20:00+` so characters never drift or morph.
2. **Volume-Preserving Squash & Stretch (`AnimCurves.squashAndStretchVolume`)**:
   - When a character or object compresses on `Y` by `s`, scale `X` and `Z` by `1 / Math.sqrt(s)` so mass and volume stay physically believable.
3. **Anticipation, Arcs & Follow-Through (`evaluateCharacterPose`)**:
   - Every jump, strike, or turn begins with an anticipation wind-up dip, follows curved angular arcs, and drives secondary follow-through motion on capes, hair, and limbs.
4. **Phoneme Lip-Sync & Eye Blink Controller**:
   - Sync jaw/mouth openness (`mouthOpen`) and natural eye blinks (`eyeBlink`) to dialogue beats.

---

## 2. Dual 2D (Anime/Cel) & 3D (Blender PBR) Rendering
- Use `renderRiggedCharacter(ctx, { bible, pose, mode: '3d' | '2d', showBones })` from `assets/ai-animation-studio.js` to support **both**:
  - **`mode: '3d'`**: Specular PBR-shaded 3D cylindrical/sculpted limbs with emissive cores and 3D AI-Blender background props.
  - **`mode: '2d'`**: Crisp hand-inked 2D Anime / Cel-Shaded vector characters with bold outlines and cel shadow bands.

---

## 3. Open-Source Animation Libraries & 60fps Baking (`npm run animate`)
Use `scripts/ai-animator.mjs` (`npm run animate`) to pull open-source rigged & animated glTF models or bake 60fps skeletal animation clips:
```bash
# 1. Fetch open-source rigged & animated 3D models from Khronos glTF Sample Repository
npm run animate -- fetch --rig fox --out games/<slug>/models/fox.gltf
npm run animate -- fetch --rig cesiumMan --out games/<slug>/models/cesiumMan.gltf
npm run animate -- fetch --rig brainStem --out games/<slug>/models/brainStem.gltf
npm run animate -- fetch --rig riggedFigure --out games/<slug>/models/riggedFigure.gltf

# 2. Bake a 60fps skeletal animation clip (walk, run, sword-combo, heroic-land, dialogue-acting, flight-soar)
npm run animate -- bake --action sword-combo --duration 3 --fps 60 --out games/<slug>/sword-combo.json

# 3. Verify 20-minute (1,200s) 5-Act Film Continuity & Camera Cuts
npm run animate -- verify-film
```

---

## 4. Long-Form (20+ Minute) Animated Film Architecture
Reference **`games/astral-odyssey-film/`** (*Chronicles of the Astral Core — 20:00 Full Animated Film*) when building animated shorts or full movies:
- Structure timelines hierarchically: **Acts (5 Acts x 4 Minutes = 20:00) -> Scenes -> Camera Cuts (Wide, Medium Two-Shot, Hero Close-Up, Dynamic Tracking) -> Dialogue & Action Beats**.
- Always include a scrubbable `00:00 / 20:00` timeline bar, Act jump buttons, NLA Pose Override mixer, Bone/F-Curve Graph Inspector toggle (`B` key), and live **2D/3D Render Mode** switch (`M` key).
