import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import {
  createCube,
  createSphere,
  createCylinder,
  createCone,
  createTorus,
  createLatheMesh,
  createPresetModel,
  createPrincipledBSDF,
  transformMesh,
  extrudeFaces,
  subdivideMesh,
  modifierMirror,
  modifierArray,
  modifierDeform,
  modifierDisplaceNoise,
  modifierSolidify,
  sculptBrush,
  exportToOBJ,
  exportToGLTF,
  exportToJSModule
} from '../assets/ai-blender-engine.js';
import { ROOT_DIR } from './chunk-tool.mjs';

const __filename = fileURLToPath(import.meta.url);

// Curated catalog of open-source 3D models hosted on GitHub (KhronosGroup & Three.js)
export const ONLINE_GITHUB_MODELS = {
  duck: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Embedded/Duck.gltf',
  box: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Box/glTF-Embedded/Box.gltf',
  cesiumMilkTruck: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF-Embedded/CesiumMilkTruck.gltf',
  damagedHelmet: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb'
};

export function buildModelFromRecipe(recipe = {}) {
  let mesh;
  const baseType = recipe.base || recipe.preset || 'interceptor-ship';

  if (
    [
      'interceptor-ship',
      'cyber-mech',
      'hyper-car',
      'plasma-sword',
      'crystal-cluster',
      'asteroid',
      'ps5-console',
      'dualsense-controller',
      'suzanne-head'
    ].includes(baseType)
  ) {
    mesh = createPresetModel(baseType);
  } else if (baseType === 'cube') {
    mesh = createCube(recipe.params || {});
  } else if (baseType === 'sphere') {
    mesh = createSphere(recipe.params || {});
  } else if (baseType === 'cylinder') {
    mesh = createCylinder(recipe.params || {});
  } else if (baseType === 'cone') {
    mesh = createCone(recipe.params || {});
  } else if (baseType === 'torus') {
    mesh = createTorus(recipe.params || {});
  } else if (baseType === 'lathe') {
    mesh = createLatheMesh(recipe.params || {});
  } else {
    mesh = createPresetModel('interceptor-ship');
  }

  if (recipe.name) mesh.name = recipe.name;

  // Apply Edit Mode & Modifier pipeline steps
  const ops = Array.isArray(recipe.operations) ? recipe.operations : [];
  for (const op of ops) {
    if (!op || !op.type) continue;
    switch (op.type) {
      case 'transform':
        mesh = transformMesh(mesh, op);
        break;
      case 'extrude':
        mesh = extrudeFaces(mesh, op);
        break;
      case 'subdivide':
        mesh = subdivideMesh(mesh, op);
        break;
      case 'mirror':
        mesh = modifierMirror(mesh, op);
        break;
      case 'array':
        mesh = modifierArray(mesh, op);
        break;
      case 'deform':
      case 'twist':
      case 'taper':
      case 'bend':
        mesh = modifierDeform(mesh, { mode: op.mode || op.type, factor: op.factor ?? 0.6 });
        break;
      case 'displace':
        mesh = modifierDisplaceNoise(mesh, op);
        break;
      case 'solidify':
        mesh = modifierSolidify(mesh, op);
        break;
      case 'sculpt':
        mesh = sculptBrush(mesh, op);
        break;
      default:
        break;
    }
  }

  if (recipe.material) {
    mesh.material = createPrincipledBSDF({ ...mesh.material, ...recipe.material });
  }

  return mesh;
}

export function saveMeshToFile(mesh, outPath) {
  const fullOut = path.isAbsolute(outPath) ? outPath : path.join(ROOT_DIR, outPath);
  fs.mkdirSync(path.dirname(fullOut), { recursive: true });
  const ext = path.extname(fullOut).toLowerCase();

  if (ext === '.obj') {
    fs.writeFileSync(fullOut, exportToOBJ(mesh), 'utf8');
  } else if (ext === '.gltf' || ext === '.json') {
    fs.writeFileSync(fullOut, exportToGLTF(mesh), 'utf8');
  } else {
    fs.writeFileSync(fullOut, exportToJSModule(mesh), 'utf8');
  }
  return fullOut;
}

export function downloadOnlineModel(urlOrKey, outPath) {
  const url = ONLINE_GITHUB_MODELS[urlOrKey] || urlOrKey;
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadOnlineModel(res.headers.location, outPath).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
          return;
        }
        const fullOut = path.isAbsolute(outPath) ? outPath : path.join(ROOT_DIR, outPath);
        fs.mkdirSync(path.dirname(fullOut), { recursive: true });
        const fileStream = fs.createWriteStream(fullOut);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(fullOut);
        });
      })
      .on('error', reject);
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const cmd = process.argv[2] || 'help';
  const args = {};
  for (let i = 3; i < process.argv.length; i++) {
    const t = process.argv[i];
    if (t.startsWith('--')) {
      args[t.slice(2)] = process.argv[++i] || '';
    }
  }

  if (cmd === 'build') {
    const preset = args.preset || 'interceptor-ship';
    const out = args.out || `models/${preset}.obj`;
    const recipe = {
      base: preset,
      operations: args.subdivide ? [{ type: 'subdivide', levels: Number(args.subdivide) || 1 }] : []
    };
    const mesh = buildModelFromRecipe(recipe);
    const saved = saveMeshToFile(mesh, out);
    console.log(`[ai-blender] Built "${mesh.name}" (${mesh.vertices.length} verts, ${mesh.faces.length} faces) -> ${path.relative(ROOT_DIR, saved)}`);
  } else if (cmd === 'recipe') {
    const spec = args.spec ? JSON.parse(args.spec) : { base: 'interceptor-ship' };
    const out = args.out || `models/${spec.name || 'custom-model'}.obj`;
    const mesh = buildModelFromRecipe(spec);
    const saved = saveMeshToFile(mesh, out);
    console.log(`[ai-blender] Built custom recipe "${mesh.name}" (${mesh.vertices.length} verts, ${mesh.faces.length} faces) -> ${path.relative(ROOT_DIR, saved)}`);
  } else if (cmd === 'fetch') {
    const key = args.model || args.url || 'duck';
    const out = args.out || `models/${key}.gltf`;
    downloadOnlineModel(key, out)
      .then((saved) => console.log(`[ai-blender] Downloaded online 3D model -> ${path.relative(ROOT_DIR, saved)}`))
      .catch((err) => {
        console.error(`[ai-blender] Online fetch fallback: ${err.message}. Generating procedural equivalent instead.`);
        const mesh = createPresetModel('interceptor-ship');
        const saved = saveMeshToFile(mesh, out);
        console.log(`[ai-blender] Saved procedural fallback -> ${path.relative(ROOT_DIR, saved)}`);
      });
  } else {
    console.log(`
🧊 Arena.ai AI-Blender CLI (scripts/ai-blender.mjs)
Commands:
  npm run blender -- build --preset interceptor-ship|cyber-mech|hyper-car|plasma-sword|crystal-cluster --out games/<slug>/models/model.obj
  npm run blender -- recipe --spec '{"base":"sphere","operations":[{"type":"subdivide","levels":1},{"type":"displace","amplitude":0.3}]}' --out models/planet.gltf
  npm run blender -- fetch --model duck|damagedHelmet|<github-raw-url> --out models/asset.gltf
`);
  }
}
