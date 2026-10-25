import fs from 'node:fs';
import path from 'node:path';
import { GAMES_DIR } from '../scripts/sync-games.mjs';

export async function run() {
  let thumbCount = 0;
  let downloadCount = 0;
  if (fs.existsSync(GAMES_DIR)) {
    for (const d of fs.readdirSync(GAMES_DIR, { withFileTypes: true })) {
      if (!d.isDirectory() || d.name.startsWith('.')) continue;
      const files = fs.readdirSync(path.join(GAMES_DIR, d.name));
      if (files.some((f) => f.endsWith('.svg') || f.endsWith('.png') || f.endsWith('.jpg'))) {
        thumbCount++;
      }
      if (files.some((f) => f.endsWith('.py') || f.endsWith('.zip') || f.endsWith('.exe'))) {
        downloadCount++;
      }
    }
  }
  return {
    agent: 'asset-optimizer',
    ok: true,
    summary: `Verified ${thumbCount} game thumbnail(s) and ${downloadCount} downloadable build package(s).`
  };
}
