/**
 * Arena.ai Full-Spectrum Repository Search & Semantic Code Navigator (scripts/repo-search.mjs)
 * Lets the AI agent (and human users) search for any specific part of the Arena.ai repo:
 * - Semantic Chunks (functions, classes, DOM sections, CSS rules, routes) with exact [Lstart-Lend]
 * - Exported Engine APIs (3D Blender, 2D/3D Animation, UHD 4K, UI Kit, Sub-Agents)
 * - Subsystem Maps (3d, animation, 4k, ui, games, subagents, memory, server)
 * - Exact Line / Regex Matches with surrounding context & ready-to-use read_file(path, offset, limit)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT_DIR, MEMORY_DIR, buildMemoryIndex } from './chunk-tool.mjs';

const __filename = fileURLToPath(import.meta.url);

// [CHUNK: SUBSYSTEM TAG DEFINITIONS]
export const SUBSYSTEM_MAP = {
  '3d': {
    title: 'AI-Blender 3D Modeling, Modifiers, Sculpting & OBJ/glTF Exports',
    files: [
      'assets/ai-blender-engine.js',
      'scripts/ai-blender.mjs',
      'blender-studio.html',
      'memory/3D_MODELING_PROMPT.md',
      'subagents/modeler-mesh.mjs',
      'subagents/modeler-modifiers-sculpt.mjs',
      'subagents/modeler-materials-shaders.mjs',
      'subagents/modeler-rig-anim-export.mjs'
    ]
  },
  animation: {
    title: '2D & 3D Blender-Grade Skeletal Animation, IK/FK & 20-Minute Film Studio',
    files: [
      'assets/ai-animation-studio.js',
      'scripts/ai-animator.mjs',
      'games/astral-odyssey-film/index.html',
      'memory/ANIMATION_FILM_PROMPT.md'
    ]
  },
  '4k': {
    title: 'UHD 4K (3840x2160) AAA Graphics, Volumetric God-Rays, HDR & 3D Physics',
    files: [
      'assets/aaa-4k-engine.js',
      'games/valkyrie-4k-horizon/index.html',
      'scripts/omni-intelligence.mjs',
      'memory/BEAST_MODE_PROMPT.md'
    ]
  },
  ui: {
    title: 'Shared AAA UI Kit, WebAudio Synth, Particles, AI Pathfinding & Hub Portal',
    files: [
      'assets/arena-ui-kit.js',
      'index.html',
      'assets/app.js',
      'assets/styles.css'
    ]
  },
  games: {
    title: 'Published Games, Console Clones & 20-Min Films Vault',
    files: [
      'games/registry.json',
      'games/valkyrie-4k-horizon/index.html',
      'games/ps5-os-clone/index.html',
      'games/astral-odyssey-film/index.html',
      'games/astra-3d-overdrive/index.html',
      'games/neon-blaster/index.html',
      'games/cyber-serpent/index.html',
      'games/dungeon-crawler-py/index.html'
    ]
  },
  subagents: {
    title: 'Parallel Worker Sub-Agents (4 Modeling + 9 Coding/Research/QA)',
    files: [
      'scripts/subagents.mjs',
      'memory/subagents.json',
      'subagents/modeler-mesh.mjs',
      'subagents/modeler-modifiers-sculpt.mjs',
      'subagents/modeler-materials-shaders.mjs',
      'subagents/modeler-rig-anim-export.mjs',
      'subagents/coder-deep-research.mjs',
      'subagents/coder-visual-polish.mjs',
      'subagents/asset-optimizer.mjs',
      'subagents/chunk-health.mjs'
    ]
  },
  memory: {
    title: 'Surgical Chunk Editing, File Memory & Anti-Stop Enforcement',
    files: [
      'scripts/chunk-tool.mjs',
      'scripts/chunk-editor.mjs',
      'scripts/repo-search.mjs',
      'scripts/anti-stop-enforcer.mjs',
      'memory/MASTER_PROMPT.md',
      'memory/MEMORY.md',
      'memory/file-tree.json',
      'memory/chunks.json'
    ]
  },
  server: {
    title: 'Dev & Upload Server, Game Scaffolder, Catalog Syncer & Validators',
    files: [
      'scripts/dev-server.mjs',
      'scripts/sync-games.mjs',
      'scripts/new-game.mjs',
      'scripts/validate-games.mjs'
    ]
  }
};

// [CHUNK: EXPORTED SYMBOL SCANNER]
export function listExportedApis(filterFile = '') {
  const treePath = path.join(MEMORY_DIR, 'file-tree.json');
  if (!fs.existsSync(treePath)) buildMemoryIndex({ quiet: true });
  const { files } = JSON.parse(fs.readFileSync(treePath, 'utf8'));
  const exportsList = [];

  for (const f of files) {
    if (!f.path.endsWith('.js') && !f.path.endsWith('.mjs')) continue;
    if (filterFile && !f.path.toLowerCase().includes(filterFile.toLowerCase())) continue;

    const fullPath = path.join(ROOT_DIR, f.path);
    if (!fs.existsSync(fullPath)) continue;
    const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/);

    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].match(
        /^\s*export\s+(?:async\s+)?(function|class|const|let)\s+([A-Za-z0-9_$]+)/
      );
      if (m) {
        exportsList.push({
          file: f.path,
          kind: m[1],
          name: m[2],
          line: i + 1,
          signature: lines[i].trim().replace(/\s*\{\s*$/, '')
        });
      }
    }
  }
  return exportsList;
}

// [CHUNK: MULTI-INDEX REPO SEARCH]
export function searchRepo(query = '', options = {}) {
  const treePath = path.join(MEMORY_DIR, 'file-tree.json');
  const chunksPath = path.join(MEMORY_DIR, 'chunks.json');
  if (!fs.existsSync(treePath) || !fs.existsSync(chunksPath)) {
    buildMemoryIndex({ quiet: true });
  }

  const { files } = JSON.parse(fs.readFileSync(treePath, 'utf8'));
  const { chunks } = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));

  const rawQuery = String(query || '').trim();
  const fileFilter = String(options.file || '').toLowerCase();
  const kindFilter = String(options.kind || '').toLowerCase();
  const contextRadius = Number(options.context ?? 1);
  const maxResults = Number(options.limit ?? 25);

  if (options.mode === 'exports') {
    return {
      mode: 'exports',
      query: rawQuery,
      exports: listExportedApis(rawQuery).slice(0, maxResults * 2)
    };
  }

  if (options.mode === 'map' || SUBSYSTEM_MAP[rawQuery.toLowerCase()]) {
    const key = rawQuery.toLowerCase();
    const targetSubsystems = SUBSYSTEM_MAP[key]
      ? { [key]: SUBSYSTEM_MAP[key] }
      : SUBSYSTEM_MAP;

    const mapResult = {};
    for (const [k, sub] of Object.entries(targetSubsystems)) {
      mapResult[k] = {
        title: sub.title,
        files: sub.files.map((fp) => {
          const meta = files.find((f) => f.path === fp);
          const fileChunks = chunks
            .filter((c) => c.file === fp && c.kind !== 'file')
            .slice(0, 12)
            .map((c) => `${c.name} [L${c.startLine}-L${c.endLine}]`);
          return {
            path: fp,
            lines: meta?.lines || 0,
            description: meta?.description || '',
            topChunks: fileChunks
          };
        })
      };
    }
    return { mode: 'map', query: rawQuery, subsystems: mapResult };
  }

  // Standard multi-token / regex search across Files, Chunks, Exports, and Lines
  const tokens = rawQuery
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  let regex = null;
  if (options.regex && rawQuery) {
    try {
      regex = new RegExp(rawQuery, 'i');
    } catch {}
  }

  function matchesText(str) {
    if (!rawQuery) return true;
    if (regex) return regex.test(str);
    const lower = str.toLowerCase();
    return tokens.every((t) => lower.includes(t));
  }

  // 1. Matching files
  const matchedFiles = files
    .filter((f) => {
      if (fileFilter && !f.path.toLowerCase().includes(fileFilter)) return false;
      return matchesText(`${f.path} ${f.description}`);
    })
    .slice(0, 12);

  // 2. Matching semantic chunks
  const matchedChunks = chunks
    .filter((c) => {
      if (fileFilter && !c.file.toLowerCase().includes(fileFilter)) return false;
      if (kindFilter && !c.kind.toLowerCase().includes(kindFilter)) return false;
      return matchesText(`${c.file} ${c.name} ${c.kind}`);
    })
    .map((c) => {
      const lineSpan = Math.max(1, c.endLine - c.startLine + 1);
      return {
        ...c,
        lineSpan,
        readCall: `read_file(path="${c.file}", offset=${c.startLine}, limit=${lineSpan})`
      };
    })
    .slice(0, maxResults);

  // 3. Matching code lines with context preview
  const lineMatches = [];
  if (rawQuery) {
    for (const f of files) {
      if (f.path.startsWith('memory/') && f.path.endsWith('.json')) continue;
      if (fileFilter && !f.path.toLowerCase().includes(fileFilter)) continue;
      const fullPath = path.join(ROOT_DIR, f.path);
      if (!fs.existsSync(fullPath)) continue;
      const ext = path.extname(f.path).toLowerCase();
      if (!['.js', '.mjs', '.html', '.css', '.py', '.md', '.json'].includes(ext)) continue;

      const lines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        if (matchesText(lines[i])) {
          const lineNum = i + 1;
          const enclosing = chunks.find(
            (c) => c.file === f.path && lineNum >= c.startLine && lineNum <= c.endLine
          );
          const ctxStart = Math.max(0, i - contextRadius);
          const ctxEnd = Math.min(lines.length - 1, i + contextRadius);
          const snippet = [];
          for (let k = ctxStart; k <= ctxEnd; k++) {
            snippet.push(`${k + 1}: ${lines[k].slice(0, 110)}`);
          }
          const offset = enclosing ? enclosing.startLine : Math.max(1, lineNum - 10);
          const limit = enclosing ? enclosing.endLine - enclosing.startLine + 1 : 25;

          lineMatches.push({
            file: f.path,
            line: lineNum,
            chunkName: enclosing ? `${enclosing.name} [L${enclosing.startLine}-L${enclosing.endLine}]` : `L${offset}-L${offset + limit}`,
            readCall: `read_file(path="${f.path}", offset=${offset}, limit=${limit})`,
            snippet
          });
          if (lineMatches.length >= maxResults) break;
        }
      }
      if (lineMatches.length >= maxResults) break;
    }
  }

  return {
    mode: 'search',
    query: rawQuery,
    matchedFiles,
    matchedChunks,
    lineMatches
  };
}

// [CHUNK: CLI ENTRYPOINT]
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const argv = process.argv.slice(2);
  const opts = { mode: 'search', file: '', kind: '', regex: false, context: 1, limit: 20 };
  const queryParts = [];

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--exports' || a === '-e') {
      opts.mode = 'exports';
    } else if (a === '--map' || a === '-m') {
      opts.mode = 'map';
    } else if (a === '--regex' || a === '-r') {
      opts.regex = true;
    } else if (a === '--file' || a === '-f') {
      opts.file = argv[++i] || '';
    } else if (a === '--kind' || a === '-k') {
      opts.kind = argv[++i] || '';
    } else if (a === '--context' || a === '-c') {
      opts.context = Number(argv[++i] || 1);
    } else {
      queryParts.push(a);
    }
  }

  const query = queryParts.join(' ');
  const res = searchRepo(query, opts);

  if (res.mode === 'exports') {
    console.log(`\n📦 Exported Engine & Script APIs (${res.exports.length}):`);
    for (const ex of res.exports) {
      console.log(`  • ${ex.file}:L${ex.line} [${ex.kind}] ${ex.name} -> ${ex.signature}`);
    }
  } else if (res.mode === 'map') {
    console.log(`\n🗺️ Arena.ai Repository Subsystem Architecture Map:`);
    for (const [key, sub] of Object.entries(res.subsystems)) {
      console.log(`\n=== [${key.toUpperCase()}] ${sub.title} ===`);
      for (const f of sub.files) {
        console.log(`  📂 ${f.path} (${f.lines} lines) — ${f.description}`);
        if (f.topChunks.length) {
          console.log(`     Chunks: ${f.topChunks.slice(0, 6).join(' | ')}`);
        }
      }
    }
  } else {
    console.log(`\n🔍 Repo Search Results for "${query || '*'}"`);
    if (res.matchedFiles.length > 0) {
      console.log(`\n📂 Matching Files (${res.matchedFiles.length}):`);
      for (const f of res.matchedFiles) {
        console.log(`  • ${f.path} (${f.lines} lines, ${f.chunkCount} chunks) — ${f.description}`);
      }
    }
    console.log(`\n🧩 Matching Semantic Chunks (${res.matchedChunks.length}):`);
    for (const c of res.matchedChunks) {
      console.log(`  • ${c.file} [L${c.startLine}-L${c.endLine}] (${c.kind}: ${c.name}) -> ${c.readCall}`);
    }
    console.log(`\n📄 Matching Code Lines (${res.lineMatches.length}):`);
    for (const l of res.lineMatches) {
      console.log(`  • ${l.file}:${l.line} in ${l.chunkName} -> ${l.readCall}`);
      for (const s of l.snippet) {
        console.log(`      ${s}`);
      }
    }
  }
}
