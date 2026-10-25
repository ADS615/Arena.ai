/**
 * Arena.ai 2D/3D Skeletal Animation & Open-Source Motion Library CLI (scripts/ai-animator.mjs)
 * Fetches open-source rigged/animated glTF models (Fox, CesiumMan, BrainStem, RiggedFigure)
 * and bakes 60fps Blender-grade skeletal animation clips & 20-minute film timelines.
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import {
  evaluateCharacterPose,
  ASTRAL_ODYSSEY_20MIN_FILM,
  sampleFilmStateAtTime
} from '../assets/ai-animation-studio.js';
import { ROOT_DIR } from './chunk-tool.mjs';

const __filename = fileURLToPath(import.meta.url);

// Open-Source Animated & Rigged 3D Models from KhronosGroup glTF Sample Repository
export const OPEN_SOURCE_ANIMATED_RIGS = {
  fox: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Fox/glTF-Embedded/Fox.gltf',
  cesiumMan: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Embedded/CesiumMan.gltf',
  brainStem: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/BrainStem/glTF-Embedded/BrainStem.gltf',
  riggedFigure: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/RiggedFigure/glTF-Embedded/RiggedFigure.gltf',
  animatedMorphCube: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/AnimatedMorphCube/glTF-Embedded/AnimatedMorphCube.gltf'
};

export function bakeAnimationClip({ action = 'walk', durationSec = 2.0, fps = 60 } = {}) {
  const totalFrames = Math.max(1, Math.round(durationSec * fps));
  const frames = [];
  for (let f = 0; f <= totalFrames; f++) {
    const t = f / fps;
    frames.push({
      frame: f,
      timeSec: Number(t.toFixed(4)),
      pose: evaluateCharacterPose(action, t)
    });
  }
  return {
    action,
    durationSec,
    fps,
    totalFrames: frames.length,
    frames
  };
}

export function fetchAnimatedRig(keyOrUrl, outPath) {
  const url = OPEN_SOURCE_ANIMATED_RIGS[keyOrUrl] || keyOrUrl;
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchAnimatedRig(res.headers.location, outPath).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode} fetching ${url}`));
          return;
        }
        const fullOut = path.isAbsolute(outPath) ? outPath : path.join(ROOT_DIR, outPath);
        fs.mkdirSync(path.dirname(fullOut), { recursive: true });
        const stream = fs.createWriteStream(fullOut);
        res.pipe(stream);
        stream.on('finish', () => {
          stream.close();
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
    const tok = process.argv[i];
    if (tok.startsWith('--')) {
      args[tok.slice(2)] = process.argv[++i] || '';
    }
  }

  if (cmd === 'bake') {
    const action = args.action || 'sword-combo';
    const duration = Number(args.duration) || 2.0;
    const fps = Number(args.fps) || 60;
    const out = args.out || `games/astral-odyssey-film/anims/${action}.json`;
    const clip = bakeAnimationClip({ action, durationSec: duration, fps });
    const fullOut = path.isAbsolute(out) ? out : path.join(ROOT_DIR, out);
    fs.mkdirSync(path.dirname(fullOut), { recursive: true });
    fs.writeFileSync(fullOut, JSON.stringify(clip, null, 2) + '\n', 'utf8');
    console.log(`[ai-animator] Baked ${clip.totalFrames} frames (@${fps}fps) for "${action}" -> ${path.relative(ROOT_DIR, fullOut)}`);
  } else if (cmd === 'fetch') {
    const rig = args.rig || args.model || 'fox';
    const out = args.out || `models/${rig}-animated.gltf`;
    fetchAnimatedRig(rig, out)
      .then((saved) => console.log(`[ai-animator] Downloaded open-source animated rig "${rig}" -> ${path.relative(ROOT_DIR, saved)}`))
      .catch((err) => console.error(`[ai-animator] Fetch warning: ${err.message}`));
  } else if (cmd === 'verify-film') {
    const checkpoints = [0, 120, 300, 600, 900, 1199];
    for (const sec of checkpoints) {
      const st = sampleFilmStateAtTime(sec);
      console.log(`  [${Math.floor(sec / 60)}m${String(sec % 60).padStart(2, '0')}s] ${st.act.title} | Shot #${st.shotIndex} (${st.shotType}) | ${st.beat.speaker}`);
    }
  } else {
    console.log(`
🎬 Arena.ai 2D/3D Animation & Film CLI (scripts/ai-animator.mjs)
Commands:
  npm run animate -- bake --action walk|run|sword-combo|heroic-land|dialogue-acting|flight-soar --duration 2 --fps 60 --out anim.json
  npm run animate -- fetch --rig fox|cesiumMan|brainStem|riggedFigure --out models/fox.gltf
  npm run animate -- verify-film
`);
  }
}
