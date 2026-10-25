/**
 * Anti-Stop Continuous Coding Enforcer (scripts/anti-stop-enforcer.mjs)
 * Forces the AI agent to never stop mid-task, leave TODO stubs, or ship broken UI/scripts.
 * Generates memory/COMPLETION_STATUS.json once all completeness gates pass.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { ROOT_DIR, MEMORY_DIR, buildMemoryIndex } from './chunk-tool.mjs';
import { GAMES_DIR, syncGames } from './sync-games.mjs';

const __filename = fileURLToPath(import.meta.url);
const STATUS_PATH = path.join(MEMORY_DIR, 'COMPLETION_STATUS.json');

const BANNED_STUB_PATTERNS = [
  { label: 'Unfinished TODO comment', regex: /\/\/\s*TODO\b/i },
  { label: 'Unfinished FIXME comment', regex: /\/\/\s*FIXME\b/i },
  { label: 'Truncated code placeholder', regex: /\/\/\s*\.\.\.\s*(rest of|existing|remaining)\s+code/i },
  { label: 'Not implemented stub error', regex: /throw\s+new\s+Error\(\s*['"]Not implemented['"]\s*\)/i }
];

export function runAntiStopEnforcement({ quiet = false } = {}) {
  const registry = syncGames({ quiet: true });
  const { treeData, chunkData } = buildMemoryIndex({ quiet: true });

  const violations = [];
  let checkedFiles = 0;

  for (const fileObj of treeData.files) {
    const rel = fileObj.path;
    if (!rel.startsWith('games/') && !rel.startsWith('assets/')) continue;
    if (!rel.endsWith('.js') && !rel.endsWith('.mjs') && !rel.endsWith('.html')) continue;

    const full = path.join(ROOT_DIR, rel);
    if (!fs.existsSync(full)) continue;
    const content = fs.readFileSync(full, 'utf8');
    const lines = content.split(/\r?\n/);
    checkedFiles++;

    // 1. Check for banned mid-coding stop/stub markers
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pat of BANNED_STUB_PATTERNS) {
        if (pat.regex.test(line)) {
          violations.push(`${rel}:${i + 1} — ${pat.label}: "${line.trim().slice(0, 80)}"`);
        }
      }
    }

    // 2. Verify JS module syntax if standalone .js/.mjs
    if (rel.endsWith('.js') || rel.endsWith('.mjs')) {
      const sanitized = content
        .replace(/^\s*import\s+[\s\S]*?from\s+['"][^'"]+['"];?/gm, '/* import */')
        .replace(/^\s*export\s+default\s+/gm, '')
        .replace(/^\s*export\s+(?=(async\s+)?function|const|let|var|class)/gm, '');
      try {
        new vm.Script(sanitized, { filename: rel });
      } catch (err) {
        violations.push(`${rel} — Syntax Error: ${err.message}`);
      }
    }
  }

  const statusReport = {
    verifiedAt: new Date().toISOString(),
    passed: violations.length === 0,
    checkedFiles,
    totalGames: registry.totalGames,
    totalIndexedChunks: chunkData.totalChunks,
    violations
  };

  fs.mkdirSync(MEMORY_DIR, { recursive: true });
  fs.writeFileSync(STATUS_PATH, JSON.stringify(statusReport, null, 2) + '\n', 'utf8');

  if (!quiet) {
    if (statusReport.passed) {
      console.log(
        `[anti-stop-enforcer] ✓ PASSED: ${checkedFiles} code files verified, 0 unfinished stubs, ${registry.totalGames} games ready, ${chunkData.totalChunks} chunks indexed.`
      );
    } else {
      console.error(`[anti-stop-enforcer] ✗ FAILED with ${violations.length} violation(s):`);
      for (const v of violations) console.error(`  - ${v}`);
      process.exitCode = 1;
    }
  }

  return statusReport;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runAntiStopEnforcement();
}
