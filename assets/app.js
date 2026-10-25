const state = {
  games: [],
  filterType: 'all',
  filterGenre: 'all',
  searchQuery: '',
  writableServer: false,
  activeGame: null
};

// DOM Elements
const gamesGrid = document.getElementById('gamesGrid');
const emptyState = document.getElementById('emptyState');
const searchInput = document.getElementById('searchInput');
const typeTabs = document.getElementById('typeTabs');
const genrePills = document.getElementById('genrePills');
const serverBadge = document.getElementById('serverBadge');

const statTotal = document.getElementById('statTotal');
const statWeb = document.getElementById('statWeb');
const statDownload = document.getElementById('statDownload');

// Player Modal
const playerModal = document.getElementById('playerModal');
const playerTitle = document.getElementById('playerTitle');
const playerGenreBadge = document.getElementById('playerGenreBadge');
const playerControls = document.getElementById('playerControls');
const playerDescription = document.getElementById('playerDescription');
const playerDownloads = document.getElementById('playerDownloads');
const gameIframe = document.getElementById('gameIframe');
const playerViewport = document.getElementById('playerViewport');
const openNewTabBtn = document.getElementById('openNewTabBtn');
const reloadGameBtn = document.getElementById('reloadGameBtn');
const fullscreenGameBtn = document.getElementById('fullscreenGameBtn');
const closePlayerBtn = document.getElementById('closePlayerBtn');

// Upload / Agent Modal
const uploadModal = document.getElementById('uploadModal');
const openUploadBtn = document.getElementById('openUploadBtn');
const openAgentGuideBtn = document.getElementById('openAgentGuideBtn');
const heroPlayFeaturedBtn = document.getElementById('heroPlayFeaturedBtn');
const heroPromptBtn = document.getElementById('heroPromptBtn');
const closeUploadBtn = document.getElementById('closeUploadBtn');
const cancelUploadBtn = document.getElementById('cancelUploadBtn');
const uploadForm = document.getElementById('uploadForm');
const gameTitleInput = document.getElementById('gameTitle');
const gameSlugInput = document.getElementById('gameSlug');
const gameTypeInput = document.getElementById('gameType');
const gameGenreInput = document.getElementById('gameGenre');
const gameControlsInput = document.getElementById('gameControls');
const gameDescriptionInput = document.getElementById('gameDescription');
const gameFilesInput = document.getElementById('gameFilesInput');
const selectedFilesList = document.getElementById('selectedFilesList');
const uploadStatusMsg = document.getElementById('uploadStatusMsg');

const promptIdeaInput = document.getElementById('promptIdeaInput');
const generatedPromptBox = document.getElementById('generatedPromptBox');
const copyPromptBtn = document.getElementById('copyPromptBtn');

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function checkServerStatus() {
  try {
    const res = await fetch('api/status', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      if (data && data.writable) {
        state.writableServer = true;
        serverBadge.textContent = '● Live Upload Server Ready';
        return;
      }
    }
  } catch {
    // Fallback to static mode (e.g. GitHub Pages)
  }
  state.writableServer = false;
  serverBadge.textContent = '● Static Hub Mode';
}

async function loadGames() {
  try {
    const res = await fetch('games/registry.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to load games/registry.json');
    const registry = await res.json();
    state.games = Array.isArray(registry.games) ? registry.games : [];
    updateStats();
    renderGenrePills();
    renderGames();
  } catch (err) {
    console.error('Error loading games:', err);
  }
}

function updateStats() {
  const total = state.games.length;
  const webCount = state.games.filter((g) => g.type === 'web' || g.type === 'hybrid' || g.playUrl).length;
  const dlCount = state.games.filter(
    (g) => g.type === 'download' || g.type === 'hybrid' || (g.downloads && g.downloads.length > 0)
  ).length;

  statTotal.textContent = total;
  statWeb.textContent = webCount;
  statDownload.textContent = dlCount;
}

function renderGenrePills() {
  const genres = ['all', ...new Set(state.games.map((g) => g.genre || 'Arcade'))];
  genrePills.innerHTML = genres
    .map(
      (g) => `
      <button class="genre-pill ${state.filterGenre === g ? 'active' : ''}" data-genre="${g}">
        ${g === 'all' ? 'All Genres' : g}
      </button>
    `
    )
    .join('');

  genrePills.querySelectorAll('.genre-pill').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.filterGenre = btn.dataset.genre;
      renderGenrePills();
      renderGames();
    });
  });
}

function getFilteredGames() {
  return state.games.filter((game) => {
    if (
      state.filterType === '3d' &&
      !(
        (game.tags && (game.tags.includes('3d') || game.tags.includes('blender'))) ||
        (game.genre && game.genre.toLowerCase().includes('3d'))
      )
    ) {
      return false;
    }
    if (state.filterType === 'web' && !(game.type === 'web' || game.type === 'hybrid' || game.playUrl)) {
      return false;
    }
    if (
      state.filterType === 'download' &&
      !(game.type === 'download' || game.type === 'hybrid' || (game.downloads && game.downloads.length > 0))
    ) {
      return false;
    }
    if (state.filterGenre !== 'all' && game.genre !== state.filterGenre) {
      return false;
    }
    if (state.searchQuery) {
      const q = state.searchQuery.toLowerCase();
      const hay = [
        game.title,
        game.description,
        game.genre,
        game.author,
        ...(game.tags || [])
      ]
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

function badgeForType(type) {
  if (type === 'hybrid') return '<span class="badge badge-hybrid">⚡ Browser + Download</span>';
  if (type === 'download') return '<span class="badge badge-download">⬇ Downloadable Build</span>';
  return '<span class="badge badge-web">🌐 Browser Playable</span>';
}

function renderGames() {
  const filtered = getFilteredGames();
  if (filtered.length === 0) {
    gamesGrid.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');
  gamesGrid.innerHTML = filtered
    .map((game) => {
      const hasPlay = Boolean(game.playUrl);
      const downloads = Array.isArray(game.downloads) ? game.downloads : [];
      const firstDl = downloads[0];

      return `
        <article class="game-card" data-slug="${game.slug}">
          <div class="card-thumb-wrap" data-play="${game.slug}">
            <img src="${game.thumbnailUrl}" alt="${game.title}" loading="lazy" />
            <div class="card-badges">
              <span class="badge">${game.genre || 'Arcade'}</span>
              ${badgeForType(game.type)}
            </div>
          </div>
          <div class="card-body">
            <h3 class="card-title">${game.title}</h3>
            <p class="card-desc">${game.description}</p>
            <div class="card-meta">
              <span>🎮 ${game.controls || 'Keyboard / Mouse'}</span>
              <span>v${game.version || '1.0.0'}</span>
            </div>
            <div class="card-actions">
              ${
                hasPlay
                  ? `<button class="btn btn-primary" data-play="${game.slug}">▶ Play Now</button>`
                  : ''
              }
              ${
                firstDl
                  ? `<a class="btn btn-secondary" href="${firstDl.url}?download=1" download="${firstDl.file}">⬇ Download (${firstDl.size || firstDl.file})</a>`
                  : ''
              }
            </div>
          </div>
        </article>
      `;
    })
    .join('');

  gamesGrid.querySelectorAll('[data-play]').forEach((el) => {
    el.addEventListener('click', () => {
      const slug = el.getAttribute('data-play');
      const game = state.games.find((g) => g.slug === slug);
      if (game && game.playUrl) {
        openPlayer(game);
      }
    });
  });
}

function openPlayer(game) {
  state.activeGame = game;
  playerTitle.textContent = game.title;
  playerGenreBadge.textContent = game.genre || 'Arcade';
  playerControls.textContent = game.controls || 'Keyboard / Mouse';
  playerDescription.textContent = game.description || '';
  gameIframe.src = game.playUrl;
  openNewTabBtn.href = game.playUrl;

  const downloads = Array.isArray(game.downloads) ? game.downloads : [];
  playerDownloads.innerHTML = downloads
    .map(
      (dl) => `
      <a class="btn btn-sm btn-secondary" href="${dl.url}?download=1" download="${dl.file}">
        ⬇ ${dl.label} (${dl.size || dl.platform})
      </a>
    `
    )
    .join('');

  playerModal.classList.remove('hidden');
  setTimeout(() => {
    try {
      gameIframe.focus();
    } catch {}
  }, 150);
}

function closePlayer() {
  gameIframe.src = 'about:blank';
  state.activeGame = null;
  playerModal.classList.add('hidden');
}

reloadGameBtn.addEventListener('click', () => {
  if (state.activeGame && state.activeGame.playUrl) {
    gameIframe.src = state.activeGame.playUrl;
    gameIframe.focus();
  }
});

fullscreenGameBtn.addEventListener('click', () => {
  if (playerViewport.requestFullscreen) {
    playerViewport.requestFullscreen();
  }
});

closePlayerBtn.addEventListener('click', closePlayer);
playerModal.addEventListener('click', (e) => {
  if (e.target === playerModal) closePlayer();
});

// Filters & Search
typeTabs.querySelectorAll('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    typeTabs.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
    tab.classList.add('active');
    state.filterType = tab.dataset.filter;
    renderGames();
  });
});

searchInput.addEventListener('input', (e) => {
  state.searchQuery = e.target.value.trim();
  renderGames();
});

// Hero & Studio Buttons
heroPlayFeaturedBtn.addEventListener('click', () => {
  const featured =
    state.games.find((g) => g.slug === 'astra-3d-overdrive') ||
    state.games.find((g) => g.featured && g.playUrl) ||
    state.games.find((g) => g.playUrl);
  if (featured) openPlayer(featured);
});

function openBlenderStudio() {
  openPlayer({
    slug: 'ai-blender-studio',
    title: 'AI-Blender 3D Studio (Mesh + Modifiers + Sculpt + PBR + OBJ/glTF Export)',
    genre: '3D Modeling Studio',
    controls: 'Drag to Orbit 3D Viewport, Scroll to Zoom, Click Modifiers / Export .OBJ & .GLTF',
    description:
      'Full interactive 3D modeling workspace powered by assets/ai-blender-engine.js and the 4 Modeling Sub-Agents.',
    playUrl: 'blender-studio.html',
    downloads: []
  });
}

document.getElementById('openBlenderStudioBtn')?.addEventListener('click', openBlenderStudio);
document.getElementById('heroBlenderBtn')?.addEventListener('click', openBlenderStudio);

function openFilmStudio() {
  const filmGame = state.games.find((g) => g.slug === 'astral-odyssey-film');
  if (filmGame) {
    openPlayer(filmGame);
  } else {
    openPlayer({
      slug: 'astral-odyssey-film',
      title: 'Chronicles of the Astral Core (20-Min 2D/3D Animated Film & Studio)',
      genre: '2D/3D Animated Film',
      controls: 'Space to Play/Pause, Scrub 20:00 Timeline, Toggle 2D Anime / 3D Blender PBR Mode, B for Bone Rig & F-Curves',
      description: 'Full 20-minute 5-Act consistent 2D & 3D animated movie powered by assets/ai-animation-studio.js.',
      playUrl: 'games/astral-odyssey-film/index.html',
      downloads: []
    });
  }
}

document.getElementById('openFilmStudioBtn')?.addEventListener('click', openFilmStudio);
document.getElementById('heroFilmStudioBtn')?.addEventListener('click', openFilmStudio);

function openModalWithTab(tabId) {
  uploadModal.classList.remove('hidden');
  switchDialogTab(tabId);
}

openUploadBtn.addEventListener('click', () => openModalWithTab('uploadTab'));
openAgentGuideBtn.addEventListener('click', () => openModalWithTab('arenaTab'));
heroPromptBtn.addEventListener('click', () => openModalWithTab('arenaTab'));

function closeUploadModal() {
  uploadModal.classList.add('hidden');
  uploadStatusMsg.classList.add('hidden');
}

closeUploadBtn.addEventListener('click', closeUploadModal);
cancelUploadBtn.addEventListener('click', closeUploadModal);
uploadModal.addEventListener('click', (e) => {
  if (e.target === uploadModal) closeUploadModal();
});

// Dialog Tabs
document.querySelectorAll('.dialog-tab').forEach((tabBtn) => {
  tabBtn.addEventListener('click', () => {
    switchDialogTab(tabBtn.dataset.tab);
  });
});

function switchDialogTab(tabId) {
  document.querySelectorAll('.dialog-tab').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === tabId);
  });
  document.getElementById('uploadTab').classList.toggle('hidden', tabId !== 'uploadTab');
  document.getElementById('arenaTab').classList.toggle('hidden', tabId !== 'arenaTab');
  document.getElementById('repoSearchTab')?.classList.toggle('hidden', tabId !== 'repoSearchTab');
  if (tabId === 'repoSearchTab') runLiveRepoSearch();
}

async function runLiveRepoSearch() {
  const input = document.getElementById('repoSearchInput');
  const modeSel = document.getElementById('repoSearchMode');
  const box = document.getElementById('repoSearchResultsBox');
  if (!box) return;
  const q = (input?.value || '').trim();
  const mode = modeSel?.value || 'search';

  try {
    const res = await fetch(`api/search?q=${encodeURIComponent(q)}&mode=${encodeURIComponent(mode)}`);
    if (!res.ok) throw new Error('Search API unavailable in static mode');
    const data = await res.json();
    if (data.mode === 'exports') {
      box.textContent = (data.exports || [])
        .map((e) => `${e.file}:L${e.line} [${e.kind}] ${e.name}\n  -> ${e.signature}`)
        .join('\n\n') || 'No matching exports.';
    } else if (data.mode === 'map') {
      box.textContent = Object.entries(data.subsystems || {})
        .map(([k, s]) => `=== [${k.toUpperCase()}] ${s.title} ===\n` + s.files.map((f) => `  • ${f.path} (${f.lines} lines)`).join('\n'))
        .join('\n\n');
    } else {
      const chunkLines = (data.matchedChunks || []).map(
        (c) => `🧩 ${c.file} [L${c.startLine}-L${c.endLine}] (${c.kind}: ${c.name})\n   ${c.readCall}`
      );
      const codeLines = (data.lineMatches || []).map(
        (l) => `📄 ${l.file}:${l.line} in ${l.chunkName}\n   ${l.readCall}\n   ${(l.snippet || []).join('\n   ')}`
      );
      box.textContent = [...chunkLines, ...codeLines].join('\n\n') || 'No matching chunks or lines found.';
    }
  } catch {
    box.textContent = `Run in terminal:\nnpm run search -- "${q || '3d'}"`;
  }
}

document.getElementById('repoSearchInput')?.addEventListener('input', runLiveRepoSearch);
document.getElementById('repoSearchMode')?.addEventListener('change', runLiveRepoSearch);

// Auto-generate slug from title
gameTitleInput.addEventListener('input', () => {
  if (!gameSlugInput.dataset.manual) {
    gameSlugInput.value = slugify(gameTitleInput.value);
  }
});
gameSlugInput.addEventListener('input', () => {
  gameSlugInput.dataset.manual = gameSlugInput.value ? '1' : '';
});

// Selected files list preview
gameFilesInput.addEventListener('change', () => {
  const files = Array.from(gameFilesInput.files || []);
  if (files.length === 0) {
    selectedFilesList.textContent = '';
  } else {
    selectedFilesList.textContent = `Selected ${files.length} file(s): ${files.map((f) => f.name).join(', ')}`;
  }
});

function readFileForUpload(file) {
  return new Promise((resolve, reject) => {
    const textExts = ['.html', '.htm', '.js', '.mjs', '.css', '.json', '.svg', '.py', '.txt', '.md'];
    const isText = textExts.some((ext) => file.name.toLowerCase().endsWith(ext));
    const reader = new FileReader();

    reader.onload = () => {
      if (isText) {
        resolve({
          name: file.name,
          content: reader.result,
          encoding: 'utf8'
        });
      } else {
        const dataUrl = String(reader.result || '');
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
        resolve({
          name: file.name,
          content: base64,
          encoding: 'base64'
        });
      }
    };
    reader.onerror = () => reject(new Error(`Failed to read file: ${file.name}`));

    if (isText) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }
  });
}

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  uploadStatusMsg.classList.remove('hidden', 'error');

  const title = gameTitleInput.value.trim();
  const slug = slugify(gameSlugInput.value || title);
  const type = gameTypeInput.value;
  const genre = gameGenreInput.value.trim() || 'Arcade';
  const controls = gameControlsInput.value.trim() || 'Keyboard / Mouse';
  const description = gameDescriptionInput.value.trim() || `${title} — Uploaded to Arena.ai Game Hub.`;

  if (!slug) {
    uploadStatusMsg.textContent = 'Please enter a valid game title.';
    uploadStatusMsg.classList.add('error');
    return;
  }

  uploadStatusMsg.textContent = 'Uploading and registering game...';

  try {
    const rawFiles = Array.from(gameFilesInput.files || []);
    const files = await Promise.all(rawFiles.map(readFileForUpload));

    if (state.writableServer) {
      const res = await fetch('api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          title,
          type,
          genre,
          controls,
          description,
          files
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Failed to publish game');
      }

      await loadGames();
      uploadForm.reset();
      selectedFilesList.textContent = '';
      closeUploadModal();

      if (data.game && data.game.playUrl) {
        openPlayer(data.game);
      }
    } else {
      // Static GitHub Pages fallback: download a ready-to-commit game.json manifest
      const manifest = {
        slug,
        title,
        description,
        author: 'Arena.ai',
        version: '1.0.0',
        type,
        genre,
        tags: [genre.toLowerCase(), type, 'arena'],
        entry: 'index.html',
        thumbnail: 'thumbnail.svg',
        controls,
        downloads: [],
        createdAt: new Date().toISOString().slice(0, 10)
      };
      const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `game.json`;
      a.click();
      URL.revokeObjectURL(url);
      uploadStatusMsg.textContent = `Downloaded game.json for games/${slug}/! In Arena Agent Mode, run "npm run dev" for live 1-click uploads.`;
    }
  } catch (err) {
    uploadStatusMsg.textContent = err.message || 'Upload failed';
    uploadStatusMsg.classList.add('error');
  }
});

// Arena Prompt Generator
function updateArenaPrompt() {
  const idea =
    promptIdeaInput.value.trim() ||
    'an arcade game with smooth controls, particle effects, score tracking, and sound effects';
  const slug = slugify(idea).slice(0, 28) || 'new-arena-game';

  generatedPromptBox.textContent = `Build ${idea} and publish it to the Arena.ai Game Hub in this repository:
1. Follow AGENTS.md to create the game in games/${slug}/ (include index.html, game.json, and any downloadable files if applicable).
2. Run "npm run sync" and "npm run validate" so games/registry.json is updated.
3. Start or verify the hub preview with "npm run dev" and commit the changes.`;
}

promptIdeaInput.addEventListener('input', updateArenaPrompt);
updateArenaPrompt();

copyPromptBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(generatedPromptBox.textContent);
    copyPromptBtn.textContent = '✓ Copied to Clipboard!';
    setTimeout(() => {
      copyPromptBtn.textContent = '📋 Copy Arena Prompt';
    }, 2000);
  } catch {}
});

// Initialize
checkServerStatus();
loadGames();
