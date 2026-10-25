import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT_DIR = path.resolve(__dirname, '..');
export const GAMES_DIR = path.join(ROOT_DIR, 'games');
export const REGISTRY_PATH = path.join(GAMES_DIR, 'registry.json');

const DOWNLOADABLE_EXTENSIONS = new Set([
  '.py', '.zip', '.tar', '.gz', '.tgz', '.7z', '.rar',
  '.exe', '.msi', '.dmg', '.pkg', '.appimage', '.deb', '.rpm',
  '.pck', '.apk', '.aab', '.jar', '.love', '.tic', '.gb', '.rom', '.nes', '.wasm',
  '.obj', '.gltf', '.glb', '.fbx', '.stl', '.blend'
]);

const IMAGE_EXTENSIONS = new Set(['.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif']);

function humanizeSlug(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function extractHtmlTitle(htmlPath) {
  try {
    const content = fs.readFileSync(htmlPath, 'utf8');
    const match = content.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (match && match[1].trim()) {
      return match[1].trim();
    }
  } catch {
    // Ignore read errors
  }
  return null;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function inferPlatformFromExt(ext) {
  switch (ext.toLowerCase()) {
    case '.py':
      return 'Python 3 (Cross-Platform)';
    case '.exe':
    case '.msi':
      return 'Windows';
    case '.dmg':
    case '.pkg':
      return 'macOS';
    case '.appimage':
    case '.deb':
    case '.rpm':
      return 'Linux';
    case '.apk':
    case '.aab':
      return 'Android';
    case '.jar':
      return 'Java (Cross-Platform)';
    case '.love':
      return 'LÖVE 2D';
    case '.pck':
      return 'Godot Engine Pack';
    case '.zip':
    case '.tar':
    case '.gz':
    case '.7z':
      return 'Archive / Build Bundle';
    default:
      return 'Cross-Platform';
  }
}

export function generateDefaultThumbnailSvg(title, genre = 'Arcade', slug = 'game') {
  // Deterministic color palette from slug hash
  let hash = 0;
  for (let i = 0; i < slug.length; i++) {
    hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  }
  const palettes = [
    ['#0f172a', '#1e1b4b', '#6366f1', '#22d3ee'],
    ['#090d16', '#1f1235', '#ec4899', '#a855f7'],
    ['#071717', '#06342e', '#10b981', '#38bdf8'],
    ['#18100c', '#331812', '#f97316', '#facc15'],
    ['#0f1123', '#1d2449', '#3b82f6', '#34d399']
  ];
  const [bg1, bg2, accent1, accent2] = palettes[hash % palettes.length];
  const safeTitle = String(title)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 32);
  const safeGenre = String(genre)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .slice(0, 24);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" width="640" height="360">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bg1}"/>
      <stop offset="100%" stop-color="${bg2}"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${accent1}"/>
      <stop offset="100%" stop-color="${accent2}"/>
    </linearGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="${accent1}" stroke-width="0.6" stroke-opacity="0.18"/>
    </pattern>
  </defs>
  <rect width="640" height="360" fill="url(#bg)"/>
  <rect width="640" height="360" fill="url(#grid)"/>
  <circle cx="520" cy="80" r="140" fill="${accent1}" opacity="0.14"/>
  <circle cx="120" cy="290" r="160" fill="${accent2}" opacity="0.12"/>
  <rect x="44" y="44" width="552" height="272" rx="18" fill="#090d16" fill-opacity="0.55" stroke="url(#accent)" stroke-width="2"/>
  <rect x="68" y="68" width="140" height="28" rx="14" fill="${accent1}" fill-opacity="0.22" stroke="${accent1}" stroke-width="1"/>
  <text x="138" y="86" fill="${accent2}" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="700" text-anchor="middle" letter-spacing="1">${safeGenre.toUpperCase()}</text>
  <text x="68" y="185" fill="#f8fafc" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="800" letter-spacing="-0.5">${safeTitle}</text>
  <rect x="68" y="212" width="120" height="5" rx="2.5" fill="url(#accent)"/>
  <text x="68" y="276" fill="#94a3b8" font-family="monospace" font-size="14">ARENA.AI GAME HUB // ${slug}</text>
</svg>`;
}

export function syncGames({ quiet = false } = {}) {
  if (!fs.existsSync(GAMES_DIR)) {
    fs.mkdirSync(GAMES_DIR, { recursive: true });
  }

  const entries = fs.readdirSync(GAMES_DIR, { withFileTypes: true });
  const games = [];

  for (const dirent of entries) {
    if (!dirent.isDirectory()) continue;
    if (dirent.name.startsWith('.')) continue;

    const slug = dirent.name;
    const gameDir = path.join(GAMES_DIR, slug);
    const manifestPath = path.join(gameDir, 'game.json');
    const dirFiles = fs.readdirSync(gameDir);

    let manifest = {};
    if (fs.existsSync(manifestPath)) {
      try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      } catch (err) {
        if (!quiet) {
          console.warn(`[sync] Warning: Invalid JSON in games/${slug}/game.json:`, err.message);
        }
      }
    }

    // Detect entry HTML file
    let entryFile = manifest.entry || null;
    if (!entryFile && dirFiles.includes('index.html')) {
      entryFile = 'index.html';
    } else if (entryFile && !fs.existsSync(path.join(gameDir, entryFile))) {
      entryFile = dirFiles.includes('index.html') ? 'index.html' : null;
    }

    // Detect downloadable files
    let downloads = Array.isArray(manifest.downloads) ? [...manifest.downloads] : [];
    const trackedDownloadFiles = new Set(downloads.map((d) => d.file));

    for (const file of dirFiles) {
      if (file === 'game.json' || file === 'index.html' || file.startsWith('.')) continue;
      const ext = path.extname(file).toLowerCase();
      const fullPath = path.join(gameDir, file);
      if (fs.statSync(fullPath).isFile() && DOWNLOADABLE_EXTENSIONS.has(ext) && !trackedDownloadFiles.has(file)) {
        downloads.push({
          label: `${file}`,
          file,
          platform: inferPlatformFromExt(ext)
        });
        trackedDownloadFiles.add(file);
      }
    }

    // Enrich download items with file size and relative URL
    downloads = downloads
      .filter((d) => d && d.file && fs.existsSync(path.join(gameDir, d.file)))
      .map((d) => {
        const stat = fs.statSync(path.join(gameDir, d.file));
        const ext = path.extname(d.file).toLowerCase();
        return {
          label: d.label || d.file,
          file: d.file,
          url: `games/${slug}/${d.file}`,
          platform: d.platform || inferPlatformFromExt(ext),
          size: d.size || formatFileSize(stat.size),
          bytes: stat.size
        };
      });

    // Skip completely empty folders with no entry and no downloads and no game.json
    if (!entryFile && downloads.length === 0 && !fs.existsSync(manifestPath)) {
      continue;
    }

    // Determine title
    const inferredTitle =
      manifest.title ||
      (entryFile ? extractHtmlTitle(path.join(gameDir, entryFile)) : null) ||
      humanizeSlug(slug);

    // Determine type: "web", "download", or "hybrid"
    let gameType = manifest.type;
    if (!gameType || !['web', 'download', 'hybrid'].includes(gameType)) {
      if (entryFile && downloads.length > 0) {
        gameType = 'hybrid';
      } else if (downloads.length > 0 && !entryFile) {
        gameType = 'download';
      } else {
        gameType = 'web';
      }
    }

    // Determine thumbnail
    let thumbnailFile = manifest.thumbnail || null;
    if (!thumbnailFile || !fs.existsSync(path.join(gameDir, thumbnailFile))) {
      const foundThumb = dirFiles.find((f) => {
        const base = path.basename(f, path.extname(f)).toLowerCase();
        const ext = path.extname(f).toLowerCase();
        return IMAGE_EXTENSIONS.has(ext) && ['thumbnail', 'cover', 'preview', 'icon', 'banner'].includes(base);
      });
      if (foundThumb) {
        thumbnailFile = foundThumb;
      } else {
        thumbnailFile = 'thumbnail.svg';
        const svgContent = generateDefaultThumbnailSvg(inferredTitle, manifest.genre || 'Arcade', slug);
        fs.writeFileSync(path.join(gameDir, thumbnailFile), svgContent, 'utf8');
      }
    }

    const normalizedManifest = {
      slug,
      title: inferredTitle,
      description:
        manifest.description ||
        `Play or download ${inferredTitle} on the Arena.ai Game Hub.`,
      author: manifest.author || 'Arena.ai',
      version: manifest.version || '1.0.0',
      type: gameType,
      genre: manifest.genre || 'Arcade',
      tags: Array.isArray(manifest.tags) && manifest.tags.length > 0 ? manifest.tags : [gameType, 'arena'],
      entry: entryFile || null,
      playUrl: entryFile ? `games/${slug}/${entryFile}` : null,
      thumbnail: thumbnailFile,
      thumbnailUrl: `games/${slug}/${thumbnailFile}`,
      controls: manifest.controls || 'Keyboard / Mouse / Touch',
      instructions: manifest.instructions || '',
      downloads,
      featured: Boolean(manifest.featured),
      createdAt: manifest.createdAt || new Date().toISOString().slice(0, 10)
    };

    // Ensure game.json exists so future tools/agents see canonical metadata
    if (!fs.existsSync(manifestPath)) {
      const toSave = { ...normalizedManifest };
      delete toSave.playUrl;
      delete toSave.thumbnailUrl;
      fs.writeFileSync(manifestPath, JSON.stringify(toSave, null, 2) + '\n', 'utf8');
    }

    games.push(normalizedManifest);
  }

  // Sort featured first, then newest createdAt, then alphabetical
  games.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    if (a.createdAt !== b.createdAt) return b.createdAt.localeCompare(a.createdAt);
    return a.title.localeCompare(b.title);
  });

  const registry = {
    schemaVersion: 1,
    updatedAt: new Date().toISOString(),
    totalGames: games.length,
    games
  };

  fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2) + '\n', 'utf8');

  if (!quiet) {
    console.log(`[sync] Synced ${games.length} game(s) -> games/registry.json`);
  }

  return registry;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  syncGames();
}
