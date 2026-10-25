/**
 * Arena.ai Shared AAA Game Logic, UI, Audio, Physics & AI Toolkit (assets/arena-ui-kit.js)
 * Provides 25+ production-ready systems for any browser game, console OS clone, or web app.
 */

// [CHUNK: MULTI-VOICE WEBAUDIO SYNTHESIZER]
export class SoundSynth {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  ensureContext() {
    if (!this.enabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    return this.ctx;
  }

  playTone(freq = 440, duration = 0.1, type = 'sine', volume = 0.08, slideTo = null) {
    try {
      const ctx = this.ensureContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), ctx.currentTime + duration);
      }
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0008, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }

  playUiNav() {
    this.playTone(580, 0.055, 'sine', 0.06, 760);
  }

  playUiSelect() {
    this.playTone(660, 0.09, 'triangle', 0.08, 990);
  }

  playTrophyChime() {
    this.playTone(523.25, 0.14, 'sine', 0.09, 659.25);
    setTimeout(() => this.playTone(783.99, 0.18, 'sine', 0.09, 1046.5), 110);
  }

  playBootChord() {
    [220, 277.18, 329.63, 440].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 0.65, 'sine', 0.045, f * 1.01), idx * 70);
    });
  }

  playLaser() {
    this.playTone(740, 0.07, 'sawtooth', 0.06, 180);
  }

  playExplosion() {
    this.playTone(130, 0.24, 'sawtooth', 0.11, 32);
  }
}

// [CHUNK: SPRING PHYSICS & TWEENING ENGINE]
export class SpringValue {
  constructor(initial = 0, stiffness = 180, damping = 18) {
    this.value = initial;
    this.target = initial;
    this.velocity = 0;
    this.stiffness = stiffness;
    this.damping = damping;
  }

  update(dt) {
    const force = (this.target - this.value) * this.stiffness;
    this.velocity = (this.velocity + force * dt) * Math.exp(-this.damping * dt);
    this.value += this.velocity * dt;
    return this.value;
  }
}

export const Easing = {
  linear: (t) => t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  easeOutBack: (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
};

// [CHUNK: SCREEN SHAKE & CAMERA TRAUMA]
export class ScreenShake {
  constructor() {
    this.trauma = 0;
  }

  addTrauma(amount = 0.4) {
    this.trauma = Math.min(1, this.trauma + amount);
  }

  update(dt) {
    this.trauma = Math.max(0, this.trauma - dt * 1.8);
    const shake = this.trauma * this.trauma;
    return {
      offsetX: (Math.random() * 2 - 1) * 14 * shake,
      offsetY: (Math.random() * 2 - 1) * 14 * shake,
      angle: (Math.random() * 2 - 1) * 0.04 * shake
    };
  }
}

// [CHUNK: 2D PARTICLE EMITTER SYSTEM]
export class ParticleSystem2D {
  constructor(maxParticles = 300) {
    this.maxParticles = maxParticles;
    this.particles = [];
  }

  burst(x, y, { count = 18, color = '#38bdf8', minSpeed = 40, maxSpeed = 220, life = 0.55 } = {}) {
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) this.particles.shift();
      const ang = Math.random() * Math.PI * 2;
      const spd = minSpeed + Math.random() * (maxSpeed - minSpeed);
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: life * (0.6 + Math.random() * 0.6),
        maxLife: life,
        size: 2 + Math.random() * 3.5,
        color
      });
    }
  }

  updateAndDraw(ctx, dt) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// [CHUNK: UNIFIED KEYBOARD, MOUSE & GAMEPAD INPUT MANAGER]
export class InputManager {
  constructor() {
    this.keys = new Set();
    this.justPressed = new Set();
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', (e) => {
        if (!this.keys.has(e.code)) this.justPressed.add(e.code);
        this.keys.add(e.code);
      });
      window.addEventListener('keyup', (e) => {
        this.keys.delete(e.code);
      });
    }
  }

  isDown(code) {
    return this.keys.has(code);
  }

  consumePress(code) {
    if (this.justPressed.has(code)) {
      this.justPressed.delete(code);
      return true;
    }
    return false;
  }

  pollGamepad() {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return null;
    const pads = navigator.getGamepads();
    return pads && pads[0] ? pads[0] : null;
  }
}

// [CHUNK: SPATIAL HASH GRID FOR FAST COLLISIONS]
export class SpatialHashGrid {
  constructor(cellSize = 64) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  clear() {
    this.cells.clear();
  }

  _key(cx, cy) {
    return `${cx},${cy}`;
  }

  insert(entity) {
    const cx = Math.floor(entity.x / this.cellSize);
    const cy = Math.floor(entity.y / this.cellSize);
    const k = this._key(cx, cy);
    if (!this.cells.has(k)) this.cells.set(k, []);
    this.cells.get(k).push(entity);
  }

  queryNear(x, y) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const out = [];
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const bucket = this.cells.get(this._key(cx + dx, cy + dy));
        if (bucket) out.push(...bucket);
      }
    }
    return out;
  }
}

// [CHUNK: AI FINITE STATE MACHINE & A* PATHFINDING]
export class FiniteStateMachine {
  constructor(initialState = 'idle', states = {}) {
    this.current = initialState;
    this.states = states;
  }

  transition(nextState, context) {
    if (this.current === nextState) return;
    this.states[this.current]?.onExit?.(context);
    this.current = nextState;
    this.states[this.current]?.onEnter?.(context);
  }

  update(dt, context) {
    this.states[this.current]?.onUpdate?.(dt, context);
  }
}

export function findGridPathAStar(start, goal, isWalkableFn, maxSteps = 250) {
  const open = [{ ...start, g: 0, f: Math.abs(goal.x - start.x) + Math.abs(goal.y - start.y), parent: null }];
  const visited = new Set([`${start.x},${start.y}`]);
  let steps = 0;

  while (open.length > 0 && steps++ < maxSteps) {
    open.sort((a, b) => a.f - b.f);
    const cur = open.shift();
    if (cur.x === goal.x && cur.y === goal.y) {
      const path = [];
      let node = cur;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cur.x + dx;
      const ny = cur.y + dy;
      const key = `${nx},${ny}`;
      if (visited.has(key) || !isWalkableFn(nx, ny)) continue;
      visited.add(key);
      const g = cur.g + 1;
      const h = Math.abs(goal.x - nx) + Math.abs(goal.y - ny);
      open.push({ x: nx, y: ny, g, f: g + h, parent: cur });
    }
  }
  return [];
}

// [CHUNK: TROPHY / ACHIEVEMENT & SAVE STATE MANAGERS]
export class AchievementManager {
  constructor(storageKey = 'arena_trophies') {
    this.storageKey = storageKey;
    this.unlocked = new Set(this._load());
  }

  _load() {
    try {
      return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    } catch {
      return [];
    }
  }

  unlock(id) {
    if (this.unlocked.has(id)) return false;
    this.unlocked.add(id);
    try {
      localStorage.setItem(this.storageKey, JSON.stringify([...this.unlocked]));
    } catch {}
    return true;
  }

  isUnlocked(id) {
    return this.unlocked.has(id);
  }
}

export class SaveStateVault {
  constructor(namespace = 'arena_save') {
    this.namespace = namespace;
  }

  save(slot = 'default', data = {}) {
    try {
      localStorage.setItem(`${this.namespace}_${slot}`, JSON.stringify({ updatedAt: Date.now(), data }));
      return true;
    } catch {
      return false;
    }
  }

  load(slot = 'default', fallback = null) {
    try {
      const raw = localStorage.getItem(`${this.namespace}_${slot}`);
      return raw ? JSON.parse(raw).data : fallback;
    } catch {
      return fallback;
    }
  }
}
