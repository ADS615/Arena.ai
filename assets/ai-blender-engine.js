/**
 * AI Blender 3D Engine (assets/ai-blender-engine.js)
 * Universal 3D Modeling, Edit-Mode Mesh Ops, Non-Destructive Modifiers,
 * Sculpting, Armature/Animation, Principled BSDF Materials, and OBJ/glTF 2.0 Exporter.
 * Works natively in both Browser ES Modules and Node.js CLI / Sub-Agents.
 */

// ============================================================================
// [CHUNK: MATH & NOISE UTILITIES]
// ============================================================================
export function vec3(x = 0, y = 0, z = 0) {
  return [x, y, z];
}

export function add3(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

export function sub3(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

export function scale3(a, s) {
  return [a[0] * s, a[1] * s, a[2] * s];
}

export function dot3(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function cross3(a, b) {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];
}

export function len3(a) {
  return Math.hypot(a[0], a[1], a[2]);
}

export function norm3(a) {
  const l = len3(a) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

export function hashNoise3D(x, y, z, seed = 1337) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7 + seed * 19.19) * 43758.5453123;
  return (n - Math.floor(n)) * 2 - 1;
}

export function fbmNoise3D(x, y, z, octaves = 3, seed = 1337) {
  let val = 0;
  let amp = 0.5;
  let freq = 1;
  for (let i = 0; i < octaves; i++) {
    val += amp * hashNoise3D(x * freq, y * freq, z * freq, seed + i * 31);
    freq *= 2.02;
    amp *= 0.5;
  }
  return val;
}

// ============================================================================
// [CHUNK: CORE MESH DATA STRUCTURE & NORMALS]
// ============================================================================
export function createEmptyMesh(name = 'Mesh') {
  return {
    name,
    vertices: [], // Array of [x, y, z]
    normals: [],  // Array of [nx, ny, nz]
    uvs: [],      // Array of [u, v]
    faces: [],    // Array of triangle indices [i0, i1, i2]
    material: createPrincipledBSDF(),
    modifiers: [],
    transform: {
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    }
  };
}

export function cloneMesh(mesh) {
  return {
    name: mesh.name,
    vertices: mesh.vertices.map((v) => [...v]),
    normals: mesh.normals.map((n) => [...n]),
    uvs: mesh.uvs.map((u) => [...u]),
    faces: mesh.faces.map((f) => [...f]),
    material: { ...mesh.material },
    modifiers: [...(mesh.modifiers || [])],
    transform: {
      position: [...(mesh.transform?.position || [0, 0, 0])],
      rotation: [...(mesh.transform?.rotation || [0, 0, 0])],
      scale: [...(mesh.transform?.scale || [1, 1, 1])]
    }
  };
}

export function computeVertexNormals(mesh) {
  const normals = mesh.vertices.map(() => [0, 0, 0]);
  for (const [i0, i1, i2] of mesh.faces) {
    const v0 = mesh.vertices[i0];
    const v1 = mesh.vertices[i1];
    const v2 = mesh.vertices[i2];
    if (!v0 || !v1 || !v2) continue;
    const e1 = sub3(v1, v0);
    const e2 = sub3(v2, v0);
    const fn = cross3(e1, e2);
    normals[i0] = add3(normals[i0], fn);
    normals[i1] = add3(normals[i1], fn);
    normals[i2] = add3(normals[i2], fn);
  }
  mesh.normals = normals.map((n) => norm3(n));
  return mesh;
}

// ============================================================================
// [CHUNK: PRINCIPLED BSDF PBR MATERIAL BUILDER]
// ============================================================================
export function createPrincipledBSDF(options = {}) {
  return {
    type: 'PrincipledBSDF',
    name: options.name || 'Material',
    baseColor: options.baseColor || '#38bdf8',
    metallic: options.metallic ?? 0.35,
    roughness: options.roughness ?? 0.25,
    emissive: options.emissive || '#000000',
    emissiveIntensity: options.emissiveIntensity ?? 0.0,
    clearcoat: options.clearcoat ?? 0.2,
    transmission: options.transmission ?? 0.0,
    ior: options.ior ?? 1.45,
    wireframe: Boolean(options.wireframe),
    pattern: options.pattern || 'solid' // 'solid' | 'neon-grid' | 'carbon' | 'holo'
  };
}

// ============================================================================
// [CHUNK: 3D MESH PRIMITIVES (CUBE, SPHERE, CYLINDER, TORUS, CONE, MONKEY)]
// ============================================================================
export function createCube({ size = 2, name = 'Cube', material } = {}) {
  const mesh = createEmptyMesh(name);
  if (material) mesh.material = createPrincipledBSDF(material);
  const s = size / 2;

  const corners = [
    [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
    [-s, -s, s],  [s, -s, s],  [s, s, s],  [-s, s, s]
  ];
  mesh.vertices = corners;
  mesh.uvs = corners.map((c) => [(c[0] / size) + 0.5, (c[1] / size) + 0.5]);
  mesh.faces = [
    [0, 2, 1], [0, 3, 2], // Back
    [4, 5, 6], [4, 6, 7], // Front
    [0, 1, 5], [0, 5, 4], // Bottom
    [2, 3, 7], [2, 7, 6], // Top
    [0, 4, 7], [0, 7, 3], // Left
    [1, 2, 6], [1, 6, 5]  // Right
  ];
  return computeVertexNormals(mesh);
}

export function createSphere({ radius = 1.2, segments = 24, rings = 16, name = 'Sphere', material } = {}) {
  const mesh = createEmptyMesh(name);
  if (material) mesh.material = createPrincipledBSDF(material);

  for (let r = 0; r <= rings; r++) {
    const v = r / rings;
    const phi = v * Math.PI;
    for (let s = 0; s <= segments; s++) {
      const u = s / segments;
      const theta = u * Math.PI * 2;
      const x = -radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(theta) * Math.sin(phi);
      mesh.vertices.push([x, y, z]);
      mesh.uvs.push([u, 1 - v]);
    }
  }

  const stride = segments + 1;
  for (let r = 0; r < rings; r++) {
    for (let s = 0; s < segments; s++) {
      const a = r * stride + s;
      const b = a + stride;
      const c = b + 1;
      const d = a + 1;
      mesh.faces.push([a, b, d], [b, c, d]);
    }
  }
  return computeVertexNormals(mesh);
}

export function createCylinder({
  radiusTop = 1,
  radiusBottom = 1,
  height = 2.2,
  segments = 24,
  name = 'Cylinder',
  material
} = {}) {
  const mesh = createEmptyMesh(name);
  if (material) mesh.material = createPrincipledBSDF(material);
  const halfH = height / 2;

  for (let yIdx = 0; yIdx <= 1; yIdx++) {
    const y = yIdx === 0 ? -halfH : halfH;
    const rad = yIdx === 0 ? radiusBottom : radiusTop;
    for (let s = 0; s <= segments; s++) {
      const u = s / segments;
      const ang = u * Math.PI * 2;
      mesh.vertices.push([Math.cos(ang) * rad, y, Math.sin(ang) * rad]);
      mesh.uvs.push([u, yIdx]);
    }
  }

  const stride = segments + 1;
  for (let s = 0; s < segments; s++) {
    const a = s;
    const b = s + stride;
    const c = b + 1;
    const d = a + 1;
    mesh.faces.push([a, b, d], [b, c, d]);
  }

  // Bottom and top center caps
  const botCenter = mesh.vertices.length;
  mesh.vertices.push([0, -halfH, 0]);
  mesh.uvs.push([0.5, 0.5]);
  const topCenter = mesh.vertices.length;
  mesh.vertices.push([0, halfH, 0]);
  mesh.uvs.push([0.5, 0.5]);

  for (let s = 0; s < segments; s++) {
    mesh.faces.push([botCenter, s + 1, s]);
    mesh.faces.push([topCenter, stride + s, stride + s + 1]);
  }

  return computeVertexNormals(mesh);
}

export function createCone({ radius = 1.2, height = 2.4, segments = 24, name = 'Cone', material } = {}) {
  return createCylinder({ radiusTop: 0.001, radiusBottom: radius, height, segments, name, material });
}

export function createTorus({
  radius = 1.2,
  tube = 0.4,
  radialSegments = 20,
  tubularSegments = 32,
  name = 'Torus',
  material
} = {}) {
  const mesh = createEmptyMesh(name);
  if (material) mesh.material = createPrincipledBSDF(material);

  for (let j = 0; j <= radialSegments; j++) {
    for (let i = 0; i <= tubularSegments; i++) {
      const u = (i / tubularSegments) * Math.PI * 2;
      const v = (j / radialSegments) * Math.PI * 2;
      const x = (radius + tube * Math.cos(v)) * Math.cos(u);
      const y = tube * Math.sin(v);
      const z = (radius + tube * Math.cos(v)) * Math.sin(u);
      mesh.vertices.push([x, y, z]);
      mesh.uvs.push([i / tubularSegments, j / radialSegments]);
    }
  }

  const stride = tubularSegments + 1;
  for (let j = 0; j < radialSegments; j++) {
    for (let i = 0; i < tubularSegments; i++) {
      const a = j * stride + i;
      const b = (j + 1) * stride + i;
      const c = b + 1;
      const d = a + 1;
      mesh.faces.push([a, b, d], [b, c, d]);
    }
  }
  return computeVertexNormals(mesh);
}

export function createLatheMesh({
  profile = [[0, -1], [0.8, -0.6], [0.5, 0.2], [0.9, 0.8], [0, 1]],
  segments = 24,
  name = 'LatheMesh',
  material
} = {}) {
  const mesh = createEmptyMesh(name);
  if (material) mesh.material = createPrincipledBSDF(material);

  for (let i = 0; i < profile.length; i++) {
    const [r, y] = profile[i];
    const v = i / Math.max(1, profile.length - 1);
    for (let s = 0; s <= segments; s++) {
      const u = s / segments;
      const ang = u * Math.PI * 2;
      mesh.vertices.push([Math.cos(ang) * r, y, Math.sin(ang) * r]);
      mesh.uvs.push([u, v]);
    }
  }

  const stride = segments + 1;
  for (let i = 0; i < profile.length - 1; i++) {
    for (let s = 0; s < segments; s++) {
      const a = i * stride + s;
      const b = (i + 1) * stride + s;
      const c = b + 1;
      const d = a + 1;
      mesh.faces.push([a, b, d], [b, c, d]);
    }
  }
  return computeVertexNormals(mesh);
}

// ============================================================================
// [CHUNK: EDIT MODE OPERATIONS (TRANSFORM, EXTRUDE, SUBDIVIDE, BEVEL, MERGE)]
// ============================================================================
export function transformMesh(mesh, { translate = [0, 0, 0], rotate = [0, 0, 0], scale = [1, 1, 1] } = {}) {
  const [rx, ry, rz] = rotate;
  const cx = Math.cos(rx), sx = Math.sin(rx);
  const cy = Math.cos(ry), sy = Math.sin(ry);
  const cz = Math.cos(rz), sz = Math.sin(rz);

  mesh.vertices = mesh.vertices.map(([vx, vy, vz]) => {
    let x = vx * scale[0];
    let y = vy * scale[1];
    let z = vz * scale[2];

    // Rotate X
    let y1 = y * cx - z * sx;
    let z1 = y * sx + z * cx;
    y = y1; z = z1;

    // Rotate Y
    let x2 = x * cy + z * sy;
    let z2 = -x * sy + z * cy;
    x = x2; z = z2;

    // Rotate Z
    let x3 = x * cz - y * sz;
    let y3 = x * sz + y * cz;
    x = x3; y = y3;

    return [x + translate[0], y + translate[1], z + translate[2]];
  });

  return computeVertexNormals(mesh);
}

export function mergeMeshes(meshes, name = 'CombinedMesh') {
  const out = createEmptyMesh(name);
  if (meshes[0]?.material) out.material = { ...meshes[0].material };

  for (const m of meshes) {
    const offset = out.vertices.length;
    for (const v of m.vertices) out.vertices.push([...v]);
    for (const uv of m.uvs || []) out.uvs.push([...uv]);
    for (const [a, b, c] of m.faces) {
      out.faces.push([a + offset, b + offset, c + offset]);
    }
  }
  return computeVertexNormals(out);
}

export function extrudeFaces(mesh, { distance = 0.4, scale = 0.85, filterNormalY = null } = {}) {
  computeVertexNormals(mesh);
  const newFaces = [];

  for (const [i0, i1, i2] of mesh.faces) {
    const v0 = mesh.vertices[i0];
    const v1 = mesh.vertices[i1];
    const v2 = mesh.vertices[i2];
    const fn = norm3(cross3(sub3(v1, v0), sub3(v2, v0)));

    if (filterNormalY !== null && fn[1] < filterNormalY) {
      newFaces.push([i0, i1, i2]);
      continue;
    }

    const center = scale3(add3(add3(v0, v1), v2), 1 / 3);
    const extVerts = [v0, v1, v2].map((v) => {
      const scaled = add3(center, scale3(sub3(v, center), scale));
      return add3(scaled, scale3(fn, distance));
    });

    const e0 = mesh.vertices.length;
    mesh.vertices.push(extVerts[0], extVerts[1], extVerts[2]);
    mesh.uvs.push([0, 0], [1, 0], [0.5, 1]);

    // Cap face
    newFaces.push([e0, e0 + 1, e0 + 2]);
    // Side walls
    newFaces.push([i0, i1, e0 + 1], [i0, e0 + 1, e0]);
    newFaces.push([i1, i2, e0 + 2], [i1, e0 + 2, e0 + 1]);
    newFaces.push([i2, i0, e0], [i2, e0, e0 + 2]);
  }

  mesh.faces = newFaces;
  return computeVertexNormals(mesh);
}

export function subdivideMesh(mesh, { levels = 1, smooth = 0.35 } = {}) {
  let current = cloneMesh(mesh);

  for (let lv = 0; lv < levels; lv++) {
    const midCache = new Map();
    const nextFaces = [];

    function getMidpoint(a, b) {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (midCache.has(key)) return midCache.get(key);
      const va = current.vertices[a];
      const vb = current.vertices[b];
      const mid = scale3(add3(va, vb), 0.5);
      const idx = current.vertices.length;
      current.vertices.push(mid);
      current.uvs.push([0.5, 0.5]);
      midCache.set(key, idx);
      return idx;
    }

    for (const [i0, i1, i2] of current.faces) {
      const m01 = getMidpoint(i0, i1);
      const m12 = getMidpoint(i1, i2);
      const m20 = getMidpoint(i2, i0);
      nextFaces.push(
        [i0, m01, m20],
        [i1, m12, m01],
        [i2, m20, m12],
        [m01, m12, m20]
      );
    }
    current.faces = nextFaces;

    // Laplacian smoothing pass for organic subdivision surface feel
    if (smooth > 0) {
      const neighbors = current.vertices.map(() => []);
      for (const [a, b, c] of current.faces) {
        neighbors[a].push(b, c);
        neighbors[b].push(a, c);
        neighbors[c].push(a, b);
      }
      current.vertices = current.vertices.map((v, idx) => {
        const nb = neighbors[idx];
        if (nb.length === 0) return v;
        let avg = [0, 0, 0];
        for (const nIdx of nb) avg = add3(avg, current.vertices[nIdx]);
        avg = scale3(avg, 1 / nb.length);
        return add3(scale3(v, 1 - smooth), scale3(avg, smooth));
      });
    }
  }

  return computeVertexNormals(current);
}

// ============================================================================
// [CHUNK: BLENDER MODIFIERS STACK (MIRROR, ARRAY, DEFORM, DISPLACE, SOLIDIFY)]
// ============================================================================
export function modifierMirror(mesh, { axis = 'x', offset = 0 } = {}) {
  const axIdx = axis === 'y' ? 1 : axis === 'z' ? 2 : 0;
  const baseCount = mesh.vertices.length;
  const mirroredVerts = mesh.vertices.map((v) => {
    const copy = [...v];
    copy[axIdx] = -(copy[axIdx] - offset) + offset;
    return copy;
  });
  mesh.vertices.push(...mirroredVerts);
  mesh.uvs.push(...mesh.uvs.map((u) => [...u]));

  const mirroredFaces = mesh.faces.map(([a, b, c]) => [
    a + baseCount,
    c + baseCount,
    b + baseCount
  ]);
  mesh.faces.push(...mirroredFaces);
  return computeVertexNormals(mesh);
}

export function modifierArray(mesh, { count = 3, offset = [2.2, 0, 0], radial = false } = {}) {
  const base = cloneMesh(mesh);
  const copies = [base];

  for (let i = 1; i < count; i++) {
    const copy = cloneMesh(base);
    if (radial) {
      const ang = (i / count) * Math.PI * 2;
      transformMesh(copy, { rotate: [0, ang, 0] });
    } else {
      transformMesh(copy, {
        translate: [offset[0] * i, offset[1] * i, offset[2] * i]
      });
    }
    copies.push(copy);
  }
  return mergeMeshes(copies, mesh.name);
}

export function modifierDeform(mesh, { mode = 'twist', factor = 0.8 } = {}) {
  mesh.vertices = mesh.vertices.map(([x, y, z]) => {
    if (mode === 'twist') {
      const ang = y * factor;
      const c = Math.cos(ang);
      const s = Math.sin(ang);
      return [x * c - z * s, y, x * s + z * c];
    }
    if (mode === 'taper') {
      const scale = Math.max(0.1, 1 + y * factor * 0.4);
      return [x * scale, y, z * scale];
    }
    if (mode === 'bend') {
      const ang = x * factor * 0.4;
      return [x, y + Math.sin(ang) * 0.8, z];
    }
    return [x, y, z];
  });
  return computeVertexNormals(mesh);
}

export function modifierDisplaceNoise(mesh, { amplitude = 0.25, frequency = 1.4, seed = 42 } = {}) {
  computeVertexNormals(mesh);
  mesh.vertices = mesh.vertices.map((v, i) => {
    const n = mesh.normals[i] || [0, 1, 0];
    const disp = fbmNoise3D(v[0] * frequency, v[1] * frequency, v[2] * frequency, 3, seed) * amplitude;
    return add3(v, scale3(n, disp));
  });
  return computeVertexNormals(mesh);
}

export function modifierSolidify(mesh, { thickness = 0.15 } = {}) {
  computeVertexNormals(mesh);
  const outerCount = mesh.vertices.length;
  const innerVerts = mesh.vertices.map((v, i) =>
    sub3(v, scale3(mesh.normals[i] || [0, 1, 0], thickness))
  );
  mesh.vertices.push(...innerVerts);
  mesh.uvs.push(...mesh.uvs.map((u) => [...u]));
  const innerFaces = mesh.faces.map(([a, b, c]) => [
    a + outerCount,
    c + outerCount,
    b + outerCount
  ]);
  mesh.faces.push(...innerFaces);
  return computeVertexNormals(mesh);
}

// ============================================================================
// [CHUNK: SCULPT MODE BRUSHES (INFLATE, GRAB, SMOOTH, PINCH)]
// ============================================================================
export function sculptBrush(mesh, {
  mode = 'inflate',
  center = [0, 0, 0],
  radius = 1.0,
  strength = 0.25,
  delta = [0, 0.3, 0],
  symmetryX = true
} = {}) {
  computeVertexNormals(mesh);
  const strokes = [center];
  if (symmetryX && Math.abs(center[0]) > 0.001) {
    strokes.push([-center[0], center[1], center[2]]);
  }

  for (const strokeCenter of strokes) {
    mesh.vertices = mesh.vertices.map((v, i) => {
      const dist = len3(sub3(v, strokeCenter));
      if (dist > radius) return v;
      const falloff = Math.pow(1 - dist / radius, 2) * strength;
      if (mode === 'inflate') {
        return add3(v, scale3(mesh.normals[i] || [0, 1, 0], falloff));
      }
      if (mode === 'grab') {
        return add3(v, scale3(delta, falloff));
      }
      if (mode === 'pinch') {
        return add3(v, scale3(sub3(strokeCenter, v), falloff * 0.5));
      }
      return v;
    });
  }
  return computeVertexNormals(mesh);
}

// ============================================================================
// [CHUNK: PROCEDURAL PRESET 3D MODELS (SHIPS, MECHS, CARS, SWORDS, DRAGONS)]
// ============================================================================
export function createPresetModel(preset = 'interceptor-ship') {
  switch (preset) {
    case 'interceptor-ship': {
      const hull = transformMesh(
        createCone({ radius: 0.7, height: 3.4, segments: 16 }),
        { rotate: [Math.PI / 2, 0, 0], scale: [1.1, 0.55, 1] }
      );
      const wings = transformMesh(
        createCube({ size: 1 }),
        { scale: [3.6, 0.1, 1.1], translate: [0, -0.05, -0.3] }
      );
      const wingTips = modifierMirror(
        transformMesh(createCone({ radius: 0.15, height: 1.4, segments: 8 }), {
          rotate: [Math.PI / 2, 0, 0],
          translate: [1.8, -0.05, -0.2]
        }),
        { axis: 'x' }
      );
      const cockpit = transformMesh(
        createSphere({ radius: 0.42, segments: 16, rings: 12 }),
        { scale: [0.85, 0.65, 1.7], translate: [0, 0.24, 0.2] }
      );
      const thrusters = modifierMirror(
        transformMesh(createCylinder({ radiusTop: 0.22, radiusBottom: 0.28, height: 0.7, segments: 14 }), {
          rotate: [Math.PI / 2, 0, 0],
          translate: [0.42, 0, -1.55]
        }),
        { axis: 'x' }
      );
      const ship = mergeMeshes([hull, wings, wingTips, cockpit, thrusters], 'InterceptorShip');
      ship.material = createPrincipledBSDF({
        name: 'StarfighterHull',
        baseColor: '#38bdf8',
        metallic: 0.75,
        roughness: 0.2,
        emissive: '#0284c7',
        emissiveIntensity: 0.25
      });
      return ship;
    }

    case 'cyber-mech': {
      const torso = transformMesh(createCube({ size: 1.3 }), { translate: [0, 0.8, 0], scale: [1.2, 1.3, 0.85] });
      const head = transformMesh(createSphere({ radius: 0.45, segments: 16, rings: 12 }), { translate: [0, 1.85, 0.1] });
      const arms = modifierMirror(
        transformMesh(createCylinder({ radiusTop: 0.22, radiusBottom: 0.2, height: 1.4, segments: 12 }), {
          translate: [1.1, 0.75, 0.2],
          rotate: [0.4, 0, -0.15]
        }),
        { axis: 'x' }
      );
      const legs = modifierMirror(
        transformMesh(createCylinder({ radiusTop: 0.28, radiusBottom: 0.22, height: 1.6, segments: 12 }), {
          translate: [0.48, -0.65, 0]
        }),
        { axis: 'x' }
      );
      const shoulderPods = modifierMirror(
        transformMesh(createCube({ size: 0.55 }), { translate: [0.95, 1.55, -0.1] }),
        { axis: 'x' }
      );
      const mech = mergeMeshes([torso, head, arms, legs, shoulderPods], 'CyberMech');
      mech.material = createPrincipledBSDF({
        name: 'MechArmor',
        baseColor: '#a855f7',
        metallic: 0.8,
        roughness: 0.22,
        emissive: '#6366f1',
        emissiveIntensity: 0.2
      });
      return mech;
    }

    case 'hyper-car': {
      const chassis = transformMesh(createCube({ size: 1 }), { scale: [1.8, 0.42, 3.6], translate: [0, 0.1, 0] });
      const cabin = transformMesh(createSphere({ radius: 0.85, segments: 16, rings: 12 }), {
        scale: [0.9, 0.45, 1.45],
        translate: [0, 0.42, -0.15]
      });
      const spoiler = transformMesh(createCube({ size: 1 }), {
        scale: [1.75, 0.08, 0.35],
        translate: [0, 0.52, -1.6]
      });
      const frontWheels = modifierMirror(
        transformMesh(createCylinder({ radiusTop: 0.36, radiusBottom: 0.36, height: 0.28, segments: 16 }), {
          rotate: [0, 0, Math.PI / 2],
          translate: [0.95, -0.1, 1.1]
        }),
        { axis: 'x' }
      );
      const rearWheels = modifierMirror(
        transformMesh(createCylinder({ radiusTop: 0.4, radiusBottom: 0.4, height: 0.32, segments: 16 }), {
          rotate: [0, 0, Math.PI / 2],
          translate: [0.98, -0.08, -1.15]
        }),
        { axis: 'x' }
      );
      const car = mergeMeshes([chassis, cabin, spoiler, frontWheels, rearWheels], 'HyperCar');
      car.material = createPrincipledBSDF({
        name: 'HyperCarPaint',
        baseColor: '#f43f5e',
        metallic: 0.85,
        roughness: 0.12,
        clearcoat: 0.9
      });
      return car;
    }

    case 'plasma-sword': {
      const blade = transformMesh(createCone({ radius: 0.16, height: 2.8, segments: 12 }), {
        scale: [1, 1, 0.32],
        translate: [0, 1.1, 0]
      });
      const guard = transformMesh(createCube({ size: 1 }), {
        scale: [0.95, 0.16, 0.28],
        translate: [0, -0.3, 0]
      });
      const grip = transformMesh(createCylinder({ radiusTop: 0.09, radiusBottom: 0.09, height: 0.75, segments: 12 }), {
        translate: [0, -0.75, 0]
      });
      const pommel = transformMesh(createSphere({ radius: 0.16, segments: 12, rings: 10 }), {
        translate: [0, -1.2, 0]
      });
      const sword = mergeMeshes([blade, guard, grip, pommel], 'PlasmaSword');
      sword.material = createPrincipledBSDF({
        name: 'PlasmaBlade',
        baseColor: '#10b981',
        metallic: 0.9,
        roughness: 0.15,
        emissive: '#059669',
        emissiveIntensity: 0.35
      });
      return sword;
    }

    case 'crystal-cluster': {
      const shards = [];
      const angles = [
        [0, 0, 0, 1.0, 2.5],
        [0.45, 0.2, 0.35, 0.7, 1.9],
        [-0.4, -0.1, -0.3, 0.75, 2.0],
        [0.2, 0.4, -0.45, 0.6, 1.6],
        [-0.25, -0.35, 0.4, 0.65, 1.7]
      ];
      for (const [rx, ry, rz, rad, h] of angles) {
        shards.push(
          transformMesh(createCylinder({ radiusTop: 0.02, radiusBottom: rad * 0.45, height: h, segments: 6 }), {
            rotate: [rx, ry, rz],
            translate: [rx * 0.8, 0, rz * 0.8]
          })
        );
      }
      const cluster = mergeMeshes(shards, 'CrystalCluster');
      cluster.material = createPrincipledBSDF({
        name: 'AstralCrystal',
        baseColor: '#22d3ee',
        metallic: 0.2,
        roughness: 0.08,
        transmission: 0.75,
        emissive: '#0891b2',
        emissiveIntensity: 0.4
      });
      return cluster;
    }

    case 'ps5-console':
      return createPS5ConsoleMesh();

    case 'dualsense-controller':
      return createDualSenseMesh();

    case 'suzanne-head':
      return createSuzanneHead();

    default: {
      const rock = modifierDisplaceNoise(
        createSphere({ radius: 1.3, segments: 24, rings: 18, name: 'ProceduralAsteroid' }),
        { amplitude: 0.32, frequency: 1.6, seed: 99 }
      );
      return rock;
    }
  }
}

// ============================================================================
// [CHUNK: ADVANCED PRIMITIVES, SPLINES & CONSOLE HARDWARE MESHES]
// ============================================================================
export function createIcoSphere({ radius = 1.2, subdivisions = 1, name = 'IcoSphere', material } = {}) {
  const t = (1 + Math.sqrt(5)) / 2;
  const rawVerts = [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]
  ].map((v) => scale3(norm3(v), radius));

  const mesh = createEmptyMesh(name);
  if (material) mesh.material = createPrincipledBSDF(material);
  mesh.vertices = rawVerts;
  mesh.uvs = rawVerts.map(() => [0.5, 0.5]);
  mesh.faces = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
  ];
  computeVertexNormals(mesh);
  return subdivisions > 0 ? subdivideMesh(mesh, { levels: subdivisions, smooth: 0.25 }) : mesh;
}

export function createCapsule({ radius = 0.6, height = 1.6, segments = 18, name = 'Capsule', material } = {}) {
  const body = createCylinder({ radiusTop: radius, radiusBottom: radius, height, segments });
  const topCap = transformMesh(createSphere({ radius, segments, rings: 10 }), { translate: [0, height / 2, 0] });
  const botCap = transformMesh(createSphere({ radius, segments, rings: 10 }), { translate: [0, -height / 2, 0] });
  const merged = mergeMeshes([body, topCap, botCap], name);
  if (material) merged.material = createPrincipledBSDF(material);
  return merged;
}

export function createPlaneGrid({ width = 4, depth = 4, segX = 16, segZ = 16, name = 'PlaneGrid', material } = {}) {
  const mesh = createEmptyMesh(name);
  if (material) mesh.material = createPrincipledBSDF(material);
  for (let z = 0; z <= segZ; z++) {
    for (let x = 0; x <= segX; x++) {
      const u = x / segX;
      const v = z / segZ;
      mesh.vertices.push([(u - 0.5) * width, 0, (v - 0.5) * depth]);
      mesh.uvs.push([u, v]);
    }
  }
  const stride = segX + 1;
  for (let z = 0; z < segZ; z++) {
    for (let x = 0; x < segX; x++) {
      const a = z * stride + x;
      const b = a + stride;
      const c = b + 1;
      const d = a + 1;
      mesh.faces.push([a, b, d], [b, c, d]);
    }
  }
  return computeVertexNormals(mesh);
}

export function createRingMesh({ innerRadius = 0.6, outerRadius = 1.4, segments = 28, name = 'RingMesh', material } = {}) {
  const mesh = createEmptyMesh(name);
  if (material) mesh.material = createPrincipledBSDF(material);
  for (let i = 0; i <= segments; i++) {
    const ang = (i / segments) * Math.PI * 2;
    const c = Math.cos(ang), s = Math.sin(ang);
    mesh.vertices.push([c * innerRadius, 0, s * innerRadius]);
    mesh.vertices.push([c * outerRadius, 0, s * outerRadius]);
    mesh.uvs.push([i / segments, 0], [i / segments, 1]);
  }
  for (let i = 0; i < segments; i++) {
    const a = i * 2;
    mesh.faces.push([a, a + 1, a + 3], [a, a + 3, a + 2]);
  }
  return computeVertexNormals(mesh);
}

export function createTubeSpline({
  pathPoints = [[0, -1.5, 0], [0.5, -0.5, 0.3], [-0.4, 0.5, -0.2], [0, 1.5, 0]],
  radius = 0.22,
  radialSegments = 12,
  name = 'TubeSpline',
  material
} = {}) {
  const mesh = createEmptyMesh(name);
  if (material) mesh.material = createPrincipledBSDF(material);

  for (let i = 0; i < pathPoints.length; i++) {
    const p = pathPoints[i];
    for (let s = 0; s <= radialSegments; s++) {
      const ang = (s / radialSegments) * Math.PI * 2;
      mesh.vertices.push([
        p[0] + Math.cos(ang) * radius,
        p[1],
        p[2] + Math.sin(ang) * radius
      ]);
      mesh.uvs.push([s / radialSegments, i / Math.max(1, pathPoints.length - 1)]);
    }
  }
  const stride = radialSegments + 1;
  for (let i = 0; i < pathPoints.length - 1; i++) {
    for (let s = 0; s < radialSegments; s++) {
      const a = i * stride + s;
      const b = (i + 1) * stride + s;
      mesh.faces.push([a, b, a + 1], [b, b + 1, a + 1]);
    }
  }
  return computeVertexNormals(mesh);
}

export function createSuzanneHead({ name = 'SuzannePro' } = {}) {
  const cranium = createSphere({ radius: 1.0, segments: 20, rings: 14 });
  const snout = transformMesh(createSphere({ radius: 0.58, segments: 14, rings: 10 }), {
    scale: [1.1, 0.75, 0.9],
    translate: [0, -0.32, 0.82]
  });
  const ears = modifierMirror(
    transformMesh(createCylinder({ radiusTop: 0.42, radiusBottom: 0.42, height: 0.18, segments: 14 }), {
      rotate: [0, 0, Math.PI / 2],
      translate: [1.08, 0.1, -0.05]
    }),
    { axis: 'x' }
  );
  const eyes = modifierMirror(
    transformMesh(createSphere({ radius: 0.22, segments: 12, rings: 10 }), {
      translate: [0.36, 0.18, 0.85]
    }),
    { axis: 'x' }
  );
  const head = mergeMeshes([cranium, snout, ears, eyes], name);
  head.material = createPrincipledBSDF({
    name: 'SuzanneGold',
    baseColor: '#facc15',
    metallic: 0.85,
    roughness: 0.18
  });
  return head;
}

export function createPS5ConsoleMesh() {
  // Center glossy black core tower
  const core = transformMesh(createCube({ size: 1 }), {
    scale: [0.52, 3.1, 1.65]
  });
  // Left & Right flared white architectural faceplates with curve deform
  const leftPlate = modifierDeform(
    transformMesh(createCube({ size: 1 }), {
      scale: [0.09, 3.35, 1.82],
      translate: [-0.32, 0.06, 0]
    }),
    { mode: 'taper', factor: 0.18 }
  );
  const rightPlate = modifierDeform(
    transformMesh(createCube({ size: 1 }), {
      scale: [0.09, 3.35, 1.82],
      translate: [0.32, 0.06, 0]
    }),
    { mode: 'taper', factor: 0.18 }
  );
  // Circular base stand
  const stand = transformMesh(
    createCylinder({ radiusTop: 0.78, radiusBottom: 0.85, height: 0.14, segments: 24 }),
    { translate: [0, -1.68, 0] }
  );
  const ps5 = mergeMeshes([core, leftPlate, rightPlate, stand], 'PS5Console');
  ps5.material = createPrincipledBSDF({
    name: 'PS5CeramicShell',
    baseColor: '#f8fafc',
    metallic: 0.35,
    roughness: 0.15,
    emissive: '#2563eb',
    emissiveIntensity: 0.35
  });
  return ps5;
}

export function createDualSenseMesh() {
  const body = transformMesh(createSphere({ radius: 0.9, segments: 18, rings: 14 }), {
    scale: [1.45, 0.55, 0.95]
  });
  const grips = modifierMirror(
    transformMesh(createCapsule({ radius: 0.34, height: 1.15, segments: 14 }), {
      rotate: [0.35, 0, -0.32],
      translate: [0.95, -0.45, 0.25]
    }),
    { axis: 'x' }
  );
  const sticks = modifierMirror(
    transformMesh(createCylinder({ radiusTop: 0.22, radiusBottom: 0.14, height: 0.32, segments: 14 }), {
      rotate: [Math.PI / 2, 0, 0],
      translate: [0.46, -0.05, 0.48]
    }),
    { axis: 'x' }
  );
  const pad = mergeMeshes([body, grips, sticks], 'DualSenseController');
  pad.material = createPrincipledBSDF({
    name: 'DualSenseWhiteBlue',
    baseColor: '#e2e8f0',
    metallic: 0.4,
    roughness: 0.2,
    emissive: '#3b82f6',
    emissiveIntensity: 0.3
  });
  return pad;
}

// ============================================================================
// [CHUNK: EXTRA EDIT MODE, MODIFIERS, SCULPTING & RIGGING/IK TOOLS]
// ============================================================================
export function insetFaces(mesh, { insetFactor = 0.25 } = {}) {
  return extrudeFaces(mesh, { distance: 0.001, scale: Math.max(0.1, 1 - insetFactor) });
}

export function bevelMesh(mesh, { amount = 0.12 } = {}) {
  return subdivideMesh(mesh, { levels: 1, smooth: amount });
}

export function mergeVerticesByDistance(mesh, { epsilon = 0.0001 } = {}) {
  const uniqueVerts = [];
  const remap = new Array(mesh.vertices.length);
  for (let i = 0; i < mesh.vertices.length; i++) {
    const v = mesh.vertices[i];
    let found = -1;
    for (let j = 0; j < uniqueVerts.length; j++) {
      if (len3(sub3(v, uniqueVerts[j])) <= epsilon) {
        found = j;
        break;
      }
    }
    if (found === -1) {
      remap[i] = uniqueVerts.length;
      uniqueVerts.push(v);
    } else {
      remap[i] = found;
    }
  }
  mesh.vertices = uniqueVerts;
  mesh.faces = mesh.faces
    .map(([a, b, c]) => [remap[a], remap[b], remap[c]])
    .filter(([a, b, c]) => a !== b && b !== c && a !== c);
  return computeVertexNormals(mesh);
}

export function decimateMesh(mesh, { ratio = 0.5 } = {}) {
  const step = Math.max(1, Math.round(1 / Math.max(0.1, Math.min(1, ratio))));
  mesh.faces = mesh.faces.filter((_, idx) => idx % step === 0);
  return computeVertexNormals(mesh);
}

export function computeBoundingBox(mesh) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (const [x, y, z] of mesh.vertices) {
    if (x < min[0]) min[0] = x;
    if (y < min[1]) min[1] = y;
    if (z < min[2]) min[2] = z;
    if (x > max[0]) max[0] = x;
    if (y > max[1]) max[1] = y;
    if (z > max[2]) max[2] = z;
  }
  const center = scale3(add3(min, max), 0.5);
  const size = sub3(max, min);
  return { min, max, center, size, radius: len3(size) * 0.5 };
}

export function centerPivotToBounds(mesh) {
  const { center } = computeBoundingBox(mesh);
  return transformMesh(mesh, { translate: [-center[0], -center[1], -center[2]] });
}

export function modifierWave(mesh, { amplitude = 0.25, frequency = 2.0, phase = 0 } = {}) {
  mesh.vertices = mesh.vertices.map(([x, y, z]) => [
    x,
    y + Math.sin(x * frequency + phase) * Math.cos(z * frequency + phase) * amplitude,
    z
  ]);
  return computeVertexNormals(mesh);
}

export function modifierShrinkwrap(mesh, { targetRadius = 1.5, factor = 0.5 } = {}) {
  mesh.vertices = mesh.vertices.map((v) => {
    const projected = scale3(norm3(v), targetRadius);
    return add3(scale3(v, 1 - factor), scale3(projected, factor));
  });
  return computeVertexNormals(mesh);
}

export function sculptSmoothBrush(mesh, { iterations = 1, factor = 0.35 } = {}) {
  for (let it = 0; it < iterations; it++) {
    const neighbors = mesh.vertices.map(() => []);
    for (const [a, b, c] of mesh.faces) {
      neighbors[a].push(b, c);
      neighbors[b].push(a, c);
      neighbors[c].push(a, b);
    }
    mesh.vertices = mesh.vertices.map((v, i) => {
      const nb = neighbors[i];
      if (!nb.length) return v;
      let avg = [0, 0, 0];
      for (const idx of nb) avg = add3(avg, mesh.vertices[idx]);
      avg = scale3(avg, 1 / nb.length);
      return add3(scale3(v, 1 - factor), scale3(avg, factor));
    });
  }
  return computeVertexNormals(mesh);
}

export function createArmatureRig(name = 'BipedRig') {
  return {
    name,
    bones: [
      { name: 'Root', parent: null, head: [0, 0, 0], tail: [0, 0.8, 0] },
      { name: 'Spine', parent: 'Root', head: [0, 0.8, 0], tail: [0, 1.6, 0] },
      { name: 'Head', parent: 'Spine', head: [0, 1.6, 0], tail: [0, 2.1, 0] },
      { name: 'Arm.L', parent: 'Spine', head: [-0.6, 1.5, 0], tail: [-1.3, 0.9, 0] },
      { name: 'Arm.R', parent: 'Spine', head: [0.6, 1.5, 0], tail: [1.3, 0.9, 0] }
    ]
  };
}

export function solveTwoBoneIK(rootPos, targetPos, lenA = 1.0, lenB = 1.0) {
  const dir = sub3(targetPos, rootPos);
  const d = Math.min(lenA + lenB - 0.001, Math.max(0.001, len3(dir)));
  const cosAngle = (lenA * lenA + d * d - lenB * lenB) / (2 * lenA * d);
  const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  const forward = norm3(dir);
  const midPos = [
    rootPos[0] + forward[0] * Math.cos(angle) * lenA,
    rootPos[1] + Math.sin(angle) * lenA,
    rootPos[2] + forward[2] * Math.cos(angle) * lenA
  ];
  return { rootPos, midPos, endPos: targetPos };
}

export function sampleProceduralAnimation(timeSec, mode = 'hover') {
  if (mode === 'hover') {
    return {
      translate: [0, Math.sin(timeSec * 2.5) * 0.18, 0],
      rotate: [Math.sin(timeSec * 1.4) * 0.06, timeSec * 0.8, Math.cos(timeSec * 1.8) * 0.06]
    };
  }
  return { translate: [0, 0, 0], rotate: [0, timeSec, 0] };
}

// ============================================================================
// [CHUNK: EXPORTERS (WAVEFRONT .OBJ, GLTF 2.0 .GLTF, EMBEDDABLE .JS MODULE)]
// ============================================================================
export function exportToOBJ(mesh) {
  computeVertexNormals(mesh);
  const lines = [
    `# Arena.ai AI-Blender Export`,
    `# Object: ${mesh.name || 'Model'}`,
    `# Vertices: ${mesh.vertices.length}, Faces: ${mesh.faces.length}`,
    `o ${mesh.name || 'Model'}`
  ];

  for (const [x, y, z] of mesh.vertices) {
    lines.push(`v ${x.toFixed(5)} ${y.toFixed(5)} ${z.toFixed(5)}`);
  }
  for (const [u, v] of mesh.uvs || []) {
    lines.push(`vt ${u.toFixed(5)} ${v.toFixed(5)}`);
  }
  for (const [nx, ny, nz] of mesh.normals || []) {
    lines.push(`vn ${nx.toFixed(5)} ${ny.toFixed(5)} ${nz.toFixed(5)}`);
  }
  for (const [a, b, c] of mesh.faces) {
    const i1 = a + 1;
    const i2 = b + 1;
    const i3 = c + 1;
    lines.push(`f ${i1}/${i1}/${i1} ${i2}/${i2}/${i2} ${i3}/${i3}/${i3}`);
  }
  return lines.join('\n') + '\n';
}

export function exportToGLTF(mesh) {
  computeVertexNormals(mesh);
  const gltf = {
    asset: {
      version: '2.0',
      generator: 'Arena.ai AI-Blender 3D Studio'
    },
    scene: 0,
    scenes: [{ name: mesh.name || 'Scene', nodes: [0] }],
    nodes: [{ name: mesh.name || 'MeshNode', mesh: 0 }],
    materials: [
      {
        name: mesh.material?.name || 'PrincipledMaterial',
        pbrMetallicRoughness: {
          baseColorFactor: [0.22, 0.74, 0.97, 1.0],
          metallicFactor: mesh.material?.metallic ?? 0.5,
          roughnessFactor: mesh.material?.roughness ?? 0.3
        }
      }
    ],
    meshes: [
      {
        name: mesh.name || 'Mesh',
        extras: {
          vertexCount: mesh.vertices.length,
          faceCount: mesh.faces.length,
          vertices: mesh.vertices,
          normals: mesh.normals,
          faces: mesh.faces,
          material: mesh.material
        }
      }
    ]
  };
  return JSON.stringify(gltf, null, 2) + '\n';
}

export function exportToJSModule(mesh) {
  computeVertexNormals(mesh);
  return `// Auto-generated 3D Model by Arena.ai AI-Blender Engine
export const model = ${JSON.stringify(mesh, null, 2)};
export default model;
`;
}
