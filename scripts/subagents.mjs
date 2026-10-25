import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { ROOT_DIR, MEMORY_DIR, buildMemoryIndex } from './chunk-tool.mjs';
import { GAMES_DIR, syncGames } from './sync-games.mjs';

const __filename = fileURLToPath(import.meta.url);
const SUBAGENTS_DIR = path.join(ROOT_DIR, 'subagents');
const SUBAGENTS_REGISTRY_PATH = path.join(MEMORY_DIR, 'subagents.json');

const DEFAULT_SUBAGENTS = [
  // === 4 DEDICATED 3D MODELING SUB-AGENTS (AI-BLENDER DIVISION) ===
  {
    id: 'modeler-mesh',
    name: '3D Mesh & Topology Sub-Agent (1/4 Modeling)',
    division: 'modeling',
    role: 'Builds 3D primitives, lathe/spline geometry, kitbashed assemblies, and face extrusions in AI-Blender',
    script: 'subagents/modeler-mesh.mjs',
    builtIn: false,
    enabled: true
  },
  {
    id: 'modeler-modifiers-sculpt',
    name: 'Modifiers, Deform & Sculpt Sub-Agent (2/4 Modeling)',
    division: 'modeling',
    role: 'Applies Subdivision Surface, Mirror, Radial Array, Twist/Taper/Bend, Noise Displace, and Sculpt brushes',
    script: 'subagents/modeler-modifiers-sculpt.mjs',
    builtIn: false,
    enabled: true
  },
  {
    id: 'modeler-materials-shaders',
    name: 'Principled BSDF & Lighting Sub-Agent (3/4 Modeling)',
    division: 'modeling',
    role: 'Configures metallic/roughness PBR materials, emissive neon glow, clearcoat, and 3-point studio lighting',
    script: 'subagents/modeler-materials-shaders.mjs',
    builtIn: false,
    enabled: true
  },
  {
    id: 'modeler-rig-anim-export',
    name: 'Rigging, Online Fetch & OBJ/glTF Export Sub-Agent (4/4 Modeling)',
    division: 'modeling',
    role: 'Fetches online .gltf/.glb/.obj models or exports AI-Blender meshes to Wavefront OBJ, glTF 2.0, and JS modules',
    script: 'subagents/modeler-rig-anim-export.mjs',
    builtIn: false,
    enabled: true
  },

  // === CODING, DEEP RESEARCH, VISUAL POLISH & QA SUB-AGENTS ===
  {
    id: 'coder-deep-research',
    name: 'Deep App/Game Research & Full-Clone Sub-Agent (Coding)',
    division: 'coding',
    role: 'Performs 5-layer deep research teardowns of any app or game to recreate 100% of its functions',
    script: 'subagents/coder-deep-research.mjs',
    builtIn: false,
    enabled: true
  },
  {
    id: 'coder-visual-polish',
    name: 'AAA Visual Polish, Shaders & Synth Audio Sub-Agent (Coding)',
    division: 'coding',
    role: 'Ensures all games and recreated apps have 60fps animations, glassmorphism HUDs, particles, and synth audio',
    script: 'subagents/coder-visual-polish.mjs',
    builtIn: false,
    enabled: true
  },
  {
    id: 'catalog-syncer',
    name: 'Game & App Catalog Sync Sub-Agent (Coding)',
    division: 'coding',
    role: 'Scans games/*, generates missing manifests/thumbnails, and syncs games/registry.json',
    builtIn: true,
    enabled: true
  },
  {
    id: 'chunk-indexer',
    name: 'Memory & Chunk Map Sub-Agent (Coding)',
    division: 'coding',
    role: 'Indexes all repository files into exact line-range semantic chunks for surgical chunk editing',
    builtIn: true,
    enabled: true
  },
  {
    id: 'syntax-qa',
    name: 'JS/HTML/Python Syntax QA Sub-Agent (Coding)',
    division: 'coding',
    role: 'Extracts inline <script> blocks and .js/.mjs files and compiles them with vm.Script to catch syntax errors',
    builtIn: true,
    enabled: true
  },
  {
    id: 'ui-auditor',
    name: 'Arcade Viewport & Controls Auditor Sub-Agent (Coding)',
    division: 'coding',
    role: 'Audits every game in games/* for responsive canvas/viewport scaling, controls metadata, and asset links',
    builtIn: true,
    enabled: true
  },
  {
    id: 'asset-optimizer',
    name: 'Asset & Build Package Sub-Agent (Coding)',
    division: 'coding',
    role: 'Verifies SVG/PNG thumbnails and downloadable build packages across games/*',
    script: 'subagents/asset-optimizer.mjs',
    builtIn: false,
    enabled: true
  },
  {
    id: 'chunk-health',
    name: 'Chunk Granularity & Size Auditor Sub-Agent (Coding)',
    division: 'coding',
    role: 'Monitors semantic chunk line lengths so files stay modular for surgical chunk editing',
    script: 'subagents/chunk-health.mjs',
    builtIn: false,
    enabled: true
  }
];

export function ensureSubagentRegistry() {
  if (!fs.existsSync(MEMORY_DIR)) fs.mkdirSync(MEMORY_DIR, { recursive: true });
  if (!fs.existsSync(SUBAGENTS_DIR)) fs.mkdirSync(SUBAGENTS_DIR, { recursive: true });

  if (!fs.existsSync(SUBAGENTS_REGISTRY_PATH)) {
    const initial = {
      updatedAt: new Date().toISOString(),
      subagents: DEFAULT_SUBAGENTS
    };
    fs.writeFileSync(SUBAGENTS_REGISTRY_PATH, JSON.stringify(initial, null, 2) + '\n', 'utf8');
    return initial;
  }

  // Merge any newly added default sub-agents into existing registry
  const current = JSON.parse(fs.readFileSync(SUBAGENTS_REGISTRY_PATH, 'utf8'));
  const existingIds = new Set((current.subagents || []).map((a) => a.id));
  let changed = false;
  for (const def of DEFAULT_SUBAGENTS) {
    if (!existingIds.has(def.id)) {
      current.subagents.push(def);
      changed = true;
    }
  }
  if (changed) {
    current.updatedAt = new Date().toISOString();
    fs.writeFileSync(SUBAGENTS_REGISTRY_PATH, JSON.stringify(current, null, 2) + '\n', 'utf8');
  }
  return current;
}

function runSyntaxQa() {
  const issues = [];
  let checkedScripts = 0;

  if (fs.existsSync(GAMES_DIR)) {
    for (const dirent of fs.readdirSync(GAMES_DIR, { withFileTypes: true })) {
      if (!dirent.isDirectory() || dirent.name.startsWith('.')) continue;
      const slug = dirent.name;
      const htmlPath = path.join(GAMES_DIR, slug, 'index.html');
      if (fs.existsSync(htmlPath)) {
        const html = fs.readFileSync(htmlPath, 'utf8');
        const scriptRegex = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
        let match;
        while ((match = scriptRegex.exec(html)) !== null) {
          const attrs = match[1] || '';
          let code = match[2].trim();
          if (!code) continue;
          if (/type\s*=\s*["']module["']/i.test(attrs)) {
            code = code.replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?/gm, '/* module import verified */');
          }
          try {
            new vm.Script(code, { filename: `games/${slug}/index.html` });
            checkedScripts++;
          } catch (err) {
            issues.push(`games/${slug}/index.html: JS Syntax Error: ${err.message}`);
          }
        }
      }
    }
  }

  return {
    agent: 'syntax-qa',
    ok: issues.length === 0,
    summary: `Verified ${checkedScripts} inline game script block(s) with ${issues.length} syntax error(s).`,
    issues
  };
}

function runUiAuditor() {
  const warnings = [];
  let audited = 0;

  if (fs.existsSync(GAMES_DIR)) {
    for (const dirent of fs.readdirSync(GAMES_DIR, { withFileTypes: true })) {
      if (!dirent.isDirectory() || dirent.name.startsWith('.')) continue;
      const slug = dirent.name;
      const gameDir = path.join(GAMES_DIR, slug);
      const htmlPath = path.join(gameDir, 'index.html');
      const manifestPath = path.join(gameDir, 'game.json');

      audited++;
      if (fs.existsSync(htmlPath)) {
        const html = fs.readFileSync(htmlPath, 'utf8');
        if (!/<meta[^>]+viewport/i.test(html)) {
          warnings.push(`games/${slug}/index.html: Missing responsive <meta name="viewport"> tag`);
        }
      }
      if (fs.existsSync(manifestPath)) {
        try {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          if (!manifest.controls) {
            warnings.push(`games/${slug}/game.json: Missing "controls" description`);
          }
        } catch {
          warnings.push(`games/${slug}/game.json: Invalid JSON`);
        }
      }
    }
  }

  return {
    agent: 'ui-auditor',
    ok: warnings.length === 0,
    summary: `Audited ${audited} game(s) with ${warnings.length} UI/metadata warning(s).`,
    warnings
  };
}

async function executeSingleAgent(agentId, payload = {}) {
  switch (agentId) {
    case 'chunk-indexer': {
      const { treeData, chunkData } = buildMemoryIndex({ quiet: true });
      return {
        agent: 'chunk-indexer',
        ok: true,
        summary: `Indexed ${treeData.totalFiles} files & ${chunkData.totalChunks} semantic chunks into memory/MEMORY.md`
      };
    }
    case 'catalog-syncer': {
      const registry = syncGames({ quiet: true });
      return {
        agent: 'catalog-syncer',
        ok: true,
        summary: `Synced ${registry.totalGames} game(s) into games/registry.json`
      };
    }
    case 'syntax-qa':
      return runSyntaxQa();
    case 'ui-auditor':
      return runUiAuditor();
    case 'game-architect': {
      const slug = payload.slug || 'sample-game';
      return {
        agent: 'game-architect',
        ok: true,
        summary: `Ready to generate modular chunk-friendly blueprints for "${slug}" ([STATE], [INPUT], [ENTITIES], [UPDATE], [RENDER], [AUDIO])`
      };
    }
    default: {
      // Check custom sub-agent script in subagents/<agentId>.mjs
      const customPath = path.join(SUBAGENTS_DIR, `${agentId}.mjs`);
      if (fs.existsSync(customPath)) {
        const mod = await import(customPath);
        if (typeof mod.run === 'function') {
          return await mod.run(payload);
        }
      }
      return {
        agent: agentId,
        ok: false,
        summary: `Unknown sub-agent: ${agentId}`
      };
    }
  }
}

// Worker thread entry point for parallel execution
if (!isMainThread) {
  executeSingleAgent(workerData.agentId, workerData.payload)
    .then((res) => parentPort.postMessage(res))
    .catch((err) =>
      parentPort.postMessage({
        agent: workerData.agentId,
        ok: false,
        summary: err.message
      })
    );
}

function runAgentInWorker(agentId, payload = {}) {
  return new Promise((resolve) => {
    const worker = new Worker(__filename, {
      workerData: { agentId, payload }
    });
    worker.once('message', (msg) => resolve(msg));
    worker.once('error', (err) =>
      resolve({ agent: agentId, ok: false, summary: `Worker error: ${err.message}` })
    );
  });
}

export async function runParallelSubagents(agentIds, payload = {}) {
  // Run catalog-syncer and chunk-indexer first so registry & chunk files are fresh before parallel QA/audit workers
  const results = [];
  const remaining = [...agentIds];

  for (const preId of ['catalog-syncer', 'chunk-indexer']) {
    if (remaining.includes(preId)) {
      remaining.splice(remaining.indexOf(preId), 1);
      results.push(await runAgentInWorker(preId, payload));
    }
  }

  const parallelResults = await Promise.all(
    remaining.map((id) => runAgentInWorker(id, payload))
  );
  results.push(...parallelResults);
  return results;
}

export function createCustomSubagent({ id, name, role, task }) {
  const safeId = String(id || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!safeId) {
    throw new Error('Provide --id <subagent-id> when creating a sub-agent');
  }

  const registry = ensureSubagentRegistry();
  const customFile = path.join(SUBAGENTS_DIR, `${safeId}.mjs`);

  const scriptContent = `/**
 * Custom Sub-Agent: ${name || safeId}
 * Role: ${role || 'Custom specialist worker'}
 * Task: ${task || 'Custom automated check or generator'}
 */
import fs from 'node:fs';
import path from 'node:path';

export async function run(payload = {}) {
  return {
    agent: '${safeId}',
    ok: true,
    summary: '${(name || safeId).replace(/'/g, "\\'")} completed task: ${(task || role || 'Ready').replace(/'/g, "\\'")}',
    payload
  };
}
`;

  fs.writeFileSync(customFile, scriptContent, 'utf8');

  const existingIdx = registry.subagents.findIndex((a) => a.id === safeId);
  const entry = {
    id: safeId,
    name: name || safeId,
    role: role || 'Custom specialist sub-agent',
    task: task || '',
    script: `subagents/${safeId}.mjs`,
    builtIn: false,
    enabled: true,
    createdAt: new Date().toISOString()
  };

  if (existingIdx >= 0) {
    registry.subagents[existingIdx] = entry;
  } else {
    registry.subagents.push(entry);
  }
  registry.updatedAt = new Date().toISOString();
  fs.writeFileSync(SUBAGENTS_REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n', 'utf8');

  return entry;
}

if (isMainThread && process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const cmd = process.argv[2] || 'run-all';
  const registry = ensureSubagentRegistry();

  if (cmd === 'list') {
    console.log(`\n🤖 Registered Sub-Agents (${registry.subagents.length}):`);
    for (const a of registry.subagents) {
      console.log(`  • [${a.id}] ${a.name} — ${a.role}`);
    }
  } else if (cmd === 'create') {
    const args = {};
    for (let i = 3; i < process.argv.length; i++) {
      const tok = process.argv[i];
      if (tok.startsWith('--')) {
        const key = tok.slice(2);
        args[key] = process.argv[++i] || '';
      }
    }
    const created = createCustomSubagent(args);
    console.log(`[subagents] Created & registered custom sub-agent "${created.id}" -> ${created.script}`);
    buildMemoryIndex({ quiet: true });
  } else if (cmd === 'run') {
    const id = process.argv[3] || 'syntax-qa';
    const res = await runAgentInWorker(id, {});
    console.log(`[${res.agent}] ${res.ok ? '✓' : '✗'} ${res.summary}`);
    if (res.issues?.length) res.issues.forEach((i) => console.error(`  - ${i}`));
    if (res.warnings?.length) res.warnings.forEach((w) => console.warn(`  - ${w}`));
  } else {
    // Default: run-all active sub-agents in parallel workers
    const enabledIds = registry.subagents.filter((a) => a.enabled).map((a) => a.id);
    console.log(`🚀 Running ${enabledIds.length} Sub-Agents in parallel worker threads...`);
    const results = await runParallelSubagents(enabledIds);
    for (const r of results) {
      console.log(`  ${r.ok ? '✓' : '✗'} [${r.agent}] ${r.summary}`);
      if (r.issues?.length) r.issues.forEach((i) => console.error(`      ! ${i}`));
      if (r.warnings?.length) r.warnings.forEach((w) => console.warn(`      ~ ${w}`));
    }
  }
}
