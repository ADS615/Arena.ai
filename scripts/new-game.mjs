import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT_DIR, GAMES_DIR, generateDefaultThumbnailSvg, syncGames } from './sync-games.mjs';

const __filename = fileURLToPath(import.meta.url);

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseArgs(argv) {
  const args = {
    slug: '',
    title: '',
    type: 'web',
    genre: 'Arcade',
    description: '',
    author: 'Arena.ai',
    controls: 'Arrow Keys / WASD or Mouse'
  };

  const positional = [];
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const [key, inlineVal] = token.slice(2).split('=');
      const val = inlineVal !== undefined ? inlineVal : argv[++i];
      if (key in args && val !== undefined) {
        args[key] = val;
      }
    } else {
      positional.push(token);
    }
  }

  if (!args.slug && positional[0]) args.slug = slugify(positional[0]);
  if (!args.title && positional[1]) args.title = positional[1];
  if (!args.title && args.slug) {
    args.title = args.slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  if (!args.slug && args.title) {
    args.slug = slugify(args.title);
  }

  return args;
}

export function createNewGame(options) {
  const slug = slugify(options.slug || options.title);
  if (!slug) {
    throw new Error('A game slug or title is required. Example: npm run new-game -- --slug space-dodger --title "Space Dodger"');
  }

  const title = options.title || slug;
  const rawType = String(options.type || 'web').toLowerCase();
  const type = ['web', 'download', 'hybrid'].includes(rawType) ? rawType : 'web';
  const genre = options.genre || (rawType === '3d' ? '3D Action' : 'Arcade');
  const description = options.description || `${title} — Built and uploaded with Arena.ai.`;
  const author = options.author || 'Arena.ai';
  const controls = options.controls || 'WASD / Arrow Keys / Mouse';

  const targetDir = path.join(GAMES_DIR, slug);
  if (fs.existsSync(targetDir)) {
    throw new Error(`Game directory already exists: games/${slug}`);
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const templateName =
    rawType === '3d' || genre.toLowerCase().includes('3d')
      ? 'web-3d-blender'
      : type === 'download'
      ? 'downloadable'
      : 'web-canvas';
  const templateDir = path.join(ROOT_DIR, 'templates', templateName);

  if (fs.existsSync(templateDir)) {
    for (const file of fs.readdirSync(templateDir)) {
      if (file === 'game.json') continue;
      const srcPath = path.join(templateDir, file);
      const destPath = path.join(targetDir, file);
      if (fs.statSync(srcPath).isFile()) {
        let content = fs.readFileSync(srcPath, 'utf8');
        content = content
          .replace(/__GAME_TITLE__/g, title)
          .replace(/__GAME_SLUG__/g, slug)
          .replace(/__GAME_GENRE__/g, genre)
          .replace(/__GAME_DESCRIPTION__/g, description);
        fs.writeFileSync(destPath, content, 'utf8');
      }
    }
  }

  const downloads = [];
  if (type === 'download' || type === 'hybrid') {
    if (fs.existsSync(path.join(targetDir, 'main.py'))) {
      downloads.push({
        label: 'Python Game Script (.py)',
        file: 'main.py',
        platform: 'Python 3 (Windows / macOS / Linux)'
      });
    }
  }

  const manifest = {
    slug,
    title,
    description,
    author,
    version: '1.0.0',
    type,
    genre,
    tags: [genre.toLowerCase(), type, 'arena'],
    entry: 'index.html',
    thumbnail: 'thumbnail.svg',
    controls,
    downloads,
    featured: false,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  fs.writeFileSync(path.join(targetDir, 'game.json'), JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  fs.writeFileSync(
    path.join(targetDir, 'thumbnail.svg'),
    generateDefaultThumbnailSvg(title, genre, slug),
    'utf8'
  );

  syncGames({ quiet: true });
  return { slug, targetDir, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  try {
    const args = parseArgs(process.argv.slice(2));
    const result = createNewGame(args);
    console.log(`[new-game] Created games/${result.slug}/`);
    console.log(`[new-game] Entry: games/${result.slug}/index.html`);
    console.log(`[new-game] Manifest: games/${result.slug}/game.json`);
  } catch (err) {
    console.error(`[new-game] Error: ${err.message}`);
    process.exit(1);
  }
}
