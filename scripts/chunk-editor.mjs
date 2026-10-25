/**
 * Surgical Chunk Editor (scripts/chunk-editor.mjs)
 * Allows the AI agent to locate, read, replace, insert, and syntax-verify
 * individual semantic chunks by name or line range without reading or rewriting entire files.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { ROOT_DIR, MEMORY_DIR, buildMemoryIndex, findChunks } from './chunk-tool.mjs';

const __filename = fileURLToPath(import.meta.url);

// [CHUNK: CHUNK LOOKUP]
export function locateChunk(fileRel, chunkQuery) {
  const chunksPath = path.join(MEMORY_DIR, 'chunks.json');
  if (!fs.existsSync(chunksPath)) {
    buildMemoryIndex({ quiet: true });
  }
  const { chunks } = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));
  const fileChunks = chunks.filter((c) => c.file === fileRel);
  if (fileChunks.length === 0) {
    throw new Error(`No indexed chunks found for file: ${fileRel}`);
  }

  const q = String(chunkQuery || '').toLowerCase().trim();
  const exact = fileChunks.find((c) => c.name.toLowerCase() === q);
  if (exact) return exact;

  const partial = fileChunks.find((c) => c.name.toLowerCase().includes(q));
  if (partial) return partial;

  // Support explicit line range e.g. "L120-L150"
  const rangeMatch = q.match(/^l?(\d+)-l?(\d+)$/i);
  if (rangeMatch) {
    return {
      file: fileRel,
      name: `L${rangeMatch[1]}-L${rangeMatch[2]}`,
      kind: 'line-range',
      startLine: Number(rangeMatch[1]),
      endLine: Number(rangeMatch[2])
    };
  }

  throw new Error(
    `Chunk "${chunkQuery}" not found in ${fileRel}. Available chunks: ${fileChunks
      .slice(0, 12)
      .map((c) => `${c.name}[L${c.startLine}-L${c.endLine}]`)
      .join(', ')}`
  );
}

// [CHUNK: READ SINGLE CHUNK]
export function readChunkOnly(fileRel, chunkQuery, contextLines = 2) {
  const target = locateChunk(fileRel, chunkQuery);
  const fullPath = path.join(ROOT_DIR, fileRel);
  const allLines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/);

  const startIdx = Math.max(0, target.startLine - 1 - contextLines);
  const endIdx = Math.min(allLines.length, target.endLine + contextLines);
  const slice = allLines.slice(startIdx, endIdx);
  const hash = crypto.createHash('sha1').update(slice.join('\n')).digest('hex').slice(0, 8);

  return {
    file: fileRel,
    chunk: target.name,
    kind: target.kind,
    startLine: startIdx + 1,
    endLine: endIdx,
    hash,
    numberedLines: slice.map((line, idx) => `${String(startIdx + idx + 1).padStart(4)} | ${line}`).join('\n'),
    rawText: slice.join('\n')
  };
}

// [CHUNK: SURGICAL CHUNK REPLACE]
export function replaceChunkOnly(fileRel, chunkQuery, newContent, { verifySyntax = true } = {}) {
  const target = locateChunk(fileRel, chunkQuery);
  const fullPath = path.join(ROOT_DIR, fileRel);
  const allLines = fs.readFileSync(fullPath, 'utf8').split(/\r?\n/);

  const before = allLines.slice(0, target.startLine - 1);
  const after = allLines.slice(target.endLine);
  const replacementLines = String(newContent).split(/\r?\n/);
  const updatedLines = [...before, ...replacementLines, ...after];
  const updatedSource = updatedLines.join('\n');

  if (verifySyntax && (fileRel.endsWith('.js') || fileRel.endsWith('.mjs'))) {
    const sanitized = updatedSource
      .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?/gm, '/* import */')
      .replace(/^\s*export\s+(default\s+)?/gm, '');
    new vm.Script(sanitized, { filename: fileRel });
  }

  fs.writeFileSync(fullPath, updatedSource, 'utf8');
  buildMemoryIndex({ quiet: true });

  return {
    ok: true,
    file: fileRel,
    chunk: target.name,
    oldRange: `L${target.startLine}-L${target.endLine}`,
    newLinesCount: replacementLines.length
  };
}

// [CHUNK: CLI ENTRYPOINT]
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const cmd = process.argv[2] || 'help';

  if (cmd === 'read') {
    const fileRel = process.argv[3];
    const query = process.argv.slice(4).join(' ');
    if (!fileRel || !query) {
      console.error('Usage: npm run chunk-edit -- read <file> <chunkNameOrRange>');
      process.exit(1);
    }
    const res = readChunkOnly(fileRel, query);
    console.log(`\n🎯 CHUNK: ${res.file} :: ${res.chunk} [L${res.startLine}-L${res.endLine}] (hash:${res.hash})`);
    console.log('------------------------------------------------------------------------');
    console.log(res.numberedLines);
    console.log('------------------------------------------------------------------------');
  } else if (cmd === 'find') {
    const query = process.argv.slice(3).join(' ');
    const { symbolMatches, contentMatches } = findChunks(query);
    console.log(`Found ${symbolMatches.length} symbol chunk(s) and ${contentMatches.length} content match(es) for "${query}":`);
    for (const m of symbolMatches) {
      console.log(`  • ${m.file} [L${m.startLine}-L${m.endLine}] (${m.kind}: ${m.name})`);
    }
    for (const c of contentMatches.slice(0, 10)) {
      console.log(`  • ${c.file}:${c.line} in ${c.chunk} -> ${c.preview}`);
    }
  } else {
    console.log(`
✂️ Arena.ai Surgical Chunk Editor (scripts/chunk-editor.mjs)
Commands:
  npm run chunk-edit -- find <keyword>                  # Find exact file & [Lstart-Lend] chunk
  npm run chunk-edit -- read <file> <chunkNameOrRange>  # Read ONLY that specific chunk (never the whole file)
`);
  }
}
