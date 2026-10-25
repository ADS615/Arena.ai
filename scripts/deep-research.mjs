import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GAMES_DIR } from './sync-games.mjs';

const __filename = fileURLToPath(import.meta.url);

export function generateDeepResearchBlueprint({
  target = 'Custom App or Game',
  slug = 'recreated-app',
  category = 'app-or-game'
} = {}) {
  return {
    target,
    slug,
    category,
    createdAt: new Date().toISOString(),
    layers: {
      layer1_domainAndDataModel: {
        entities: ['User/Player State', 'Workspace/Scene Items', 'History/Undo Stack', 'Settings & Preferences'],
        persistence: 'localStorage + JSON Import/Export + URL State'
      },
      layer2_completeFeatureMatrix: [
        'Full interactive primary viewport / canvas / workspace',
        'Complete toolbar, keyboard shortcuts, and context actions',
        'Search, filtering, sorting, and multi-tab or multi-view navigation',
        'Real-time state persistence, save/load slots, and export/download',
        'Sound effects / audio synthesis and visual feedback on every interaction'
      ],
      layer3_visualDesignAndUX: {
        theme: 'AAA Dark Glassmorphism + Neon Accents + Smooth 60fps Transitions',
        typography: 'Inter / JetBrains Mono hierarchy with crisp status badges',
        effects: ['Particle bursts', 'Dynamic lighting / glow', 'Responsive layout scaling', 'Micro-animations']
      },
      layer4_3dAndMediaPipeline: {
        engine: 'assets/ai-blender-engine.js (3D Meshes, Modifiers, Principled BSDF, OBJ/glTF Export)',
        audio: 'WebAudio Synthesizer & Multi-Channel SFX'
      },
      layer5_chunkArchitecture: [
        '[CHUNK: STATE & PERSISTENCE]',
        '[CHUNK: 3D MODELS & ASSETS]',
        '[CHUNK: CORE ENGINE & LOGIC]',
        '[CHUNK: UI & CONTROLS]',
        '[CHUNK: RENDER & POST-PROCESSING]',
        '[CHUNK: AUDIO SYNTH]'
      ]
    }
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const tok = process.argv[i];
    if (tok.startsWith('--')) {
      args[tok.slice(2)] = process.argv[++i] || '';
    }
  }
  const target = args.target || 'Target App or Game';
  const slug = (args.slug || target)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const spec = generateDeepResearchBlueprint({ target, slug, category: args.category || 'recreation' });
  const outDir = path.join(GAMES_DIR, slug);
  fs.mkdirSync(outDir, { recursive: true });
  const specPath = path.join(outDir, 'RESEARCH_SPEC.json');
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2) + '\n', 'utf8');
  console.log(`[deep-research] Generated 5-Layer Deep Research Spec for "${target}" -> games/${slug}/RESEARCH_SPEC.json`);
}
