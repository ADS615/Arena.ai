import fs from 'node:fs';
import path from 'node:path';
import { GAMES_DIR, REGISTRY_PATH, syncGames } from './sync-games.mjs';

const registry = syncGames({ quiet: true });
let errors = 0;

if (!fs.existsSync(REGISTRY_PATH)) {
  console.error('[validate] Missing games/registry.json');
  process.exit(1);
}

for (const game of registry.games) {
  const gameDir = path.join(GAMES_DIR, game.slug);

  if (!game.title || typeof game.title !== 'string') {
    console.error(`[validate] ${game.slug}: Missing valid title`);
    errors++;
  }

  if (game.entry) {
    const entryPath = path.join(gameDir, game.entry);
    if (!fs.existsSync(entryPath)) {
      console.error(`[validate] ${game.slug}: Missing entry file "${game.entry}"`);
      errors++;
    }
  } else if (!game.downloads || game.downloads.length === 0) {
    console.error(`[validate] ${game.slug}: Game must have either an HTML "entry" file or at least one item in "downloads"`);
    errors++;
  }

  if (game.thumbnail) {
    const thumbPath = path.join(gameDir, game.thumbnail);
    if (!fs.existsSync(thumbPath)) {
      console.error(`[validate] ${game.slug}: Missing thumbnail file "${game.thumbnail}"`);
      errors++;
    }
  }

  if (Array.isArray(game.downloads)) {
    for (const dl of game.downloads) {
      const dlPath = path.join(gameDir, dl.file);
      if (!fs.existsSync(dlPath)) {
        console.error(`[validate] ${game.slug}: Missing downloadable file "${dl.file}"`);
        errors++;
      }
    }
  }
}

if (errors > 0) {
  console.error(`[validate] Failed with ${errors} error(s).`);
  process.exit(1);
}

console.log(`[validate] All ${registry.games.length} game(s) validated successfully!`);
