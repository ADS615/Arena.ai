# 🎬 FULL BLENDER `bpy` SYSTEM — AI Build, Rig & Animate Directive (`memory/FULL_BLENDER_BPY_PROMPT.md`)

> **PURPOSE**: Give every Arena session a complete 1-for-1 Blender `bpy` + `bmesh` engine so the AI can **build any model, rig/skin it, create full animations on that exact model, and export playable rigged+animated assets** — with zero gaps between modeling and animation.

---

## 1. THE THREE ENTRY POINTS

| Entry | What it is | When to use |
|---|---|---|
| `assets/bpy-core.js` | The full `bpy` & `bmesh` engine (browser `window.BPY` + Node `globalThis.BPY`) | Any game/app/model/animation work |
| `scripts/bpy-full.mjs` (`npm run bpy`) | Headless Full Blender CLI & script runner | Batch pipelines, sub-agents, exports |
| `blender-studio.html` + `assets/full-blender-workstation.js` | 1-for-1 Blender Workstation UI (all 11 workspaces) | Visual editing, sculpt, UV, nodes, console |

```bash
npm run bpy -- demo --out models/demo                 # model → auto-rig → skin → animate → export everything
npm run bpy -- build --preset interceptor-ship --out games/<slug>/ship.bblend.json
npm run bpy -- rig --out games/<slug>/hero.gltf       # ARMATURE_AUTO heat-diffusion weights
npm run bpy -- animate --frames 120 --out games/<slug>/hero-walk.gltf
npm run bpy -- run <pipeline.mjs>                     # any bpy script exporting run(bpy)
```

---

## 2. `bpy.data` — FULL ID DATABLOCKS

`meshes, objects, armatures, actions, materials, node_groups, cameras, lights, worlds, collections, grease_pencils, particles, scenes, textures, images, curves, shape_keys, brushes` — each with `create/get/remove/keys/values/items`. Shape keys live on `mesh.shape_keys.blocks` with per-key `value` sliders.

## 3. `bpy.ops` — FULL OPERATOR SET

- **mesh**: `primitive_{cube,uv_sphere,ico_sphere,cylinder,cone,torus,plane,grid,monkey}_add`, `subdivide, extrude, inset, bevel, loopcut, bridge_edge_loops, knife, spin, screw, bisect, convex_hull, triangulate, poke, dissolve_verts/edges, remove_doubles, boolean, voxel_remesh, decimate, shade_smooth/flat, mark_seam, unwrap`
- **object**: `select_all, mode_set, parent_set(type='ARMATURE_AUTO'), parent_clear, modifier_add/remove/apply, duplicate, delete, transform_apply, convert`
- **armature**: `primitive_bone_add, extrude, subdivide, symmetrize, parent_set, roll_clear`
- **pose**: `select_all, constraint_add/remove (IK, COPY_ROTATION/LOCATION/SCALE, DAMPED_TRACK, LOCKED_TRACK, CHILD_OF, LIMIT_ROTATION, STRETCH_TO, SPLINE_IK), rotate, loc/rot/scale_clear, visual_transform_apply`
- **anim**: `keyframe_insert, keyframe_insert_by_name(bone_name=…), keyframe_delete/clear, action_create/set, action_slot_new, driver_add`
- **nla**: `action_pushdown, track_add, strip_add/remove, bake` (bakes every bone channel over the scene range)
- **sculpt**: `brush_stroke (16+ brushes), set_tool, set_strength, dyntopo_detail, voxel_remesh, mask_clear`
- **uv**: `mark_seam, unwrap, smart_project, cube/cylinder/sphere_project, pack_islands, average_islands_scale`
- **node**: `add_node, add_node_group, link, delete`
- **gpencil / rigidbody / render / export_scene / import_scene** all present (`export_scene.gltf/obj/bblend`, `import_scene.gltf/obj/bblend`)

## 4. `bmesh` — TOPOLOGY ENGINE

`BMesh.from_mesh(mesh)` → `bm.verts/edges/faces` with `new_vert/new_face`, `extrude_face, extrude_edges, inset_face, bevel_edges, loopcut, subdivide_face, triangulate, dissolve_verts/edges, poke_faces, bisect, convex_hull, spin, screw, bridge_loops, knife, remove_doubles, recalc_normals` → `bm.to_mesh(mesh)`.

## 5. MODIFIER STACK — 28+ TYPES

`MODIFIER_TYPES`: ARRAY, BEVEL, BOOLEAN, BUILD, DECIMATE, EDGE_SPLIT, NODES, MASK, MIRROR, MULTIRES, REMESH, SCREW, SKIN, SOLIDIFY, SUBSURF, TRIANGULATE, WIREFRAME | ARMATURE, CAST, CURVE, DISPLACE, HOOK, LAPLACIANSMOOTH, LATTICE, MESH_DEFORM, SHRINKWRAP, SIMPLE_DEFORM, SMOOTH, SURFACE_DEFORM, WARP, WAVE | CLOTH, COLLISION, FLUID, OCEAN, PARTICLE_SYSTEM, SOFT_BODY, RIGID_BODY. Evaluated with `BPY.apply_modifier_stack(mesh, obj, frame)`.

## 6. 🌉 SEAMLESS MODEL → RIG → ANIMATE PIPELINE (the whole point)

```js
import './assets/bpy-core.js';
const { bpy, ops, data, context } = globalThis.BPY;

// 1) BUILD the exact model you want
ops.mesh.primitive_uv_sphere_add({ radius: 1, segments: 48, rings: 24 });
const hero = context.object; hero.name = 'Hero';

// 2) RIG + AUTO-WEIGHT SKIN it (heat diffusion, top-4 weights/vertex)
const arm = data.armatures.create('HeroRig');
arm.add_bone('Spine', [0,0,-1], [0,0,0]);
arm.add_bone('Head', [0,0,0], [0,0,1], 'Spine');
const rig = new globalThis.BPY.Object3D('HeroRig', 'ARMATURE', arm);
data.objects._list.push(rig); context.scene.link(rig);
globalThis.BPY.poseEnsureBones(rig);
context.selected_objects = [hero, rig];
ops.object.parent_set({ type: 'ARMATURE_AUTO' });       // ← JOINTS_0/WEIGHTS_0 + inverseBindMatrices

// 3) ANIMATE the pose bones of THAT model
context.object = rig;
const head = rig.pose.bones.find(b => b.name === 'Head');
rig.keyframe_insert('pose.bones["Head"].rotation_quaternion', 1);
head.rotation_quaternion = globalThis.BPY.eulerToQuat([0, 0.8, 0]);
rig.keyframe_insert('pose.bones["Head"].rotation_quaternion', 24);

// 4) PLAY the deformation per frame (Linear Blend Skinning + shape keys)
context.scene.frame_set(12);
const posed = globalThis.BPY.skin_deform_mesh(hero.data, rig);   // deformed verts

// 5) EXPORT skinned + animated (glTF 2.0 spec: skins/joints/IBM/JOINTS_0/WEIGHTS_0/animations)
const gltf = ops.export_scene.gltf({ filepath: 'games/my-game/hero.gltf' });
```

Runtime playback in any game:
```js
const anim = await BPY.BlenderModelAnimator.load('hero.bblend.json');
anim.play('HeroAction', { loop: true, speed: 1 });
loop(() => { const pose = anim.update(dt); const verts = anim.deform('Hero', meshData, anim.frame); });
```

## 7. ANIMATION SYSTEM

- **Layered Actions (Blender 4.4/5.0)**: `action.slots`, `action.get_channelbag(slot, true).get_fcurve(path, index, true)`, keyframe `interpolation` ∈ BEZIER / LINEAR / CONSTANT / SINE / EXPO / BOUNCE / ELASTIC with `easing` + F-Curve `modifiers` (`CYCLES` repeat/offset, `NOISE`).
- **NLA**: `anim.nla_tracks → strips` with `frame_start/end`, `blend_type`, `influence`, `extrapolation`; `ops.nla.bake` bakes every channel.
- **Shape Keys**: `BPY.shape_key_add(mesh, name)` + per-key `value` sliders evaluated in `shape_key_eval`.
- **Constraints/IK**: CCD IK solver (`solve_ik`), copy-rotation/location/scale, damped/locked track, limit rotation, stretch-to.
- **Deformation**: `skin_deform_mesh` = Linear Blend Skinning `Σ wⱼ · (Gⱼ · IBⱼ) · v`, exact glTF joint math.

## 8. EXPORTS (all self-contained)

- **`.gltf`** — Khronos 2.0 compliant: `meshes` (POSITION/NORMAL/TEXCOORD_0/JOINTS_0/WEIGHTS_0), `skins` (joints + `inverseBindMatrices` MAT4 accessor + skeleton), `animations` (samplers/channels targeting `translation/rotation/scale`), `materials` PBR, embedded base64 buffer.
- **`.obj`** — v/vt/vn/f with groups.
- **`.bblend.json`** — full session: meshes, armatures, pose, modifiers, vertex groups, shape keys, Actions (slots/channelbags/fcurves), NLA — reloadable via `import_scene.bblend` or `BlenderModelAnimator`.

## 9. WORKSTATION (`blender-studio.html`)

All 11 workspaces (Layout, Modeling, Sculpting, UV Editing, Texture Paint, Shading, Animation, Rendering, Compositing, Geometry Nodes, Scripting), Outliner, Properties (14 tabs: Render/Output/ViewLayer/Scene/World/Object/Modifiers/Particles/Physics/Constraint/Data/Material/Texture/Collection), 3D Viewport modes `OBJECT|EDIT|SCULPT|VERTEX_PAINT|WEIGHT_PAINT|TEXTURE_PAINT|POSE` (keys 1-7, Tab toggle), Node Editor, UV Editor, Timeline/Dope Sheet/Graph/NLA, interactive `bpy` console (`>>> bpy.ops.mesh.primitive_monkey_add()`), live skinned animation playback (Space), render (F12), import/export glTF/OBJ/BBlend.

## 10. RULES FOR THE AI

1. **Any model you make, you must be able to animate** — always go through `bpy-core` so rig/skin/keys/export work on the exact same data.
2. **Prefer `npm run bpy` scripts** for sub-agent/CI work; keep scripts in `scripts/` and export `run(bpy)`.
3. **Export both** `.gltf` (games/engines) and `.bblend.json` (round-trip editing) for every rigged asset.
4. **Use Actions + NLA** for multi-clip characters (idle/walk/run/jump) and `BlenderModelAnimator` for runtime blending.
5. **Never stub** — if the user asks for a rig, ship weights + keys + export in the same turn.
