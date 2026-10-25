#!/usr/bin/env node
/* ============================================================
 * bpy-full.mjs — Headless Full Blender CLI & Script Runner
 * The AI's `bpy` pipeline: build models, auto-rig & skin them,
 * bake multi-action animations, and export ready-to-use
 * rigged + animated assets (.gltf / .obj / .bblend.json).
 *
 * Usage:
 *   npm run bpy -- run <script.mjs>              Run a bpy pipeline script (exports `run(bpy)`)
 *   npm run bpy -- build --preset <p> --out <f>  Build a primitive/preset mesh
 *   npm run bpy -- rig --in <m.bblend.json> --out <m.gltf>  Auto-rig + skin + export skinned glTF
 *   npm run bpy -- animate --action <name> --frames N --in <m.bblend.json> --out <anim.gltf>
 *   npm run bpy -- export --in <m.bblend.json> --format gltf|obj|bblend --out <f>
 *   npm run bpy -- render --in <m.bblend.json> --out <img.ppm> [--engine EEVEE|CYCLES]
 *   npm run bpy -- demo --out <dir>              End-to-end demo: model → rig → skin → animate → export
 * ============================================================ */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, basename, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(new URL(import.meta.url).pathname), '..');
const { default: BPY } = await import(pathToFileURL(resolve(ROOT, 'assets/bpy-core.js')).href)
  .catch(async () => {
    // bpy-core is UMD; import for side effect then read globalThis
    await import(pathToFileURL(resolve(ROOT, 'assets/bpy-core.js')).href);
    return { default: globalThis.BPY };
  });
const api = BPY || globalThis.BPY;
const { bpy, ops, data, context } = api;

// Write hook used by exporters
globalThis.__arena_write_file = (path, content) => {
  const p = resolve(ROOT, path);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, content);
  return p;
};

const PRESETS = {
  'cube': () => ops.mesh.primitive_cube_add({ size: 2 }),
  'sphere': () => ops.mesh.primitive_uv_sphere_add({ radius: 1, segments: 48, rings: 24 }),
  'ico-sphere': () => ops.mesh.primitive_ico_sphere_add({ radius: 1, subdivisions: 3 }),
  'cylinder': () => ops.mesh.primitive_cylinder_add({ radius: 1, depth: 2, vertices: 48 }),
  'cone': () => ops.mesh.primitive_cone_add({ radius1: 1, radius2: 0, depth: 2, vertices: 48 }),
  'torus': () => ops.mesh.primitive_torus_add({ major_radius: 1, minor_radius: 0.3 }),
  'plane': () => ops.mesh.primitive_plane_add({ size: 2 }),
  'grid': () => ops.mesh.primitive_grid_add({ x_subdivisions: 32, y_subdivisions: 32, size: 4 }),
  'monkey': () => ops.mesh.primitive_monkey_add({}),
  'interceptor-ship': () => buildInterceptorShip(),
  'hero-character': () => buildHeroCharacter(),
  'mech': () => buildMech()
};

function buildInterceptorShip() {
  ops.mesh.primitive_cube_add({ size: 2, location: [0, 0, 0] });
  const body = context.object;
  body.name = 'InterceptorShip';
  body.scale = [0.5, 2.2, 0.35];
  ops.object.transform_apply();
  // nose cone
  ops.mesh.primitive_cone_add({ radius1: 0.5, radius2: 0, depth: 1.6, vertices: 24, location: [0, 2.6, 0] });
  const nose = context.object;
  nose.rotation_euler = [Math.PI / 2, 0, 0];
  nose.name = 'Nose';
  // wings
  for (const side of [-1, 1]) {
    ops.mesh.primitive_cube_add({ size: 2, location: [side * 1.6, -0.3, 0] });
    const wing = context.object;
    wing.scale = [1.4, 0.7, 0.06];
    wing.rotation_euler = [0, 0, side * -0.35];
    wing.name = 'Wing.' + (side < 0 ? 'L' : 'R');
  }
  // engines
  for (const side of [-1, 1]) {
    ops.mesh.primitive_cylinder_add({ radius: 0.28, depth: 1.1, vertices: 20, location: [side * 0.55, -2.2, 0] });
    const eng = context.object;
    eng.rotation_euler = [Math.PI / 2, 0, 0];
    eng.name = 'Engine.' + (side < 0 ? 'L' : 'R');
    const mat = data.materials.create('EngineGlow' + side);
    mat.principled.inputs.find((s) => s.name === 'Emission Color').value = [0.3, 0.8, 1, 1];
    mat.principled.inputs.find((s) => s.name === 'Emission Strength').value = 8;
    eng.data.materials.push(mat);
  }
  // canopy
  ops.mesh.primitive_uv_sphere_add({ radius: 0.45, segments: 24, rings: 12, location: [0, 0.9, 0.35] });
  const canopy = context.object;
  canopy.scale = [0.8, 1.4, 0.6];
  canopy.name = 'Canopy';
  return body;
}

function buildHeroCharacter() {
  ops.mesh.primitive_uv_sphere_add({ radius: 0.5, segments: 32, rings: 16, location: [0, 0, 1.6] });
  const head = context.object; head.name = 'Head';
  ops.mesh.primitive_cylinder_add({ radius: 0.55, depth: 1.1, vertices: 24, location: [0, 0, 0.85] });
  const torso = context.object; torso.name = 'Torso';
  torso.scale = [1, 0.6, 1];
  for (const side of [-1, 1]) {
    ops.mesh.primitive_cylinder_add({ radius: 0.16, depth: 1.0, vertices: 16, location: [side * 0.85, 0, 0.95] });
    const arm = context.object;
    arm.name = 'Arm.' + (side < 0 ? 'L' : 'R');
    arm.rotation_euler = [0, 0, side * 0.25];
    ops.mesh.primitive_cylinder_add({ radius: 0.2, depth: 1.05, vertices: 16, location: [side * 0.28, 0, 0.05] });
    const leg = context.object;
    leg.name = 'Leg.' + (side < 0 ? 'L' : 'R');
  }
  return head;
}

function buildMech() {
  ops.mesh.primitive_cube_add({ size: 2, location: [0, 0, 1.9] });
  const cockpit = context.object; cockpit.name = 'Cockpit'; cockpit.scale = [0.9, 0.7, 0.6];
  ops.mesh.primitive_cube_add({ size: 2, location: [0, 0, 1.0] });
  const torso = context.object; torso.name = 'Torso'; torso.scale = [1.2, 0.9, 0.8];
  for (const side of [-1, 1]) {
    ops.mesh.primitive_cylinder_add({ radius: 0.35, depth: 1.6, vertices: 20, location: [side * 0.95, 0, 1.55] });
    const shoulder = context.object;
    shoulder.rotation_euler = [0, 0, side * Math.PI / 2];
    shoulder.name = 'Shoulder.' + (side < 0 ? 'L' : 'R');
    ops.mesh.primitive_cylinder_add({ radius: 0.32, depth: 1.5, vertices: 20, location: [side * 0.55, 0, 0.05] });
    const leg = context.object;
    leg.name = 'Leg.' + (side < 0 ? 'L' : 'R');
    ops.mesh.primitive_cube_add({ size: 1, location: [side * 0.55, 0.25, -0.75] });
    const foot = context.object;
    foot.scale = [0.45, 0.8, 0.18];
    foot.name = 'Foot.' + (side < 0 ? 'L' : 'R');
  }
  return cockpit;
}

function autoRigChain(armObj, chain) {
  // chain: [{name, head, tail}]
  for (const b of chain) armObj.data.add_bone(b.name, b.head, b.tail, b.parent || null);
  api.poseEnsureBones(armObj);
}

function rigCurrentModel(armName = 'Rig') {
  const scene = context.scene;
  const meshes = scene.objects.filter((o) => o.type === 'MESH');
  const arm = data.armatures.create(armName);
  const armObj = new api.Object3D(armName, 'ARMATURE', arm);
  data.objects._list.push(armObj);
  scene.link(armObj);
  // auto chain: vertical humanoid-style bone chain spanning model bounds
  const all = meshes.flatMap((m) => m.data.verts);
  if (!all.length) return null;
  const min = [Math.min(...all.map((v) => v[0])), Math.min(...all.map((v) => v[1])), Math.min(...all.map((v) => v[2]))];
  const max = [Math.max(...all.map((v) => v[0])), Math.max(...all.map((v) => v[1])), Math.max(...all.map((v) => v[2]))];
  const h = max[2] - min[2] || 2;
  const cx = (min[0] + max[0]) / 2, cy = (min[1] + max[1]) / 2;
  const segments = 4;
  const chain = [];
  for (let i = 0; i < segments; i++) {
    const z0 = min[2] + (h * i) / segments;
    const z1 = min[2] + (h * (i + 1)) / segments;
    chain.push({ name: 'Bone' + (i ? '.' + String(i).padStart(3, '0') : ''), head: [cx, cy, z0], tail: [cx, cy, z1], parent: i ? chain[i - 1].name : null });
  }
  autoRigChain(armObj, chain);
  for (const meshObj of meshes) {
    context.object = meshObj;
    context.selected_objects = [meshObj, armObj];
    ops.object.parent_set({ type: 'ARMATURE_AUTO' });
  }
  return armObj;
}

function bakeWalkCycle(armObj, frames = 48) {
  const scene = context.scene;
  scene.frame_start = 1;
  scene.frame_end = frames;
  const swing = 0.7;
  for (const pb of armObj.pose.bones) {
    const isLeg = /Bone\./.test(pb.name);
    const phase = armObj.pose.bones.indexOf(pb) % 2 === 0 ? 0 : Math.PI;
    for (let f = 1; f <= frames; f++) {
      const t = (f / frames) * Math.PI * 2;
      const ang = Math.sin(t + phase) * (isLeg ? swing : swing * 0.6);
      armObj.pose.bones.forEach((b) => { void b; });
      pb.rotation_euler = [ang, 0, 0];
      pb.rotation_quaternion = api.eulerToQuat(pb.rotation_euler);
      context.object = armObj;
      armObj.keyframe_insert(`pose.bones["${pb.name}"].rotation_quaternion`, f);
    }
  }
  return frames;
}

function printHelp() {
  console.log(`bpy-full — Headless Full Blender CLI
  run <script.mjs>                                  Run a bpy pipeline script exporting run(bpy)
  build --preset <name> --out <file>                Build preset mesh (cube|sphere|monkey|interceptor-ship|hero-character|mech|...)
  rig --out <file> [--model-preset <p>]             Auto-rig + auto-weight skin the current/model preset
  animate --frames <n> --out <file>                 Bake walk-cycle animation on the rig
  export --format gltf|obj|bblend --out <file>      Export the current scene
  render --out <img.ppm> [--engine EEVEE|CYCLES]    Software-render the scene
  demo --out <dir>                                  Full pipeline: build → rig → skin → animate → export`);
}

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];
  const flag = (name, dflt = null) => {
    const i = args.indexOf('--' + name);
    return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
  };
  if (!cmd || cmd === 'help' || cmd === '--help') return printHelp();

  if (cmd === 'run') {
    const scriptPath = resolve(ROOT, args[1] || '');
    if (!existsSync(scriptPath)) { console.error('Script not found:', scriptPath); process.exit(1); }
    const mod = await import(pathToFileURL(scriptPath).href);
    const run = mod.default || mod.run;
    if (typeof run !== 'function') { console.error('Script must export run(bpy) or default function'); process.exit(1); }
    const result = await run(api);
    console.log(typeof result === 'string' ? result : JSON.stringify(result ?? bpy.state, null, 2));
    return;
  }

  if (cmd === 'build') {
    const preset = flag('preset', 'cube');
    const out = flag('out', 'models/' + preset + '.bblend.json');
    if (!PRESETS[preset]) { console.error('Unknown preset:', preset, '\nAvailable:', Object.keys(PRESETS).join(', ')); process.exit(1); }
    PRESETS[preset]();
    const content = ops.export_scene.bblend({ filepath: out });
    globalThis.__arena_write_file(out, content);
    console.log(`Built preset "${preset}" -> ${out} (${bpy.state.objects.length} objects)`);
    return;
  }

  if (cmd === 'rig') {
    const out = flag('out', 'models/rigged.gltf');
    const modelPreset = flag('model-preset');
    if (modelPreset && PRESETS[modelPreset]) PRESETS[modelPreset]();
    const armObj = rigCurrentModel();
    if (!armObj) { console.error('No mesh found to rig'); process.exit(1); }
    const content = ops.export_scene.gltf({ filepath: out });
    globalThis.__arena_write_file(out, content);
    console.log(`Rigged + auto-weighted skin -> ${out} (joints: ${armObj.data.joints.length})`);
    return;
  }

  if (cmd === 'animate') {
    const frames = parseInt(flag('frames', '48'), 10);
    const out = flag('out', 'models/animated.gltf');
    const modelPreset = flag('model-preset');
    if (modelPreset && PRESETS[modelPreset]) PRESETS[modelPreset]();
    const armObj = context.scene.objects.find((o) => o.type === 'ARMATURE') || rigCurrentModel();
    bakeWalkCycle(armObj, frames);
    const content = ops.export_scene.gltf({ filepath: out });
    globalThis.__arena_write_file(out, content);
    console.log(`Baked ${frames}-frame animation -> ${out}`);
    return;
  }

  if (cmd === 'export') {
    const format = flag('format', 'gltf');
    const out = flag('out', 'models/scene.' + format);
    const modelPreset = flag('model-preset');
    if (modelPreset && PRESETS[modelPreset]) PRESETS[modelPreset]();
    const writer = { gltf: ops.export_scene.gltf, obj: ops.export_scene.obj, bblend: ops.export_scene.bblend }[format];
    if (!writer) { console.error('Format must be gltf|obj|bblend'); process.exit(1); }
    const content = writer({ filepath: out });
    globalThis.__arena_write_file(out, content);
    console.log(`Exported ${format} -> ${out} (${content.length} bytes)`);
    return;
  }

  if (cmd === 'render') {
    const out = flag('out', 'models/render.ppm');
    const engine = flag('engine', 'EEVEE');
    context.scene.render.engine = engine === 'CYCLES' ? 'CYCLES' : 'BLENDER_EEVEE_NEXT';
    const img = api.render_scene(context.scene, true);
    globalThis.__arena_write_file(out, img.ppm);
    console.log(`Rendered ${img.width}x${img.height} (${engine}) -> ${out}`);
    return;
  }

  if (cmd === 'demo') {
    const outDir = flag('out', 'models/demo');
    console.log('1/5 building hero model...');
    PRESETS['hero-character']();
    console.log('2/5 auto-rigging + skinning (ARMATURE_AUTO)...');
    const armObj = rigCurrentModel('HeroRig');
    console.log('3/5 baking walk-cycle animation...');
    bakeWalkCycle(armObj, 48);
    console.log('4/5 exporting skinned animated glTF + obj + bblend...');
    globalThis.__arena_write_file(outDir + '/hero.gltf', ops.export_scene.gltf({ filepath: outDir + '/hero.gltf' }));
    globalThis.__arena_write_file(outDir + '/hero.obj', ops.export_scene.obj({ filepath: outDir + '/hero.obj' }));
    globalThis.__arena_write_file(outDir + '/hero.bblend.json', ops.export_scene.bblend({ filepath: outDir + '/hero.bblend.json' }));
    console.log('5/5 rendering preview frame...');
    context.scene.frame_set(12);
    const img = api.render_scene(context.scene, true);
    globalThis.__arena_write_file(outDir + '/preview.ppm', img.ppm);
    console.log(`\nDone. Rigged + animated hero in ${outDir}/`);
    console.log('Files: hero.gltf (skinned+animated) | hero.obj | hero.bblend.json | preview.ppm');
    return;
  }

  printHelp();
}

main().catch((e) => { console.error(e); process.exit(1); });
