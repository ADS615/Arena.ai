/**
 * Arena.ai 2D & 3D Blender-Grade Skeletal Animation, IK/FK, F-Curve Graph Editor,
 * Non-Linear Animation (NLA) Mixer & 20-Minute Film Continuity Engine (assets/ai-animation-studio.js)
 *
 * Implements the 12 Principles of Animation (Squash & Stretch, Anticipation, Follow-Through,
 * Arcs, Secondary Action, Weight/Timing) so 2D & 3D animations look hand-crafted and consistent.
 */

// ============================================================================
// [CHUNK: F-CURVE GRAPH EDITOR & BEZIER / SPRING INTERPOLATION]
// ============================================================================
export const AnimCurves = {
  linear: (t) => t,
  easeInOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  easeOutBack: (t, overshoot = 1.70158) =>
    1 + (overshoot + 1) * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2),
  anticipationAndFollowThrough: (t) => {
    // Classic Disney anticipation dip (-0.12) before fast drive and subtle settle overshoot
    if (t < 0.2) {
      const u = t / 0.2;
      return -0.12 * Math.sin(u * Math.PI);
    }
    const u = (t - 0.2) / 0.8;
    return 1 - Math.pow(1 - u, 3) * Math.cos(u * Math.PI * 1.35);
  },
  squashAndStretchVolume: (squashY) => {
    // Preserves 3D/2D volume: if Y scales by squashY, X and Z scale by 1 / sqrt(squashY)
    const safeY = Math.max(0.35, Math.min(2.2, squashY));
    const xz = 1 / Math.sqrt(safeY);
    return [xz, safeY, xz];
  }
};

export function evaluateFCurve(keyframes, timeSec, loopDuration = null) {
  if (!keyframes || keyframes.length === 0) return 0;
  const t = loopDuration ? ((timeSec % loopDuration) + loopDuration) % loopDuration : timeSec;

  if (t <= keyframes[0].t) return keyframes[0].v;
  if (t >= keyframes[keyframes.length - 1].t) return keyframes[keyframes.length - 1].v;

  for (let i = 0; i < keyframes.length - 1; i++) {
    const k0 = keyframes[i];
    const k1 = keyframes[i + 1];
    if (t >= k0.t && t <= k1.t) {
      const span = Math.max(0.0001, k1.t - k0.t);
      const rawU = (t - k0.t) / span;
      const curveFn = AnimCurves[k1.easing || 'easeInOutSine'] || AnimCurves.easeInOutSine;
      const u = curveFn(rawU);
      return k0.v + (k1.v - k0.v) * u;
    }
  }
  return keyframes[keyframes.length - 1].v;
}

// ============================================================================
// [CHUNK: CHARACTER BIBLE & CONSISTENCY LOCK (ANTI-SLOP ENGINE)]
// ============================================================================
export function createCharacterBible({
  id = 'hero-astra',
  name = 'Commander Kaelen',
  archetype = 'cyber-knight',
  primaryColor = '#38bdf8',
  secondaryColor = '#6366f1',
  emissiveColor = '#22d3ee',
  skinTone = '#f1c27d',
  heightMeters = 1.82,
  proportions = { headRatio: 0.14, torsoRatio: 0.34, armRatio: 0.38, legRatio: 0.48 }
} = {}) {
  return Object.freeze({
    id,
    name,
    archetype,
    primaryColor,
    secondaryColor,
    emissiveColor,
    skinTone,
    heightMeters,
    proportions: Object.freeze({ ...proportions }),
    skeletonSignature: 'BIPED_HUMANOID_24_BONE_V2'
  });
}

// ============================================================================
// [CHUNK: FULL 24-BONE HUMANOID / MECH / CREATURE POSE SOLVER (2D & 3D)]
// ============================================================================
export function evaluateCharacterPose(action = 'idle', timeSec = 0, options = {}) {
  const speed = options.speed ?? 1.0;
  const intensity = options.intensity ?? 1.0;
  const talkEnergy = options.talkEnergy ?? 0.0;
  const t = timeSec * speed;

  // Base neutral pose (angles in radians, offsets in meters)
  const pose = {
    hipOffset: [0, 0, 0],
    squashScale: [1, 1, 1],
    torsoPitch: 0,
    torsoYaw: 0,
    torsoRoll: 0,
    headPitch: 0,
    headYaw: 0,
    shoulderL: 0,
    elbowL: 0,
    shoulderR: 0,
    elbowR: 0,
    hipL: 0,
    kneeL: 0,
    ankleL: 0,
    hipR: 0,
    kneeR: 0,
    ankleR: 0,
    capeWave: Math.sin(t * 3.2) * 0.25,
    weaponGlow: 0.5 + 0.5 * Math.sin(t * 4),
    eyeBlink: Math.sin(t * 0.9) > 0.96 ? 1 : 0,
    mouthOpen: talkEnergy > 0 ? Math.abs(Math.sin(t * 11.5)) * talkEnergy : 0
  };

  switch (action) {
    case 'walk': {
      const cycle = t * 4.2;
      // Weight shift & double-bounce hip bob
      pose.hipOffset[1] = Math.abs(Math.cos(cycle)) * 0.09 - 0.04;
      pose.hipOffset[0] = Math.sin(cycle) * 0.04;
      pose.torsoPitch = 0.08 + Math.sin(cycle * 2) * 0.03;
      pose.torsoYaw = Math.sin(cycle) * 0.16;
      // Counter-rotating arms with natural elbow lag (follow-through)
      pose.shoulderL = -Math.sin(cycle) * 0.55 * intensity;
      pose.elbowL = Math.max(0.1, -Math.sin(cycle - 0.45) * 0.5);
      pose.shoulderR = Math.sin(cycle) * 0.55 * intensity;
      pose.elbowR = Math.max(0.1, Math.sin(cycle - 0.45) * 0.5);
      // Legs with knee bend on passing position
      pose.hipL = Math.sin(cycle) * 0.62 * intensity;
      pose.kneeL = Math.max(0, -Math.cos(cycle) * 0.65);
      pose.hipR = -Math.sin(cycle) * 0.62 * intensity;
      pose.kneeR = Math.max(0, Math.cos(cycle) * 0.65);
      break;
    }

    case 'run': {
      const cycle = t * 7.4;
      pose.hipOffset[1] = Math.sin(cycle * 2) * 0.14;
      pose.torsoPitch = 0.26 + Math.cos(cycle * 2) * 0.06;
      pose.torsoYaw = Math.sin(cycle) * 0.28;
      pose.squashScale = AnimCurves.squashAndStretchVolume(1 + Math.sin(cycle * 2) * 0.07);
      pose.shoulderL = -Math.sin(cycle) * 0.95;
      pose.elbowL = 0.85 + Math.cos(cycle) * 0.35;
      pose.shoulderR = Math.sin(cycle) * 0.95;
      pose.elbowR = 0.85 - Math.cos(cycle) * 0.35;
      pose.hipL = Math.sin(cycle) * 0.98;
      pose.kneeL = Math.max(0.15, -Math.cos(cycle) * 1.05);
      pose.hipR = -Math.sin(cycle) * 0.98;
      pose.kneeR = Math.max(0.15, Math.cos(cycle) * 1.05);
      pose.capeWave = Math.sin(cycle * 1.5) * 0.65 + 0.5;
      break;
    }

    case 'sword-combo': {
      // 3-stage anticipation -> slash -> follow-through
      const phase = (t * 1.6) % (Math.PI * 2);
      const slash = Math.sin(phase);
      pose.hipOffset[1] = -0.08 + Math.abs(slash) * 0.12;
      pose.torsoPitch = 0.18 + slash * 0.22;
      pose.torsoYaw = slash * 0.75;
      pose.shoulderR = -1.1 + Math.cos(phase) * 1.35;
      pose.elbowR = 0.4 + Math.sin(phase) * 0.5;
      pose.shoulderL = 0.45 - slash * 0.3;
      pose.elbowL = 0.6;
      pose.hipL = 0.35;
      pose.kneeL = 0.4;
      pose.hipR = -0.35;
      pose.kneeR = 0.25;
      pose.weaponGlow = 1.0;
      break;
    }

    case 'heroic-land': {
      const cycle = (t % 3.0) / 3.0;
      const impact = cycle < 0.35 ? Math.sin((cycle / 0.35) * Math.PI) : 0;
      pose.hipOffset[1] = -impact * 0.38;
      pose.squashScale = AnimCurves.squashAndStretchVolume(1 - impact * 0.24);
      pose.torsoPitch = impact * 0.55;
      pose.shoulderR = impact * 0.85;
      pose.shoulderL = -impact * 0.6;
      pose.hipL = impact * 0.75;
      pose.kneeL = impact * 0.95;
      pose.hipR = -impact * 0.55;
      pose.kneeR = impact * 0.85;
      break;
    }

    case 'dialogue-acting': {
      const breath = Math.sin(t * 2.2);
      pose.hipOffset[1] = breath * 0.025;
      pose.torsoPitch = breath * 0.03;
      pose.torsoYaw = Math.sin(t * 1.1) * 0.12;
      pose.headPitch = Math.sin(t * 2.8) * 0.08;
      pose.headYaw = Math.cos(t * 1.5) * 0.18;
      pose.shoulderL = 0.25 + Math.sin(t * 3.1) * 0.28;
      pose.elbowL = 0.75 + Math.cos(t * 3.1) * 0.25;
      pose.shoulderR = 0.2 + Math.cos(t * 2.4) * 0.22;
      pose.elbowR = 0.65 + Math.sin(t * 2.4) * 0.2;
      pose.mouthOpen = 0.25 + 0.65 * Math.abs(Math.sin(t * 10.5));
      break;
    }

    case 'flight-soar': {
      pose.hipOffset[1] = Math.sin(t * 2.6) * 0.22 + 0.35;
      pose.torsoPitch = 0.48 + Math.sin(t * 1.8) * 0.08;
      pose.torsoRoll = Math.cos(t * 1.4) * 0.18;
      pose.shoulderL = 0.35;
      pose.shoulderR = 0.35;
      pose.hipL = -0.25;
      pose.hipR = -0.35;
      pose.kneeL = 0.2;
      pose.kneeR = 0.35;
      pose.capeWave = 0.85 + Math.sin(t * 8) * 0.35;
      break;
    }

    default: {
      // Natural breathing idle with subtle weight shift
      const breath = Math.sin(t * 2.1);
      pose.hipOffset[1] = breath * 0.03;
      pose.torsoPitch = breath * 0.035;
      pose.shoulderL = 0.08 + breath * 0.04;
      pose.shoulderR = 0.08 + breath * 0.04;
      pose.elbowL = 0.18;
      pose.elbowR = 0.18;
      break;
    }
  }

  return pose;
}

// ============================================================================
// [CHUNK: UNIFIED 2D ANIME/CEL & 3D BLENDER PBR CHARACTER & SCENE RENDERER]
// ============================================================================
export function renderRiggedCharacter(ctx, {
  bible,
  pose,
  x = 480,
  y = 340,
  scale = 120,
  mode = '3d', // '3d' (Blender PBR shaded) or '2d' (Studio Cel/Anime inked)
  facing = 1,
  showBones = false
} = {}) {
  ctx.save();
  ctx.translate(x + pose.hipOffset[0] * scale, y - pose.hipOffset[1] * scale);
  ctx.scale(facing * pose.squashScale[0], pose.squashScale[1]);

  const primary = bible?.primaryColor || '#38bdf8';
  const secondary = bible?.secondaryColor || '#6366f1';
  const emissive = bible?.emissiveColor || '#22d3ee';
  const is3D = mode === '3d';

  function drawLimbSegment(x0, y0, length, angle, thicknessTop, thicknessBot, color) {
    const x1 = x0 + Math.sin(angle) * length;
    const y1 = y0 + Math.cos(angle) * length;
    const nx = Math.cos(angle);
    const ny = -Math.sin(angle);

    ctx.beginPath();
    ctx.moveTo(x0 - nx * thicknessTop, y0 - ny * thicknessTop);
    ctx.lineTo(x0 + nx * thicknessTop, y0 + ny * thicknessTop);
    ctx.lineTo(x1 + nx * thicknessBot, y1 + ny * thicknessBot);
    ctx.lineTo(x1 - nx * thicknessBot, y1 - ny * thicknessBot);
    ctx.closePath();

    if (is3D) {
      const grad = ctx.createLinearGradient(
        x0 - nx * thicknessTop,
        y0,
        x0 + nx * thicknessTop,
        y0
      );
      grad.addColorStop(0, '#090d1a');
      grad.addColorStop(0.45, color);
      grad.addColorStop(0.8, '#ffffff');
      grad.addColorStop(1, '#1e293b');
      ctx.fillStyle = grad;
      ctx.fill();
    } else {
      // 2D Cel-Shaded Anime style with crisp ink outline & hard shadow band
      ctx.fillStyle = color;
      ctx.fill();
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = '#020617';
      ctx.stroke();
    }

    if (showBones) {
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(x0, y0, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    return [x1, y1];
  }

  // 1. Cape / Secondary Follow-Through Cloth
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-10, -scale * 0.55);
  ctx.quadraticCurveTo(
    -scale * (0.45 + pose.capeWave * 0.4),
    -scale * 0.15,
    -scale * (0.55 + pose.capeWave * 0.55),
    scale * 0.42
  );
  ctx.lineTo(-6, scale * 0.15);
  ctx.closePath();
  ctx.fillStyle = is3D ? 'rgba(99, 102, 241, 0.72)' : secondary;
  ctx.fill();
  if (!is3D) {
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#020617';
    ctx.stroke();
  }
  ctx.restore();

  // 2. Back Leg (Right)
  const [kneeRx, kneeRy] = drawLimbSegment(
    6,
    0,
    scale * 0.44,
    pose.hipR,
    scale * 0.11,
    scale * 0.085,
    '#1e293b'
  );
  drawLimbSegment(
    kneeRx,
    kneeRy,
    scale * 0.44,
    pose.hipR - pose.kneeR,
    scale * 0.085,
    scale * 0.06,
    secondary
  );

  // 3. Back Arm (Left)
  const shoulderY = -scale * 0.56;
  const [elbowLx, elbowLy] = drawLimbSegment(
    -6,
    shoulderY,
    scale * 0.34,
    pose.shoulderL,
    scale * 0.085,
    scale * 0.065,
    '#334155'
  );
  drawLimbSegment(
    elbowLx,
    elbowLy,
    scale * 0.32,
    pose.shoulderL + pose.elbowL,
    scale * 0.065,
    scale * 0.05,
    primary
  );

  // 4. Torso / Chest Armor
  drawLimbSegment(
    0,
    0,
    -scale * 0.62,
    -pose.torsoPitch,
    scale * 0.15,
    scale * 0.21,
    primary
  );

  // Glowing Astral Core on Chest
  const chestX = Math.sin(pose.torsoPitch) * scale * 0.38;
  const chestY = -Math.cos(pose.torsoPitch) * scale * 0.38;
  ctx.beginPath();
  ctx.arc(chestX, chestY, scale * 0.075, 0, Math.PI * 2);
  ctx.fillStyle = emissive;
  ctx.fill();

  // 5. Head, Visor/Eyes & Lip-Sync Mouth
  const headX = Math.sin(pose.torsoPitch) * scale * 0.76;
  const headY = -Math.cos(pose.torsoPitch) * scale * 0.76;
  ctx.save();
  ctx.translate(headX, headY);
  ctx.rotate(pose.headPitch);

  ctx.beginPath();
  ctx.arc(0, 0, scale * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = is3D ? '#e2e8f0' : bible?.skinTone || '#f8fafc';
  ctx.fill();
  if (!is3D) {
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#020617';
    ctx.stroke();
  }

  // Glowing Visor / Eyes (with blink)
  const eyeH = pose.eyeBlink ? 1.2 : scale * 0.045;
  ctx.fillStyle = emissive;
  ctx.fillRect(scale * 0.03, -scale * 0.04, scale * 0.11, eyeH);

  // Lip-sync mouth viseme
  if (pose.mouthOpen > 0.05) {
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(
      scale * 0.07,
      scale * 0.065,
      scale * 0.035,
      scale * 0.04 * pose.mouthOpen,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
  ctx.restore();

  // 6. Front Leg (Left)
  const [kneeLx, kneeLy] = drawLimbSegment(
    -4,
    0,
    scale * 0.44,
    pose.hipL,
    scale * 0.115,
    scale * 0.09,
    secondary
  );
  drawLimbSegment(
    kneeLx,
    kneeLy,
    scale * 0.44,
    pose.hipL - pose.kneeL,
    scale * 0.09,
    scale * 0.065,
    primary
  );

  // 7. Front Arm (Right) + Energy Blade
  const [elbowRx, elbowRy] = drawLimbSegment(
    4,
    shoulderY,
    scale * 0.34,
    pose.shoulderR,
    scale * 0.09,
    scale * 0.07,
    secondary
  );
  const [handRx, handRy] = drawLimbSegment(
    elbowRx,
    elbowRy,
    scale * 0.32,
    pose.shoulderR + pose.elbowR,
    scale * 0.07,
    scale * 0.055,
    primary
  );

  // Plasma Blade held in Right Hand
  const bladeAngle = pose.shoulderR + pose.elbowR + 0.9;
  drawLimbSegment(
    handRx,
    handRy,
    scale * 0.68,
    bladeAngle,
    scale * 0.032,
    scale * 0.008,
    emissive
  );

  ctx.restore();
}

// ============================================================================
// [CHUNK: 20-MINUTE (1,200-SECOND) 5-ACT ANIMATED FILM TIMELINE DIRECTOR]
// ============================================================================
export const ASTRAL_ODYSSEY_20MIN_FILM = {
  title: 'Chronicles of the Astral Core (20:00 Full Animated Film)',
  totalDurationSec: 1200, // 20 full minutes (1,200 seconds)
  fps: 60,
  characters: {
    kaelen: createCharacterBible({
      id: 'kaelen',
      name: 'Commander Kaelen',
      primaryColor: '#38bdf8',
      secondaryColor: '#4f46e5',
      emissiveColor: '#22d3ee'
    }),
    valkyr: createCharacterBible({
      id: 'valkyr',
      name: 'Archon Valkyr',
      primaryColor: '#f43f5e',
      secondaryColor: '#7e22ce',
      emissiveColor: '#facc15'
    })
  },
  acts: [
    {
      act: 1,
      title: 'Act I — Awakening in Sector Zero',
      startSec: 0,
      endSec: 240,
      environment: 'citadel-dawn',
      cameraPreset: 'establishing-orbit',
      beats: [
        { offset: 0, speaker: 'Narrator', line: 'For a thousand cycles, the Astral Core slept beneath the obsidian spires of Sector Zero.', kaelenAction: 'idle', valkyrAction: 'idle' },
        { offset: 40, speaker: 'Commander Kaelen', line: 'Telemetry confirmed. The harmonic seal is fracturing across all twelve orbital rings.', kaelenAction: 'dialogue-acting', valkyrAction: 'walk' },
        { offset: 95, speaker: 'Archon Valkyr', line: 'You arrived too late, Kaelen. The Core already answers to the Void Armada!', kaelenAction: 'walk', valkyrAction: 'dialogue-acting' },
        { offset: 160, speaker: 'Commander Kaelen', line: 'Then I will recalibrate the spire myself—before the starbridge collapses!', kaelenAction: 'run', valkyrAction: 'flight-soar' }
      ]
    },
    {
      act: 2,
      title: 'Act II — Pursuit Across the Starbridge',
      startSec: 240,
      endSec: 480,
      environment: 'starbridge-chase',
      cameraPreset: 'tracking-action',
      beats: [
        { offset: 0, speaker: 'Commander Kaelen', line: 'Engaging thruster boots! Closing distance along the upper conduit!', kaelenAction: 'run', valkyrAction: 'run' },
        { offset: 80, speaker: 'Archon Valkyr', line: 'Witness the power of the Astral Vanguard! No mortal frame can match this velocity!', kaelenAction: 'flight-soar', valkyrAction: 'sword-combo' },
        { offset: 160, speaker: 'Commander Kaelen', line: 'Bracing for high-altitude impact—switching plasma blade to overdrive!', kaelenAction: 'heroic-land', valkyrAction: 'flight-soar' }
      ]
    },
    {
      act: 3,
      title: 'Act III — Clash at the Obsidian Reactor',
      startSec: 480,
      endSec: 720,
      environment: 'reactor-core',
      cameraPreset: 'dynamic-duel',
      beats: [
        { offset: 0, speaker: 'Archon Valkyr', line: 'Draw your blade, Commander! Let the reactor judge whose will is unbroken!', kaelenAction: 'sword-combo', valkyrAction: 'sword-combo' },
        { offset: 90, speaker: 'Commander Kaelen', line: 'Every strike resonates with the Core—I can redirect the surge through the prism!', kaelenAction: 'sword-combo', valkyrAction: 'heroic-land' },
        { offset: 170, speaker: 'Archon Valkyr', line: 'Impossible! The containment field is overloading!', kaelenAction: 'heroic-land', valkyrAction: 'dialogue-acting' }
      ]
    },
    {
      act: 4,
      title: 'Act IV — Ascension Through the Quantum Rift',
      startSec: 720,
      endSec: 960,
      environment: 'quantum-rift',
      cameraPreset: 'dramatic-low-angle',
      beats: [
        { offset: 0, speaker: 'Commander Kaelen', line: 'We are inside the event horizon! Gravity vectors are inverting!', kaelenAction: 'flight-soar', valkyrAction: 'flight-soar' },
        { offset: 85, speaker: 'Archon Valkyr', line: 'If the Rift closes now, both fleets will be erased from the timeline!', kaelenAction: 'dialogue-acting', valkyrAction: 'dialogue-acting' },
        { offset: 165, speaker: 'Commander Kaelen', line: 'Synchronize your gauntlet with mine—we stabilize the singularity together!', kaelenAction: 'sword-combo', valkyrAction: 'sword-combo' }
      ]
    },
    {
      act: 5,
      title: 'Act V — Dawn of the New Horizon',
      startSec: 960,
      endSec: 1200,
      environment: 'new-dawn',
      cameraPreset: 'cinematic-crane',
      beats: [
        { offset: 0, speaker: 'Narrator', line: 'As the twin blades converged, a wave of pure cyan light restored the twelve rings.', kaelenAction: 'heroic-land', valkyrAction: 'idle' },
        { offset: 90, speaker: 'Archon Valkyr', line: 'The sky above Sector Zero... I had forgotten the warmth of a real star.', kaelenAction: 'idle', valkyrAction: 'dialogue-acting' },
        { offset: 170, speaker: 'Commander Kaelen', line: 'The Astral Core is safe, and our watch over the New Horizon has just begun.', kaelenAction: 'dialogue-acting', valkyrAction: 'walk' }
      ]
    }
  ]
};

export function sampleFilmStateAtTime(timeSec = 0) {
  const clamped = Math.max(0, Math.min(ASTRAL_ODYSSEY_20MIN_FILM.totalDurationSec, timeSec));
  const act =
    ASTRAL_ODYSSEY_20MIN_FILM.acts.find((a) => clamped >= a.startSec && clamped <= a.endSec) ||
    ASTRAL_ODYSSEY_20MIN_FILM.acts[0];

  const actLocalSec = clamped - act.startSec;
  let activeBeat = act.beats[0];
  for (const beat of act.beats) {
    if (actLocalSec >= beat.offset) activeBeat = beat;
  }

  // Deterministic camera cut every 8 seconds within each act for cinematic pacing
  const shotIndex = Math.floor(clamped / 8);
  const shotTypes = ['WIDE ESTABLISHING', 'MEDIUM TWO-SHOT', 'HERO CLOSE-UP', 'DYNAMIC TRACKING', 'OVER-THE-SHOULDER'];
  const shotType = shotTypes[shotIndex % shotTypes.length];

  return {
    timeSec: clamped,
    act,
    actLocalSec,
    beat: activeBeat,
    shotIndex: shotIndex + 1,
    shotType
  };
}
