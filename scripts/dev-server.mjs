import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT_DIR, GAMES_DIR, generateDefaultThumbnailSvg, syncGames } from './sync-games.mjs';
import { createNewGame } from './new-game.mjs';
import { searchRepo } from './repo-search.mjs';

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.wasm': 'application/wasm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.py': 'text/x-python; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.zip': 'application/zip'
};

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function sendJson(res, status, data) {
  const body = JSON.stringify(data, null, 2);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Cache-Control': 'no-store'
  });
  res.end(body);
}

function readJsonBody(req, maxBytes = 50 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        reject(new Error('Payload too large (max 50MB)'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

// Initial sync on startup
syncGames();

const server = http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(urlObj.pathname);

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }

    // API routes
    if (pathname === '/api/status' && req.method === 'GET') {
      sendJson(res, 200, {
        ok: true,
        mode: 'server',
        writable: true,
        repo: 'ADS615/Arena.ai'
      });
      return;
    }

    if (pathname === '/api/search' && req.method === 'GET') {
      const q = urlObj.searchParams.get('q') || '';
      const mode = urlObj.searchParams.get('mode') || 'search';
      const file = urlObj.searchParams.get('file') || '';
      const kind = urlObj.searchParams.get('kind') || '';
      const results = searchRepo(q, { mode, file, kind, limit: 30 });
      sendJson(res, 200, { ok: true, ...results });
      return;
    }

    if ((pathname === '/api/games' || pathname === '/games/registry.json') && req.method === 'GET') {
      const registry = syncGames({ quiet: true });
      sendJson(res, 200, registry);
      return;
    }

    if (pathname === '/api/games/sync' && req.method === 'POST') {
      const registry = syncGames();
      sendJson(res, 200, { ok: true, registry });
      return;
    }

    if (pathname === '/api/games' && req.method === 'POST') {
      const body = await readJsonBody(req);
      const title = String(body.title || '').trim();
      const slug = slugify(body.slug || title);

      if (!slug) {
        sendJson(res, 400, { ok: false, error: 'Please provide a game title or slug.' });
        return;
      }

      const genre = String(body.genre || 'Arcade').trim();
      const type = ['web', 'download', 'hybrid'].includes(body.type) ? body.type : 'web';
      const description = String(body.description || `${title || slug} — Uploaded to Arena.ai Game Hub.`).trim();
      const author = String(body.author || 'Arena.ai').trim();
      const controls = String(body.controls || 'Keyboard / Mouse / Touch').trim();
      const files = Array.isArray(body.files) ? body.files : [];

      const gameDir = path.join(GAMES_DIR, slug);

      // If no files uploaded and directory does not exist, scaffold from template
      if (files.length === 0 && !fs.existsSync(gameDir)) {
        createNewGame({ slug, title: title || slug, type, genre, description, author, controls });
        const registry = syncGames({ quiet: true });
        const created = registry.games.find((g) => g.slug === slug);
        sendJson(res, 201, { ok: true, game: created, registry });
        return;
      }

      fs.mkdirSync(gameDir, { recursive: true });

      const uploadedDownloads = [];
      let hasIndexHtml = false;

      for (const fileObj of files) {
        if (!fileObj || !fileObj.name) continue;
        // Sanitize relative file name inside game folder
        const safeName = path.basename(String(fileObj.name).replace(/\\/g, '/'));
        if (!safeName || safeName.startsWith('.')) continue;

        const destPath = path.join(gameDir, safeName);
        if (fileObj.encoding === 'base64') {
          const buf = Buffer.from(fileObj.content || '', 'base64');
          fs.writeFileSync(destPath, buf);
        } else {
          fs.writeFileSync(destPath, String(fileObj.content || ''), 'utf8');
        }

        if (safeName.toLowerCase() === 'index.html') {
          hasIndexHtml = true;
        } else if (
          safeName.toLowerCase() !== 'game.json' &&
          !['.svg', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.css', '.js', '.mjs'].includes(
            path.extname(safeName).toLowerCase()
          )
        ) {
          uploadedDownloads.push({
            label: fileObj.label || safeName,
            file: safeName,
            platform: fileObj.platform || undefined
          });
        }
      }

      // If user uploaded a single HTML file with another name (e.g., my_game.html), copy/rename to index.html if no index.html exists
      if (!hasIndexHtml) {
        const htmlFile = files.find(
          (f) => f && f.name && path.extname(f.name).toLowerCase() === '.html'
        );
        if (htmlFile) {
          const safeHtmlName = path.basename(String(htmlFile.name));
          fs.copyFileSync(path.join(gameDir, safeHtmlName), path.join(gameDir, 'index.html'));
          hasIndexHtml = true;
        }
      }

      // Write or merge game.json
      const manifestPath = path.join(gameDir, 'game.json');
      let existingManifest = {};
      if (fs.existsSync(manifestPath)) {
        try {
          existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        } catch {
          existingManifest = {};
        }
      }

      const manifest = {
        ...existingManifest,
        slug,
        title: title || existingManifest.title || slug,
        description: description || existingManifest.description,
        author: author || existingManifest.author || 'Arena.ai',
        version: body.version || existingManifest.version || '1.0.0',
        type: body.type || existingManifest.type || (hasIndexHtml && uploadedDownloads.length > 0 ? 'hybrid' : uploadedDownloads.length > 0 ? 'download' : 'web'),
        genre: genre || existingManifest.genre || 'Arcade',
        tags: Array.isArray(body.tags) && body.tags.length > 0 ? body.tags : existingManifest.tags || [genre.toLowerCase(), 'arena'],
        entry: hasIndexHtml || fs.existsSync(path.join(gameDir, 'index.html')) ? 'index.html' : null,
        thumbnail: existingManifest.thumbnail || 'thumbnail.svg',
        controls: controls || existingManifest.controls || 'Keyboard / Mouse',
        downloads: uploadedDownloads.length > 0 ? uploadedDownloads : existingManifest.downloads || [],
        featured: Boolean(body.featured ?? existingManifest.featured ?? false),
        createdAt: existingManifest.createdAt || new Date().toISOString().slice(0, 10)
      };

      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

      if (!fs.existsSync(path.join(gameDir, manifest.thumbnail))) {
        fs.writeFileSync(
          path.join(gameDir, 'thumbnail.svg'),
          generateDefaultThumbnailSvg(manifest.title, manifest.genre, slug),
          'utf8'
        );
      }

      const registry = syncGames();
      const savedGame = registry.games.find((g) => g.slug === slug);
      sendJson(res, 201, { ok: true, game: savedGame, registry });
      return;
    }

    // Static file serving
    let relPath = pathname === '/' ? '/index.html' : pathname;
    const safePath = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
    let filePath = path.join(ROOT_DIR, safePath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      sendJson(res, 404, { ok: false, error: `Not found: ${pathname}` });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    };

    if (urlObj.searchParams.get('download') === '1') {
      headers['Content-Disposition'] = `attachment; filename="${path.basename(filePath)}"`;
    }

    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  } catch (err) {
    console.error('[server] Error:', err);
    sendJson(res, 500, { ok: false, error: err.message || 'Internal Server Error' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`========================================================`);
  console.log(`🎮 Arena.ai Game Hub running at http://${HOST}:${PORT}`);
  console.log(`📂 Serving games from: ${GAMES_DIR}`);
  console.log(`========================================================`);
});
