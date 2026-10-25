import fs from 'node:fs';
import path from 'node:path';
import { MEMORY_DIR } from '../scripts/chunk-tool.mjs';

export async function run() {
  const chunksPath = path.join(MEMORY_DIR, 'chunks.json');
  if (!fs.existsSync(chunksPath)) {
    return {
      agent: 'chunk-health',
      ok: true,
      summary: 'No chunks.json yet; run chunk-indexer first.'
    };
  }
  const { chunks } = JSON.parse(fs.readFileSync(chunksPath, 'utf8'));
  const oversized = chunks.filter(
    (c) => c.kind !== 'file' && c.kind !== 'html-script' && c.endLine - c.startLine > 140
  );
  return {
    agent: 'chunk-health',
    ok: true,
    summary: `Checked ${chunks.length} semantic chunks (${oversized.length} oversized >140 lines).`
  };
}
