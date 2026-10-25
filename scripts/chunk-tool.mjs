import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '..');
export const MEMORY_DIR = path.join(ROOT_DIR, 'memory');

const IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  '.cache',
  'dist',
  'build',
  'coverage',
  'Unselected files'
]);

const TEXT_EXTENSIONS = new Set([
  '.js', '.mjs', '.html', '.css', '.py', '.json', '.md', '.yml', '.yaml', '.svg'
]);

const FILE_DESCRIPTIONS = {
  'AGENTS.md': 'Primary instructions, Master Prompt, Chunk Editing protocol & Sub-Agent guide for Arena agents',
  'CLAUDE.md': 'Agent instructions mirror pointing to AGENTS.md & Master Prompt',
  'README.md': 'Repository overview, CLI documentation, and structure guide',
  'package.json': 'NPM scripts for dev server, game sync, chunk memory, and sub-agents',
  'index.html': 'Main Arena.ai Game Hub frontend layout (navbar, hero, filters, theatre modal, upload modal)',
  'assets/app.js': 'Frontend application state, catalog filtering, iframe player, file uploader, and prompt generator',
  'assets/styles.css': 'Dark arcade UI styles, responsive grid, theatre modal, and dialog styles',
  'scripts/dev-server.mjs': 'Zero-dependency HTTP server (0.0.0.0:3000) with static file serving and REST upload API',
  'scripts/sync-games.mjs': 'Auto-discovers games/* folders, generates missing manifests/thumbnails, and updates registry + memory',
  'scripts/new-game.mjs': 'CLI generator that scaffolds new browser or downloadable games from templates/',
  'scripts/validate-games.mjs': 'Validator checking all game manifests, entry points, thumbnails, and downloads',
  'scripts/chunk-tool.mjs': 'File Memory & Semantic Chunk Indexer for surgical line-range reading and chunk editing',
  'scripts/subagents.mjs': 'Parallel Sub-Agent Orchestrator, QA syntax verifier, game blueprinter, and custom sub-agent creator',
  'memory/MASTER_PROMPT.md': 'Master Self-Prompt enforcing continuous execution, chunk-only reading, and sub-agent usage',
  'memory/MEMORY.md': 'Auto-generated File Tree and line-number Chunk Map for fast lookup without full-file reads',
  'memory/file-tree.json': 'Machine-readable repository file tree with line counts and hashes',
  'memory/chunks.json': 'Machine-readable semantic chunk index (functions, sections, CSS rules) with startLine/endLine',
  'memory/subagents.json': 'Registry of specialist sub-agents available to the main agent'
};

function walkRepo(dir, relBase = '') {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.sort((a, b) => a.name.localeCompare(b.name));

  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const relPath = relBase ? `${relBase}/${entry.name}` : entry.name;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...walkRepo(fullPath, relPath));
    } else if (entry.isFile()) {
      results.push({ relPath, fullPath });
    }
  }
  return results;
}

function extractJsChunks(lines, fileRel, baseLineOffset = 0) {
  const chunks = [];
  const patterns = [
    { kind: 'function', regex: /^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*\(/ },
    { kind: 'const-fn', regex: /^\s*(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/ },
    { kind: 'state', regex: /^\s*(?:export\s+)?const\s+([A-Za-z0-9_$]+)\s*=\s*\{/ },
    { kind: 'listener', regex: /^\s*([A-Za-z0-9_$.]+)\.addEventListener\(\s*['"]([^'"]+)['"]/ },
    { kind: 'route', regex: /pathname\s*===\s*['"]([^'"]+)['"]/ }
  ];

  const markers = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const pat of patterns) {
      const m = line.match(pat.regex);
      if (m) {
        const name = pat.kind === 'listener' ? `${m[1]}.on(${m[2]})` : pat.kind === 'route' ? `route:${m[1]}` : m[1];
        markers.push({
          name,
          kind: pat.kind,
          startLine: baseLineOffset + i + 1
        });
        break;
      }
    }
  }

  for (let i = 0; i < markers.length; i++) {
    const cur = markers[i];
    const nextStart = i + 1 < markers.length ? markers[i + 1].startLine - 1 : baseLineOffset + lines.length;
    chunks.push({
      file: fileRel,
      name: cur.name,
      kind: cur.kind,
      startLine: cur.startLine,
      endLine: Math.max(cur.startLine, Math.min(nextStart, cur.startLine + 90))
    });
  }

  return chunks;
}

function extractHtmlChunks(lines, fileRel) {
  const chunks = [];
  let styleStart = null;
  let scriptStart = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    if (/<style\b/i.test(line)) styleStart = lineNum;
    if (/<\/style>/i.test(line) && styleStart !== null) {
      chunks.push({
        file: fileRel,
        name: '<style> block',
        kind: 'html-style',
        startLine: styleStart,
        endLine: lineNum
      });
      styleStart = null;
    }

    if (/<script\b/i.test(line)) scriptStart = lineNum;
    if (/<\/script>/i.test(line) && scriptStart !== null) {
      chunks.push({
        file: fileRel,
        name: '<script> block',
        kind: 'html-script',
        startLine: scriptStart,
        endLine: lineNum
      });
      const scriptLines = lines.slice(scriptStart, lineNum - 1);
      chunks.push(...extractJsChunks(scriptLines, fileRel, scriptStart));
      scriptStart = null;
    }

    const secMatch = line.match(/<(header|main|section|footer|div|form)\b[^>]*\bid=["']([^"']+)["']/i);
    if (secMatch) {
      chunks.push({
        file: fileRel,
        name: `#${secMatch[2]} (${secMatch[1].toLowerCase()})`,
        kind: 'dom-section',
        startLine: lineNum,
        endLine: Math.min(lines.length, lineNum + 35)
      });
    }
  }

  return chunks;
}

function extractCssChunks(lines, fileRel) {
  const chunks = [];
  const markers = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const commentMatch = line.match(/^\/\*\s*([^*]+?)\s*\*\/$/);
    if (commentMatch) {
      markers.push({
        name: `Section: ${commentMatch[1].trim()}`,
        kind: 'css-section',
        startLine: i + 1
      });
      continue;
    }
    const selectorMatch = line.match(/^([.:#a-zA-Z0-9_-][^{]+)\{\s*$/);
    if (selectorMatch && !line.startsWith(' ')) {
      markers.push({
        name: selectorMatch[1].trim(),
        kind: 'css-rule',
        startLine: i + 1
      });
    }
  }

  for (let i = 0; i < markers.length; i++) {
    const cur = markers[i];
    const nextStart = i + 1 < markers.length ? markers[i + 1].startLine - 1 : lines.length;
    chunks.push({
      file: fileRel,
      name: cur.name,
      kind: cur.kind,
      startLine: cur.startLine,
      endLine: Math.max(cur.startLine, nextStart)
    });
  }

  return chunks;
}

function extractPythonChunks(lines, fileRel) {
  const chunks = [];
  const markers = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const m = line.match(/^(\s*)(class|def)\s+([A-Za-z0-9_]+)/);
    if (m) {
      markers.push({
        name: `${m[2]} ${m[3]}`,
        kind: m[2] === 'class' ? 'py-class' : 'py-def',
        startLine: i + 1
      });
    }
  }

  for (let i = 0; i < markers.length; i++) {
    const cur = markers[i];
    const nextStart = i + 1 < markers.length ? markers[i + 1].startLine - 1 : lines.length;
    chunks.push({
      file: fileRel,
      name: cur.name,
      kind: cur.kind,
      startLine: cur.startLine,
      endLine: Math.max(cur.startLine, nextStart)
    });
  }
  return chunks;
}

function extractMarkdownChunks(lines, fileRel) {
  const chunks = [];
  const markers = [];

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,3})\s+(.+)$/);
    if (m) {
      markers.push({
        name: m[2].trim(),
        kind: `md-h${m[1].length}`,
        startLine: i + 1
      });
    }
  }

  for (let i = 0; i < markers.length; i++) {
    const cur = markers[i];
    const nextStart = i + 1 < markers.length ? markers[i + 1].startLine - 1 : lines.length;
    chunks.push({
      file: fileRel,
      name: cur.name,
      kind: cur.kind,
      startLine: cur.startLine,
      endLine: Math.max(cur.startLine, nextStart)
    });
  }
  return chunks;
}

export function buildMemoryIndex({ quiet = false } = {}) {
  if (!fs.existsSync(MEMORY_DIR)) {
    fs.mkdirSync(MEMORY_DIR, { recursive: true });
  }

  const allFiles = walkRepo(ROOT_DIR);
  const fileTree = [];
  const allChunks = [];

  for (const { relPath, fullPath } of allFiles) {
    // Skip generated memory outputs to avoid recursive self-diffs
    if (relPath === 'memory/file-tree.json' || relPath === 'memory/chunks.json' || relPath === 'memory/MEMORY.md') {
      continue;
    }

    const stat = fs.statSync(fullPath);
    const ext = path.extname(relPath).toLowerCase();
    const isText = TEXT_EXTENSIONS.has(ext);

    let lineCount = 0;
    let fileChunks = [];
    let hash = '';

    if (isText && stat.size < 2 * 1024 * 1024) {
      const content = fs.readFileSync(fullPath, 'utf8');
      hash = crypto.createHash('sha1').update(content).digest('hex').slice(0, 10);
      const lines = content.split(/\r?\n/);
      lineCount = lines.length;

      if (ext === '.js' || ext === '.mjs') {
        fileChunks = extractJsChunks(lines, relPath, 0);
      } else if (ext === '.html') {
        fileChunks = extractHtmlChunks(lines, relPath);
      } else if (ext === '.css') {
        fileChunks = extractCssChunks(lines, relPath);
      } else if (ext === '.py') {
        fileChunks = extractPythonChunks(lines, relPath);
      } else if (ext === '.md') {
        fileChunks = extractMarkdownChunks(lines, relPath);
      }

      if (fileChunks.length === 0 && lineCount > 0) {
        fileChunks.push({
          file: relPath,
          name: 'full-file',
          kind: 'file',
          startLine: 1,
          endLine: lineCount
        });
      }
    }

    const description =
      FILE_DESCRIPTIONS[relPath] ||
      (relPath.startsWith('games/')
        ? `Game asset/source for ${relPath.split('/')[1]}`
        : relPath.startsWith('templates/')
        ? `Starter template file (${relPath})`
        : 'Repository file');

    fileTree.push({
      path: relPath,
      bytes: stat.size,
      lines: lineCount,
      hash,
      chunkCount: fileChunks.length,
      description
    });

    allChunks.push(...fileChunks);
  }

  const treeData = {
    updatedAt: new Date().toISOString(),
    totalFiles: fileTree.length,
    files: fileTree
  };

  const chunkData = {
    updatedAt: new Date().toISOString(),
    totalChunks: allChunks.length,
    chunks: allChunks
  };

  fs.writeFileSync(path.join(MEMORY_DIR, 'file-tree.json'), JSON.stringify(treeData, null, 2) + '\n', 'utf8');
  fs.writeFileSync(path.join(MEMORY_DIR, 'chunks.json'), JSON.stringify(chunkData, null, 2) + '\n', 'utf8');

  // Generate compact human & agent readable memory/MEMORY.md
  const mdLines = [
    '# 🧠 Repository File Memory & Chunk Map (`memory/MEMORY.md`)',
    '',
    '> **CHUNK EDITING PROTOCOL FOR AGENTS**:',
    '> Do **NOT** read entire files from line 1 to end when fixing or updating code.',
    '> 1. Locate the target file and exact `[Lstart-Lend]` line range below (or run `npm run find-chunk -- <keyword>`).',
    '> 2. Call `read_file` with `offset: startLine` and `limit: (endLine - startLine + 1)`.',
    '> 3. Apply surgical edits using `edit_file`, then run `npm run sync` to refresh this memory map.',
    '',
    '---',
    '',
    '## 1. File Tree Overview',
    '',
    '| File Path | Lines | Chunks | Purpose |',
    '| :--- | :---: | :---: | :--- |'
  ];

  for (const f of fileTree) {
    mdLines.push(`| \`${f.path}\` | ${f.lines} | ${f.chunkCount} | ${f.description} |`);
  }

  mdLines.push('', '---', '', '## 2. Semantic Chunk Index (Line Ranges by File)', '');

  const byFile = new Map();
  for (const c of allChunks) {
    if (!byFile.has(c.file)) byFile.set(c.file, []);
    byFile.get(c.file).push(c);
  }

  for (const [file, chunks] of byFile.entries()) {
    if (file.endsWith('.svg') || file.endsWith('.json')) continue;
    mdLines.push(`### \`${file}\``);
    for (const c of chunks) {
      mdLines.push(`- **\`L${c.startLine}-L${c.endLine}\`** (\`${c.kind}\`): \`${c.name}\``);
    }
    mdLines.push('');
  }

  fs.writeFileSync(path.join(MEMORY_DIR, 'MEMORY.md'), mdLines.join('\n') + '\n', 'utf8');

  if (!quiet) {
    console.log(`[memory] Indexed ${fileTree.length} files and ${allChunks.length} semantic chunks -> memory/MEMORY.md`);
  }

  return { treeData, chunkData };
}

export function findChunks(query) {
  const chunksPath = path.join(MEMORY_DIR, 'chunks.json');
  if (!fs.existsSync(chunksPath)) {
    buildMemoryIndex({ quiet: true });
  }
  const { chunks } = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));
  const q = String(query || '').toLowerCase().trim();

  // Also search file contents for exact line matches if query isn't just a symbol name
  const symbolMatches = chunks.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.file.toLowerCase().includes(q) ||
      c.kind.toLowerCase().includes(q)
  );

  // Content search mapped to enclosing chunk
  const contentMatches = [];
  const treePath = path.join(MEMORY_DIR, 'file-tree.json');
  const { files } = JSON.parse(fs.readFileSync(treePath, 'utf8'));

  for (const f of files) {
    const ext = path.extname(f.path).toLowerCase();
    if (!TEXT_EXTENSIONS.has(ext) || f.path.startsWith('memory/')) continue;
    const full = path.join(ROOT_DIR, f.path);
    if (!fs.existsSync(full)) continue;
    const lines = fs.readFileSync(full, 'utf8').split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].toLowerCase().includes(q)) {
        const lineNum = i + 1;
        const enclosing = chunks.find(
          (c) => c.file === f.path && lineNum >= c.startLine && lineNum <= c.endLine
        );
        contentMatches.push({
          file: f.path,
          line: lineNum,
          preview: lines[i].trim().slice(0, 100),
          chunk: enclosing
            ? `${enclosing.name} [L${enclosing.startLine}-L${enclosing.endLine}]`
            : `L${Math.max(1, lineNum - 10)}-L${Math.min(lines.length, lineNum + 15)}`,
          recommendedOffset: enclosing ? enclosing.startLine : Math.max(1, lineNum - 10),
          recommendedLimit: enclosing ? enclosing.endLine - enclosing.startLine + 1 : 25
        });
        if (contentMatches.length >= 25) break;
      }
    }
    if (contentMatches.length >= 25) break;
  }

  return { symbolMatches: symbolMatches.slice(0, 20), contentMatches };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const cmd = process.argv[2] || 'index';
  const arg = process.argv.slice(3).join(' ');

  if (cmd === 'index') {
    buildMemoryIndex();
  } else if (cmd === 'tree') {
    const { treeData } = buildMemoryIndex({ quiet: true });
    console.log(`Repository File Tree (${treeData.totalFiles} files):`);
    for (const f of treeData.files) {
      console.log(`  ${f.path.padEnd(42)} | ${String(f.lines).padStart(4)} lines | ${String(f.chunkCount).padStart(2)} chunks | ${f.description}`);
    }
  } else if (cmd === 'find' || cmd === 'search') {
    if (!arg) {
      console.error('Usage: npm run find-chunk -- <search-query>');
      process.exit(1);
    }
    const { symbolMatches, contentMatches } = findChunks(arg);
    console.log(`\n=== Symbol / Chunk Matches for "${arg}" ===`);
    if (symbolMatches.length === 0) {
      console.log('  (none)');
    } else {
      for (const m of symbolMatches) {
        const limit = m.endLine - m.startLine + 1;
        console.log(
          `  • ${m.file} [L${m.startLine}-L${m.endLine}] (${m.kind}: ${m.name}) -> read_file(path="${m.file}", offset=${m.startLine}, limit=${limit})`
        );
      }
    }
    console.log(`\n=== Line Content Matches for "${arg}" ===`);
    if (contentMatches.length === 0) {
      console.log('  (none)');
    } else {
      for (const c of contentMatches) {
        console.log(
          `  • ${c.file}:${c.line} in ${c.chunk} -> read_file(path="${c.file}", offset=${c.recommendedOffset}, limit=${c.recommendedLimit})\n      ${c.preview}`
        );
      }
    }
  } else {
    buildMemoryIndex();
  }
}
