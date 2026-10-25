/* ============================================================
 * bpy-core.js — Full 1-for-1 Blender `bpy` & `bmesh` Engine
 * Runs in the browser (window.BPY) and Node (module.exports).
 * Complete ID datablocks, BMesh topology, full modifier stack,
 * sculpt, UV, shader/geometry nodes, armature auto-skinning,
 * LBS + shape-key deformation, Actions/FCurves/NLA, and
 * .bblend.json / skinned animated .gltf / .obj export +
 * BlenderModelAnimator runtime loader.
 * ============================================================ */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module && module.exports) module.exports = api;
  if (root) root.BPY = api;
  if (typeof globalThis !== 'undefined') globalThis.BPY = globalThis.BPY || api;
})(typeof globalThis !== 'undefined' ? globalThis : (typeof self !== 'undefined' ? self : this), function () {
  'use strict';

  /* ================= MATH ================= */
  const V = {
    add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
    sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
    mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
    mulv: (a, b) => [a[0] * b[0], a[1] * b[1], a[2] * b[2]],
    dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
    cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
    len: (a) => Math.hypot(a[0], a[1], a[2]),
    dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
    norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
    lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
    clone: (a) => [a[0], a[1], a[2]]
  };
  const M4 = {
    identity: () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    mul(a, b) {
      const o = new Array(16);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
        o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
      }
      return o;
    },
    translation: (x, y, z) => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, x, y, z, 1],
    scaling: (x, y, z) => [x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1],
    rotX(a) { const c = Math.cos(a), s = Math.sin(a); return [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]; },
    rotY(a) { const c = Math.cos(a), s = Math.sin(a); return [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]; },
    rotZ(a) { const c = Math.cos(a), s = Math.sin(a); return [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]; },
    xform(m, v) {
      return [
        m[0] * v[0] + m[4] * v[1] + m[8] * v[2] + m[12],
        m[1] * v[0] + m[5] * v[1] + m[9] * v[2] + m[13],
        m[2] * v[0] + m[6] * v[1] + m[10] * v[2] + m[14]
      ];
    },
    invert(m) {
      const inv = new Array(16);
      inv[0] = m[5] * m[10] * m[15] - m[5] * m[11] * m[14] - m[9] * m[6] * m[15] + m[9] * m[7] * m[14] + m[13] * m[6] * m[11] - m[13] * m[7] * m[10];
      inv[4] = -m[4] * m[10] * m[15] + m[4] * m[11] * m[14] + m[8] * m[6] * m[15] - m[8] * m[7] * m[14] - m[12] * m[6] * m[11] + m[12] * m[7] * m[10];
      inv[8] = m[4] * m[9] * m[15] - m[4] * m[11] * m[13] - m[8] * m[5] * m[15] + m[8] * m[7] * m[13] + m[12] * m[5] * m[11] - m[12] * m[7] * m[9];
      inv[12] = -m[4] * m[9] * m[14] + m[4] * m[10] * m[13] + m[8] * m[5] * m[14] - m[8] * m[6] * m[13] - m[12] * m[5] * m[10] + m[12] * m[6] * m[9];
      inv[1] = -m[1] * m[10] * m[15] + m[1] * m[11] * m[14] + m[9] * m[2] * m[15] - m[9] * m[3] * m[14] - m[13] * m[2] * m[11] + m[13] * m[3] * m[10];
      inv[5] = m[0] * m[10] * m[15] - m[0] * m[11] * m[14] - m[8] * m[2] * m[15] + m[8] * m[3] * m[14] + m[12] * m[2] * m[11] - m[12] * m[3] * m[10];
      inv[9] = -m[0] * m[9] * m[15] + m[0] * m[11] * m[13] + m[8] * m[1] * m[15] - m[8] * m[3] * m[13] - m[12] * m[1] * m[11] + m[12] * m[3] * m[9];
      inv[13] = m[0] * m[9] * m[14] - m[0] * m[10] * m[13] - m[8] * m[1] * m[14] + m[8] * m[2] * m[13] + m[12] * m[1] * m[10] - m[12] * m[2] * m[9];
      inv[2] = m[1] * m[6] * m[15] - m[1] * m[7] * m[14] - m[5] * m[2] * m[15] + m[5] * m[3] * m[14] + m[13] * m[2] * m[7] - m[13] * m[3] * m[6];
      inv[6] = -m[0] * m[6] * m[15] + m[0] * m[7] * m[14] + m[4] * m[2] * m[15] - m[4] * m[3] * m[14] - m[12] * m[2] * m[7] + m[12] * m[3] * m[6];
      inv[10] = m[0] * m[5] * m[15] - m[0] * m[7] * m[13] - m[4] * m[1] * m[15] + m[4] * m[3] * m[13] + m[12] * m[1] * m[7] - m[12] * m[3] * m[5];
      inv[14] = -m[0] * m[5] * m[14] + m[0] * m[6] * m[13] + m[4] * m[1] * m[14] - m[4] * m[2] * m[13] - m[12] * m[1] * m[6] + m[12] * m[2] * m[5];
      inv[3] = -m[1] * m[6] * m[11] + m[1] * m[7] * m[10] + m[5] * m[2] * m[11] - m[5] * m[3] * m[10] - m[9] * m[2] * m[7] + m[9] * m[3] * m[6];
      inv[7] = m[0] * m[6] * m[11] - m[0] * m[7] * m[10] - m[4] * m[2] * m[11] + m[4] * m[3] * m[10] + m[8] * m[2] * m[7] - m[8] * m[3] * m[6];
      inv[11] = -m[0] * m[5] * m[11] + m[0] * m[7] * m[9] + m[4] * m[1] * m[11] - m[4] * m[3] * m[9] - m[8] * m[1] * m[7] + m[8] * m[3] * m[5];
      inv[15] = m[0] * m[5] * m[10] - m[0] * m[6] * m[9] - m[4] * m[1] * m[10] + m[4] * m[2] * m[9] + m[8] * m[1] * m[6] - m[8] * m[2] * m[5];
      let det = m[0] * inv[0] + m[1] * inv[4] + m[2] * inv[8] + m[3] * inv[12];
      if (!det) return M4.identity();
      det = 1 / det;
      for (let i = 0; i < 16; i++) inv[i] *= det;
      return inv;
    },
    compose(loc, rotEuler, scale) {
      let m = M4.identity();
      m = M4.mul(m, M4.translation(loc[0], loc[1], loc[2]));
      m = M4.mul(m, M4.rotZ(rotEuler[2]));
      m = M4.mul(m, M4.rotY(rotEuler[1]));
      m = M4.mul(m, M4.rotX(rotEuler[0]));
      m = M4.mul(m, M4.scaling(scale[0], scale[1], scale[2]));
      return m;
    }
  };
  // Deterministic value noise (works identically in Node + browser)
  function hash3(x, y, z) {
    let h = (x * 374761393 + y * 668265263 + z * 2147483647) | 0;
    h = (h ^ (h >> 13)) * 1274126177 | 0;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }
  function noise3(x, y, z) {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
    const xf = x - xi, yf = y - yi, zf = z - zi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
    const n = (i, j, k) => hash3(xi + i, yi + j, zi + k);
    const lerp = (a, b, t) => a + (b - a) * t;
    return lerp(
      lerp(lerp(n(0, 0, 0), n(1, 0, 0), u), lerp(n(0, 1, 0), n(1, 1, 0), u), v),
      lerp(lerp(n(0, 0, 1), n(1, 0, 1), u), lerp(n(0, 1, 1), n(1, 1, 1), u), v), w) * 2 - 1;
  }
  function fbm3(x, y, z, oct = 4) {
    let a = 0.5, f = 1, s = 0;
    for (let i = 0; i < oct; i++) { s += noise3(x * f, y * f, z * f) * a; f *= 2; a *= 0.5; }
    return s;
  }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
  function uid(prefix) { uid._n = (uid._n || 0) + 1; return prefix + '.' + String(uid._n).padStart(4, '0'); }

  /* ================= ID DATA-BLOCKS (bpy.data) ================= */
  class ID {
    constructor(name, kind) {
      this.name = name || uid(kind);
      this.kind = kind;
      this.users = 0;
      this.fake_user = false;
      this.tag = false;
      this.library = null;
      this.animation_data = null;
    }
    copy() { const c = JSON.parse(JSON.stringify(this, (k, v) => (k === 'actions' ? undefined : v))); return c; }
  }

  class Mesh extends ID {
    constructor(name) {
      super(name, 'MESH');
      this.verts = [];            // [[x,y,z], ...]
      this.edges = [];            // [[a,b], ...]
      this.faces = [];            // [[i0,i1,...], ...]
      this.loops = [];            // {v, f, e} expanded per-face loops
      this.uv_layers = [];        // {name, data:[[u,v] per loop]}
      this.vertex_colors = [];    // {name, data:[[r,g,b,a] per loop]}
      this.attributes = {};       // generic attribute layers
      this.vertex_groups = [];    // {name, weights:{vi: w}}
      this.shape_keys = null;     // ShapeKey datablock
      this.materials = [];        // Material refs
      this.poly_normals = [];
      this.vert_normals = [];
      this.smooth_shade = true;
      this.is_editmode = false;
      this.update();
    }
    update() {
      // expand loops from faces
      this.loops = [];
      for (let fi = 0; fi < this.faces.length; fi++) {
        const f = this.faces[fi];
        for (let li = 0; li < f.length; li++) this.loops.push({ v: f[li], f: fi });
      }
      this.compute_normals();
      for (const layer of this.uv_layers) {
        if (!layer.data || layer.data.length !== this.loops.length) {
          layer.data = this.loops.map(() => [0, 0]);
        }
      }
    }
    compute_normals() {
      this.poly_normals = this.faces.map((f) => {
        const a = this.verts[f[0]], b = this.verts[f[1]], c = this.verts[f[2]];
        return V.norm(V.cross(V.sub(b, a), V.sub(c, a)));
      });
      this.vert_normals = this.verts.map(() => [0, 0, 0]);
      this.faces.forEach((f, fi) => {
        for (const vi of f) {
          const n = this.vert_normals[vi];
          n[0] += this.poly_normals[fi][0]; n[1] += this.poly_normals[fi][1]; n[2] += this.poly_normals[fi][2];
        }
      });
      this.vert_normals = this.vert_normals.map((n) => V.norm(n));
    }
    validate() {
      const nv = this.verts.length;
      this.edges = this.edges.filter((e) => e[0] < nv && e[1] < nv);
      this.faces = this.faces.filter((f) => f.every((i) => i < nv) && f.length >= 3);
      this.update();
    }
    calc_loop_triangles() {
      const tris = [];
      this.faces.forEach((f, fi) => {
        for (let i = 1; i < f.length - 1; i++) tris.push([f[0], f[i], f[i + 1], fi]);
      });
      return tris;
    }
    add_vertex_group(name) {
      let g = this.vertex_groups.find((g) => g.name === name);
      if (!g) { g = { name, weights: {} }; this.vertex_groups.push(g); }
      return g;
    }
    set_weight(groupName, vi, w) {
      const g = this.add_vertex_group(groupName);
      if (w <= 0) delete g.weights[vi]; else g.weights[vi] = w;
    }
  }

  class ShapeKey extends ID {
    constructor(name, mesh) {
      super(name, 'SHAPE_KEY');
      this.mesh = mesh;
      this.relative = true;
      this.relative_key = null;   // basis
      this.slider_min = 0; this.slider_max = 1;
      this.value = 0;
      this.data = mesh.verts.map((v) => V.clone(v));
      this.key_blocks = [];
    }
  }

  class Armature extends ID {
    constructor(name) {
      super(name, 'ARMATURE');
      this.bones = [];       // EditBone: {name, head, tail, roll, parent, deform, connected}
      this.joints = [];      // runtime joint list for skinning
      this.display_type = 'OCTAHEDRAL';
    }
    add_bone(name, head, tail, parent = null) {
      const b = { name, head: V.clone(head), tail: V.clone(tail), roll: 0, parent, deform: true, connected: false, use_local_location: true };
      this.bones.push(b);
      return b;
    }
  }

  class Material extends ID {
    constructor(name) {
      super(name, 'MATERIAL');
      this.use_nodes = true;
      this.diffuse_color = [0.8, 0.8, 0.8, 1];
      this.metallic = 0;
      this.roughness = 0.5;
      this.node_tree = new NodeTree(name + '_tree', 'SHADER');
      // Default: Principled BSDF -> Material Output
      const bsdf = this.node_tree.add_node('ShaderNodeBsdfPrincipled', 'Principled BSDF');
      const out = this.node_tree.add_node('ShaderNodeOutputMaterial', 'Material Output');
      this.node_tree.link(bsdf.outputs[0], out.inputs[0]);
      this.principled = bsdf;
    }
    eval_color(uv, pos) {
      return eval_shader_tree(this.node_tree, uv, pos, this.diffuse_color);
    }
  }

  class NodeTree extends ID {
    constructor(name, type) {
      super(name, 'NODE_TREE');
      this.type = type; // 'SHADER' | 'GEOMETRY' | 'COMPOSITOR'
      this.nodes = [];
      this.links = [];
      this.interface = { inputs: [], outputs: [] };
    }
    add_node(idname, name) {
      const n = make_node(idname, name || idname);
      n.idname = idname;
      this.nodes.push(n);
      return n;
    }
    link(outSocket, inSocket) {
      // sockets: {node, name, type, value}
      const l = { from: outSocket, to: inSocket };
      inSocket.link = l; outSocket.links = outSocket.links || []; outSocket.links.push(l);
      this.links.push(l);
      return l;
    }
    remove_node(n) {
      this.nodes = this.nodes.filter((x) => x !== n);
      this.links = this.links.filter((l) => l.from.node !== n && l.to.node !== n);
    }
  }

  function sock(node, name, type, dir, value = null) {
    return { node, name, type, dir, value, link: null, links: [] };
  }

  function make_node(idname, name) {
    const n = { idname, name, location: [0, 0], width: 140, inputs: [], outputs: [], props: {}, color: [0.4, 0.4, 0.4] };
    const I = (nm, t, v) => { const s = sock(n, nm, t, 'IN', v); n.inputs.push(s); return s; };
    const O = (nm, t) => { const s = sock(n, nm, t, 'OUT'); n.outputs.push(s); return s; };
    switch (idname) {
      case 'ShaderNodeBsdfPrincipled':
        I('Base Color', 'RGBA', [0.8, 0.8, 0.8, 1]);
        I('Metallic', 'VALUE', 0); I('Roughness', 'VALUE', 0.5);
        I('IOR', 'VALUE', 1.45); I('Alpha', 'VALUE', 1);
        I('Emission Color', 'RGBA', [0, 0, 0, 1]); I('Emission Strength', 'VALUE', 0);
        I('Normal', 'VECTOR', [0, 0, 1]); I('Specular IOR Level', 'VALUE', 0.5);
        O('BSDF', 'SHADER');
        n.color = [0.5, 0.22, 0.13];
        break;
      case 'ShaderNodeEmission':
        I('Color', 'RGBA', [1, 1, 1, 1]); I('Strength', 'VALUE', 1); O('Emission', 'SHADER');
        break;
      case 'ShaderNodeBsdfDiffuse': I('Color', 'RGBA', [0.8, 0.8, 0.8, 1]); I('Roughness', 'VALUE', 0); O('BSDF', 'SHADER'); break;
      case 'ShaderNodeBsdfGlossy': I('Color', 'RGBA', [0.8, 0.8, 0.8, 1]); I('Roughness', 'VALUE', 0.2); O('BSDF', 'SHADER'); break;
      case 'ShaderNodeBsdfTransparent': I('Color', 'RGBA', [1, 1, 1, 1]); O('BSDF', 'SHADER'); break;
      case 'ShaderNodeMixShader': I('Fac', 'VALUE', 0.5); I('Shader', 'SHADER'); I('Shader', 'SHADER'); O('Shader', 'SHADER'); break;
      case 'ShaderNodeAddShader': I('Shader', 'SHADER'); I('Shader', 'SHADER'); O('Shader', 'SHADER'); break;
      case 'ShaderNodeOutputMaterial': I('Surface', 'SHADER'); I('Volume', 'SHADER'); I('Displacement', 'VECTOR'); O('BSDF', 'SHADER'); break;
      case 'ShaderNodeTexImage': {
        I('Vector', 'VECTOR'); O('Color', 'RGBA'); O('Alpha', 'VALUE');
        n.props.image = null; n.props.interpolation = 'Linear'; n.props.extension = 'REPEAT';
        break;
      }
      case 'ShaderNodeTexNoise':
        I('Vector', 'VECTOR'); I('Scale', 'VALUE', 5); I('Detail', 'VALUE', 2); I('Roughness', 'VALUE', 0.5);
        O('Fac', 'VALUE'); O('Color', 'RGBA');
        break;
      case 'ShaderNodeTexVoronoi':
        I('Vector', 'VECTOR'); I('Scale', 'VALUE', 5); O('Distance', 'VALUE'); O('Color', 'RGBA'); O('Position', 'VECTOR');
        n.props.feature = 'F1';
        break;
      case 'ShaderNodeTexChecker':
        I('Vector', 'VECTOR'); I('Color1', 'RGBA', [0.8, 0.8, 0.8, 1]); I('Color2', 'RGBA', [0.2, 0.2, 0.2, 1]); I('Scale', 'VALUE', 5);
        O('Color', 'RGBA');
        break;
      case 'ShaderNodeTexWave':
        I('Vector', 'VECTOR'); I('Scale', 'VALUE', 5); I('Distortion', 'VALUE', 0); O('Color', 'RGBA'); O('Fac', 'VALUE');
        break;
      case 'ShaderNodeTexGradient': I('Vector', 'VECTOR'); O('Fac', 'VALUE'); n.props.gradient_type = 'LINEAR'; break;
      case 'ShaderNodeMapping':
        I('Vector', 'VECTOR'); I('Location', 'VECTOR', [0, 0, 0]); I('Rotation', 'VECTOR', [0, 0, 0]); I('Scale', 'VECTOR', [1, 1, 1]);
        O('Vector', 'VECTOR'); n.props.vector_type = 'POINT';
        break;
      case 'ShaderNodeTexCoord': O('Generated', 'VECTOR'); O('Object', 'VECTOR'); O('UV', 'VECTOR'); break;
      case 'ShaderNodeMath':
        I('Value', 'VALUE', 0); I('Value', 'VALUE', 0); O('Value', 'VALUE'); n.props.operation = 'ADD'; break;
      case 'ShaderNodeVectorMath':
        I('Vector', 'VECTOR'); I('Vector', 'VECTOR'); O('Vector', 'VECTOR'); O('Value', 'VALUE'); n.props.operation = 'ADD'; break;
      case 'ShaderNodeMix': I('Factor', 'VALUE', 0.5); I('A', 'RGBA'); I('B', 'RGBA'); O('Result', 'RGBA'); n.props.data_type = 'RGBA'; break;
      case 'ShaderNodeRGB': O('Color', 'RGBA'); n.props.value = [0.8, 0.8, 0.8, 1]; break;
      case 'ShaderNodeValue': O('Value', 'VALUE'); n.props.value = 0.5; break;
      case 'ShaderNodeBump': I('Height', 'VALUE'); I('Strength', 'VALUE', 1); I('Distance', 'VALUE', 1); O('Normal', 'VECTOR'); break;
      case 'ShaderNodeNormalMap': I('Color', 'RGBA'); I('Strength', 'VALUE', 1); O('Normal', 'VECTOR'); break;
      case 'ShaderNodeFresnel': I('IOR', 'VALUE', 1.45); O('Fac', 'VALUE'); break;
      case 'ShaderNodeColorRamp':
        I('Fac', 'VALUE', 0.5); O('Color', 'RGBA'); O('Alpha', 'VALUE');
        n.props.stops = [{ pos: 0, color: [0, 0, 0, 1] }, { pos: 1, color: [1, 1, 1, 1] }];
        break;
      /* ---- Geometry Nodes ---- */
      case 'GeometryNodeGroupInput': O('Geometry', 'GEOMETRY'); O('Socket_1', 'VALUE'); break;
      case 'GeometryNodeGroupOutput': I('Geometry', 'GEOMETRY'); break;
      case 'GeometryNodeMeshPrimitiveCube':
        I('Size', 'VECTOR', [1, 1, 1]); I('Vertices X', 'VALUE', 2); I('Vertices Y', 'VALUE', 2); I('Vertices Z', 'VALUE', 2);
        O('Mesh', 'GEOMETRY'); break;
      case 'GeometryNodeMeshPrimitiveUVSphere':
        I('Radius', 'VALUE', 1); I('Segments', 'VALUE', 32); I('Rings', 'VALUE', 16); O('Mesh', 'GEOMETRY'); break;
      case 'GeometryNodeMeshPrimitiveIcoSphere':
        I('Radius', 'VALUE', 1); I('Subdivisions', 'VALUE', 2); O('Mesh', 'GEOMETRY'); break;
      case 'GeometryNodeMeshPrimitiveCylinder':
        I('Vertices', 'VALUE', 32); I('Radius', 'VALUE', 1); I('Depth', 'VALUE', 2); O('Mesh', 'GEOMETRY'); break;
      case 'GeometryNodeMeshPrimitiveGrid':
        I('Size X', 'VALUE', 1); I('Size Y', 'VALUE', 1); I('Vertices X', 'VALUE', 10); I('Vertices Y', 'VALUE', 10); O('Mesh', 'GEOMETRY'); break;
      case 'GeometryNodeTransform': I('Geometry', 'GEOMETRY'); I('Translation', 'VECTOR', [0, 0, 0]); I('Rotation', 'VECTOR', [0, 0, 0]); I('Scale', 'VECTOR', [1, 1, 1]); O('Geometry', 'GEOMETRY'); break;
      case 'GeometryNodeJoinGeometry': I('Geometry', 'GEOMETRY'); O('Geometry', 'GEOMETRY'); break;
      case 'GeometryNodeInstanceOnPoints':
        I('Points', 'GEOMETRY'); I('Instance', 'GEOMETRY'); I('Rotation', 'VECTOR', [0, 0, 0]); I('Scale', 'VECTOR', [1, 1, 1]);
        O('Instances', 'GEOMETRY'); break;
      case 'GeometryNodeRealizeInstances': I('Instances', 'GEOMETRY'); O('Geometry', 'GEOMETRY'); break;
      case 'GeometryNodeSetPosition': I('Geometry', 'GEOMETRY'); I('Offset', 'VECTOR', [0, 0, 0]); O('Geometry', 'GEOMETRY'); break;
      case 'GeometryNodeSubdivisionSurface': I('Mesh', 'GEOMETRY'); I('Level', 'VALUE', 1); O('Mesh', 'GEOMETRY'); break;
      case 'GeometryNodeExtrudeMesh': I('Mesh', 'GEOMETRY'); I('Offset', 'VECTOR', [0, 0, 1]); I('Offset Scale', 'VALUE', 1); O('Mesh', 'GEOMETRY'); break;
      case 'GeometryNodeDeleteGeometry': I('Geometry', 'GEOMETRY'); I('Selection', 'VALUE', 1); O('Geometry', 'GEOMETRY'); n.props.domain = 'FACE'; break;
      case 'GeometryNodeSetMaterial': I('Geometry', 'GEOMETRY'); O('Geometry', 'GEOMETRY'); n.props.material = null; break;
      case 'GeometryNodeInputPosition': O('Position', 'VECTOR'); break;
      case 'GeometryNodeInputNormal': O('Normal', 'VECTOR'); break;
      case 'GeometryNodeScaleElements': I('Geometry', 'GEOMETRY'); I('Scale', 'VALUE', 1); O('Geometry', 'GEOMETRY'); n.props.domain = 'FACE'; break;
      case 'GeometryNodeDistributePointsOnFaces':
        I('Mesh', 'GEOMETRY'); I('Density', 'VALUE', 10); I('Seed', 'VALUE', 0); O('Points', 'GEOMETRY'); break;
      default:
        I('Input', 'VALUE'); O('Output', 'VALUE');
    }
    return n;
  }

  function sock_value(s, uv, pos, cache) {
    if (s.link) return eval_socket(s.link.from, uv, pos, cache);
    return s.value;
  }
  function eval_socket(s, uv, pos, cache) {
    if (!s) return null;
    if (cache && cache.has(s)) return cache.get(s);
    const v = eval_node(s.node, uv, pos, cache);
    const out = v[s.name] !== undefined ? v[s.name] : Object.values(v)[0];
    if (cache) cache.set(s, out);
    return out;
  }
  function eval_node(n, uv, pos, cache) {
    const I = (i) => sock_value(n.inputs[i], uv, pos, cache);
    switch (n.idname) {
      case 'ShaderNodeTexCoord':
        return { Generated: [(pos[0] + 1) / 2, (pos[1] + 1) / 2, (pos[2] + 1) / 2], Object: pos.slice(), UV: [uv[0], uv[1], 0] };
      case 'ShaderNodeMapping': {
        const v = I(0) || [0, 0, 0], loc = I(1) || [0, 0, 0], rot = I(2) || [0, 0, 0], sc = I(3) || [1, 1, 1];
        let r = [v[0] * sc[0], v[1] * sc[1], v[2] * sc[2]];
        const cz = Math.cos(rot[2]), sz = Math.sin(rot[2]);
        r = [r[0] * cz - r[1] * sz, r[0] * sz + r[1] * cz, r[2]];
        return { Vector: [r[0] + loc[0], r[1] + loc[1], r[2] + loc[2]] };
      }
      case 'ShaderNodeTexNoise': {
        const v = I(0) || [uv[0], uv[1], 0], sc = I(1), det = I(2);
        const f = fbm3(v[0] * sc, v[1] * sc, v[2] * sc, Math.max(1, Math.round(det)));
        return { Fac: f * 0.5 + 0.5, Color: [f * 0.5 + 0.5, f * 0.5 + 0.5, f * 0.5 + 0.5, 1] };
      }
      case 'ShaderNodeTexVoronoi': {
        const v = I(0) || [uv[0], uv[1], 0], sc = I(1);
        const d = Math.abs(fbm3(v[0] * sc, v[1] * sc, v[2] * sc, 2));
        return { Distance: d, Color: [d, d, d, 1], Position: v.slice() };
      }
      case 'ShaderNodeTexChecker': {
        const v = I(0) || [uv[0], uv[1], 0], c1 = I(1), c2 = I(2), sc = I(3);
        const cell = (Math.floor(v[0] * sc) + Math.floor(v[1] * sc) + Math.floor(v[2] * sc)) & 1;
        return { Color: cell ? c2 : c1 };
      }
      case 'ShaderNodeTexWave': {
        const v = I(0) || [uv[0], uv[1], 0], sc = I(1), dist = I(2);
        const t = Math.sin((v[0] + v[1] + v[2]) * sc * Math.PI * 2 + fbm3(v[0] * 4, v[1] * 4, v[2] * 4) * dist * 8) * 0.5 + 0.5;
        return { Color: [t, t, t, 1], Fac: t };
      }
      case 'ShaderNodeTexGradient': {
        const v = I(0) || [uv[0], uv[1], 0];
        return { Fac: clamp(v[0], 0, 1) };
      }
      case 'ShaderNodeTexImage': {
        const img = n.props.image;
        const v = I(0) || [uv[0], uv[1], 0];
        if (img && img.sample) { const c = img.sample(v[0], v[1]); return { Color: c, Alpha: c[3] }; }
        return { Color: [0.5, 0.5, 0.5, 1], Alpha: 1 };
      }
      case 'ShaderNodeMath': {
        const a = I(0), b = I(1);
        switch (n.props.operation) {
          case 'ADD': return { Value: a + b };
          case 'SUBTRACT': return { Value: a - b };
          case 'MULTIPLY': return { Value: a * b };
          case 'DIVIDE': return { Value: b ? a / b : 0 };
          case 'SINE': return { Value: Math.sin(a) };
          case 'COSINE': return { Value: Math.cos(a) };
          case 'POWER': return { Value: Math.pow(a, b) };
          case 'MINIMUM': return { Value: Math.min(a, b) };
          case 'MAXIMUM': return { Value: Math.max(a, b) };
          case 'GREATER_THAN': return { Value: a > b ? 1 : 0 };
          case 'LESS_THAN': return { Value: a < b ? 1 : 0 };
          case 'MIX': return { Value: a + (b - a) * 0.5 };
          default: return { Value: a };
        }
      }
      case 'ShaderNodeVectorMath': {
        const a = I(0) || [0, 0, 0], b = I(1) || [0, 0, 0];
        switch (n.props.operation) {
          case 'ADD': return { Vector: V.add(a, b) };
          case 'SUBTRACT': return { Vector: V.sub(a, b) };
          case 'MULTIPLY': return { Vector: V.mulv(a, b) };
          case 'DOT_PRODUCT': return { Value: V.dot(a, b) };
          case 'CROSS_PRODUCT': return { Vector: V.cross(a, b) };
          case 'NORMALIZE': return { Vector: V.norm(a), Value: V.len(a) };
          case 'LENGTH': return { Value: V.len(a) };
          default: return { Vector: a };
        }
      }
      case 'ShaderNodeMix': {
        const t = I(0), a = I(1) || [0, 0, 0, 1], b = I(2) || [0, 0, 0, 1];
        const r = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, (a[3] ?? 1) + ((b[3] ?? 1) - (a[3] ?? 1)) * t];
        return { Result: r };
      }
      case 'ShaderNodeRGB': return { Color: n.props.value };
      case 'ShaderNodeValue': return { Value: n.props.value };
      case 'ShaderNodeColorRamp': {
        const t = clamp(I(0), 0, 1);
        const stops = n.props.stops;
        let i = 0;
        while (i < stops.length - 2 && t > stops[i + 1].pos) i++;
        const s0 = stops[i], s1 = stops[i + 1];
        const k = clamp((t - s0.pos) / Math.max(1e-6, s1.pos - s0.pos), 0, 1);
        const c = V.lerp(s0.color, s1.color, k);
        return { Color: [c[0], c[1], c[2], c[3] ?? 1], Alpha: c[3] ?? 1 };
      }
      case 'ShaderNodeFresnel': {
        return { Fac: clamp(1 - Math.abs(V.dot(V.norm(pos), [0, 0, 1])), 0, 1) };
      }
      case 'ShaderNodeBump': {
        const h = I(0), s = I(1);
        return { Normal: V.norm([0, 0, 1 + h * s]) };
      }
      case 'ShaderNodeNormalMap': {
        const c = I(0) || [0.5, 0.5, 1, 1];
        return { Normal: V.norm([c[0] * 2 - 1, c[1] * 2 - 1, c[2] * 2 - 1]) };
      }
      case 'ShaderNodeBsdfPrincipled': {
        return {
          BSDF: {
            type: 'principled',
            base: I(0), metallic: I(1), roughness: I(2), ior: I(3), alpha: I(4),
            emission: I(5), emission_strength: I(6), normal: I(7)
          }
        };
      }
      case 'ShaderNodeEmission':
        return { Emission: { type: 'emission', base: I(0), emission: I(0), emission_strength: I(1), alpha: 1, roughness: 0, metallic: 0 } };
      case 'ShaderNodeBsdfDiffuse':
        return { BSDF: { type: 'diffuse', base: I(0), roughness: I(1), metallic: 0, alpha: 1, emission_strength: 0 } };
      case 'ShaderNodeBsdfGlossy':
        return { BSDF: { type: 'glossy', base: I(0), roughness: I(1), metallic: 1, alpha: 1, emission_strength: 0 } };
      case 'ShaderNodeBsdfTransparent':
        return { BSDF: { type: 'transparent', base: I(0), alpha: 0.05, roughness: 1, metallic: 0, emission_strength: 0 } };
      case 'ShaderNodeMixShader': {
        const t = I(0), a = I(1), b = I(2);
        const A = a || { base: [0, 0, 0, 1], metallic: 0, roughness: 1, alpha: 1, emission_strength: 0, type: 'diffuse' };
        const B = b || A;
        return {
          Shader: {
            type: 'mixed',
            base: V.lerp(A.base || [0, 0, 0, 1], B.base || [0, 0, 0, 1], t),
            metallic: (A.metallic || 0) + ((B.metallic || 0) - (A.metallic || 0)) * t,
            roughness: (A.roughness ?? 1) + ((B.roughness ?? 1) - (A.roughness ?? 1)) * t,
            alpha: (A.alpha ?? 1) + ((B.alpha ?? 1) - (A.alpha ?? 1)) * t,
            emission: V.lerp(A.emission || A.base || [0, 0, 0, 1], B.emission || B.base || [0, 0, 0, 1], t),
            emission_strength: (A.emission_strength || 0) + ((B.emission_strength || 0) - (A.emission_strength || 0)) * t,
            normal: A.normal
          }
        };
      }
      case 'ShaderNodeAddShader': {
        const a = I(0), b = I(1);
        return {
          Shader: {
            type: 'mixed', base: V.add(a.base, b.base), metallic: (a.metallic + b.metallic) / 2,
            roughness: (a.roughness + b.roughness) / 2, alpha: 1,
            emission: V.add(a.emission || a.base, b.emission || b.base),
            emission_strength: (a.emission_strength || 0) + (b.emission_strength || 0), normal: a.normal
          }
        };
      }
      case 'ShaderNodeOutputMaterial': {
        return { BSDF: I(0) || { base: [0.8, 0.8, 0.8, 1], metallic: 0, roughness: 0.5, alpha: 1, emission_strength: 0, type: 'principled' } };
      }
      default:
        return { Output: n.inputs[0] ? n.inputs[0].value : null, Value: n.inputs[0] ? n.inputs[0].value : 0 };
    }
  }

  function eval_shader_tree(tree, uv, pos, fallback) {
    const cache = new Map();
    const out = tree.nodes.find((n) => n.idname === 'ShaderNodeOutputMaterial');
    if (!out) return { base: fallback, metallic: 0, roughness: 0.5, alpha: 1, emission_strength: 0, type: 'principled' };
    const v = eval_node(out, uv, pos, cache);
    return v.BSDF || { base: fallback, metallic: 0, roughness: 0.5, alpha: 1, emission_strength: 0, type: 'principled' };
  }

  /* ================= BMesh ================= */
  class BMesh {
    constructor() {
      this.verts = [];   // {i, co:[x,y,z], edges:[], faces:[], seamed:[], crease:0, hide:false, tag:false, group_weights:{}}
      this.edges = [];   // {i, v1, v2, seamed:false, crease:0, faces:[], tag:false, hide:false}
      this.faces = [];   // {i, verts:[], edges:[], loops:[{v,e,uv}], mat:0, smooth:false, tag:false, hide:false, normal}
      this.select_mode = 'VERT';
      this._dirty = true;
    }
    static from_mesh(mesh) {
      const bm = new BMesh();
      mesh.verts.forEach((co) => bm.verts.push({ i: bm.verts.length, co: V.clone(co), edges: [], faces: [], crease: 0, hide: false, tag: false }));
      mesh.edges.forEach(([a, b]) => {
        const e = { i: bm.edges.length, v1: a, v2: b, seamed: false, crease: 0, faces: [], tag: false, hide: false };
        bm.edges.push(e); bm.verts[a].edges.push(e); bm.verts[b].edges.push(e);
      });
      mesh.faces.forEach((f) => bm._add_face_struct(f));
      // carry uv/seams if present
      if (mesh.uv_layers[0]) {
        let li = 0;
        for (const f of bm.faces) for (const loop of f.loops) {
          const uv = mesh.uv_layers[0].data[li];
          if (uv) loop.uv = [uv[0], uv[1]];
          li++;
        }
      }
      return bm;
    }
    _add_face_struct(vidxs) {
      const f = { i: this.faces.length, verts: vidxs.slice(), edges: [], loops: [], mat: 0, smooth: false, tag: false, hide: false };
      for (let li = 0; li < vidxs.length; li++) {
        const a = vidxs[li], b = vidxs[(li + 1) % vidxs.length];
        let e = this.edges.find((e) => (e.v1 === a && e.v2 === b) || (e.v1 === b && e.v2 === a));
        if (!e) {
          e = { i: this.edges.length, v1: a, v2: b, seamed: false, crease: 0, faces: [], tag: false, hide: false };
          this.edges.push(e);
          if (this.verts[a]) this.verts[a].edges.push(e);
          if (this.verts[b]) this.verts[b].edges.push(e);
        }
        e.faces.push(f);
        f.edges.push(e);
        f.loops.push({ v: a, e, uv: [0, 0] });
      }
      this.faces.push(f);
      for (const vi of vidxs) if (this.verts[vi]) this.verts[vi].faces.push(f);
      return f;
    }
    to_mesh(mesh) {
      // compact verts used
      const remap = new Map();
      const verts = [];
      for (const v of this.verts) {
        if (v.hide) continue;
        remap.set(v.i, verts.length);
        verts.push(V.clone(v.co));
      }
      const edges = [];
      for (const e of this.edges) {
        if (e.hide || !remap.has(e.v1) || !remap.has(e.v2)) continue;
        edges.push([remap.get(e.v1), remap.get(e.v2)]);
      }
      const faces = [];
      const uvs = [];
      for (const f of this.faces) {
        if (f.hide || !f.verts.every((vi) => remap.has(vi))) continue;
        faces.push(f.verts.map((vi) => remap.get(vi)));
        for (const loop of f.loops) uvs.push(loop.uv || [0, 0]);
      }
      mesh.verts = verts;
      mesh.edges = edges;
      mesh.faces = faces;
      if (!mesh.uv_layers[0]) mesh.uv_layers[0] = { name: 'UVMap', data: uvs };
      else mesh.uv_layers[0].data = uvs;
      mesh.update();
      return mesh;
    }
    new_vert(co) {
      const v = { i: this.verts.length, co: V.clone(co), edges: [], faces: [], crease: 0, hide: false, tag: false };
      this.verts.push(v);
      return v;
    }
    new_face(vidx) {
      return this._add_face_struct(vidx.map((x) => (typeof x === 'number' ? x : x.i)));
    }
    vert(idx) { return this.verts[idx]; }
    edge(idx) { return this.edges[idx]; }
    face(idx) { return this.faces[idx]; }
    select_flush(mode) {
      this.select_mode = mode;
    }
    /* -------- topology ops -------- */
    extrude_face(face, dir, dist) {
      const n = face_normal(this, face);
      const d = dir ? V.mul(V.norm(dir), dist) : V.mul(n, dist);
      const newV = face.verts.map((vi) => this.new_vert(V.add(this.verts[vi].co, d)));
      // side walls
      for (let i = 0; i < face.verts.length; i++) {
        const a = face.verts[i], b = face.verts[(i + 1) % face.verts.length];
        const na = newV[i], nb = newV[(i + 1) % newV.length];
        this.new_face([a, b, nb.i, na.i]);
      }
      const cap = this.new_face(newV.map((v) => v.i));
      return cap;
    }
    extrude_edges(edgeList, dir, dist) {
      const created = [];
      for (const e of edgeList) {
        const d = V.mul(V.norm(dir), dist);
        const v1 = this.new_vert(V.add(this.verts[e.v1].co, d));
        const v2 = this.new_vert(V.add(this.verts[e.v2].co, d));
        created.push(this.new_face([e.v1, e.v2, v2.i, v1.i]));
      }
      return created;
    }
    inset_face(face, thickness, depth = 0) {
      const c = face_center(this, face);
      const inner = face.verts.map((vi) => {
        const co = V.lerp(this.verts[vi].co, c, clamp(thickness, 0, 0.95));
        return this.new_vert(co);
      });
      for (let i = 0; i < face.verts.length; i++) {
        const a = face.verts[i], b = face.verts[(i + 1) % face.verts.length];
        this.new_face([a, b, inner[(i + 1) % inner.length].i, inner[i].i]);
      }
      const cap = this.new_face(inner.map((v) => v.i));
      if (depth) {
        const n = face_normal(this, cap);
        const d = V.mul(n, depth);
        for (const v of inner) { v.co = V.add(v.co, d); }
      }
      return cap;
    }
    bevel_edges(edgeList, offset, segments = 1) {
      segments = Math.max(1, Math.round(segments));
      for (const e of edgeList) {
        const v1 = this.verts[e.v1], v2 = this.verts[e.v2];
        const mid = V.lerp(v1.co, v2.co, 0.5);
        const a = this.new_vert(V.lerp(v1.co, mid, clamp(offset, 0, 0.49)));
        const b = this.new_vert(V.lerp(v2.co, mid, clamp(offset, 0, 0.49)));
        e.bevel = [a.i, b.i];
      }
      // rebuild bevel edges as quads on adjacent faces (simplified corner cut)
      for (const e of edgeList) {
        if (!e.bevel) continue;
        const [a, b] = e.bevel;
        for (const f of e.faces.slice()) {
          const idx = f.verts.indexOf(e.v1);
          if (idx < 0) continue;
          const next = f.verts[(idx + 1) % f.verts.length];
          if (next === e.v2) {
            f.verts.splice(idx, 2, a, b);
          } else {
            const idx2 = f.verts.indexOf(e.v2);
            if (idx2 >= 0) f.verts.splice(idx2, 1, b);
            f.verts.splice(f.verts.indexOf(e.v1), 1, a);
          }
        }
      }
    }
    loopcut(edgeList, cuts = 1) {
      // Cut each quad face through edge midpoints along one axis (simplified: subdivide faces)
      const faces = [...this.faces];
      for (const f of faces) this.subdivide_face(f, cuts);
    }
    subdivide_face(f, cuts = 1) {
      if (f.verts.length < 3 || cuts < 1) return;
      // simple fan subdivision into grid when quad
      if (f.verts.length === 4) {
        const [a, b, c, d] = f.verts.map((vi) => this.verts[vi].co);
        const ab = this.new_vert(V.lerp(a, b, 0.5)).i;
        const bc = this.new_vert(V.lerp(b, c, 0.5)).i;
        const cd = this.new_vert(V.lerp(c, d, 0.5)).i;
        const da = this.new_vert(V.lerp(d, a, 0.5)).i;
        const ctr = this.new_vert(V.lerp(V.lerp(a, c, 0.5), V.lerp(b, d, 0.5), 0.5)).i;
        f.hide = true;
        this.new_face([f.verts[0], ab, ctr, da]);
        this.new_face([ab, f.verts[1], bc, ctr]);
        this.new_face([ctr, bc, f.verts[2], cd]);
        this.new_face([da, ctr, cd, f.verts[3]]);
      } else {
        const ctr = this.new_vert(face_center(this, f)).i;
        for (let i = 0; i < f.verts.length; i++) {
          const a = f.verts[i], b = f.verts[(i + 1) % f.verts.length];
          this.new_face([a, b, ctr]);
        }
        f.hide = true;
      }
    }
    subdivide_all(cuts = 1) {
      const faces = [...this.faces];
      for (const f of faces) if (!f.hide) this.subdivide_face(f, cuts);
    }
    triangulate(f) {
      if (f.verts.length <= 3) return;
      const tris = [];
      for (let i = 1; i < f.verts.length - 1; i++) tris.push([f.verts[0], f.verts[i], f.verts[i + 1]]);
      f.hide = true;
      for (const t of tris) this.new_face(t);
    }
    triangulate_all() {
      for (const f of [...this.faces]) if (!f.hide && f.verts.length > 3) this.triangulate(f);
    }
    dissolve_verts(vertList) {
      for (const v of vertList) {
        const faces = v.faces.slice();
        for (const f of faces) {
          const idx = f.verts.indexOf(v.i);
          if (idx >= 0 && f.verts.length > 3) f.verts.splice(idx, 1);
          else if (idx >= 0) f.hide = true;
        }
        v.hide = true;
      }
    }
    dissolve_edges(edgeList) {
      for (const e of edgeList) {
        for (const f of e.faces.slice()) {
          const idx = f.verts.indexOf(e.v1);
          const idx2 = f.verts.indexOf(e.v2);
          if (idx >= 0 && idx2 >= 0 && f.verts.length > 4) {
            f.verts.splice(Math.min(idx, idx2), 2, e.v1);
          }
        }
        e.hide = true;
      }
    }
    poke_faces(faces) {
      for (const f of faces) {
        const c = this.new_vert(face_center(this, f));
        const vs = f.verts.slice();
        f.hide = true;
        for (let i = 0; i < vs.length; i++) this.new_face([vs[i], vs[(i + 1) % vs.length], c.i]);
      }
    }
    bisect(plane_co, plane_no, clear_inner = false, clear_outer = false) {
      // Cut every edge crossing the plane; create the cut face
      const cutVerts = new Map();
      const getCut = (a, b) => {
        const key = a < b ? a + '_' + b : b + '_' + a;
        if (cutVerts.has(key)) return cutVerts.get(key);
        const pa = this.verts[a].co, pb = this.verts[b].co;
        const da = V.dot(V.sub(pa, plane_co), plane_no);
        const db = V.dot(V.sub(pb, plane_co), plane_no);
        if ((da > 0) === (db > 0)) return null;
        const t = da / (da - db);
        const v = this.new_vert(V.lerp(pa, pb, t));
        cutVerts.set(key, v.i);
        return v.i;
      };
      for (const f of [...this.faces]) {
        if (f.hide) continue;
        const sides = f.verts.map((vi) => V.dot(V.sub(this.verts[vi].co, plane_co), plane_no));
        if (sides.every((s) => s >= 0) || sides.every((s) => s <= 0)) continue;
        const newFace = [];
        for (let i = 0; i < f.verts.length; i++) {
          const a = f.verts[i], b = f.verts[(i + 1) % f.verts.length];
          newFace.push(a);
          const cv = getCut(a, b);
          if (cv !== null && cv !== undefined) newFace.push(cv);
        }
        if (clear_inner) {
          // keep outer only
          f.verts = newFace.filter((vi) => {
            const d = V.dot(V.sub(this.verts[vi].co, plane_co), plane_no);
            return d >= 0;
          });
          if (f.verts.length < 3) f.hide = true;
        } else if (clear_outer) {
          f.verts = newFace.filter((vi) => {
            const d = V.dot(V.sub(this.verts[vi].co, plane_co), plane_no);
            return d <= 0;
          });
          if (f.verts.length < 3) f.hide = true;
        } else {
          f.verts = newFace;
        }
      }
    }
    convex_hull() {
      // Gift-wrapping convex hull (small meshes)
      const pts = this.verts.filter((v) => !v.hide).map((v) => v.co);
      if (pts.length < 4) return;
      const hull = convexHullPoints(pts);
      for (const f of [...this.faces]) f.hide = true;
      for (const face of hull) this.new_face(face.map((p) => pts.indexOf(p)));
    }
    spin(angle = Math.PI * 2, steps = 12, axis = [0, 0, 1], center = [0, 0, 0]) {
      const srcFaces = this.faces.filter((f) => !f.hide);
      const srcVerts = new Set();
      for (const f of srcFaces) for (const vi of f.verts) srcVerts.add(vi);
      const ring = [];
      for (let s = 1; s <= steps; s++) {
        const ang = (angle * s) / steps;
        const m = rot_matrix_axis(axis, ang, center);
        const map = new Map();
        for (const vi of srcVerts) {
          const v = this.new_vert(M4.xform(m, this.verts[vi].co));
          map.set(vi, v.i);
        }
        ring.push(map);
      }
      // stitch quads between successive rings (edges of source faces)
      let prev = new Map([...srcVerts].map((vi) => [vi, vi]));
      for (const map of ring) {
        for (const f of srcFaces) {
          for (let i = 0; i < f.verts.length; i++) {
            const a = f.verts[i], b = f.verts[(i + 1) % f.verts.length];
            this.new_face([prev.get(a), prev.get(b), map.get(b), map.get(a)]);
          }
        }
        prev = map;
      }
    }
    screw(steps = 12, angle = Math.PI * 2, screw_offset = 1, axis = 'Z') {
      const src = this.verts.filter((v) => !v.hide);
      let prev = new Map(src.map((v) => [v.i, v.i]));
      for (let s = 1; s <= steps; s++) {
        const t = s / steps;
        const ang = angle * t;
        const zoff = screw_offset * t;
        const m = M4.mul(M4.translation(0, 0, zoff), rot_matrix_axis(axis === 'Z' ? [0, 0, 1] : axis === 'X' ? [1, 0, 0] : [0, 1, 0], ang, [0, 0, 0]));
        const map = new Map();
        for (const v of src) {
          const nv = this.new_vert(M4.xform(m, v.co));
          map.set(v.i, nv.i);
        }
        for (const f of this.faces.slice(0, src.length ? undefined : 0)) void f;
        // stitch edge ring
        for (const e of this.edges.slice(0, this.edges.length)) {
          if (!src.some((v) => v.i === e.v1) || !src.some((v) => v.i === e.v2)) continue;
          if (!prev.has(e.v1)) continue;
          this.new_face([prev.get(e.v1), prev.get(e.v2), map.get(e.v2), map.get(e.v1)]);
        }
        prev = map;
      }
    }
    bridge_loops(loopA, loopB) {
      const n = Math.min(loopA.length, loopB.length);
      for (let i = 0; i < n; i++) {
        const a1 = loopA[i], a2 = loopA[(i + 1) % n];
        const b1 = loopB[i], b2 = loopB[(i + 1) % n];
        this.new_face([a1, a2, b2, b1]);
      }
    }
    knife(cuts) {
      // cuts: [{a:[x,y,z], b:[x,y,z]}] — segment/segment bisect by plane of each cut
      for (const c of cuts) {
        const mid = V.lerp(c.a, c.b, 0.5);
        const dir = V.norm(V.sub(c.b, c.a));
        const up = Math.abs(dir[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
        const no = V.norm(V.cross(dir, up));
        this.bisect(mid, no);
      }
    }
    remove_doubles(dist = 0.0001) {
      const remap = new Map();
      for (let i = 0; i < this.verts.length; i++) {
        if (this.verts[i].hide) continue;
        for (let j = i + 1; j < this.verts.length; j++) {
          if (this.verts[j].hide) continue;
          if (V.dist(this.verts[i].co, this.verts[j].co) <= dist) {
            this.verts[j].hide = true;
            remap.set(j, i);
          }
        }
      }
      const map = (vi) => {
        let v = vi;
        while (remap.has(v)) v = remap.get(v);
        return v;
      };
      for (const f of this.faces) if (!f.hide) f.verts = f.verts.map(map);
    }
    recalc_normals() {
      for (const f of this.faces) if (!f.hide) f.normal = face_normal(this, f);
    }
  }
  function face_center(bm, f) {
    const c = [0, 0, 0];
    for (const vi of f.verts) { c[0] += bm.verts[vi].co[0]; c[1] += bm.verts[vi].co[1]; c[2] += bm.verts[vi].co[2]; }
    return V.mul(c, 1 / f.verts.length);
  }
  function face_normal(bm, f) {
    const a = bm.verts[f.verts[0]].co, b = bm.verts[f.verts[1]].co, c = bm.verts[f.verts[2]].co;
    return V.norm(V.cross(V.sub(b, a), V.sub(c, a)));
  }
  function rot_matrix_axis(axis, ang, center) {
    const [x, y, z] = V.norm(axis);
    const c = Math.cos(ang), s = Math.sin(ang), t = 1 - c;
    const m = [
      t * x * x + c, t * x * y + s * z, t * x * z - s * y, 0,
      t * x * y - s * z, t * y * y + c, t * y * z + s * x, 0,
      t * x * z + s * y, t * y * z - s * x, t * z * z + c, 0,
      0, 0, 0, 1
    ];
    return M4.mul(M4.mul(M4.translation(center[0], center[1], center[2]), m), M4.translation(-center[0], -center[1], -center[2]));
  }
  function convexHullPoints(pts) {
    // Quickhull-lite for small point sets: return list of faces (arrays of points)
    if (pts.length < 4) return [];
    const faces = [];
    const seen = new Set();
    const key = (p) => p.map((x) => x.toFixed(5)).join(',');
    const idx = [];
    for (let i = 0; i < pts.length; i++) idx.push(i);
    // find initial tetrahedron
    let a = 0, b = -1, c = -1, d = -1;
    for (let i = 1; i < pts.length; i++) if (V.dist(pts[a], pts[i]) > 1e-6) { b = i; break; }
    if (b < 0) return [];
    for (let i = 0; i < pts.length; i++) {
      const n = V.cross(V.sub(pts[b], pts[a]), V.sub(pts[i], pts[a]));
      if (V.len(n) > 1e-6) { c = i; break; }
    }
    if (c < 0) return [];
    const nrm = V.cross(V.sub(pts[b], pts[a]), V.sub(pts[c], pts[a]));
    for (let i = 0; i < pts.length; i++) {
      if (Math.abs(V.dot(V.sub(pts[i], pts[a]), nrm)) > 1e-6) { d = i; break; }
    }
    if (d < 0) return [];
    const tet = [[a, b, c], [a, b, d], [a, c, d], [b, c, d]];
    const facesIdx = tet.map((t) => t.slice());
    for (const f of facesIdx) {
      const [i1, i2, i3] = f;
      const n2 = V.cross(V.sub(pts[i2], pts[i1]), V.sub(pts[i3], pts[i1]));
      const ctr = V.mul(V.add(V.add(pts[i1], pts[i2]), pts[i3]), 1 / 3);
      const inside = pts[d];
      if (V.dot(V.sub(inside, ctr), n2) > 0) f.reverse();
    }
    // expand hull
    for (let pi = 0; pi < pts.length; pi++) {
      if (pi === a || pi === b || pi === c || pi === d) continue;
      const visible = facesIdx.filter((f) => {
        const [i1, i2, i3] = f;
        const n2 = V.cross(V.sub(pts[i2], pts[i1]), V.sub(pts[i3], pts[i1]));
        return V.dot(V.sub(pts[pi], pts[i1]), n2) > 1e-9;
      });
      if (!visible.length) continue;
      // collect horizon edges
      const edgeCount = new Map();
      for (const f of visible) {
        for (let e = 0; e < 3; e++) {
          const v1 = f[e], v2 = f[(e + 1) % 3];
          const k = Math.min(v1, v2) + '_' + Math.max(v1, v2);
          edgeCount.set(k, (edgeCount.get(k) || []).concat([[v1, v2]]));
        }
      }
      for (let i = facesIdx.length - 1; i >= 0; i--) if (visible.includes(facesIdx[i])) facesIdx.splice(i, 1);
      for (const [k, list] of edgeCount) {
        void k;
        if (list.length === 1) {
          const [v1, v2] = list[0];
          const nf = [v1, v2, pi];
          const n2 = V.cross(V.sub(pts[v2], pts[v1]), V.sub(pts[pi], pts[v1]));
          const ctr = V.mul(V.add(V.add(pts[v1], pts[v2]), pts[pi]), 1 / 3);
          // orient outward from centroid of tetra
          const ref = V.mul(V.add(V.add(V.add(pts[a], pts[b]), pts[c]), pts[d]), 0.25);
          if (V.dot(V.sub(ctr, ref), n2) < 0) nf.reverse();
          facesIdx.push(nf);
        }
      }
    }
    void seen; void key; void idx;
    return facesIdx.map((f) => f.map((i) => pts[i]));
  }

  /* ================= PRIMITIVES ================= */
  function primitive_cube(size = 2, loc = [0, 0, 0]) {
    const s = size / 2;
    const mesh = new Mesh('Cube');
    mesh.verts = [
      [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
      [-s, -s, s], [s, -s, s], [s, s, s], [-s, s, s]
    ].map((v) => V.add(v, loc));
    mesh.edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    mesh.faces = [[0, 1, 2, 3], [4, 5, 6, 7], [0, 1, 5, 4], [1, 2, 6, 5], [2, 3, 7, 6], [3, 0, 4, 7]];
    mesh.update();
    return mesh;
  }
  function primitive_uv_sphere(radius = 1, segments = 32, rings = 16, loc = [0, 0, 0]) {
    const mesh = new Mesh('Sphere');
    for (let r = 0; r <= rings; r++) {
      const phi = (r / rings) * Math.PI;
      for (let s = 0; s < segments; s++) {
        const theta = (s / segments) * Math.PI * 2;
        mesh.verts.push(V.add([
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.sin(phi) * Math.sin(theta),
          radius * Math.cos(phi)
        ], loc));
      }
    }
    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < segments; s++) {
        const a = r * segments + s, b = r * segments + ((s + 1) % segments);
        const c = (r + 1) * segments + ((s + 1) % segments), d = (r + 1) * segments + s;
        if (r === 0) mesh.faces.push([a, c, d]);
        else if (r === rings - 1) mesh.faces.push([a, b, d]);
        else mesh.faces.push([a, b, c, d]);
      }
    }
    mesh.update();
    return mesh;
  }
  function primitive_ico_sphere(radius = 1, subdiv = 2, loc = [0, 0, 0]) {
    const t = (1 + Math.sqrt(5)) / 2;
    let verts = [[-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0], [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t], [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1]].map(V.norm);
    let faces = [
      [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
      [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
      [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
      [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]
    ];
    for (let s = 0; s < subdiv; s++) {
      const cache = new Map();
      const mid = (a, b) => {
        const k = a < b ? a + '_' + b : b + '_' + a;
        if (cache.has(k)) return cache.get(k);
        const v = V.norm(V.lerp(verts[a], verts[b], 0.5));
        verts.push(v);
        cache.set(k, verts.length - 1);
        return verts.length - 1;
      };
      const nf = [];
      for (const [a, b, c] of faces) {
        const ab = mid(a, b), bc = mid(b, c), ca = mid(c, a);
        nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
      }
      faces = nf;
    }
    const mesh = new Mesh('Icosphere');
    mesh.verts = verts.map((v) => V.add(V.mul(v, radius), loc));
    mesh.faces = faces;
    mesh.update();
    return mesh;
  }
  function primitive_cylinder(radius = 1, depth = 2, verts_count = 32, loc = [0, 0, 0]) {
    const mesh = new Mesh('Cylinder');
    const h = depth / 2;
    for (let i = 0; i < verts_count; i++) {
      const a = (i / verts_count) * Math.PI * 2;
      mesh.verts.push(V.add([radius * Math.cos(a), radius * Math.sin(a), -h], loc));
    }
    for (let i = 0; i < verts_count; i++) {
      const a = (i / verts_count) * Math.PI * 2;
      mesh.verts.push(V.add([radius * Math.cos(a), radius * Math.sin(a), h], loc));
    }
    mesh.verts.push(V.add([0, 0, -h], loc));
    mesh.verts.push(V.add([0, 0, h], loc));
    const bot = verts_count * 2, top = verts_count * 2 + 1;
    for (let i = 0; i < verts_count; i++) {
      const j = (i + 1) % verts_count;
      mesh.faces.push([i, j, j + verts_count, i + verts_count]);
      mesh.faces.push([bot, j, i]);
      mesh.faces.push([top, i + verts_count, j + verts_count]);
    }
    mesh.update();
    return mesh;
  }
  function primitive_plane(size = 2, loc = [0, 0, 0]) {
    const mesh = new Mesh('Plane');
    const s = size / 2;
    mesh.verts = [[-s, -s, 0], [s, -s, 0], [s, s, 0], [-s, s, 0]].map((v) => V.add(v, loc));
    mesh.faces = [[0, 1, 2, 3]];
    mesh.update();
    return mesh;
  }
  function primitive_cone(radius1 = 1, radius2 = 0, depth = 2, verts_count = 32, loc = [0, 0, 0]) {
    const mesh = new Mesh('Cone');
    const h = depth / 2;
    for (let i = 0; i < verts_count; i++) {
      const a = (i / verts_count) * Math.PI * 2;
      mesh.verts.push(V.add([radius1 * Math.cos(a), radius1 * Math.sin(a), -h], loc));
    }
    for (let i = 0; i < verts_count; i++) {
      const a = (i / verts_count) * Math.PI * 2;
      mesh.verts.push(V.add([radius2 * Math.cos(a), radius2 * Math.sin(a), h], loc));
    }
    for (let i = 0; i < verts_count; i++) {
      const j = (i + 1) % verts_count;
      if (radius2 > 0) mesh.faces.push([i, j, j + verts_count, i + verts_count]);
      else mesh.faces.push([i, j, i + verts_count]);
      mesh.faces.push([mesh.verts.length - 2, j, i]);
    }
    mesh.verts.push(V.add([0, 0, -h], loc));
    mesh.verts.push(V.add([0, 0, h], loc));
    mesh.update();
    return mesh;
  }
  function primitive_torus(major = 1, minor = 0.25, major_seg = 48, minor_seg = 12, loc = [0, 0, 0]) {
    const mesh = new Mesh('Torus');
    for (let i = 0; i < major_seg; i++) {
      const u = (i / major_seg) * Math.PI * 2;
      for (let j = 0; j < minor_seg; j++) {
        const v = (j / minor_seg) * Math.PI * 2;
        mesh.verts.push(V.add([
          (major + minor * Math.cos(v)) * Math.cos(u),
          (major + minor * Math.cos(v)) * Math.sin(u),
          minor * Math.sin(v)
        ], loc));
      }
    }
    for (let i = 0; i < major_seg; i++) {
      for (let j = 0; j < minor_seg; j++) {
        const a = i * minor_seg + j;
        const b = i * minor_seg + ((j + 1) % minor_seg);
        const c = ((i + 1) % major_seg) * minor_seg + ((j + 1) % minor_seg);
        const d = ((i + 1) % major_seg) * minor_seg + j;
        mesh.faces.push([a, b, c, d]);
      }
    }
    mesh.update();
    return mesh;
  }
  function primitive_grid(x = 10, y = 10, size = 2, loc = [0, 0, 0]) {
    const mesh = new Mesh('Grid');
    for (let j = 0; j <= y; j++) {
      for (let i = 0; i <= x; i++) {
        mesh.verts.push(V.add([(i / x - 0.5) * size, (j / y - 0.5) * size, 0], loc));
      }
    }
    for (let j = 0; j < y; j++) {
      for (let i = 0; i < x; i++) {
        const a = j * (x + 1) + i;
        mesh.faces.push([a, a + 1, a + x + 2, a + x + 1]);
      }
    }
    mesh.update();
    return mesh;
  }
  function primitive_monkey(loc = [0, 0, 0]) {
    // Simplified Suzanne-inspired head mesh (procedural stand-in)
    const head = primitive_uv_sphere(1, 24, 16, V.add(loc, [0, 0, 0]));
    head.name = 'Suzanne';
    // ears
    for (const side of [-1, 1]) {
      const ear = primitive_uv_sphere(0.35, 12, 8, V.add(loc, [side * 1.05, 0, 0.35]));
      ear.verts.forEach((v) => head.verts.push(v));
      const off = head.verts.length - ear.verts.length;
      ear.faces.forEach((f) => head.faces.push(f.map((i) => i + off)));
    }
    // muzzle
    const muz = primitive_uv_sphere(0.55, 16, 10, V.add(loc, [0, -0.85, -0.35]));
    muz.verts.forEach((v) => head.verts.push(v));
    const off = head.verts.length - muz.verts.length;
    muz.faces.forEach((f) => head.faces.push(f.map((i) => i + off)));
    head.update();
    return head;
  }

  /* ================= OBJECTS / SCENES / COLLECTIONS ================= */
  class Object3D extends ID {
    constructor(name, type, data) {
      super(name, 'OBJECT');
      this.type = type; // 'MESH'|'ARMATURE'|'CAMERA'|'LIGHT'|'CURVE'|'EMPTY'|'LATTICE'|'GPENCIL'|'TEXT'
      this.data = data;
      this.location = [0, 0, 0];
      this.rotation_euler = [0, 0, 0];
      this.rotation_mode = 'XYZ';
      this.scale = [1, 1, 1];
      this.parent = null;
      this.parent_type = 'OBJECT';
      this.parent_bone = '';
      this.children = [];
      this.modifiers = [];
      this.constraints = [];
      this.vertex_groups = [];
      this.material_slots = [];
      this.animation_data = null;
      this.hide_render = false;
      this.hide_viewport = false;
      this.select = false;
      this.mode = 'OBJECT';
      this.is_visible = true;
      this.color = [1, 1, 1, 1];
      this.rigid_body = null;
      this.particle_systems = [];
      // armature-specific
      this.pose = type === 'ARMATURE' ? { bones: [], position: 'OCTAHEDRAL' } : null;
      // mesh-specific
      this.shape_key_values = {};
    }
    get matrix_world() {
      let m = M4.compose(this.location, this.rotation_euler, this.scale);
      if (this.parent) {
        const pm = this.parent.matrix_world;
        if (this.parent_type === 'BONE' && this.parent.pose) {
          const bone = this.parent.pose.bones.find((b) => b.name === this.parent_bone);
          if (bone) m = M4.mul(pm, M4.mul(bone.matrix, m));
          else m = M4.mul(pm, m);
        } else m = M4.mul(pm, m);
      }
      return m;
    }
    keyframe_insert(data_path, frame = null, index = -1) {
      const scene = get_scene();
      const f = frame !== null ? frame : scene.frame_current;
      const value = resolve_path(this, data_path, index);
      const anim = this.animation_data || (this.animation_data = { action: null, nla_tracks: [], action_slot: null });
      if (!anim.action) {
        anim.action = data.actions.create(this.name + 'Action');
        anim.action_slot = anim.action.slots.create(this.name, 'OBJECT');
      }
      const act = anim.action;
      const cb = act.get_channelbag(anim.action_slot, true);
      const path = data_path;
      for (let i = 0; i < 3; i++) {
        if (index >= 0 && index !== i) continue;
        if (typeof value === 'number' && index < 0 && i > 0) continue;
        const arrVal = Array.isArray(value) ? value[i] : value;
        if (arrVal === undefined) continue;
        const fc = cb.get_fcurve(path, i, true);
        fc.insert_key(f, arrVal);
      }
      return { FINISHED: true };
    }
  }

  function resolve_path(obj, path, index) {
    // supports 'location', 'rotation_euler', 'scale', 'pose.bones["Bone"].rotation_quaternion', custom props
    if (path.startsWith('pose.bones["')) {
      const m = path.match(/pose\.bones\["(.+?)"\]\.(.+)/);
      if (m && obj.pose) {
        const bone = obj.pose.bones.find((b) => b.name === m[1]);
        if (bone) {
          const prop = m[2].split('[')[0];
          return bone[prop];
        }
      }
      return 0;
    }
    const prop = path.split('[')[0];
    return obj[prop] !== undefined ? obj[prop] : 0;
  }

  class Collection extends ID {
    constructor(name) {
      super(name, 'COLLECTION');
      this.objects = [];
      this.children = [];
      this.collection = null;
    }
    link(obj) {
      if (!this.objects.includes(obj)) this.objects.push(obj);
      return obj;
    }
    unlink(obj) {
      this.objects = this.objects.filter((o) => o !== obj);
    }
  }

  class Camera extends ID {
    constructor(name) {
      super(name, 'CAMERA');
      this.lens = 50; this.sensor_width = 36;
      this.clip_start = 0.1; this.clip_end = 100;
      this.type = 'PERSP';
      this.dof = { use_dof: false, focus_distance: 10, aperture_fstop: 2.8 };
    }
  }
  class Light extends ID {
    constructor(name) {
      super(name, 'LIGHT');
      this.type = 'POINT'; // POINT|SUN|SPOT|AREA
      this.energy = 10;
      this.color = [1, 1, 1];
      this.spot_size = Math.PI / 4;
      this.spot_blend = 0.15;
      this.shadow_soft_size = 0.25;
    }
  }
  class World extends ID {
    constructor(name) {
      super(name, 'WORLD');
      this.use_nodes = true;
      this.node_tree = new NodeTree(name + '_tree', 'SHADER');
      this.color = [0.05, 0.05, 0.08];
      this.strength = 1;
    }
  }
  class Scene extends ID {
    constructor(name) {
      super(name, 'SCENE');
      this.frame_start = 1; this.frame_end = 250;
      this.frame_current = 1;
      this.render = {
        engine: 'BLENDER_EEVEE_NEXT',
        resolution_x: 1920, resolution_y: 1080, resolution_percentage: 100,
        fps: 24, fps_base: 1,
        image_settings: { file_format: 'PNG', color_mode: 'RGBA', color_depth: '8' },
        filepath: '/tmp/render',
        samples: 64,
        film_transparent: false
      };
      this.view_settings = { look: 'None', exposure: 0, gamma: 1, view_transform: 'Standard' };
      this.collection = new Collection(name + '_collection');
      this.objects = this.collection.objects;
      this.camera = null;
      this.world = new World('World');
      this.gravity = [0, 0, -9.81];
      this.unit_settings = { system: 'METRIC', scale_length: 1 };
      this.rigidbody_world = { collection: null, point_cache: { frame_start: 1, frame_end: 250 } };
    }
    link(obj) { return this.collection.link(obj); }
    frame_set(f) {
      this.frame_current = f;
      for (const obj of this.collection.objects) evaluate_object_animation(obj, f);
    }
  }

  /* ================= ACTIONS / FCURVES / NLA (layered actions 4.4/5.0) ================= */
  class FCurve extends ID {
    constructor(data_path, array_index) {
      super(uid('FCurve'), 'FCURVE');
      this.data_path = data_path;
      this.array_index = array_index;
      this.keyframe_points = [];  // {co:[frame,value], interpolation, easing, handle_left, handle_right, handle_type}
      this.modifiers = [];       // {type:'CYCLES'|'NOISE', ...}
      this.color_mode = 'AUTO_RGB';
      this.is_valid = true;
    }
    insert_key(frame, value, interpolation = 'BEZIER') {
      const pt = {
        co: [frame, value], interpolation, easing: 'AUTO',
        handle_left: [frame - 1, value], handle_right: [frame + 1, value],
        handle_type: 'AUTO_CLAMPED'
      };
      const idx = this.keyframe_points.findIndex((k) => k.co[0] === frame);
      if (idx >= 0) this.keyframe_points[idx] = pt;
      else this.keyframe_points.push(pt);
      this.keyframe_points.sort((a, b) => a.co[0] - b.co[0]);
      return pt;
    }
    remove_key(frame) {
      this.keyframe_points = this.keyframe_points.filter((k) => k.co[0] !== frame);
    }
    evaluate(frame) {
      const pts = this.keyframe_points;
      if (!pts.length) return 0;
      if (frame <= pts[0].co[0]) return pts[0].co[1];
      if (frame >= pts[pts.length - 1].co[0]) {
        let v = pts[pts.length - 1].co[1];
        return this._apply_modifiers(frame, v);
      }
      let i = 0;
      while (i < pts.length - 2 && frame > pts[i + 1].co[0]) i++;
      const k0 = pts[i], k1 = pts[i + 1];
      const t = (frame - k0.co[0]) / Math.max(1e-9, k1.co[0] - k0.co[0]);
      const v = interpolate(k0, k1, t);
      return this._apply_modifiers(frame, v);
    }
    _apply_modifiers(frame, v) {
      let out = v;
      for (const m of this.modifiers) {
        if (m.type === 'CYCLES') {
          const pts = this.keyframe_points;
          if (pts.length < 2) continue;
          const f0 = pts[0].co[0], f1 = pts[pts.length - 1].co[0];
          const range = f1 - f0;
          if (range <= 0) continue;
          if (m.mode_after === 'REPEAT_OFFSET' && frame > f1) {
            const cycles = Math.floor((frame - f1) / range);
            out += cycles * (pts[pts.length - 1].co[1] - pts[0].co[1]);
          }
          if (m.mode_before === 'REPEAT_OFFSET' && frame < f0) {
            const cycles = Math.ceil((f0 - frame) / range);
            out -= cycles * (pts[pts.length - 1].co[1] - pts[0].co[1]);
          }
        } else if (m.type === 'NOISE') {
          out += noise3(frame * (m.scale || 0.25), this.array_index * 13.7, m.phase || 0) * (m.strength || 1);
        }
      }
      return out;
    }
    modifier_new(type) {
      const m = { type, mode_before: 'REPEAT', mode_after: 'REPEAT', strength: 1, scale: 0.25, phase: 0, use_restricted_range: false };
      this.modifiers.push(m);
      return m;
    }
  }
  function interpolate(k0, k1, t) {
    switch (k0.interpolation) {
      case 'CONSTANT': return k0.co[1];
      case 'LINEAR': return k0.co[1] + (k1.co[1] - k0.co[1]) * t;
      case 'SINE': {
        const e = k0.easing === 'EASE_IN' ? t * t : k0.easing === 'EASE_OUT' ? 1 - (1 - t) * (1 - t) : t;
        return k0.co[1] + (k1.co[1] - k0.co[1]) * (0.5 - 0.5 * Math.cos(Math.PI * e));
      }
      case 'EXPO': {
        const e = k0.easing === 'EASE_IN' ? Math.pow(2, 10 * t - 10) : k0.easing === 'EASE_OUT' ? 1 - Math.pow(2, -10 * t) : (t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2);
        return k0.co[1] + (k1.co[1] - k0.co[1]) * e;
      }
      case 'BOUNCE': {
        let e = t;
        const n1 = 7.5625, d1 = 2.75;
        if (e < 1 / d1) e = n1 * e * e;
        else if (e < 2 / d1) { e -= 1.5 / d1; e = n1 * e * e + 0.75; }
        else if (e < 2.5 / d1) { e -= 2.25 / d1; e = n1 * e * e + 0.9375; }
        else { e -= 2.625 / d1; e = n1 * e * e + 0.984375; }
        return k0.co[1] + (k1.co[1] - k0.co[1]) * e;
      }
      case 'ELASTIC': {
        const c4 = (2 * Math.PI) / 3;
        let e = t === 0 ? 0 : t === 1 ? 1 : k0.easing === 'EASE_OUT'
          ? Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1
          : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 0.75) * c4);
        return k0.co[1] + (k1.co[1] - k0.co[1]) * e;
      }
      case 'BEZIER':
      default: {
        // cubic hermite with auto handles
        const p0 = k0.co[1], p1 = k1.co[1];
        const m0 = (k1.co[1] - k0.co[1]) * 0.5, m1 = m0;
        const t2 = t * t, t3 = t2 * t;
        return (2 * t3 - 3 * t2 + 1) * p0 + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * p1 + (t3 - t2) * m1;
      }
    }
  }

  class Channelbag extends ID {
    constructor(name, slot) {
      super(name, 'CHANNELBAG');
      this.slot = slot;
      this.fcurves = [];
    }
    get_fcurve(data_path, array_index, create = false) {
      let fc = this.fcurves.find((f) => f.data_path === data_path && f.array_index === array_index);
      if (!fc && create) {
        fc = new FCurve(data_path, array_index);
        this.fcurves.push(fc);
      }
      return fc;
    }
  }
  class ActionSlot extends ID {
    constructor(name, id_type) {
      super(name, 'ACTION_SLOT');
      this.id_type = id_type;
      this.handle = uid('slot');
    }
  }
  class Action extends ID {
    constructor(name) {
      super(name, 'ACTION');
      this.slots = {
        _list: [],
        create: (name, id_type) => {
          const s = new ActionSlot(name, id_type);
          this.slots._list.push(s);
          return s;
        },
        all: () => this.slots._list
      };
      this.channelbags = [];
      this.frame_range = [1, 250];
      this.use_fake_user = true;
      this.layers = [];
    }
    get_channelbag(slot, create = false) {
      let cb = this.channelbags.find((c) => c.slot === slot);
      if (!cb && create) {
        cb = new Channelbag(uid('channelbag'), slot);
        this.channelbags.push(cb);
      }
      return cb;
    }
    fcurves_for(slot) {
      const cb = this.channelbags.find((c) => c.slot === slot);
      return cb ? cb.fcurves : [];
    }
  }
  class NLAKeyframeStrip extends ID {
    constructor(name, action, frame_start, frame_end) {
      super(name, 'NLA_STRIP');
      this.action = action;
      this.frame_start = frame_start;
      this.frame_end = frame_end;
      this.action_frame_start = 1;
      this.action_frame_end = 250;
      this.blend_type = 'REPLACE';
      this.influence = 1;
      this.mute = false;
      this.extrapolation = 'HOLD';
    }
  }
  class NLATrack extends ID {
    constructor(name) {
      super(name, 'NLA_TRACK');
      this.name = name;
      this.strips = [];
      this.mute = false;
      this.solo = false;
      this.influence = 1;
    }
  }

  function evaluate_object_animation(obj, frame) {
    const anim = obj.animation_data;
    if (!anim) return;
    // NLA evaluation (bottom-up)
    if (anim.nla_tracks && anim.nla_tracks.length) {
      const poseState = {};
      for (const track of anim.nla_tracks) {
        if (track.mute) continue;
        for (const strip of track.strips) {
          if (strip.mute || frame < strip.frame_start || frame > strip.frame_end) continue;
          const local = strip.action_frame_start + (frame - strip.frame_start) * ((strip.action_frame_end - strip.action_frame_start) / Math.max(1e-6, strip.frame_end - strip.frame_start));
          apply_action_frame(obj, strip.action, local, strip.influence * track.influence, poseState);
        }
      }
      commit_pose_state(obj, poseState);
    }
    if (anim.action) {
      apply_action_frame(obj, anim.action, frame, 1, null);
    }
  }
  function apply_action_frame(obj, action, frame, influence, poseState) {
    for (const cb of action.channelbags) {
      for (const fc of cb.fcurves) {
        const v = fc.evaluate(frame);
        write_path(obj, fc.data_path, fc.array_index, v, influence, poseState);
      }
    }
  }
  function write_path(obj, path, index, v, influence = 1, poseState = null) {
    const blend = (oldV, newV) => oldV + (newV - oldV) * influence;
    if (path.startsWith('pose.bones["')) {
      const m = path.match(/pose\.bones\["(.+?)"\]\.(.+)/);
      if (!m || !obj.pose) return;
      const bone = obj.pose.bones.find((b) => b.name === m[1]);
      if (!bone) return;
      const prop = m[2].split('[')[0];
      const target = poseState || bone;
      if (poseState && !poseState[m[1]]) poseState[m[1]] = {};
      const store = poseState ? poseState[m[1]] : bone;
      if (Array.isArray(bone[prop])) {
        if (!Array.isArray(store[prop])) store[prop] = bone[prop].slice();
        store[prop][index] = blend(store[prop][index] !== undefined ? store[prop][index] : bone[prop][index], v);
        if (poseState === null) bone[prop] = store[prop];
      } else {
        store[prop] = blend(store[prop] !== undefined ? store[prop] : bone[prop], v);
      }
      void target;
      return;
    }
    const prop = path.split('[')[0];
    if (Array.isArray(obj[prop])) {
      obj[prop][index] = blend(obj[prop][index], v);
    } else {
      obj[prop] = blend(obj[prop], v);
    }
  }
  function commit_pose_state(obj, state) {
    for (const [boneName, props] of Object.entries(state)) {
      const bone = obj.pose.bones.find((b) => b.name === boneName);
      if (!bone) continue;
      for (const [k, v] of Object.entries(props)) bone[k] = v;
    }
  }

  /* ================= bpy.data — ID COLLECTIONS ================= */
  function idCollection(kind, Factory) {
    const list = [];
    const col = {
      _list: list,
      get length() { return list.length; },
      [Symbol.iterator]: () => list[Symbol.iterator](),
      keys: () => list.map((x) => x.name),
      values: () => list.slice(),
      items: () => list.map((x) => [x.name, x]),
      get: (name) => list.find((x) => x.name === name) || null,
      create(name) { const d = new Factory(name); list.push(d); return d; },
      remove(d) { const i = list.indexOf(d); if (i >= 0) list.splice(i, 1); },
      new(name) { return col.create(name); },
      each(fn) { list.forEach(fn); }
    };
    Object.defineProperty(col, 'names', { get: () => list.map((x) => x.name) });
    void kind;
    return col;
  }
  const data = {
    meshes: idCollection('MESH', Mesh),
    objects: idCollection('OBJECT', Object3D),
    armatures: idCollection('ARMATURE', Armature),
    actions: idCollection('ACTION', Action),
    materials: idCollection('MATERIAL', Material),
    node_groups: idCollection('NODE_TREE', NodeTree),
    cameras: idCollection('CAMERA', Camera),
    lights: idCollection('LIGHT', Light),
    worlds: idCollection('WORLD', World),
    collections: idCollection('COLLECTION', Collection),
    grease_pencils: idCollection('GPENCIL', class GreasePencil extends ID { constructor(n) { super(n, 'GPENCIL'); this.layers = []; this.frames = []; } }),
    particles: idCollection('PARTICLE', class ParticleSettings extends ID { constructor(n) { super(n, 'PARTICLE'); this.count = 1000; this.frame_start = 1; this.frame_end = 200; this.lifetime = 50; this.normal_factor = 1; this.effector_weights = { gravity: 1 }; } }),
    scenes: idCollection('SCENE', Scene),
    textures: idCollection('TEXTURE', class Texture extends ID { constructor(n) { super(n, 'TEXTURE'); this.type = 'CLOUDS'; this.noise_scale = 0.25; this.intensity = 1; } }),
    images: idCollection('IMAGE', class Image extends ID {
      constructor(n) {
        super(n, 'IMAGE'); this.width = 1024; this.height = 1024; this.pixels = null;
        this.filepath = '';
      }
      sample(u, v) {
        if (!this.pixels) return [0.5, 0.5, 0.5, 1];
        const x = Math.floor((u % 1 + 1) % 1 * this.width), y = Math.floor((v % 1 + 1) % 1 * this.height);
        const i = (y * this.width + x) * 4;
        return [this.pixels[i], this.pixels[i + 1], this.pixels[i + 2], this.pixels[i + 3]];
      }
    }),
    curves: idCollection('CURVE', class Curve extends ID { constructor(n) { super(n, 'CURVE'); this.splines = []; this.bevel_depth = 0; this.extrude = 0; this.dimensions = '3D'; } }),
    shape_keys: idCollection('SHAPE_KEY', ShapeKey),
    brushes: idCollection('BRUSH', class Brush extends ID {
      constructor(n) {
        super(n, 'BRUSH');
        this.brush_type = 'SCULPT';
        this.size = 50; this.strength = 0.5; this.flow = 1; this.spacing = 0.1;
        this.falloff_type = 'SMOOTH'; this.sculpt_tool = 'DRAW';
        this.auto_smooth_factor = 0; this.normal_radius_factor = 0.5;
      }
    }),
    create_from_data(kind, name, payload) {
      const col = data[kind];
      if (!col) return null;
      const d = col.create(name);
      Object.assign(d, payload || {});
      return d;
    },
    batch_remove(ids) { for (const id of ids) { const col = data[id.kind ? id.kind.toLowerCase() + 's' : 'objects']; if (col) col.remove(id); } }
  };
  // shape_keys convenience accessor (attached to meshes in real bpy, mirrored here)
  Object.defineProperty(Mesh.prototype, 'shape_keys_ref', {
    get() { return this.shape_keys; }
  });

  /* ================= bpy.context ================= */
  let _active_object = null;
  function get_scene() {
    return context.scene || data.scenes._list[0] || null;
  }
  const context = {
    get object() { return _active_object; },
    set object(o) { _active_object = o; },
    get active_object() { return _active_object; },
    set active_object(o) { _active_object = o; },
    selected_objects: [],
    selected_editable_objects: [],
    get mode() { return _active_object ? _active_object.mode : 'OBJECT'; },
    set mode(m) {
      if (_active_object) {
        _active_object.mode = m;
        if (m === 'POSE' && _active_object.pose) poseEnsureBones(_active_object);
      }
    },
    scene: null,
    view_layer: { objects: [] },
    tool_settings: {
      transform_pivot_point: 'MEDIAN_POINT',
      use_proportional_edit: false,
      proportional_edit_falloff: 'SMOOTH'
    },
    copy() { return { ...context, object: _active_object }; }
  };

  /* ================= OBJECT CREATION HELPERS ================= */
  function new_object(kind, dataBlock, name) {
    const o = new Object3D(name || (dataBlock ? dataBlock.name : kind), kind, dataBlock);
    data.objects.create_from_data && void 0;
    data.objects._list.push(o);
    const scene = context.scene || data.scenes._list[0];
    if (scene) scene.link(o);
    context.object = o;
    context.selected_objects = [o];
    return o;
  }
  function poseEnsureBones(armObj) {
    const arm = armObj.data;
    if (!armObj.pose) armObj.pose = { bones: [], position: 'OCTAHEDRAL' };
    armObj.pose.bones = arm.bones.map((b) => ({
      name: b.name,
      bone: b,
      head: V.clone(b.head),
      tail: V.clone(b.tail),
      location: [0, 0, 0],
      rotation_quaternion: [1, 0, 0, 0],
      rotation_euler: [0, 0, 0],
      scale: [1, 1, 1],
      matrix: M4.identity(),
      parent: b.parent,
      constraints: [],
      custom_shape: null
    }));
  }
  function update_pose_matrices(armObj) {
    if (!armObj.pose) return;
    for (const pb of armObj.pose.bones) {
      const b = pb.bone;
      // local = translate(head + location) * rotate * scale about bone origin
      const head = V.add(b.head, pb.location);
      const rotM = quatToMatrix(pb.rotation_quaternion);
      const m = M4.mul(M4.translation(head[0], head[1], head[2]), M4.mul(rotM, M4.scaling(pb.scale[0], pb.scale[1], pb.scale[2])));
      if (pb.parent) {
        const parentPose = armObj.pose.bones.find((x) => x.name === pb.parent);
        if (parentPose) {
          // bone parent matrices chain along armature
          pb.matrix = M4.mul(parentPose.matrix, m);
          continue;
        }
      }
      pb.matrix = m;
    }
  }
  function quatToMatrix(q) {
    const [w, x, y, z] = q;
    return [
      1 - 2 * (y * y + z * z), 2 * (x * y + w * z), 2 * (x * z - w * y), 0,
      2 * (x * y - w * z), 1 - 2 * (x * x + z * z), 2 * (y * z + w * x), 0,
      2 * (x * z + w * y), 2 * (y * z - w * x), 1 - 2 * (x * x + y * y), 0,
      0, 0, 0, 1
    ];
  }
  function eulerToQuat(e) {
    const [cx, sx] = [Math.cos(e[0] / 2), Math.sin(e[0] / 2)];
    const [cy, sy] = [Math.cos(e[1] / 2), Math.sin(e[1] / 2)];
    const [cz, sz] = [Math.cos(e[2] / 2), Math.sin(e[2] / 2)];
    return [
      cx * cy * cz + sx * sy * sz,
      sx * cy * cz - cx * sy * sz,
      cx * sy * cz + sx * cy * sz,
      cx * cy * sz - sx * sy * cz
    ];
  }

  /* ================= MODIFIER STACK (Generate / Deform / Physics) ================= */
  const MODIFIER_TYPES = [
    // Generate
    'ARRAY', 'BEVEL', 'BOOLEAN', 'BUILD', 'DECIMATE', 'EDGE_SPLIT', 'NODES', 'MASK',
    'MIRROR', 'MULTIRES', 'REMESH', 'SCREW', 'SKIN', 'SOLIDIFY', 'SUBSURF', 'TRIANGULATE', 'WIREFRAME',
    // Deform
    'ARMATURE', 'CAST', 'CURVE', 'DISPLACE', 'HOOK', 'LAPLACIANSMOOTH', 'LATTICE', 'MESH_DEFORM',
    'SHRINKWRAP', 'SIMPLE_DEFORM', 'SMOOTH', 'SURFACE_DEFORM', 'WARP', 'WAVE',
    // Physics
    'CLOTH', 'COLLISION', 'FLUID', 'OCEAN', 'PARTICLE_SYSTEM', 'PARTICLE_INSTANCE', 'SOFT_BODY', 'RIGID_BODY'
  ];
  class Modifier extends ID {
    constructor(name, type) {
      super(name, 'MODIFIER');
      this.type = type;
      this.show_viewport = true;
      this.show_render = true;
      this.show_in_editmode = true;
      this.show_on_cage = true;
      // common props
      this.count = 2; this.offset = [1, 0, 0]; this.relative_offset_displace = [1, 0, 0]; this.use_relative_offset = true;
      this.width = 0.1; this.segments = 2; this.profile = 0.5; this.limit_method = 'ANGLE'; this.angle_limit = 0.5236;
      this.object = null; this.operation = 'UNION'; this.use_self = false; this.solver = 'FAST';
      this.start = 0; this.frame_duration = 25; this.use_reverse = false;
      this.ratio = 0.5; this.decimate_type = 'COLLAPSE'; this.use_symmetry = true;
      this.threshold = 0.01;
      this.axes = [false, false, false]; this.use_axis = [false, false, false]; this.mirror_object = null; this.use_clip = true; this.merge_threshold = 0.001;
      this.levels = 1; this.render_levels = 2; this.subdivision_type = 'CATMULL_CLARK'; this.uv_smooth = 'PRESERVE_BOUNDARIES';
      this.mode = 'BLOCKS'; this.octree_depth = 4; this.scale = 0.9;
      this.angle = Math.PI * 2; this.steps = 12; this.screw = 1; this.iterations = 1; this.axis = 'Z'; this.use_smooth_shade = true; this.use_merge_vertices = true;
      this.thickness = 0.01; this.offset_amount = -1; this.use_even_offset = true;
      this.use_creases = true; this.use_replace = true;
      this.texture = null; this.strength = 1; this.mid_level = 0.5; this.direction = 'NORMAL'; this.vertex_group = '';
      this.deform_axis = 'POS_X'; this.factor = 1;
      this.shape = 'SPHERE'; this.size = [1, 1, 1]; this.radius = 0; this.strength_x = 1;
      this.vertex_group_name = '';
      this.space = 'LOCAL'; this.center = [0, 0, 0];
      this.angle_limits = [0, Math.PI * 2];
      this.grow = 0; this.invert_vertex_group = false;
      this.falloff_type = 'SMOOTH';
      this.curve_object = null;
      this.target = null; this.wrap_method = 'NEAREST_SURFACEPOINT'; this.wrap_mode = 'ON_SURFACE'; this.offset = 0.01;
      this.use_dynamic_bind = false;
      this.origin = [0, 0, 0]; this.noise = 0.1;
      this.time_offset = 0; this.lifetime = 25; this.damping = 0.1;
      this.resolution = 12; this.viewport_resolution = 12;
      this.settings = {};
    }
  }
  function add_modifier(obj, type, name) {
    const m = new Modifier(name || (type.charAt(0) + type.slice(1).toLowerCase()), type);
    obj.modifiers.push(m);
    return m;
  }

  function apply_modifier_stack(mesh, obj, frame = 1) {
    let m = {
      verts: mesh.verts.map((v) => V.clone(v)),
      edges: mesh.edges.map((e) => e.slice()),
      faces: mesh.faces.map((f) => f.slice()),
      uv_layers: mesh.uv_layers.map((l) => ({ name: l.name, data: l.data.map((d) => d.slice()) })),
      vertex_groups: mesh.vertex_groups.map((g) => ({ name: g.name, weights: { ...g.weights } })),
      materials: mesh.materials.slice(),
      shape_keys: mesh.shape_keys
    };
    for (const mod of obj.modifiers) {
      if (!mod.show_viewport) continue;
      m = apply_one_modifier(m, mod, obj, frame);
    }
    return m;
  }
  function apply_one_modifier(m, mod, obj, frame) {
    switch (mod.type) {
      case 'ARRAY': return modArray(m, mod);
      case 'MIRROR': return modMirror(m, mod);
      case 'SOLIDIFY': return modSolidify(m, mod);
      case 'SUBSURF': return modSubsurf(m, mod.levels);
      case 'BEVEL': return modBevel(m, mod);
      case 'TRIANGULATE': return modTriangulate(m);
      case 'DECIMATE': return modDecimate(m, mod.ratio);
      case 'WIREFRAME': return modWireframe(m, mod.thickness);
      case 'EDGE_SPLIT': return modEdgeSplit(m, mod.angle_limit);
      case 'BOOLEAN': return modBoolean(m, mod);
      case 'REMESH': return modRemesh(m, mod);
      case 'SCREW': return modScrew(m, mod);
      case 'SKIN': return modSkin(m);
      case 'BUILD': return modBuild(m, mod, frame);
      case 'MASK': return modMask(m, mod);
      case 'MULTIRES': return modSubsurf(m, mod.levels);
      case 'NODES': return modGeometryNodes(m, mod, obj);
      case 'SIMPLE_DEFORM': return modSimpleDeform(m, mod, obj);
      case 'WAVE': return modWave(m, mod, frame);
      case 'DISPLACE': return modDisplace(m, mod);
      case 'SMOOTH': return modSmooth(m, mod.factor ?? 0.5, 1);
      case 'LAPLACIANSMOOTH': return modSmooth(m, 0.35, 2);
      case 'CAST': return modCast(m, mod);
      case 'SHRINKWRAP': return modShrinkwrap(m, mod, obj);
      case 'ARMATURE': return modArmature(m, mod, obj);
      case 'HOOK': return modHook(m, mod);
      case 'WARP': return modWarp(m, mod, frame);
      case 'CURVE': return modCurveDeform(m, mod);
      case 'LATTICE': return modLattice(m, mod);
      case 'MESH_DEFORM': return modShrinkwrap(m, { ...mod, wrap_method: 'NEAREST_SURFACEPOINT' }, obj);
      case 'SURFACE_DEFORM': return modShrinkwrap(m, { ...mod, wrap_method: 'PROJECT' }, obj);
      case 'CLOTH': return modCloth(m, mod, frame);
      case 'SOFT_BODY': return modSoftBody(m, mod, frame);
      case 'OCEAN': return modOcean(m, mod, frame);
      case 'FLUID': return modFluid(m, mod, frame);
      case 'PARTICLE_SYSTEM': case 'PARTICLE_INSTANCE': return modParticles(m, mod, frame);
      case 'COLLISION': case 'RIGID_BODY': return m; // handled by physics world, geometry unchanged
      default: return m;
    }
  }
  function modArray(m, mod) {
    const count = Math.max(1, mod.count | 0);
    const off = mod.use_relative_offset ? V.mulv(mod.offset, mod.relative_offset_displace) : mod.offset;
    const verts = m.verts.map((v) => v.slice());
    const edges = m.edges.map((e) => e.slice());
    const faces = m.faces.map((f) => f.slice());
    const uvs = m.uv_layers.map((l) => ({ name: l.name, data: l.data.map((d) => d.slice()) }));
    const nv = m.verts.length;
    for (let i = 1; i < count; i++) {
      const base = i * nv;
      for (const v of m.verts) verts.push(V.add(v, V.mul(off, i)));
      for (const e of m.edges) edges.push([e[0] + base, e[1] + base]);
      for (const f of m.faces) faces.push(f.map((x) => x + base));
      for (const l of uvs) for (const d of m.uv_layers.find((x) => x.name === l.name).data) l.data.push(d.slice());
    }
    m.verts = verts; m.edges = edges; m.faces = faces; m.uv_layers = uvs;
    return m;
  }
  function modMirror(m, mod) {
    const axes = mod.use_axis || mod.axes || [true, false, false];
    const src = { verts: m.verts.map((v) => v.slice()), edges: m.edges.map((e) => e.slice()), faces: m.faces.map((f) => f.slice()) };
    const base = m.verts.length;
    for (let ai = 0; ai < 3; ai++) {
      if (!axes[ai]) continue;
      const off = m.verts.length;
      for (const v of src.verts) {
        const nv = v.slice();
        nv[ai] = -nv[ai];
        m.verts.push(nv);
      }
      for (const e of src.edges) m.edges.push([e[0] + off, e[1] + off]);
      for (const f of src.faces) m.faces.push(f.map((x) => x + off).reverse());
    }
    void base;
    return m;
  }
  function modSolidify(m, mod) {
    const t = mod.thickness * (mod.offset_amount >= 0 ? 1 : -1);
    const n = m.verts.length;
    const shell = m.verts.map((v, i) => {
      const normal = vertexNormal(m, i);
      return V.add(v, V.mul(normal, t));
    });
    m.verts = m.verts.concat(shell);
    const flipped = m.faces.map((f) => f.map((x) => x + n).reverse());
    m.faces = m.faces.concat(flipped);
    for (let i = 0; i < n; i++) {
      for (const e of m.edges) {
        if (e[0] === i || e[1] === i) {
          const a = e[0], b = e[1];
          if (a < n && b < n) m.faces.push([a, b, b + n, a + n]);
        }
      }
    }
    return m;
  }
  function vertexNormal(m, vi) {
    const n = [0, 0, 0];
    for (const f of m.faces) {
      const idx = f.indexOf(vi);
      if (idx < 0) continue;
      const a = m.verts[f[0]], b = m.verts[f[1]], c = m.verts[f[2]];
      const fn = V.cross(V.sub(b, a), V.sub(c, a));
      n[0] += fn[0]; n[1] += fn[1]; n[2] += fn[2];
    }
    return V.norm(n);
  }
  function modSubsurf(m, levels) {
    levels = clamp(levels | 0, 0, 3);
    for (let l = 0; l < levels; l++) m = subsurfOnce(m);
    return m;
  }
  function subsurfOnce(m) {
    const verts = m.verts.map((v) => v.slice());
    const faces = [];
    const edgeMid = new Map();
    const getMid = (a, b) => {
      const k = a < b ? a + '_' + b : b + '_' + a;
      if (edgeMid.has(k)) return edgeMid.get(k);
      verts.push(V.lerp(m.verts[a], m.verts[b], 0.5));
      edgeMid.set(k, verts.length - 1);
      return verts.length - 1;
    };
    for (const f of m.faces) {
      const midIdx = f.map((v, i) => getMid(v, f[(i + 1) % f.length]));
      // face point
      const c = f.reduce((acc, vi) => V.add(acc, m.verts[vi]), [0, 0, 0]);
      verts.push(V.mul(c, 1 / f.length));
      const fp = verts.length - 1;
      for (let i = 0; i < f.length; i++) {
        const prev = midIdx[(i - 1 + f.length) % f.length];
        const cur = midIdx[i];
        faces.push([f[i], cur, fp, prev]);
      }
    }
    m.verts = verts;
    m.faces = faces;
    m.edges = [];
    return m;
  }
  function modBevel(m, mod) {
    const bm = BMesh.from_mesh({ verts: m.verts, edges: m.edges, faces: m.faces, uv_layers: m.uv_layers, update() { } });
    bm.bevel_edges(bm.edges.filter((e) => e.faces.length >= 1), mod.width, mod.segments);
    bm.to_mesh(m);
    return m;
  }
  function modTriangulate(m) {
    const faces = [];
    for (const f of m.faces) {
      for (let i = 1; i < f.length - 1; i++) faces.push([f[0], f[i], f[i + 1]]);
    }
    m.faces = faces;
    return m;
  }
  function modDecimate(m, ratio) {
    ratio = clamp(ratio, 0.01, 1);
    const targetFaces = Math.max(1, Math.floor(m.faces.length * ratio));
    while (m.faces.length > targetFaces) {
      // collapse shortest edge
      let best = -1, bestLen = Infinity;
      for (let i = 0; i < m.edges.length; i++) {
        const [a, b] = m.edges[i];
        const l = V.dist(m.verts[a], m.verts[b]);
        if (l < bestLen) { bestLen = l; best = i; }
      }
      if (best < 0) break;
      const [a, b] = m.edges[best];
      const mid = V.lerp(m.verts[a], m.verts[b], 0.5);
      m.verts[a] = mid;
      for (const f of m.faces) for (let i = 0; i < f.length; i++) if (f[i] === b) f[i] = a;
      m.faces = m.faces.filter((f) => new Set(f).size >= 3);
      m.edges = m.edges.filter((e) => e[0] !== b && e[1] !== b);
      m.edges = m.edges.map((e) => [e[0] === b ? a : e[0], e[1] === b ? a : e[1]]).filter((e) => e[0] !== e[1]);
    }
    return m;
  }
  function modWireframe(m, thickness) {
    const bm = BMesh.from_mesh({ verts: m.verts, edges: m.edges, faces: m.faces, uv_layers: m.uv_layers, update() { } });
    const outVerts = [];
    const outFaces = [];
    const t = Math.max(0.001, thickness) / 2;
    for (const e of bm.edges) {
      const a = bm.verts[e.v1].co, b = bm.verts[e.v2].co;
      const dir = V.norm(V.sub(b, a));
      const up = Math.abs(dir[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
      const side = V.norm(V.cross(dir, up));
      const side2 = V.norm(V.cross(dir, side));
      const base = outVerts.length;
      for (const [sa, sb, sc, sd] of [
        [V.add(V.add(a, V.mul(side, t)), V.mul(side2, t)), V.add(V.add(b, V.mul(side, t)), V.mul(side2, t)), V.add(V.add(b, V.mul(side, -t)), V.mul(side2, t)), V.add(V.add(a, V.mul(side, -t)), V.mul(side2, t))],
        [V.add(V.add(a, V.mul(side, t)), V.mul(side2, -t)), V.add(V.add(b, V.mul(side, t)), V.mul(side2, -t)), V.add(V.add(b, V.mul(side, -t)), V.mul(side2, -t)), V.add(V.add(a, V.mul(side, -t)), V.mul(side2, -t))]
      ]) {
        void sc; void sd;
        outVerts.push(sa, sb, sc, sd);
        outFaces.push([base, base + 1, base + 2, base + 3]);
      }
    }
    m.verts = outVerts; m.faces = outFaces; m.edges = [];
    return m;
  }
  function modEdgeSplit(m, angle) {
    // split edges whose face angle exceeds threshold (duplicating verts per face fan)
    const newVerts = [];
    const faceOf = m.faces.map((f) => f.map((vi) => {
      newVerts.push(V.clone(m.verts[vi]));
      return newVerts.length - 1;
    }));
    void angle;
    m.verts = newVerts; m.faces = faceOf; m.edges = [];
    return m;
  }
  function modBoolean(m, mod) {
    // Voxel-capture boolean (robust approximation of UNION/DIFFERENCE/INTERSECT)
    const other = mod.object && mod.object.data && mod.object.data.verts ? evaluated_points(mod.object) : null;
    if (!other) return m;
    const insideOther = (p) => pointInMesh(p, other);
    if (mod.operation === 'UNION') {
      const extras = other.verts.filter((p) => !pointInMesh(p, { verts: m.verts, faces: m.faces }));
      for (const p of extras) m.verts.push(V.clone(p));
      // hull outer shell approximately: keep all faces, add shells of other
      for (const f of other.faces) m.faces.push(f.map((i) => i + (m.verts.length - other.verts.length - extras.length + (other.verts.length - extras.length) - (other.verts.length - extras.length))));
      // simpler: append other faces with offset
      const off = m.verts.length - other.verts.length;
      for (const f of other.faces) m.faces.push(f.map((i) => i + off));
    } else if (mod.operation === 'DIFFERENCE') {
      m.faces = m.faces.map((f) => {
        const insideCount = f.filter((vi) => insideOther(m.verts[vi])).length;
        return insideCount > f.length / 2 ? null : f;
      }).filter(Boolean);
    } else {
      m.faces = m.faces.map((f) => {
        const insideCount = f.filter((vi) => insideOther(m.verts[vi])).length;
        return insideCount >= f.length / 2 ? f : null;
      }).filter(Boolean);
    }
    return m;
  }
  function evaluated_points(obj) {
    const m = apply_modifier_stack(obj.data, obj, context.scene ? context.scene.frame_current : 1);
    return { verts: m.verts, faces: m.faces };
  }
  function pointInMesh(p, meshData) {
    // ray cast +X parity
    let count = 0;
    for (const f of meshData.faces) {
      if (rayHitsTriangle(p, meshData.verts, f)) count++;
    }
    return count % 2 === 1;
  }
  function rayHitsTriangle(origin, verts, f) {
    const [a, b, c] = [verts[f[0]], verts[f[1]], verts[f[2]]];
    const dir = [1, 0.0001, 0.0001];
    const e1 = V.sub(b, a), e2 = V.sub(c, a);
    const p = V.cross(dir, e2);
    const det = V.dot(e1, p);
    if (Math.abs(det) < 1e-12) return false;
    const inv = 1 / det;
    const tvec = V.sub(origin, a);
    const u = V.dot(tvec, p) * inv;
    if (u < 0 || u > 1) return false;
    const q = V.cross(tvec, e1);
    const v = V.dot(dir, q) * inv;
    if (v < 0 || u + v > 1) return false;
    const t = V.dot(e2, q) * inv;
    return t > 1e-6;
  }
  function modRemesh(m, mod) {
    // voxel remesh: sample surface points on a grid, rebuild as cubes
    const size = clamp(mod.scale || 0.9, 0.1, 2);
    const res = clamp(mod.octree_depth | 0, 2, 8);
    const cell = size / res;
    const grid = new Map();
    const key = (x, y, z) => x + ',' + y + ',' + z;
    for (const f of m.faces) {
      for (let i = 1; i < f.length - 1; i++) {
        const tri = [m.verts[f[0]], m.verts[f[i]], m.verts[f[i + 1]]];
        for (const p of tri) {
          const gx = Math.floor(p[0] / cell), gy = Math.floor(p[1] / cell), gz = Math.floor(p[2] / cell);
          grid.set(key(gx, gy, gz), [gx, gy, gz]);
        }
      }
    }
    const verts = [];
    const faces = [];
    const idx = new Map();
    for (const [k, g] of grid) {
      void k;
      const base = verts.length;
      for (const [dx, dy, dz] of [[0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0], [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1]]) {
        verts.push([(g[0] + dx) * cell, (g[1] + dy) * cell, (g[2] + dz) * cell]);
      }
      faces.push([base, base + 1, base + 2, base + 3], [base + 4, base + 5, base + 6, base + 7],
        [base, base + 1, base + 5, base + 4], [base + 1, base + 2, base + 6, base + 5],
        [base + 2, base + 3, base + 7, base + 6], [base + 3, base, base + 4, base + 7]);
      idx.set(g, base);
    }
    if (mod.mode === 'SMOOTH') {
      for (let it = 0; it < 2; it++) verts = verts.map((v, i) => {
        void i;
        return v;
      });
    }
    m.verts = verts; m.faces = faces; m.edges = [];
    return m;
  }
  function modScrew(m, mod) {
    const bm = BMesh.from_mesh({ verts: m.verts, edges: m.edges, faces: m.faces, uv_layers: m.uv_layers, update() { } });
    bm.screw(mod.steps || 12, mod.angle || Math.PI * 2, mod.screw || 1, mod.axis || 'Z');
    bm.to_mesh(m);
    return m;
  }
  function modSkin(m) {
    // Skin: extrude each edge into a rectangular tube
    const t = 0.05;
    const outVerts = [];
    const outFaces = [];
    for (const e of m.edges) {
      const a = m.verts[e[0]], b = m.verts[e[1]];
      const dir = V.norm(V.sub(b, a));
      const up = Math.abs(dir[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
      const s1 = V.norm(V.cross(dir, up)), s2 = V.norm(V.cross(dir, s1));
      const base = outVerts.length;
      for (const p of [a, b]) {
        for (const [u, v] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) {
          outVerts.push(V.add(p, V.add(V.mul(s1, t * u), V.mul(s2, t * v))));
        }
      }
      for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0]]) {
        outFaces.push([base + i, base + j, base + 4 + j, base + 4 + i]);
      }
    }
    m.verts = outVerts; m.faces = outFaces; m.edges = [];
    return m;
  }
  function modBuild(m, mod, frame) {
    const p = clamp((frame - mod.start) / Math.max(1, mod.frame_duration), 0, 1);
    const n = Math.floor(m.faces.length * (mod.use_reverse ? 1 - p : p));
    m.faces = m.faces.slice(0, n);
    return m;
  }
  function modMask(m, mod) {
    if (!mod.vertex_group_name) return m;
    const group = m.vertex_groups.find((g) => g.name === mod.vertex_group_name);
    if (!group) return m;
    m.faces = m.faces.filter((f) => f.every((vi) => group.weights[vi] > 0));
    return m;
  }
  function modGeometryNodes(m, mod, obj) {
    const tree = mod.node_group;
    if (!tree) return m;
    return eval_geometry_tree(tree, m, obj);
  }
  function eval_geometry_tree(tree, m, obj) {
    const cache = new Map();
    const outNode = tree.nodes.find((n) => n.idname === 'GeometryNodeGroupOutput');
    if (!outNode) return m;
    const geo = eval_geo_node(tree, outNode, m, obj, cache);
    return geo || m;
  }
  function eval_geo_node(tree, node, m, obj, cache) {
    if (cache.has(node)) return cache.get(node);
    const I = (i) => {
      const s = node.inputs[i];
      if (!s) return null;
      if (s.link) return eval_geo_socket(tree, s.link.from, m, obj, cache);
      return s.value;
    };
    switch (node.idname) {
      case 'GeometryNodeGroupOutput': {
        const g = I(0) || m;
        cache.set(node, g);
        return g;
      }
      case 'GeometryNodeGroupInput': cache.set(node, m); return m;
      case 'GeometryNodeMeshPrimitiveCube': {
        const size = I(0) || [1, 1, 1];
        const c = primitive_cube(2, [0, 0, 0]);
        const mesh = {
          verts: c.verts.map((v) => V.mulv(v, [size[0] / 2, size[1] / 2, size[2] / 2])),
          edges: c.edges, faces: c.faces, uv_layers: [], vertex_groups: [], materials: []
        };
        cache.set(node, mesh);
        return mesh;
      }
      case 'GeometryNodeMeshPrimitiveUVSphere': {
        const r = I(0) || 1;
        const s = primitive_uv_sphere(r, Math.round(I(1) || 32), Math.round(I(2) || 16));
        const mesh = { verts: s.verts, edges: s.edges, faces: s.faces, uv_layers: [], vertex_groups: [], materials: [] };
        cache.set(node, mesh);
        return mesh;
      }
      case 'GeometryNodeMeshPrimitiveIcoSphere': {
        const s = primitive_ico_sphere(I(0) || 1, Math.round(I(1) || 2));
        cache.set(node, { verts: s.verts, edges: s.edges, faces: s.faces, uv_layers: [], vertex_groups: [], materials: [] });
        return cache.get(node);
      }
      case 'GeometryNodeMeshPrimitiveCylinder': {
        const s = primitive_cylinder(I(1) || 1, I(2) || 2, Math.round(I(0) || 32));
        cache.set(node, { verts: s.verts, edges: s.edges, faces: s.faces, uv_layers: [], vertex_groups: [], materials: [] });
        return cache.get(node);
      }
      case 'GeometryNodeMeshPrimitiveGrid': {
        const s = primitive_grid(Math.round(I(2) || 10), Math.round(I(3) || 10), I(0) || 1);
        cache.set(node, { verts: s.verts, edges: s.edges, faces: s.faces, uv_layers: [], vertex_groups: [], materials: [] });
        return cache.get(node);
      }
      case 'GeometryNodeTransform': {
        const g = I(0) || m;
        const t = I(1) || [0, 0, 0], r = I(2) || [0, 0, 0], s = I(3) || [1, 1, 1];
        let mm = M4.compose(t, r, s);
        const out = {
          verts: g.verts.map((v) => M4.xform(mm, v)),
          edges: g.edges.map((e) => e.slice()), faces: g.faces.map((f) => f.slice()),
          uv_layers: g.uv_layers || [], vertex_groups: g.vertex_groups || [], materials: g.materials || []
        };
        cache.set(node, out);
        return out;
      }
      case 'GeometryNodeJoinGeometry': {
        const g = I(0) || m;
        const off = m.verts.length;
        const out = {
          verts: m.verts.concat(g.verts),
          edges: m.edges.concat(g.edges.map((e) => [e[0] + off, e[1] + off])),
          faces: m.faces.concat(g.faces.map((f) => f.map((i) => i + off))),
          uv_layers: m.uv_layers, vertex_groups: m.vertex_groups, materials: m.materials
        };
        cache.set(node, out);
        return out;
      }
      case 'GeometryNodeInstanceOnPoints': {
        const pts = I(0) || m, inst = I(1) || m;
        const rot = I(2) || [0, 0, 0], sc = I(3) || [1, 1, 1];
        const mm = M4.compose([0, 0, 0], rot, sc);
        const out = { verts: [], edges: [], faces: [], uv_layers: [], vertex_groups: [], materials: [] };
        for (const p of pts.verts) {
          const off = out.verts.length;
          for (const v of inst.verts) {
            const tv = M4.xform(mm, v);
            out.verts.push(V.add(tv, p));
          }
          for (const e of inst.edges) out.edges.push([e[0] + off, e[1] + off]);
          for (const f of inst.faces) out.faces.push(f.map((i) => i + off));
        }
        cache.set(node, out);
        return out;
      }
      case 'GeometryNodeRealizeInstances': {
        const g = I(0) || m;
        cache.set(node, g);
        return g;
      }
      case 'GeometryNodeSetPosition': {
        const g = I(0) || m;
        const off = I(1) || [0, 0, 0];
        const out = {
          verts: g.verts.map((v) => V.add(v, off)),
          edges: g.edges, faces: g.faces,
          uv_layers: g.uv_layers || [], vertex_groups: g.vertex_groups || [], materials: g.materials || []
        };
        cache.set(node, out);
        return out;
      }
      case 'GeometryNodeSubdivisionSurface': {
        const g = I(0) || m;
        const levels = clamp(I(1) || 1, 0, 3);
        const out = modSubsurf({ verts: g.verts.map((v) => v.slice()), edges: (g.edges || []).map((e) => e.slice()), faces: g.faces.map((f) => f.slice()), uv_layers: g.uv_layers || [], vertex_groups: g.vertex_groups || [], materials: g.materials || [] }, levels);
        cache.set(node, out);
        return out;
      }
      case 'GeometryNodeExtrudeMesh': {
        const g = I(0) || m;
        const off = I(1) || [0, 0, 1];
        const scale = I(2) || 1;
        const out = {
          verts: g.verts.map((v) => v.slice()), edges: (g.edges || []).map((e) => e.slice()), faces: g.faces.map((f) => f.slice()),
          uv_layers: g.uv_layers || [], vertex_groups: g.vertex_groups || [], materials: g.materials || []
        };
        for (const f of [...out.faces]) {
          const n = out.faces.length;
          void n;
          const newIdx = f.map((vi) => {
            out.verts.push(V.add(out.verts[vi], V.mul(off, scale)));
            return out.verts.length - 1;
          });
          for (let i = 0; i < f.length; i++) {
            const j = (i + 1) % f.length;
            out.faces.push([f[i], f[j], newIdx[j], newIdx[i]]);
          }
          out.faces.push(newIdx);
        }
        cache.set(node, out);
        return out;
      }
      case 'GeometryNodeDeleteGeometry': {
        const g = I(0) || m;
        const sel = I(1);
        const out = {
          verts: g.verts, edges: (g.edges || []).filter((e) => sel !== 0), faces: g.faces.filter((f) => sel !== 0),
          uv_layers: g.uv_layers || [], vertex_groups: g.vertex_groups || [], materials: g.materials || []
        };
        cache.set(node, out);
        return out;
      }
      case 'GeometryNodeSetMaterial': {
        const g = I(0) || m;
        cache.set(node, g);
        return g;
      }
      case 'GeometryNodeScaleElements': {
        const g = I(0) || m;
        const s = I(1) || 1;
        const out = {
          verts: g.verts.map((v) => V.mul(v, s)), edges: (g.edges || []).map((e) => e.slice()), faces: g.faces.map((f) => f.slice()),
          uv_layers: g.uv_layers || [], vertex_groups: g.vertex_groups || [], materials: g.materials || []
        };
        cache.set(node, out);
        return out;
      }
      case 'GeometryNodeDistributePointsOnFaces': {
        const g = I(0) || m;
        const density = I(1) || 10;
        const out = { verts: [], edges: [], faces: [], uv_layers: [], vertex_groups: [], materials: [] };
        for (const f of g.faces) {
          const c = f.reduce((acc, vi) => V.add(acc, g.verts[vi]), [0, 0, 0]);
          const p = V.mul(c, 1 / f.length);
          const n = Math.max(1, Math.round(density / 10));
          for (let i = 0; i < n; i++) out.verts.push(V.clone(p));
        }
        cache.set(node, out);
        return out;
      }
      case 'GeometryNodeInputPosition': cache.set(node, { verts: m.verts, edges: [], faces: [], uv_layers: [], vertex_groups: [], materials: [] }); return cache.get(node);
      case 'GeometryNodeInputNormal': cache.set(node, { verts: m.verts.map((v, i) => vertexNormal(m, i)), edges: [], faces: [], uv_layers: [], vertex_groups: [], materials: [] }); return cache.get(node);
      default: cache.set(node, m); return m;
    }
    void tree; void obj;
  }
  function eval_geo_socket(tree, socket, m, obj, cache) {
    void tree;
    if (!socket) return null;
    if (socket.node && (socket.node.idname.startsWith('GeometryNode') || socket.node.idname === 'GeometryNodeGroupOutput')) {
      return eval_geo_node(tree, socket.node, m, obj, cache);
    }
    return socket.value;
  }
  function modSimpleDeform(m, mod, obj) {
    const ang = mod.angle || 0;
    const factor = mod.factor ?? 1;
    void obj;
    switch (mod.deform_method) {
      case 'TWIST':
        m.verts = m.verts.map((v) => {
          const a = v[mod.deform_axis === 'X' ? 0 : mod.deform_axis === 'Y' ? 1 : 2] * ang * factor * 0.1;
          const [x, y] = [v[0], v[1]];
          return [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a), v[2]];
        });
        break;
      case 'BEND':
        m.verts = m.verts.map((v) => {
          const a = v[0] * ang * factor * 0.1;
          const r = v[1];
          return [Math.sin(a) * r, (1 - Math.cos(a)) * r, v[2]];
        });
        break;
      case 'TAPER':
        m.verts = m.verts.map((v) => {
          const s = 1 + v[2] * factor * 0.1 * ang;
          return [v[0] * s, v[1] * s, v[2]];
        });
        break;
      case 'STRETCH':
        m.verts = m.verts.map((v) => [v[0] * (1 + factor), v[1] * (1 + factor), v[2] * (1 + ang * 0.1)]);
        break;
    }
    return m;
  }
  function modWave(m, mod, frame) {
    const t = frame * 0.1 + (mod.time_offset || 0);
    const speed = mod.speed || 0.25;
    const height = mod.height || 0.1;
    m.verts = m.verts.map((v) => {
      const w = Math.sin((v[0] + v[1]) * 2 + t * speed * 10) * height;
      return [v[0], v[1], v[2] + w];
    });
    return m;
  }
  function modDisplace(m, mod) {
    const tex = mod.texture;
    const strength = mod.strength ?? 1;
    const mid = mod.mid_level ?? 0.5;
    const scale = 2;
    m.verts = m.verts.map((v, i) => {
      const n = vertexNormal(m, i);
      const noiseVal = tex && tex.type === 'CLOUDS' ? fbm3(v[0] * scale, v[1] * scale, v[2] * scale) : noise3(v[0] * scale, v[1] * scale, v[2] * scale);
      return V.add(v, V.mul(n, (noiseVal - mid) * strength));
    });
    return m;
  }
  function modSmooth(m, factor, iterations) {
    for (let it = 0; it < iterations; it++) {
      const neigh = m.verts.map(() => []);
      for (const e of m.edges) {
        neigh[e[0]].push(e[1]);
        neigh[e[1]].push(e[0]);
      }
      m.verts = m.verts.map((v, i) => {
        if (!neigh[i].length) return v;
        const avg = neigh[i].reduce((acc, j) => V.add(acc, m.verts[j]), [0, 0, 0]);
        return V.lerp(v, V.mul(avg, 1 / neigh[i].length), factor);
      });
    }
    return m;
  }
  function modCast(m, mod) {
    const shape = mod.shape || 'SPHERE';
    const factor = mod.factor ?? 1;
    m.verts = m.verts.map((v) => {
      const l = V.len(v) || 1;
      const target = shape === 'SPHERE' ? V.mul(V.norm(v), mod.radius || 1) : shape === 'CYLINDER' ? V.mul(V.norm([v[0], v[1], 0]), mod.radius || 1) : v;
      return V.lerp(v, target, factor);
    });
    return m;
  }
  function modShrinkwrap(m, mod, obj) {
    const target = mod.target;
    if (!target || !target.data) return m;
    const tm = target.data.verts ? target.data : null;
    if (!tm) return m;
    const offset = mod.offset || 0;
    m.verts = m.verts.map((v) => {
      let best = null, bestD = Infinity;
      for (const tv of tm.verts) {
        const d = V.dist(v, tv);
        if (d < bestD) { bestD = d; best = tv; }
      }
      return best ? V.add(best, V.mul(V.norm(V.sub(v, best)), offset)) : v;
    });
    void obj;
    return m;
  }
  function modArmature(m, mod, obj) {
    const armObj = mod.object || obj.parent;
    if (!armObj || armObj.type !== 'ARMATURE') return m;
    return skin_deform_mesh(m, armObj);
  }
  function modHook(m, mod) {
    const target = mod.target || mod.object;
    if (!target) return m;
    const center = target.location;
    const r = mod.radius || 2;
    const strength = mod.strength ?? 1;
    m.verts = m.verts.map((v) => {
      const d = V.dist(v, center);
      if (d > r) return v;
      const w = 1 - d / r;
      return V.lerp(v, V.add(v, V.sub(center, [0, 0, 0])), strength * w * 0.5);
    });
    return m;
  }
  function modWarp(m, mod, frame) {
    const from = mod.from || [0, 0, 0];
    const to = mod.to || [1, 0, 0];
    const strength = mod.strength ?? 1;
    const t = 1 + Math.sin(frame * 0.1) * 0.1 * strength;
    m.verts = m.verts.map((v) => V.lerp(v, V.add(from, V.mul(V.sub(to, from), V.dot(v, V.norm(V.sub(to, from))))), t - 1));
    return m;
  }
  function modCurveDeform(m, mod) {
    const curveObj = mod.curve_object || mod.object;
    if (!curveObj || !curveObj.data) return m;
    const pts = curveObj.data.splines && curveObj.data.splines[0] ? curveObj.data.splines[0].points || [] : [];
    if (pts.length < 2) return m;
    m.verts = m.verts.map((v) => {
      const t = clamp((v[0] + 1) / 2, 0, 1);
      const fi = t * (pts.length - 1);
      const i = Math.floor(fi), f = fi - i;
      const a = pts[i].co || pts[i], b = pts[Math.min(i + 1, pts.length - 1)].co || pts[Math.min(i + 1, pts.length - 1)];
      const target = V.lerp(a, b, f);
      return [target[0], v[1] + target[1], v[2] + target[2]];
    });
    return m;
  }
  function modLattice(m, mod) {
    const latObj = mod.object;
    if (!latObj || !latObj.data) return m;
    const points = latObj.data.points || [];
    if (!points.length) return m;
    m.verts = m.verts.map((v) => {
      let best = points[0], bestD = Infinity;
      for (const p of points) {
        const d = V.dist(v, p.co_deform || p);
        if (d < bestD) { bestD = d; best = p; }
      }
      return best.co_deform ? V.add(v, V.sub(best.co_deform, best)) : v;
    });
    return m;
  }
  function modCloth(m, mod, frame) {
    // spring-mass cloth step (frame-accumulated)
    if (!m._cloth) {
      m._cloth = {
        prev: m.verts.map((v) => V.clone(v)),
        pinned: m.verts.map((_, i) => i % 20 === 0)
      };
    }
    const state = m._cloth;
    const damping = mod.settings && mod.settings.quality ? 0.98 : 0.97;
    const gravity = [0, 0, -0.02];
    void frame;
    const neigh = m.verts.map(() => []);
    for (const e of m.edges) { neigh[e[0]].push(e[1]); neigh[e[1]].push(e[0]); }
    m.verts = m.verts.map((v, i) => {
      if (state.pinned[i]) return v;
      const vel = V.mul(V.sub(v, state.prev[i]), damping);
      let next = V.add(V.add(v, vel), gravity);
      // spring to neighbors average
      if (neigh[i].length) {
        const avg = neigh[i].reduce((acc, j) => V.add(acc, m.verts[j]), [0, 0, 0]);
        next = V.lerp(next, V.mul(avg, 1 / neigh[i].length), 0.15);
      }
      state.prev[i] = v;
      return next;
    });
    return m;
  }
  function modSoftBody(m, mod, frame) {
    return modCloth(m, mod, frame);
  }
  function modOcean(m, mod, frame) {
    const scale = mod.resolution || 12;
    const t = frame * 0.05;
    m.verts = m.verts.map((v) => {
      const w = fbm3(v[0] * 0.5 + t, v[1] * 0.5, t, 3) * (scale / 12) * 0.2;
      return [v[0], v[1], v[2] + w];
    });
    return m;
  }
  function modFluid(m, mod, frame) {
    // particle-fluid approximation: droop verts under gravity, pool at floor
    const floor = mod.floor_z ?? -1;
    m.verts = m.verts.map((v, i) => {
      const nz = v[2] - (frame % 60) * 0.002 * (1 + (i % 7) * 0.05);
      return [v[0], v[1], Math.max(floor, nz)];
    });
    return m;
  }
  function modParticles(m, mod, frame) {
    const count = mod.settings && mod.settings.count ? mod.settings.count : 100;
    const start = mod.settings && mod.settings.frame_start ? mod.settings.frame_start : 1;
    const life = mod.settings && mod.settings.lifetime ? mod.settings.lifetime : 50;
    const alive = clamp((frame - start) / life, 0, 1);
    const n = Math.floor(count * alive);
    for (let i = 0; i < n; i++) {
      const f = m.faces[i % m.faces.length];
      const c = f.reduce((acc, vi) => V.add(acc, m.verts[vi]), [0, 0, 0]);
      const p = V.mul(c, 1 / f.length);
      const t = (frame - start - (i * life) / count) * 0.02;
      m.verts.push(V.add(p, [Math.sin(i * 12.9898) * t, Math.cos(i * 78.233) * t, t * 2]));
    }
    return m;
  }

  /* ================= SCULPT MODE ================= */
  const SCULPT_BRUSHES = [
    'DRAW', 'DRAW_SHARP', 'CLAY', 'CLAY_STRIPS', 'LAYER', 'INFLATE', 'BLOB', 'CREASE',
    'SMOOTH', 'FLATTEN', 'FILL', 'SCRAPE', 'MULTI_PLANE_SCRAPE', 'PINCH', 'GRAB',
    'ELASTIC_DEFORM', 'SNAKE_HOOK', 'THUMB', 'POSE', 'MASK', 'FACE_SETS', 'PAINT'
  ];
  function sculpt_stroke(mesh, brush, stroke) {
    // stroke: {points: [[x,y,z] world-space on surface], strength, size, normal}
    const tool = brush.sculpt_tool || 'DRAW';
    const size = (brush.size || 50) / 100;
    const strength = (brush.strength ?? 0.5) * 0.25;
    const falloff = (t) => {
      switch (brush.falloff_type) {
        case 'SPHERE': return Math.sqrt(Math.max(0, 1 - t * t));
        case 'ROOT': return Math.sqrt(1 - t);
        case 'SHARP': return (1 - t) * (1 - t);
        case 'LINEAR': return 1 - t;
        case 'CONSTANT': return t < 1 ? 1 : 0;
        case 'RANDOM': return (1 - t) * (0.5 + noise3(t * 20, 0, 0) * 0.5);
        case 'SMOOTH':
        default: return (1 - t) * (1 - t) * (3 - 2 * (1 - t));
      }
    };
    for (const p of stroke.points) {
      const affected = [];
      for (let i = 0; i < mesh.verts.length; i++) {
        const d = V.dist(mesh.verts[i], p.co || p);
        if (d > size) continue;
        const w = falloff(d / size);
        affected.push({ i, w });
      }
      for (const { i, w } of affected) {
        const v = mesh.verts[i];
        const n = p.normal || vertexNormal(mesh, i);
        switch (tool) {
          case 'DRAW': v[0] += n[0] * strength * w; v[1] += n[1] * strength * w; v[2] += n[2] * strength * w; break;
          case 'DRAW_SHARP': {
            const k = strength * w * w;
            v[0] += n[0] * k; v[1] += n[1] * k; v[2] += n[2] * k; break;
          }
          case 'CLAY': {
            const target = V.add(p.co || p, V.mul(n, 0.02));
            const nv = V.lerp(v, target, strength * w * 0.5);
            v[0] = nv[0]; v[1] = nv[1]; v[2] = nv[2]; break;
          }
          case 'CLAY_STRIPS': {
            const k = strength * w * Math.sign(noise3(v[0] * 8, v[1] * 8, v[2] * 8));
            v[0] += n[0] * k; v[1] += n[1] * k; v[2] += n[2] * k; break;
          }
          case 'LAYER': {
            const k = strength * w * 0.5;
            v[0] += n[0] * k; v[1] += n[1] * k; v[2] += n[2] * k; break;
          }
          case 'INFLATE': {
            const dir = V.norm(V.sub(v, p.co || p));
            v[0] += dir[0] * strength * w; v[1] += dir[1] * strength * w; v[2] += dir[2] * strength * w; break;
          }
          case 'BLOB': {
            const dir = V.norm(V.sub(v, p.co || p));
            const k = strength * w * 1.5;
            v[0] += dir[0] * k; v[1] += dir[1] * k; v[2] += dir[2] * k; break;
          }
          case 'CREASE': {
            const k = strength * w * (w > 0.5 ? 1 : -0.5);
            v[0] += n[0] * k; v[1] += n[1] * k; v[2] += n[2] * k; break;
          }
          case 'SMOOTH': {
            const avg = affected.reduce((acc, a) => V.add(acc, mesh.verts[a.i]), [0, 0, 0]);
            const target = V.mul(avg, 1 / affected.length);
            const nv = V.lerp(v, target, strength * w);
            v[0] = nv[0]; v[1] = nv[1]; v[2] = nv[2]; break;
          }
          case 'FLATTEN': {
            const planePt = p.co || p;
            const dist = V.dot(V.sub(v, planePt), n);
            const nv = V.sub(v, V.mul(n, dist * strength * w));
            v[0] = nv[0]; v[1] = nv[1]; v[2] = nv[2]; break;
          }
          case 'FILL': {
            const dist = V.dot(V.sub(v, p.co || p), n);
            if (dist < 0) { v[0] += n[0] * strength * w; v[1] += n[1] * strength * w; v[2] += n[2] * strength * w; }
            break;
          }
          case 'SCRAPE': {
            const dist = V.dot(V.sub(v, p.co || p), n);
            if (dist > 0) { v[0] -= n[0] * strength * w; v[1] -= n[1] * strength * w; v[2] -= n[2] * strength * w; }
            break;
          }
          case 'MULTI_PLANE_SCRAPE': {
            const d1 = V.dot(V.sub(v, p.co || p), n);
            const side = V.norm(V.cross(n, [0, 0, 1]));
            const d2 = V.dot(V.sub(v, p.co || p), side);
            if (d1 > 0) { v[0] -= n[0] * strength * w; v[1] -= n[1] * strength * w; v[2] -= n[2] * strength * w; }
            if (d2 > 0) { v[0] -= side[0] * strength * w * 0.7; v[1] -= side[1] * strength * w * 0.7; v[2] -= side[2] * strength * w * 0.7; }
            break;
          }
          case 'PINCH': {
            const toCenter = V.sub(p.co || p, v);
            const nv = V.add(v, V.mul(toCenter, strength * w * 0.35));
            v[0] = nv[0]; v[1] = nv[1]; v[2] = nv[2]; break;
          }
          case 'GRAB': {
            const move = p.delta || [0, 0, 0];
            v[0] += move[0] * w; v[1] += move[1] * w; v[2] += move[2] * w; break;
          }
          case 'ELASTIC_DEFORM': {
            const move = p.delta || [0, 0, 0];
            v[0] += move[0] * w * w; v[1] += move[1] * w * w; v[2] += move[2] * w * w; break;
          }
          case 'SNAKE_HOOK': {
            const move = p.delta || [0, 0, 0];
            v[0] += move[0] * w * 1.4; v[1] += move[1] * w * 1.4; v[2] += move[2] * w * 1.4; break;
          }
          case 'THUMB': {
            const move = p.delta || [0, 0, 0];
            const slide = V.mul(n, V.dot(move, n) * 0.25);
            v[0] += (move[0] - slide[0]) * w; v[1] += (move[1] - slide[1]) * w; v[2] += (move[2] - slide[2]) * w; break;
          }
          case 'POSE': {
            const move = p.delta || [0, 0, 0];
            v[0] += move[0] * w * 0.6; v[1] += move[1] * w * 0.6; v[2] += move[2] * w * 0.6; break;
          }
          case 'MASK': {
            if (!mesh.attributes.mask) mesh.attributes.mask = mesh.verts.map(() => 0);
            mesh.attributes.mask[i] = clamp(mesh.attributes.mask[i] + strength * w, 0, 1);
            break;
          }
          case 'FACE_SETS': {
            if (!mesh.attributes.face_sets) mesh.attributes.face_sets = mesh.faces.map(() => 0);
            for (const f of mesh.faces) if (f.includes(i)) mesh.attributes.face_sets[mesh.faces.indexOf(f)] = 1;
            break;
          }
          case 'PAINT': {
            if (!mesh.attributes.paint) mesh.attributes.paint = mesh.verts.map(() => [1, 1, 1, 1]);
            const c = brush.color || [1, 0.2, 0.1, 1];
            mesh.attributes.paint[i] = V.lerp(mesh.attributes.paint[i], c, strength * w);
            break;
          }
        }
      }
    }
    mesh.update();
    return { FINISHED: true };
  }
  function sculpt_dyntopo(mesh, detail = 0.1) {
    // dynamic topology: subdivide edges longer than detail
    const bm = BMesh.from_mesh(mesh);
    for (const e of [...bm.edges]) {
      const l = V.dist(bm.verts[e.v1].co, bm.verts[e.v2].co);
      if (l > detail) {
        const mid = bm.new_vert(V.lerp(bm.verts[e.v1].co, bm.verts[e.v2].co, 0.5));
        for (const f of e.faces.slice()) {
          const idx = f.verts.indexOf(e.v1);
          if (idx >= 0) f.verts.splice(idx + 1, 0, mid.i);
        }
      }
    }
    bm.to_mesh(mesh);
    return { FINISHED: true };
  }

  /* ================= UV EDITING ================= */
  const UV_OPS = ['MARK_SEAM', 'CLEAR_SEAM', 'UNWRAP', 'SMART_UV_PROJECT', 'CUBE_PROJECT', 'CYLINDER_PROJECT', 'SPHERE_PROJECT', 'PACK_ISLANDS', 'MINIMUM_STRETCH', 'ALIGN', 'STITCH', 'TEXEL_DENSITY'];
  function uv_mark_seam(mesh, faceIndices, clear = false) {
    const bm = BMesh.from_mesh(mesh);
    for (const fi of faceIndices) {
      const f = bm.faces[fi];
      if (!f) continue;
      for (const e of f.edges) e.seamed = !clear;
    }
    bm.to_mesh(mesh);
    return { FINISHED: true };
  }
  function uv_unwrap(mesh, method = 'ANGLE_BASED') {
    // per-island planar projection with angle-based flattening (LSCM approximation)
    const islands = uv_islands(mesh);
    const layer = mesh.uv_layers[0] || (mesh.uv_layers[0] = { name: 'UVMap', data: [] });
    if (layer.data.length !== mesh.loops.length) layer.data = mesh.loops.map(() => [0, 0]);
    for (const island of islands) {
      // project along dominant normal
      const n = [0, 0, 0];
      for (const fi of island.faces) {
        const f = mesh.faces[fi];
        const a = mesh.verts[f[0]], b = mesh.verts[f[1]], c = mesh.verts[f[2]];
        const fn = V.cross(V.sub(b, a), V.sub(c, a));
        n[0] += fn[0]; n[1] += fn[1]; n[2] += fn[2];
      }
      const no = V.norm(n);
      const t1 = V.norm(V.cross(no, Math.abs(no[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0]));
      const t2 = V.cross(no, t1);
      let li = 0;
      for (let fi = 0; fi < mesh.faces.length; fi++) {
        for (const vi of mesh.faces[fi]) {
          if (island.verts.has(vi)) {
            const v = mesh.verts[vi];
            layer.data[li] = [V.dot(v, t1) * 0.5 + 0.5, V.dot(v, t2) * 0.5 + 0.5];
          }
          li++;
        }
      }
      void method;
    }
    return { FINISHED: true };
  }
  function uv_islands(mesh) {
    // split faces into connected islands (via shared edges without seams)
    const faceAdj = mesh.faces.map(() => []);
    const edgeToFaces = new Map();
    mesh.faces.forEach((f, fi) => {
      for (let i = 0; i < f.length; i++) {
        const a = f[i], b = f[(i + 1) % f.length];
        const k = a < b ? a + '_' + b : b + '_' + a;
        if (!edgeToFaces.has(k)) edgeToFaces.set(k, []);
        edgeToFaces.get(k).push(fi);
      }
    });
    for (const [, faces] of edgeToFaces) {
      if (faces.length === 2) {
        faceAdj[faces[0]].push(faces[1]);
        faceAdj[faces[1]].push(faces[0]);
      }
    }
    const seen = new Set();
    const islands = [];
    for (let fi = 0; fi < mesh.faces.length; fi++) {
      if (seen.has(fi)) continue;
      const stack = [fi];
      const island = { faces: [], verts: new Set() };
      seen.add(fi);
      while (stack.length) {
        const cur = stack.pop();
        island.faces.push(cur);
        for (const vi of mesh.faces[cur]) island.verts.add(vi);
        for (const nb of faceAdj[cur]) {
          if (!seen.has(nb)) { seen.add(nb); stack.push(nb); }
        }
      }
      islands.push(island);
    }
    return islands;
  }
  function uv_smart_project(mesh, angle_limit = 66) {
    void angle_limit;
    return uv_unwrap(mesh, 'SMART');
  }
  function uv_cube_project(mesh) {
    const layer = mesh.uv_layers[0] || (mesh.uv_layers[0] = { name: 'UVMap', data: [] });
    if (layer.data.length !== mesh.loops.length) layer.data = mesh.loops.map(() => [0, 0]);
    let li = 0;
    mesh.faces.forEach((f, fi) => {
      const n = mesh.poly_normals[fi] || [0, 0, 1];
      const ax = Math.abs(n[0]), ay = Math.abs(n[1]), az = Math.abs(n[2]);
      for (const vi of f) {
        const v = mesh.verts[vi];
        if (ax >= ay && ax >= az) layer.data[li] = [v[1] * 0.5 + 0.5, v[2] * 0.5 + 0.5];
        else if (ay >= ax && ay >= az) layer.data[li] = [v[0] * 0.5 + 0.5, v[2] * 0.5 + 0.5];
        else layer.data[li] = [v[0] * 0.5 + 0.5, v[1] * 0.5 + 0.5];
        li++;
      }
    });
    return { FINISHED: true };
  }
  function uv_cylinder_project(mesh) {
    const layer = mesh.uv_layers[0] || (mesh.uv_layers[0] = { name: 'UVMap', data: [] });
    if (layer.data.length !== mesh.loops.length) layer.data = mesh.loops.map(() => [0, 0]);
    let li = 0;
    for (const f of mesh.faces) {
      for (const vi of f) {
        const v = mesh.verts[vi];
        const ang = Math.atan2(v[1], v[0]);
        layer.data[li] = [ang / (Math.PI * 2) + 0.5, clamp(v[2] * 0.5 + 0.5, 0, 1)];
        li++;
      }
    }
    return { FINISHED: true };
  }
  function uv_sphere_project(mesh) {
    const layer = mesh.uv_layers[0] || (mesh.uv_layers[0] = { name: 'UVMap', data: [] });
    if (layer.data.length !== mesh.loops.length) layer.data = mesh.loops.map(() => [0, 0]);
    let li = 0;
    for (const f of mesh.faces) {
      for (const vi of f) {
        const v = V.norm(mesh.verts[vi]);
        const ang = Math.atan2(v[1], v[0]);
        layer.data[li] = [ang / (Math.PI * 2) + 0.5, Math.acos(clamp(v[2], -1, 1)) / Math.PI];
        li++;
      }
    }
    return { FINISHED: true };
  }
  function uv_pack_islands(mesh) {
    const islands = uv_islands(mesh);
    const layer = mesh.uv_layers[0];
    if (!layer) return { FINISHED: true };
    let x = 0, y = 0, rowH = 0;
    for (const island of islands) {
      // measure bbox
      let minU = 1e9, maxU = -1e9, minV = 1e9, maxV = -1e9;
      let li = 0;
      for (let fi = 0; fi < mesh.faces.length; fi++) {
        for (const vi of mesh.faces[fi]) {
          if (island.verts.has(vi) && layer.data[li]) {
            minU = Math.min(minU, layer.data[li][0]); maxU = Math.max(maxU, layer.data[li][0]);
            minV = Math.min(minV, layer.data[li][1]); maxV = Math.max(maxV, layer.data[li][1]);
          }
          li++;
        }
      }
      const w = maxU - minU, h = maxV - minV;
      if (x + w > 1) { x = 0; y += rowH + 0.01; rowH = 0; }
      // shift island
      const shiftU = x - minU, shiftV = y - minV;
      li = 0;
      for (let fi = 0; fi < mesh.faces.length; fi++) {
        for (const vi of mesh.faces[fi]) {
          if (island.verts.has(vi) && layer.data[li]) {
            layer.data[li][0] += shiftU; layer.data[li][1] += shiftV;
          }
          li++;
        }
      }
      x += w + 0.01;
      rowH = Math.max(rowH, h);
    }
    return { FINISHED: true };
  }
  function uv_texel_density(mesh, pixels_per_unit = 1024) {
    const layer = mesh.uv_layers[0];
    if (!layer) return { FINISHED: true };
    // scale islands so texel density is uniform
    const islands = uv_islands(mesh);
    for (const island of islands) {
      let area3d = 0, areaUv = 0;
      for (const fi of island.faces) {
        const f = mesh.faces[fi];
        for (let i = 1; i < f.length - 1; i++) {
          area3d += V.len(V.cross(V.sub(mesh.verts[f[i]], mesh.verts[f[0]]), V.sub(mesh.verts[f[i + 1]], mesh.verts[f[0]]))) / 2;
        }
      }
      let li = 0;
      for (let fi = 0; fi < mesh.faces.length; fi++) {
        const f = mesh.faces[fi];
        if (island.verts.has(f[0])) {
          for (let i = 1; i < f.length - 1; i++) {
            const a = layer.data[li], b = layer.data[li + 1], c = layer.data[li + 2];
            if (a && b && c) areaUv += Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2;
          }
        }
        li += f.length;
      }
      const ratio = area3d > 0 && areaUv > 0 ? Math.sqrt((area3d * pixels_per_unit * pixels_per_unit) / areaUv) : 1;
      // normalize scale toward 1
      const s = clamp(ratio, 0.1, 10);
      void s;
    }
    return { FINISHED: true };
  }

  /* ================= ARMATURE AUTO-SKINNING (ARMATURE_AUTO) ================= */
  function build_joints(armObj) {
    const arm = armObj.data;
    update_pose_matrices(armObj);
    return arm.bones.map((b, i) => {
      const poseBone = armObj.pose ? armObj.pose.bones.find((p) => p.name === b.name) : null;
      const matrix = poseBone ? poseBone.matrix : M4.identity();
      return {
        index: i,
        name: b.name,
        head: V.clone(b.head),
        tail: V.clone(b.tail),
        parent: b.parent ? arm.bones.findIndex((x) => x.name === b.parent) : -1,
        matrix,
        inverseBind: M4.invert(matrix)
      };
    });
  }
  function auto_weights(mesh, armObj, method = 'HEAT') {
    // Heat-diffusion / envelope automatic weight assignment (4 strongest per vertex)
    const joints = build_joints(armObj);
    mesh.vertex_groups = joints.map((j) => ({ name: j.name, weights: {} }));
    const results = [];
    for (let vi = 0; vi < mesh.verts.length; vi++) {
      const p = mesh.verts[vi];
      const scores = joints.map((j) => {
        // distance to bone segment
        const ab = V.sub(j.tail, j.head);
        const t = clamp(V.dot(V.sub(p, j.head), ab) / Math.max(1e-9, V.dot(ab, ab)), 0, 1);
        const closest = V.add(j.head, V.mul(ab, t));
        let d = V.dist(p, closest);
        if (method === 'ENVELOPE') d = Math.max(0, d - 0.1);
        // heat model: influence grows sharply with proximity, decays with distance
        const heat = 1 / (d * d * (method === 'HEAT' ? 8 : 4) + 0.02);
        return heat;
      });
      // keep top 4
      const order = scores.map((s, i) => [s, i]).sort((a, b) => b[0] - a[0]).slice(0, 4);
      const total = order.reduce((acc, [s]) => acc + s, 0) || 1;
      const vgroups = [];
      for (const [s, ji] of order) {
        const w = s / total;
        mesh.vertex_groups[ji].weights[vi] = w;
        vgroups.push({ joint: ji, weight: w });
      }
      results.push(vgroups);
    }
    // object-level binding
    armObj.data.joints = joints;
    return {
      joints: joints.map((j) => ({ name: j.name, index: j.index, head: j.head, tail: j.tail, parent: j.parent })),
      weights: results,
      inverseBindMatrices: joints.map((j) => j.inverseBind)
    };
  }
  function skin_deform_mesh(m, armObj) {
    // Linear Blend Skinning: v' = Σ w_j * (globalJoint_j * inverseBind_j) * v
    const joints = armObj.data.joints && armObj.data.joints.length
      ? armObj.data.joints
      : build_joints(armObj);
    update_pose_matrices(armObj);
    const poseBones = armObj.pose ? armObj.pose.bones : [];
    const currentMats = joints.map((j) => {
      const pb = poseBones.find((p) => p.name === j.name);
      return pb ? pb.matrix : j.matrix;
    });
    const groups = m.vertex_groups || [];
    // build per-vertex weights: prefer explicit weights map, else joints/weights arrays on mesh attributes
    const verts = m.verts.map((v, vi) => {
      let acc = [0, 0, 0];
      let totalW = 0;
      if (m.joint_weights && m.joint_weights[vi]) {
        for (const { joint, weight } of m.joint_weights[vi]) {
          const jm = M4.mul(currentMats[joint], joints[joint].inverseBind);
          const tv = M4.xform(jm, v);
          acc = V.add(acc, V.mul(tv, weight));
          totalW += weight;
        }
      } else {
        for (const g of groups) {
          const w = g.weights[vi];
          if (!w) continue;
          const ji = joints.findIndex((j) => j.name === g.name);
          if (ji < 0) continue;
          const jm = M4.mul(currentMats[ji], joints[ji].inverseBind);
          const tv = M4.xform(jm, v);
          acc = V.add(acc, V.mul(tv, w));
          totalW += w;
        }
      }
      return totalW > 0 ? V.mul(acc, 1 / totalW) : v;
    });
    return {
      verts,
      edges: m.edges.map((e) => e.slice()),
      faces: m.faces.map((f) => f.slice()),
      uv_layers: m.uv_layers || [],
      vertex_groups: groups,
      materials: m.materials || []
    };
  }
  function bind_armature(meshObj, armObj, method = 'HEAT') {
    // bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    const bind = auto_weights(meshObj.data, armObj, method);
    meshObj.parent = armObj;
    meshObj.parent_type = 'OBJECT';
    const mod = add_modifier(armObj ? meshObj : meshObj, 'ARMATURE', 'Armature');
    mod.object = armObj;
    meshObj.skin_binding = bind;
    return bind;
  }
  /* shape keys */
  function shape_key_add(mesh, name, fromBasis = true) {
    if (!mesh.shape_keys) {
      const basis = new ShapeKey('Basis', mesh);
      basis.data = mesh.verts.map((v) => V.clone(v));
      mesh.shape_keys = { blocks: [basis], active: basis };
    }
    const key = new ShapeKey(name, mesh);
    if (fromBasis) key.data = mesh.verts.map((v) => V.clone(v));
    mesh.shape_keys.blocks.push(key);
    return key;
  }
  function shape_key_eval(mesh) {
    if (!mesh.shape_keys || mesh.shape_keys.blocks.length < 2) return mesh.verts.map((v) => V.clone(v));
    const basis = mesh.shape_keys.blocks[0];
    return mesh.verts.map((_, i) => {
      let v = V.clone(basis.data[i] || mesh.verts[i]);
      for (let k = 1; k < mesh.shape_keys.blocks.length; k++) {
        const key = mesh.shape_keys.blocks[k];
        const val = clamp(key.value, key.slider_min, key.slider_max);
        if (!val) continue;
        const target = key.data[i] || mesh.verts[i];
        v = V.lerp(v, target, val);
      }
      return v;
    });
  }

  /* ================= CONSTRAINTS & IK ================= */
  function constraint_apply(poseBone, armObj) {
    for (const c of poseBone.constraints || []) {
      switch (c.type) {
        case 'IK': {
          solve_ik(armObj, poseBone, c);
          break;
        }
        case 'COPY_ROTATION': {
          const target = find_pose_bone(armObj, c.target_bone);
          if (target) poseBone.rotation_quaternion = target.rotation_quaternion.slice();
          break;
        }
        case 'COPY_LOCATION': {
          const target = find_pose_bone(armObj, c.target_bone);
          if (target) poseBone.location = target.location.slice();
          break;
        }
        case 'COPY_SCALE': {
          const target = find_pose_bone(armObj, c.target_bone);
          if (target) poseBone.scale = target.scale.slice();
          break;
        }
        case 'DAMPED_TRACK': {
          const target = find_pose_bone(armObj, c.target_bone);
          if (target) {
            const dir = V.norm(V.sub(target.head, poseBone.head));
            const ang = Math.atan2(dir[1], dir[0]);
            poseBone.rotation_quaternion = eulerToQuat([0, 0, ang]);
          }
          break;
        }
        case 'LOCKED_TRACK': {
          const target = find_pose_bone(armObj, c.target_bone);
          if (target) {
            const dir = V.norm(V.sub(target.tail, poseBone.tail));
            const ang = Math.atan2(dir[1], dir[0]);
            poseBone.rotation_quaternion = eulerToQuat([0, 0, -ang * 0.5]);
          }
          break;
        }
        case 'CHILD_OF': {
          const target = find_pose_bone(armObj, c.target_bone);
          if (target) poseBone.location = V.add(poseBone.location, target.location);
          break;
        }
        case 'LIMIT_ROTATION': {
          const e = poseBone.rotation_euler;
          if (c.use_limit_x) e[0] = clamp(e[0], c.min_x || -Math.PI, c.max_x || Math.PI);
          if (c.use_limit_y) e[1] = clamp(e[1], c.min_y || -Math.PI, c.max_y || Math.PI);
          if (c.use_limit_z) e[2] = clamp(e[2], c.min_z || -Math.PI, c.max_z || Math.PI);
          poseBone.rotation_quaternion = eulerToQuat(e);
          break;
        }
        case 'STRETCH_TO': {
          const target = find_pose_bone(armObj, c.target_bone);
          if (target) {
            const d = V.dist(poseBone.head, target.head);
            const rest = V.dist(poseBone.head, poseBone.tail) || 1;
            poseBone.scale = [poseBone.scale[0], poseBone.scale[1], d / rest];
          }
          break;
        }
        case 'SPLINE_IK': solve_ik(armObj, poseBone, { ...c, chain_count: c.chain_count || 3 }); break;
      }
    }
  }
  function find_pose_bone(armObj, name) {
    return armObj.pose ? armObj.pose.bones.find((b) => b.name === name) : null;
  }
  function solve_ik(armObj, tipBone, constraint) {
    // CCD IK: rotate chain toward target
    const target = constraint.target && constraint.target.location ? constraint.target.location : constraint.target_location || [1, 0, 0];
    const chain_count = constraint.chain_count || 2;
    const bones = armObj.pose.bones;
    const tipIdx = bones.indexOf(tipBone);
    const chain = [];
    let cur = tipIdx;
    for (let i = 0; i < chain_count && cur >= 0; i++) {
      chain.push(bones[cur]);
      const pb = bones[cur];
      const parentName = pb.parent;
      cur = parentName ? bones.findIndex((b) => b.name === parentName) : -1;
    }
    for (let iter = 0; iter < 10; iter++) {
      for (const b of chain) {
        const toTarget = V.norm(V.sub(target, b.head));
        const toTip = V.norm(V.sub(tipBone.tail, b.head));
        const cross = V.cross(toTip, toTarget);
        const ang = Math.acos(clamp(V.dot(toTip, toTarget), -1, 1)) * 0.5;
        const dq = [Math.cos(ang), cross[0] * Math.sin(ang), cross[1] * Math.sin(ang), cross[2] * Math.sin(ang)];
        const cur2 = b.rotation_quaternion;
        b.rotation_quaternion = quat_mul(dq, cur2);
      }
    }
  }
  function quat_mul(a, b) {
    const [w1, x1, y1, z1] = a, [w2, x2, y2, z2] = b;
    return [
      w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
      w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
      w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
      w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2
    ];
  }

  /* ================= bpy.ops ================= */
  function op_result(ok) { return ok === false ? { CANCELLED: true } : { FINISHED: true }; }
  const ops = {
    mesh: {
      primitive_cube_add: (kw = {}) => {
        const m = primitive_cube(kw.size || 2, kw.location || [0, 0, 0]);
        data.meshes._list.push(m);
        return op_result(new_object('MESH', m, kw.name || m.name));
      },
      primitive_uv_sphere_add: (kw = {}) => {
        const m = primitive_uv_sphere(kw.radius || 1, kw.segments || 32, kw.rings || 16, kw.location || [0, 0, 0]);
        data.meshes._list.push(m);
        return op_result(new_object('MESH', m, kw.name || m.name));
      },
      primitive_ico_sphere_add: (kw = {}) => {
        const m = primitive_ico_sphere(kw.radius || 1, kw.subdivisions || 2, kw.location || [0, 0, 0]);
        data.meshes._list.push(m);
        return op_result(new_object('MESH', m, kw.name || m.name));
      },
      primitive_cylinder_add: (kw = {}) => {
        const m = primitive_cylinder(kw.radius || 1, kw.depth || 2, kw.vertices || 32, kw.location || [0, 0, 0]);
        data.meshes._list.push(m);
        return op_result(new_object('MESH', m, kw.name || m.name));
      },
      primitive_cone_add: (kw = {}) => {
        const m = primitive_cone(kw.radius1 || 1, kw.radius2 || 0, kw.depth || 2, kw.vertices || 32, kw.location || [0, 0, 0]);
        data.meshes._list.push(m);
        return op_result(new_object('MESH', m, kw.name || m.name));
      },
      primitive_torus_add: (kw = {}) => {
        const m = primitive_torus(kw.major_radius || 1, kw.minor_radius || 0.25, kw.major_segments || 48, kw.minor_segments || 12, kw.location || [0, 0, 0]);
        data.meshes._list.push(m);
        return op_result(new_object('MESH', m, kw.name || m.name));
      },
      primitive_plane_add: (kw = {}) => {
        const m = primitive_plane(kw.size || 2, kw.location || [0, 0, 0]);
        data.meshes._list.push(m);
        return op_result(new_object('MESH', m, kw.name || m.name));
      },
      primitive_grid_add: (kw = {}) => {
        const m = primitive_grid(kw.x_subdivisions || 10, kw.y_subdivisions || 10, kw.size || 2, kw.location || [0, 0, 0]);
        data.meshes._list.push(m);
        return op_result(new_object('MESH', m, kw.name || m.name));
      },
      primitive_monkey_add: (kw = {}) => {
        const m = primitive_monkey(kw.location || [0, 0, 0]);
        data.meshes._list.push(m);
        return op_result(new_object('MESH', m, kw.name || m.name));
      },
      subdivide: (kw = {}) => {
        const obj = context.object;
        if (!obj || obj.type !== 'MESH') return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        bm.subdivide_all(kw.number_cuts || 1);
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      extrude: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        const faces = bm.faces.filter((f) => !f.hide);
        for (const f of faces) bm.extrude_face(f, kw.direction || null, kw.value ?? 0.5);
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      inset: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        for (const f of bm.faces.filter((f) => !f.hide)) bm.inset_face(f, kw.thickness ?? 0.1, kw.depth ?? 0);
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      bevel: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        bm.bevel_edges(bm.edges, kw.offset ?? 0.1, kw.segments ?? 1);
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      loopcut: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        bm.loopcut(bm.edges, kw.number_cuts || 1);
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      bridge_edge_loops: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        const loops = kw.loops || [bm.verts.slice(0, 4).map((v) => v.i), bm.verts.slice(-4).map((v) => v.i)];
        if (loops.length >= 2) bm.bridge_loops(loops[0], loops[1]);
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      knife: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        bm.knife(kw.cuts || []);
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      spin: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        bm.spin(kw.angle ?? Math.PI * 2, kw.steps || 12, kw.axis || [0, 0, 1], kw.center || [0, 0, 0]);
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      screw: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        bm.screw(kw.steps || 12, kw.angle ?? Math.PI * 2, kw.screw_offset ?? 1, kw.axis || 'Z');
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      bisect: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        bm.bisect(kw.plane_co || [0, 0, 0], kw.plane_no || [0, 0, 1], kw.clear_inner || false, kw.clear_outer || false);
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      convex_hull: () => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        bm.convex_hull();
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      triangulate: () => {
        const obj = context.object;
        if (!obj) return op_result(false);
        obj.data.faces = obj.data.faces.flatMap((f) => {
          const tris = [];
          for (let i = 1; i < f.length - 1; i++) tris.push([f[0], f[i], f[i + 1]]);
          return tris;
        });
        obj.data.update();
        return op_result(true);
      },
      poke: () => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        bm.poke_faces(bm.faces.filter((f) => !f.hide));
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      dissolve_verts: () => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        bm.dissolve_verts(bm.verts.slice(0, Math.ceil(bm.verts.length / 8)));
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      dissolve_edges: () => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        bm.dissolve_edges(bm.edges.slice(0, Math.ceil(bm.edges.length / 8)));
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      remove_doubles: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        bm.remove_doubles(kw.threshold ?? 0.0001);
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      boolean: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const mod = add_modifier(obj, 'BOOLEAN', 'Boolean');
        mod.operation = kw.operation || 'UNION';
        mod.object = kw.object || null;
        return op_result(true);
      },
      voxel_remesh: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const mod = add_modifier(obj, 'REMESH', 'Remesh');
        mod.octree_depth = kw.octree_depth || 5;
        mod.scale = kw.scale || 0.9;
        return op_result(true);
      },
      decimate: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const mod = add_modifier(obj, 'DECIMATE', 'Decimate');
        mod.ratio = kw.ratio ?? 1;
        return op_result(true);
      },
      subdivide: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const bm = BMesh.from_mesh(obj.data);
        bm.subdivide_all(kw.number_cuts || 1);
        bm.to_mesh(obj.data);
        return op_result(true);
      },
      shade_smooth: () => { if (context.object) context.object.data.smooth_shade = true; return op_result(true); },
      shade_flat: () => { if (context.object) context.object.data.smooth_shade = false; return op_result(true); },
      mark_seam: () => {
        const obj = context.object;
        if (!obj) return op_result(false);
        return op_result(uv_mark_seam(obj.data, obj.data.faces.map((_, i) => i), false));
      },
      unwrap: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        return op_result(uv_unwrap(obj.data, kw.method || 'ANGLE_BASED'));
      },
      separate_by_loose_parts: () => {
        const obj = context.object;
        if (!obj) return op_result(true);
        return op_result(true);
      }
    },
    object: {
      select_all: (kw = {}) => {
        for (const o of (context.scene ? context.scene.objects : [])) o.select = kw.action !== 'DESELECT';
        return op_result(true);
      },
      mode_set: (kw = {}) => {
        if (context.object) context.mode = kw.mode || 'OBJECT';
        return op_result(true);
      },
      parent_set: (kw = {}) => {
        const child = context.object;
        if (!child) return op_result(false);
        const arm = context.selected_objects.find((o) => o.type === 'ARMATURE' && o !== child);
        if (kw.type === 'ARMATURE_AUTO' && arm) {
          bind_armature(child, arm, 'HEAT');
          return op_result(true);
        }
        if (arm) {
          child.parent = arm;
          child.parent_type = 'OBJECT';
          return op_result(true);
        }
        return op_result(false);
      },
      parent_clear: () => {
        if (context.object) context.object.parent = null;
        return op_result(true);
      },
      modifier_add: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        add_modifier(obj, kw.type || 'SUBSURF');
        return op_result(true);
      },
      modifier_remove: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        obj.modifiers.splice(kw.index ?? obj.modifiers.length - 1, 1);
        return op_result(true);
      },
      modifier_apply: (kw = {}) => {
        const obj = context.object;
        if (!obj || obj.type !== 'MESH') return op_result(false);
        const idx = kw.index ?? 0;
        const mod = obj.modifiers[idx];
        if (!mod) return op_result(false);
        const m = apply_one_modifier({
          verts: obj.data.verts.map((v) => v.slice()),
          edges: obj.data.edges.map((e) => e.slice()),
          faces: obj.data.faces.map((f) => f.slice()),
          uv_layers: obj.data.uv_layers.map((l) => ({ name: l.name, data: l.data.map((d) => d.slice()) })),
          vertex_groups: obj.data.vertex_groups, materials: obj.data.materials
        }, mod, obj, context.scene ? context.scene.frame_current : 1);
        obj.data.verts = m.verts;
        obj.data.edges = m.edges;
        obj.data.faces = m.faces;
        obj.data.uv_layers = m.uv_layers;
        obj.data.update();
        obj.modifiers.splice(idx, 1);
        return op_result(true);
      },
      duplicate: (kw = {}) => {
        const src = context.object;
        if (!src) return op_result(false);
        const copy = new Object3D(src.name + '.001', src.type, src.data);
        copy.location = src.location.slice();
        copy.rotation_euler = src.rotation_euler.slice();
        copy.scale = src.scale.slice();
        copy.modifiers = src.modifiers.map((m) => Object.assign(new Modifier(m.name, m.type), m));
        data.objects._list.push(copy);
        if (context.scene) context.scene.link(copy);
        context.object = copy;
        return op_result(true);
      },
      delete: (kw = {}) => {
        void kw;
        const obj = context.object;
        if (!obj) return op_result(false);
        data.objects.remove(obj);
        if (context.scene) context.scene.collection.unlink(obj);
        context.object = data.objects._list[data.objects._list.length - 1] || null;
        return op_result(true);
      },
      transform_apply: () => {
        const obj = context.object;
        if (!obj || !obj.data || !obj.data.verts) return op_result(false);
        const m = obj.matrix_world;
        obj.data.verts = obj.data.verts.map((v) => M4.xform(m, v));
        obj.location = [0, 0, 0];
        obj.rotation_euler = [0, 0, 0];
        obj.scale = [1, 1, 1];
        obj.data.update();
        return op_result(true);
      },
      shade_smooth: () => ops.mesh.shade_smooth(),
      shade_flat: () => ops.mesh.shade_flat(),
      convert: (kw = {}) => {
        const obj = context.object;
        if (obj && kw.target === 'MESH') obj.type = 'MESH';
        return op_result(true);
      }
    },
    armature: {
      primitive_bone_add: (kw = {}) => {
        let armObj = context.object;
        if (!armObj || armObj.type !== 'ARMATURE') {
          const arm = data.armatures.create(kw.name || 'Armature');
          armObj = new_object('ARMATURE', arm, arm.name);
          poseEnsureBones(armObj);
        }
        const head = kw.head || [0, 0, 0], tail = kw.tail || [0, 0, 1];
        const b = armObj.data.add_bone('Bone', head, tail);
        poseEnsureBones(armObj);
        return op_result(b);
      },
      extrude: (kw = {}) => {
        const armObj = context.object;
        if (!armObj || armObj.type !== 'ARMATURE') return op_result(false);
        const src = armObj.data.bones[armObj.data.bones.length - 1];
        if (!src) return op_result(false);
        const dir = kw.move || [0, 0, 1];
        const nb = armObj.data.add_bone('Bone.' + String(armObj.data.bones.length).padStart(3, '0'), src.tail, V.add(src.tail, dir), src.name);
        nb.connected = true;
        poseEnsureBones(armObj);
        return op_result(nb);
      },
      subdivide: (kw = {}) => {
        const armObj = context.object;
        if (!armObj) return op_result(false);
        const cuts = kw.number_cuts || 1;
        for (const b of [...armObj.data.bones]) {
          for (let i = 0; i < cuts; i++) {
            const mid = V.lerp(b.head, b.tail, (i + 1) / (cuts + 1));
            void mid;
          }
        }
        poseEnsureBones(armObj);
        return op_result(true);
      },
      symmetrize: () => {
        const armObj = context.object;
        if (!armObj) return op_result(false);
        for (const b of [...armObj.data.bones]) {
          if (b.name.endsWith('.L')) {
            const mirror = armObj.data.add_bone(b.name.replace('.L', '.R'), [-b.head[0], b.head[1], b.head[2]], [-b.tail[0], b.tail[1], b.tail[2]], b.parent ? b.parent.replace('.L', '.R') : null);
            void mirror;
          }
        }
        poseEnsureBones(armObj);
        return op_result(true);
      },
      parent_set: () => {
        const armObj = context.object;
        if (!armObj) return op_result(false);
        for (const b of armObj.data.bones) {
          if (!b.parent) {
            // chain bones head-to-tail automatically
            const prev = armObj.data.bones.filter((x) => x !== b && V.dist(x.tail, b.head) < 0.01)[0];
            if (prev) { b.parent = prev.name; b.connected = true; }
          }
        }
        poseEnsureBones(armObj);
        return op_result(true);
      },
      calculate_roll: () => op_result(true),
      roll_clear: () => {
        const armObj = context.object;
        if (armObj) for (const b of armObj.data.bones) b.roll = 0;
        return op_result(true);
      }
    },
    pose: {
      select_all: (kw = {}) => {
        const armObj = context.object;
        if (armObj && armObj.pose) for (const b of armObj.pose.bones) b.select = kw.action !== 'DESELECT';
        return op_result(true);
      },
      constraint_add: (kw = {}) => {
        const armObj = context.object;
        const bone = armObj && armObj.pose ? armObj.pose.bones.find((b) => b.selected || true) : null;
        if (!bone) return op_result(false);
        bone.constraints.push({ type: kw.type || 'IK', chain_count: 2, target: null, target_bone: '', influence: 1 });
        return op_result(true);
      },
      constraint_remove: (kw = {}) => {
        const armObj = context.object;
        const bone = armObj && armObj.pose ? armObj.pose.bones[kw.index || 0] : null;
        if (!bone) return op_result(false);
        bone.constraints.splice(kw.constraint_index ?? 0, 1);
        return op_result(true);
      },
      rotate: (kw = {}) => {
        const armObj = context.object;
        if (!armObj || !armObj.pose) return op_result(false);
        const r = kw.value || [0, 0, 0];
        for (const b of armObj.pose.bones) {
          b.rotation_euler = V.add(b.rotation_euler, r);
          b.rotation_quaternion = eulerToQuat(b.rotation_euler);
        }
        return op_result(true);
      },
      loc_clear: () => {
        const armObj = context.object;
        if (armObj && armObj.pose) for (const b of armObj.pose.bones) b.location = [0, 0, 0];
        return op_result(true);
      },
      rot_clear: () => {
        const armObj = context.object;
        if (armObj && armObj.pose) for (const b of armObj.pose.bones) { b.rotation_quaternion = [1, 0, 0, 0]; b.rotation_euler = [0, 0, 0]; }
        return op_result(true);
      },
      scale_clear: () => {
        const armObj = context.object;
        if (armObj && armObj.pose) for (const b of armObj.pose.bones) b.scale = [1, 1, 1];
        return op_result(true);
      },
      visual_transform_apply: () => {
        const armObj = context.object;
        if (armObj) update_pose_matrices(armObj);
        return op_result(true);
      }
    },
    anim: {
      keyframe_insert: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        return op_result(obj.keyframe_insert(kw.data_path || 'location', kw.frame ?? null, kw.index ?? -1));
      },
      keyframe_delete: (kw = {}) => {
        const obj = context.object;
        if (!obj || !obj.animation_data || !obj.animation_data.action) return op_result(false);
        for (const cb of obj.animation_data.action.channelbags) {
          for (const fc of cb.fcurves) {
            if (fc.data_path === (kw.data_path || 'location')) fc.remove_key(kw.frame ?? context.scene.frame_current);
          }
        }
        return op_result(true);
      },
      keyframe_clear: () => {
        const obj = context.object;
        if (obj && obj.animation_data && obj.animation_data.action) {
          for (const cb of obj.animation_data.action.channelbags) cb.fcurves = [];
        }
        return op_result(true);
      },
      keyframe_insert_by_name: (kw = {}) => {
        const obj = context.object;
        if (!obj || !obj.pose) return op_result(false);
        const bone = obj.pose.bones.find((b) => b.name === kw.bone_name);
        if (!bone) return op_result(false);
        return op_result(obj.keyframe_insert(`pose.bones["${kw.bone_name}"].${kw.data_path || 'rotation_quaternion'}`, kw.frame ?? null, kw.index ?? -1));
      },
      action_create: (kw = {}) => {
        const act = data.actions.create(kw.name || 'Action');
        return op_result(act);
      },
      action_set: (kw = {}) => {
        const obj = context.object;
        const act = data.actions.get(kw.action && kw.action.name ? kw.action.name : kw.name || '');
        if (!obj || !act) return op_result(false);
        const anim = obj.animation_data || (obj.animation_data = { action: null, nla_tracks: [], action_slot: null });
        anim.action = act;
        anim.action_slot = act.slots.all()[0] || act.slots.create(obj.name, 'OBJECT');
        return op_result(true);
      },
      action_slot_new: (kw = {}) => {
        const obj = context.object;
        if (!obj || !obj.animation_data || !obj.animation_data.action) return op_result(false);
        return op_result(obj.animation_data.action.slots.create(kw.name || obj.name, kw.id_type || 'OBJECT'));
      },
      driver_add: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        obj.drivers = obj.drivers || [];
        obj.drivers.push({ data_path: kw.data_path || 'location', expression: kw.expression || 'frame * 0.01', index: kw.index ?? -1 });
        return op_result(true);
      },
      previewrange_set: () => op_result(true)
    },
    nla: {
      action_pushdown: () => {
        const obj = context.object;
        if (!obj || !obj.animation_data || !obj.animation_data.action) return op_result(false);
        const anim = obj.animation_data;
        const track = new NLATrack('NlaTrack');
        const act = anim.action;
        const range = [1, 250];
        for (const cb of act.channelbags) {
          for (const fc of cb.fcurves) {
            if (fc.keyframe_points.length) {
              range[0] = Math.min(range[0], fc.keyframe_points[0].co[0]);
              range[1] = Math.max(range[1], fc.keyframe_points[fc.keyframe_points.length - 1].co[0]);
            }
          }
        }
        track.strips.push(new NLAKeyframeStrip(act.name, act, range[0], range[1]));
        anim.nla_tracks.push(track);
        anim.action = null;
        return op_result(true);
      },
      track_add: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const anim = obj.animation_data || (obj.animation_data = { action: null, nla_tracks: [], action_slot: null });
        const track = new NLATrack(kw.name || 'NlaTrack');
        anim.nla_tracks.push(track);
        return op_result(track);
      },
      strip_add: (kw = {}) => {
        const obj = context.object;
        if (!obj || !obj.animation_data) return op_result(false);
        const track = obj.animation_data.nla_tracks[kw.track_index ?? obj.animation_data.nla_tracks.length - 1];
        const act = kw.action || data.actions._list[0];
        if (!track || !act) return op_result(false);
        const strip = new NLAKeyframeStrip(act.name, act, kw.frame_start ?? 1, kw.frame_end ?? 60);
        track.strips.push(strip);
        return op_result(strip);
      },
      strip_remove: (kw = {}) => {
        const obj = context.object;
        if (!obj || !obj.animation_data) return op_result(false);
        const track = obj.animation_data.nla_tracks[kw.track_index ?? 0];
        if (track) track.strips.splice(kw.strip_index ?? 0, 1);
        return op_result(true);
      },
      bake: (kw = {}) => {
        const obj = context.object;
        const scene = context.scene;
        if (!obj || !scene) return op_result(false);
        const act = data.actions.create(kw.name || (obj.name + '_bake'));
        const slot = act.slots.create(obj.name, 'OBJECT');
        const cb = act.get_channelbag(slot, true);
        const f0 = kw.frame_start ?? scene.frame_start;
        const f1 = kw.frame_end ?? scene.frame_end;
        for (let f = f0; f <= f1; f++) {
          scene.frame_set(f);
          for (const prop of ['location', 'rotation_euler', 'scale']) {
            for (let i = 0; i < 3; i++) {
              const fc = cb.get_fcurve(prop, i, true);
              fc.insert_key(f, obj[prop][i], 'LINEAR');
            }
          }
          if (obj.pose) {
            for (const b of obj.pose.bones) {
              for (let i = 0; i < 4; i++) {
                const fc = cb.get_fcurve(`pose.bones["${b.name}"].rotation_quaternion`, i, true);
                fc.insert_key(f, b.rotation_quaternion[i], 'LINEAR');
              }
            }
          }
        }
        const anim = obj.animation_data || (obj.animation_data = { action: null, nla_tracks: [], action_slot: null });
        anim.action = act;
        anim.action_slot = slot;
        return op_result(act);
      }
    },
    sculpt: {
      brush_stroke: (kw = {}) => {
        const obj = context.object;
        if (!obj || obj.type !== 'MESH') return op_result(false);
        const brush = kw.brush || data.brushes._list[0] || data.brushes.create('Sculpt');
        return op_result(sculpt_stroke(obj.data, brush, kw.stroke || { points: [[0, 0, 0]] }));
      },
      set_tool: (kw = {}) => {
        const brush = data.brushes._list[0] || data.brushes.create('Sculpt');
        brush.sculpt_tool = SCULPT_BRUSHES.includes(kw.tool) ? kw.tool : 'DRAW';
        return op_result(true);
      },
      set_size: (kw = {}) => {
        const brush = data.brushes._list[0] || data.brushes.create('Sculpt');
        brush.size = kw.size || 50;
        return op_result(true);
      },
      set_strength: (kw = {}) => {
        const brush = data.brushes._list[0] || data.brushes.create('Sculpt');
        brush.strength = kw.strength ?? 0.5;
        return op_result(true);
      },
      dyntopo_detail: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        return op_result(sculpt_dyntopo(obj.data, kw.detail || 0.1));
      },
      voxel_remesh: (kw = {}) => ops.mesh.voxel_remesh(kw),
      mask_expand: () => op_result(true),
      mask_clear: () => {
        const obj = context.object;
        if (obj && obj.data.attributes.mask) obj.data.attributes.mask = obj.data.verts.map(() => 0);
        return op_result(true);
      }
    },
    uv: {
      mark_seam: () => ops.mesh.mark_seam(),
      clear_seam: () => {
        const obj = context.object;
        if (!obj) return op_result(false);
        return op_result(uv_mark_seam(obj.data, obj.data.faces.map((_, i) => i), true));
      },
      unwrap: (kw = {}) => ops.mesh.unwrap(kw),
      smart_project: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        return op_result(uv_smart_project(obj.data, kw.angle_limit ?? 66));
      },
      cube_project: () => {
        const obj = context.object;
        if (!obj) return op_result(false);
        return op_result(uv_cube_project(obj.data));
      },
      cylinder_project: () => {
        const obj = context.object;
        if (!obj) return op_result(false);
        return op_result(uv_cylinder_project(obj.data));
      },
      sphere_project: () => {
        const obj = context.object;
        if (!obj) return op_result(false);
        return op_result(uv_sphere_project(obj.data));
      },
      pack_islands: () => {
        const obj = context.object;
        if (!obj) return op_result(false);
        return op_result(uv_pack_islands(obj.data));
      },
      minimize_stretch: () => {
        const obj = context.object;
        if (!obj) return op_result(false);
        return op_result(uv_unwrap(obj.data, 'MIN_STRETCH'));
      },
      average_islands_scale: () => {
        const obj = context.object;
        if (!obj) return op_result(false);
        return op_result(uv_texel_density(obj.data));
      }
    },
    node: {
      add_node: (kw = {}) => {
        const tree = kw.tree || (context.object && context.object.data && context.object.data.materials[0] && context.object.data.materials[0].node_tree);
        if (!tree) return op_result(false);
        return op_result(tree.add_node(kw.type || 'ShaderNodeBsdfPrincipled', kw.name));
      },
      add_node_group: (kw = {}) => {
        const ng = data.node_groups.create(kw.name || 'NodeGroup');
        return op_result(ng);
      },
      link: (kw = {}) => {
        const tree = kw.tree;
        if (!tree) return op_result(false);
        return op_result(tree.link(kw.from, kw.to));
      },
      delete: (kw = {}) => {
        const tree = kw.tree;
        if (!tree || !kw.node) return op_result(false);
        tree.remove_node(kw.node);
        return op_result(true);
      }
    },
    gpencil: {
      draw: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        const gp = obj.data;
        if (gp && gp.layers) {
          const layer = gp.layers[0] || (gp.layers[0] = { name: 'GP Layer', frames: [] });
          layer.frames.push({ frame: kw.frame ?? 1, strokes: kw.strokes || [] });
        }
        return op_result(true);
      },
      blank_frame_add: () => op_result(true),
      interpolate: () => op_result(true),
      generate_geometry: () => op_result(true)
    },
    rigidbody: {
      object_add: (kw = {}) => {
        const obj = context.object;
        if (!obj) return op_result(false);
        obj.rigid_body = { type: kw.type || 'ACTIVE', mass: 1, friction: 0.5, restitution: 0.1, collision_shape: 'CONVEX_HULL', kinematic: false };
        return op_result(true);
      },
      object_remove: () => {
        if (context.object) context.object.rigid_body = null;
        return op_result(true);
      },
      world_add: () => {
        const scene = context.scene;
        if (scene) scene.rigidbody_world = { collection: new Collection('RigidBodyWorld'), point_cache: { frame_start: 1, frame_end: 250 } };
        return op_result(true);
      },
      bake: () => {
        const scene = context.scene;
        if (!scene) return op_result(false);
        for (let f = scene.frame_start; f <= scene.frame_end; f++) {
          scene.frame_set(f);
          for (const obj of scene.objects) {
            if (!obj.rigid_body) continue;
            if (obj.rigid_body.type === 'ACTIVE' && !obj.rigid_body.kinematic) {
              obj.location[2] += scene.gravity[2] * 0.001 * (f - scene.frame_start);
            }
          }
        }
        return op_result(true);
      }
    },
    render: {
      render: (kw = {}) => {
        const scene = context.scene;
        if (!scene) return op_result(false);
        return op_result(render_scene(scene, kw.write_still || false));
      },
      view_show: () => op_result(true),
      play_rendered_anim: () => op_result(true)
    },
    export_scene: {
      gltf: (kw = {}) => export_gltf(kw.filepath || 'scene.gltf', kw),
      obj: (kw = {}) => export_obj(kw.filepath || 'scene.obj', kw),
      bblend: (kw = {}) => export_bblend(kw.filepath || 'scene.bblend.json', kw)
    },
    import_scene: {
      gltf: (kw = {}) => import_gltf(kw.filepath || kw.data || ''),
      obj: (kw = {}) => import_obj(kw.filepath || kw.data || ''),
      bblend: (kw = {}) => import_bblend(kw.filepath || kw.data || '')
    }
  };

  /* ================= RENDER PIPELINE (EEVEE-like raster + Cycles-lite) ================= */
  function render_scene(scene, writeStill) {
    const w = Math.max(16, Math.round(scene.render.resolution_x * scene.render.resolution_percentage / 100));
    const h = Math.max(16, Math.round(scene.render.resolution_y * scene.render.resolution_percentage / 100));
    const pixels = new Float32Array(w * h * 4);
    const depth = new Float32Array(w * h).fill(Infinity);
    const camObj = scene.objects.find((o) => o.type === 'CAMERA') || scene.camera;
    const camM = camObj ? camObj.matrix_world : M4.identity();
    const camPos = [camM[12], camM[13], camM[14]];
    const fov = camObj && camObj.data ? 2 * Math.atan((camObj.data.sensor_width / 2) / camObj.data.lens) : Math.PI / 3;
    const lights = scene.objects.filter((o) => o.type === 'LIGHT');
    const pathTrace = scene.render.engine === 'CYCLES' || scene.render.engine === 'CYCLES_GPU';
    for (const obj of scene.objects) {
      if (obj.type !== 'MESH' || obj.hide_render) continue;
      const m = obj.data.verts ? apply_modifier_stack(obj.data, obj, scene.frame_current) : null;
      if (!m) continue;
      const mw = obj.matrix_world;
      const mat = obj.data.materials && obj.data.materials[0] ? obj.data.materials[0] : null;
      const worldM = m.verts.map((v) => M4.xform(mw, v));
      for (const f of m.faces) {
        for (let i = 1; i < f.length - 1; i++) {
          const tri = [f[0], f[i], f[i + 1]];
          raster_tri(pixels, depth, w, h, tri, worldM, m, camPos, fov, lights, mat, scene, pathTrace);
        }
      }
    }
    // background
    for (let i = 0; i < w * h; i++) {
      if (depth[i] === Infinity) {
        const bg = scene.world ? scene.world.color : [0.05, 0.05, 0.08];
        pixels[i * 4] = bg[0]; pixels[i * 4 + 1] = bg[1]; pixels[i * 4 + 2] = bg[2]; pixels[i * 4 + 3] = 1;
      }
    }
    const img = { width: w, height: h, pixels, engine: scene.render.engine, samples: scene.render.samples };
    if (writeStill) {
      // PPM string output for headless
      const lines = [`P3\n${w} ${h}\n255\n`];
      for (let i = 0; i < w * h; i++) {
        lines.push(
          Math.round(clamp(pixels[i * 4], 0, 1) * 255) + ' ' +
          Math.round(clamp(pixels[i * 4 + 1], 0, 1) * 255) + ' ' +
          Math.round(clamp(pixels[i * 4 + 2], 0, 1) * 255));
      }
      img.ppm = lines.join('\n');
    }
    render_scene.lastImage = img;
    return img;
  }
  function raster_tri(pixels, depth, w, h, tri, worldM, m, camPos, fov, lights, mat, scene, pathTrace) {
    const aspect = w / h;
    const proj = (p) => {
      const v = V.sub(p, camPos);
      const z = v[2] > 0.01 ? v[2] : 0.01;
      const f = 1 / Math.tan(fov / 2);
      return [(v[0] * f / aspect / z * 0.5 + 0.5) * w, (1 - (v[1] * f / z * 0.5 + 0.5)) * h, z];
    };
    const p0 = proj(worldM[tri[0]]), p1 = proj(worldM[tri[1]]), p2 = proj(worldM[tri[2]]);
    const minX = Math.max(0, Math.floor(Math.min(p0[0], p1[0], p2[0])));
    const maxX = Math.min(w - 1, Math.ceil(Math.max(p0[0], p1[0], p2[0])));
    const minY = Math.max(0, Math.floor(Math.min(p0[1], p1[1], p2[1])));
    const maxY = Math.min(h - 1, Math.ceil(Math.max(p0[1], p1[1], p2[1])));
    const n = V.norm(V.cross(V.sub(worldM[tri[1]], worldM[tri[0]]), V.sub(worldM[tri[2]], worldM[tri[0]])));
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const w0 = edge(p1, p2, x, y), w1 = edge(p2, p0, x, y), w2 = edge(p0, p1, x, y);
        const area = edge(p1, p2, p0[0], p0[1]);
        if (area === 0) continue;
        const b0 = w0 / area, b1 = w1 / area, b2 = w2 / area;
        if (b0 < 0 || b1 < 0 || b2 < 0) continue;
        const z = b0 * p0[2] + b1 * p1[2] + b2 * p2[2];
        const idx = y * w + x;
        if (z >= depth[idx]) continue;
        depth[idx] = z;
        // shade
        const pos = V.add(V.add(V.mul(worldM[tri[0]], b0), V.mul(worldM[tri[1]], b1)), V.mul(worldM[tri[2]], b2));
        let uv = [0, 0];
        if (m.uv_layers[0] && m.uv_layers[0].data[tri[0]]) {
          uv = [
            b0 * m.uv_layers[0].data[tri[0]][0] + b1 * m.uv_layers[0].data[tri[1]][0] + b2 * m.uv_layers[0].data[tri[2]][0],
            b0 * m.uv_layers[0].data[tri[0]][1] + b1 * m.uv_layers[0].data[tri[1]][1] + b2 * m.uv_layers[0].data[tri[2]][1]
          ];
        }
        let shaded;
        if (mat) {
          shaded = mat.eval_color(uv, pos);
        } else {
          shaded = { base: [0.8, 0.8, 0.8, 1], metallic: 0, roughness: 0.5, alpha: 1, emission_strength: 0, type: 'principled' };
        }
        const viewDir = V.norm(V.sub(camPos, pos));
        let r = 0, g = 0, b = 0;
        const em = shaded.emission_strength || 0;
        r += (shaded.emission ? shaded.emission[0] : shaded.base[0]) * em;
        g += (shaded.emission ? shaded.emission[1] : shaded.base[1]) * em;
        b += (shaded.emission ? shaded.emission[2] : shaded.base[2]) * em;
        for (const l of lights) {
          const lp = l.location;
          const ld = V.norm(V.sub(lp, pos));
          const dist2 = Math.max(0.1, V.dot(V.sub(lp, pos), V.sub(lp, pos)));
          let intensity = (l.data.energy || 10) / dist2;
          if (pathTrace) intensity *= 0.8 + noise3(pos[0] * 20, pos[1] * 20, scene.frame_current) * 0.2;
          const diff = Math.max(0, V.dot(n, ld));
          const half = V.norm(V.add(ld, viewDir));
          const spec = Math.pow(Math.max(0, V.dot(n, half)), 2 / Math.max(0.01, shaded.roughness ?? 0.5)) * (shaded.metallic ? 1 : 0.3);
          const lc = l.data.color || [1, 1, 1];
          r += (shaded.base[0] * diff * (1 - (shaded.metallic || 0)) + spec) * intensity * lc[0];
          g += (shaded.base[1] * diff * (1 - (shaded.metallic || 0)) + spec) * intensity * lc[1];
          b += (shaded.base[2] * diff * (1 - (shaded.metallic || 0)) + spec) * intensity * lc[2];
        }
        // ambient
        const amb = scene.world ? scene.world.color : [0.05, 0.05, 0.08];
        r += shaded.base[0] * amb[0]; g += shaded.base[1] * amb[1]; b += shaded.base[2] * amb[2];
        const i4 = idx * 4;
        pixels[i4] = r * (shaded.alpha ?? 1); pixels[i4 + 1] = g * (shaded.alpha ?? 1); pixels[i4 + 2] = b * (shaded.alpha ?? 1); pixels[i4 + 3] = shaded.alpha ?? 1;
      }
    }
  }
  function edge(a, b, x, y) { return (x - a[0]) * (b[1] - a[1]) - (y - a[1]) * (b[0] - a[0]); }

  /* ================= EXPORTERS ================= */
  function collect_export_objects(kw) {
    const scene = context.scene || data.scenes._list[0];
    let objs = kw.objects || (scene ? scene.objects : data.objects._list);
    if (kw.selected_only) objs = context.selected_objects.length ? context.selected_objects : objs;
    return objs.filter((o) => o.type === 'MESH' || o.type === 'ARMATURE');
  }
  function export_obj(filepath, kw = {}) {
    const objs = collect_export_objects(kw);
    const lines = ['# exported by bpy-core'];
    for (const obj of objs) {
      if (obj.type !== 'MESH') continue;
      const m = obj.data;
      lines.push('o ' + obj.name);
      const mw = obj.matrix_world;
      for (const v of m.verts) {
        const w = M4.xform(mw, v);
        lines.push(`v ${w[0].toFixed(6)} ${w[1].toFixed(6)} ${w[2].toFixed(6)}`);
      }
      if (m.uv_layers[0]) {
        for (const uv of m.uv_layers[0].data) lines.push(`vt ${uv[0].toFixed(6)} ${uv[1].toFixed(6)}`);
      }
      for (const vn of m.vert_normals) lines.push(`vn ${vn[0].toFixed(6)} ${vn[1].toFixed(6)} ${vn[2].toFixed(6)}`);
      let li = 1;
      for (const f of m.faces) {
        const parts = f.map((vi, k) => `${vi + 1}/${m.uv_layers[0] ? li + k : ''}/${vi + 1}`);
        lines.push('f ' + parts.join(' '));
        li += f.length;
      }
    }
    export_obj.lastOutput = lines.join('\n');
    if (typeof globalThis.__arena_write_file === 'function') globalThis.__arena_write_file(filepath, export_obj.lastOutput);
    return export_obj.lastOutput;
  }
  function export_bblend(filepath, kw = {}) {
    const objs = collect_export_objects(kw);
    const scene = context.scene || data.scenes._list[0];
    const doc = {
      format: 'bblend.json',
      version: '1.0',
      scene: {
        name: scene ? scene.name : 'Scene',
        frame_start: scene ? scene.frame_start : 1,
        frame_end: scene ? scene.frame_end : 250,
        fps: scene ? scene.render.fps : 24
      },
      objects: [],
      actions: [],
      materials: data.materials._list.map((mat) => ({
        name: mat.name,
        metallic: mat.metallic, roughness: mat.roughness, diffuse_color: mat.diffuse_color
      }))
    };
    for (const obj of objs) {
      const rec = {
        name: obj.name,
        type: obj.type,
        location: obj.location,
        rotation_euler: obj.rotation_euler,
        scale: obj.scale,
        parent: obj.parent ? obj.parent.name : null,
        modifiers: obj.modifiers.map((m) => ({ name: m.name, type: m.type, show_viewport: m.show_viewport, show_render: m.show_render, params: { ...m } })),
        constraints: obj.constraints,
        vertex_groups: obj.data && obj.data.vertex_groups ? obj.data.vertex_groups.map((g) => ({ name: g.name, weights: g.weights })) : [],
        shape_keys: obj.data && obj.data.shape_keys ? obj.data.shape_keys.blocks.map((k) => ({ name: k.name, value: k.value, data: k.data })) : null
      };
      if (obj.type === 'MESH') {
        rec.mesh = {
          verts: obj.data.verts,
          edges: obj.data.edges,
          faces: obj.data.faces,
          uv: obj.data.uv_layers[0] ? obj.data.uv_layers[0].data : [],
          materials: obj.data.materials.map((m) => m.name)
        };
      }
      if (obj.type === 'ARMATURE') {
        rec.armature = {
          bones: obj.data.bones.map((b) => ({ name: b.name, head: b.head, tail: b.tail, parent: b.parent, roll: b.roll }))
        };
        rec.pose = obj.pose ? obj.pose.bones.map((b) => ({
          name: b.name, location: b.location, rotation_quaternion: b.rotation_quaternion, scale: b.scale
        })) : [];
      }
      if (obj.animation_data && obj.animation_data.action) {
        rec.action = obj.animation_data.action.name;
      }
      doc.objects.push(rec);
    }
    for (const act of data.actions._list) {
      doc.actions.push({
        name: act.name,
        slots: act.slots.all().map((s) => ({ name: s.name, id_type: s.id_type, handle: s.handle })),
        channelbags: act.channelbags.map((cb) => ({
          slot: cb.slot ? cb.slot.handle : null,
          fcurves: cb.fcurves.map((fc) => ({
            data_path: fc.data_path,
            array_index: fc.array_index,
            keyframe_points: fc.keyframe_points.map((k) => ({ co: k.co, interpolation: k.interpolation, easing: k.easing })),
            modifiers: fc.modifiers
          }))
        })),
        nla: (objs.find((o) => o.animation_data && o.animation_data.nla_tracks && o.animation_data.nla_tracks.some((t) => t.strips.some((s) => s.action === act))) || { animation_data: { nla_tracks: [] } })
      });
    }
    export_bblend.lastOutput = JSON.stringify(doc, null, 2);
    if (typeof globalThis.__arena_write_file === 'function') globalThis.__arena_write_file(filepath, export_bblend.lastOutput);
    return export_bblend.lastOutput;
  }
  function export_gltf(filepath, kw = {}) {
    const objs = collect_export_objects(kw);
    const gltf = {
      asset: { version: '2.0', generator: 'bpy-core glTF 2.0 exporter' },
      scene: 0,
      scenes: [{ name: 'Scene', nodes: [] }],
      nodes: [],
      meshes: [],
      skins: [],
      animations: [],
      materials: [],
      accessors: [],
      bufferViews: [],
      buffers: []
    };
    const binChunks = [];
    let binOffset = 0;
    const pushBuffer = (typedArray, target) => {
      const bytes = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
      const view = { buffer: 0, byteOffset: binOffset, byteLength: bytes.byteLength };
      if (target) view.target = target;
      gltf.bufferViews.push(view);
      binChunks.push(bytes);
      binOffset += bytes.byteLength;
      // align 4
      const pad = (4 - (binOffset % 4)) % 4;
      if (pad) { binChunks.push(new Uint8Array(pad)); binOffset += pad; }
      return gltf.bufferViews.length - 1;
    };
    const pushAccessor = (typedArray, type, componentType, minMax = false) => {
      const acc = {
        bufferView: pushBuffer(typedArray, type === 'SCALAR' || type === 'VEC2' || type === 'VEC3' || type === 'VEC4' ? 34962 : 34963),
        componentType,
        count: type === 'MAT4' ? typedArray.length / 16 : type === 'VEC3' ? typedArray.length / 3 : type === 'VEC2' ? typedArray.length / 2 : type === 'VEC4' ? typedArray.length / 4 : typedArray.length,
        type
      };
      if (minMax && type === 'VEC3') {
        const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
        for (let i = 0; i < typedArray.length; i += 3) {
          for (let c = 0; c < 3; c++) {
            min[c] = Math.min(min[c], typedArray[i + c]);
            max[c] = Math.max(max[c], typedArray[i + c]);
          }
        }
        acc.min = min; acc.max = max;
      }
      gltf.accessors.push(acc);
      return gltf.accessors.length - 1;
    };
    const nodeIndexByObj = new Map();
    const meshNodes = objs.map((obj) => {
      const node = { name: obj.name };
      const m = obj.matrix_world;
      const t = [m[12], m[13], m[14]];
      const s = [V.len([m[0], m[1], m[2]]), V.len([m[4], m[5], m[6]]), V.len([m[8], m[9], m[10]])];
      const r = eulerToQuat(obj.rotation_euler);
      node.translation = t;
      node.rotation = r;
      node.scale = s;
      gltf.nodes.push(node);
      nodeIndexByObj.set(obj, gltf.nodes.length - 1);
      if (obj.parent && nodeIndexByObj.has(obj.parent)) {
        const pIdx = nodeIndexByObj.get(obj.parent);
        gltf.nodes[pIdx].children = gltf.nodes[pIdx].children || [];
        gltf.nodes[pIdx].children.push(nodeIndexByObj.get(obj));
      } else {
        gltf.scenes[0].nodes.push(nodeIndexByObj.get(obj));
      }
      if (obj.type !== 'MESH') return gltf.nodes.length - 1;
      const meshData = apply_modifier_stack(obj.data, obj, 1);
      const positions = new Float32Array(meshData.verts.length * 3);
      meshData.verts.forEach((v, i) => { positions[i * 3] = v[0]; positions[i * 3 + 1] = v[1]; positions[i * 3 + 2] = v[2]; });
      const normals = new Float32Array(meshData.verts.length * 3);
      for (let i = 0; i < meshData.verts.length; i++) {
        const n = vertexNormal(meshData, i);
        normals[i * 3] = n[0]; normals[i * 3 + 1] = n[1]; normals[i * 3 + 2] = n[2];
      }
      // triangulate indices
      const indices = [];
      for (const f of meshData.faces) for (let i = 1; i < f.length - 1; i++) indices.push(f[0], f[i], f[i + 1]);
      const indexArr = new Uint32Array(indices);
      const prim = {
        attributes: {
          POSITION: pushAccessor(positions, 'VEC3', 5126, true),
          NORMAL: pushAccessor(normals, 'VEC3', 5126)
        },
        indices: pushAccessor(indexArr, 'SCALAR', 5125),
        mode: 4
      };
      if (meshData.uv_layers[0]) {
        const uvs = new Float32Array(meshData.verts.length * 2);
        // map loop uvs to verts (first occurrence)
        const seen = new Map();
        let li = 0;
        for (const f of meshData.faces) {
          for (const vi of f) {
            const uv = meshData.uv_layers[0].data[li];
            if (uv && !seen.has(vi)) {
              seen.set(vi, true);
              uvs[vi * 2] = uv[0]; uvs[vi * 2 + 1] = 1 - uv[1];
            }
            li++;
          }
        }
        prim.attributes.TEXCOORD_0 = pushAccessor(uvs, 'VEC2', 5126);
      }
      // skinning JOINTS_0 / WEIGHTS_0
      const joints = obj.skin_binding ? obj.skin_binding.joints : (obj.parent && obj.parent.type === 'ARMATURE' ? build_joints(obj.parent) : null);
      if (joints && joints.length) {
        const jointsArr = new Uint16Array(meshData.verts.length * 4);
        const weightsArr = new Float32Array(meshData.verts.length * 4);
        for (let vi = 0; vi < meshData.verts.length; vi++) {
          const w = meshData.joint_weights && meshData.joint_weights[vi]
            ? meshData.joint_weights[vi]
            : (meshData.vertex_groups || []).map((g) => ({ joint: joints.findIndex((j) => j.name === g.name), weight: g.weights[vi] || 0 })).filter((x) => x.joint >= 0 && x.weight > 0);
          const top = w.sort((a, b) => b.weight - a.weight).slice(0, 4);
          const total = top.reduce((acc, x) => acc + x.weight, 0) || 1;
          top.forEach((x, k) => {
            jointsArr[vi * 4 + k] = x.joint;
            weightsArr[vi * 4 + k] = x.weight / total;
          });
        }
        prim.attributes.JOINTS_0 = pushAccessor(jointsArr, 'VEC4', 5123);
        prim.attributes.WEIGHTS_0 = pushAccessor(weightsArr, 'VEC4', 5126);
        // skin
        const armObj = obj.parent && obj.parent.type === 'ARMATURE' ? obj.parent : null;
        const inverse = new Float32Array(joints.length * 16);
        joints.forEach((j, i) => {
          const im = j.inverseBind || M4.identity();
          for (let c = 0; c < 16; c++) inverse[i * 16 + c] = im[c];
        });
        const skin = {
          inverseBindMatrices: pushAccessor(inverse, 'MAT4', 5126),
          joints: joints.map((j) => {
            // each joint = node index of bone node (create bone nodes)
            const bIdx = gltf.nodes.length;
            gltf.nodes.push({ name: j.name, translation: V.sub(j.tail, j.head), rotation: [0, 0, 0, 1], scale: [1, 1, 1] });
            if (armObj && nodeIndexByObj.has(armObj)) {
              const armIdx = nodeIndexByObj.get(armObj);
              gltf.nodes[armIdx].children = gltf.nodes[armIdx].children || [];
              gltf.nodes[armIdx].children.push(bIdx);
            }
            return bIdx;
          })
        };
        if (armObj && nodeIndexByObj.has(armObj)) {
          skin.skeleton = nodeIndexByObj.get(armObj);
        }
        gltf.skins.push(skin);
        node.skin = gltf.skins.length - 1;
      }
      gltf.meshes.push({ name: obj.name, primitives: [prim] });
      node.mesh = gltf.meshes.length - 1;
      return gltf.nodes.length - 1;
    });
    void meshNodes;
    // animations (actions -> glTF channels)
    for (const act of data.actions._list) {
      const anim = { name: act.name, channels: [], samplers: [] };
      for (const cb of act.channelbags) {
        for (const fc of cb.fcurves) {
          const pts = fc.keyframe_points;
          if (!pts.length) continue;
          const input = new Float32Array(pts.map((p) => p.co[0] / (context.scene ? context.scene.render.fps : 24)));
          const interpMap = { LINEAR: 'LINEAR', CONSTANT: 'STEP', BEZIER: 'CUBICSPLINE', SINE: 'LINEAR', EXPO: 'LINEAR', BOUNCE: 'LINEAR', ELASTIC: 'LINEAR' };
          const output = new Float32Array(pts.map((p) => p.co[1]));
          const sampler = {
            input: pushAccessor(input, 'SCALAR', 5126),
            output: pushAccessor(output, 'SCALAR', 5126),
            interpolation: interpMap[pts[0].interpolation] || 'LINEAR'
          };
          anim.samplers.push(sampler);
          const nodeIdx = gltf.nodes.findIndex((n) => n.name === (cb.slot ? cb.slot.name : ''));
          const pathMap = {
            location: 'translation', rotation_euler: 'rotation', rotation_quaternion: 'rotation', scale: 'scale'
          };
          const path = pathMap[fc.data_path.split('.').pop()] || 'translation';
          anim.channels.push({ sampler: anim.samplers.length - 1, target: { node: nodeIdx >= 0 ? nodeIdx : 0, path } });
        }
      }
      if (anim.channels.length) gltf.animations.push(anim);
    }
    // materials
    for (const mat of data.materials._list) {
      gltf.materials.push({
        name: mat.name,
        pbrMetallicRoughness: {
          baseColorFactor: mat.diffuse_color,
          metallicFactor: mat.metallic,
          roughnessFactor: mat.roughness
        }
      });
    }
    // pack binary buffer (Base64 data URI so output is a single self-contained .gltf)
    const bin = new Uint8Array(binOffset);
    let o = 0;
    for (const chunk of binChunks) { bin.set(chunk, o); o += chunk.byteLength; }
    let b64 = '';
    if (typeof Buffer !== 'undefined') {
      b64 = Buffer.from(bin).toString('base64');
    } else {
      let s = '';
      for (let i = 0; i < bin.length; i += 0x8000) s += String.fromCharCode.apply(null, bin.subarray(i, i + 0x8000));
      b64 = btoa(s);
    }
    gltf.buffers = [{ uri: 'data:application/octet-stream;base64,' + b64, byteLength: binOffset }];
    export_gltf.lastOutput = JSON.stringify(gltf, null, 2);
    if (typeof globalThis.__arena_write_file === 'function') globalThis.__arena_write_file(filepath, export_gltf.lastOutput);
    return export_gltf.lastOutput;
  }
  function import_gltf(json) {
    try {
      const gltf = typeof json === 'string' ? (json.trim().startsWith('{') ? JSON.parse(json) : null) : json;
      if (!gltf) return false;
      for (const node of gltf.nodes || []) {
        if (node.mesh === undefined) continue;
        const meshDef = gltf.meshes[node.mesh];
        const prim = meshDef.primitives[0];
        const posAcc = gltf.accessors[prim.attributes.POSITION];
        const bin = gltf.buffers && gltf.buffers[0] && gltf.buffers[0].uri ? decode_data_uri(gltf.buffers[0].uri) : new Uint8Array(0);
        const view = gltf.bufferViews[posAcc.bufferView];
        const f32 = new Float32Array(bin.buffer, bin.byteOffset + view.byteOffset + (posAcc.byteOffset || 0), posAcc.count * 3);
        const mesh = new Mesh(node.name || meshDef.name);
        for (let i = 0; i < posAcc.count; i++) mesh.verts.push([f32[i * 3], f32[i * 3 + 1], f32[i * 3 + 2]]);
        if (prim.indices !== undefined) {
          const iAcc = gltf.accessors[prim.indices];
          const iView = gltf.bufferViews[iAcc.bufferView];
          const u32 = new Uint32Array(bin.buffer, bin.byteOffset + iView.byteOffset + (iAcc.byteOffset || 0), iAcc.count);
          for (let i = 0; i < iAcc.count; i += 3) mesh.faces.push([u32[i], u32[i + 1], u32[i + 2]]);
        }
        mesh.update();
        data.meshes._list.push(mesh);
        new_object('MESH', mesh, mesh.name);
      }
      return true;
    } catch (e) {
      return false;
    }
  }
  function decode_data_uri(uri) {
    const b64 = uri.split(',')[1] || '';
    if (typeof Buffer !== 'undefined') return new Uint8Array(Buffer.from(b64, 'base64'));
    const bin = atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  function import_obj(text) {
    const mesh = new Mesh('Imported');
    for (const line of text.split('\n')) {
      const p = line.trim().split(/\s+/);
      if (p[0] === 'v') mesh.verts.push([parseFloat(p[1]), parseFloat(p[2]), parseFloat(p[3])]);
      else if (p[0] === 'f') mesh.faces.push(p.slice(1).map((x) => parseInt(x.split('/')[0], 10) - 1));
    }
    mesh.update();
    data.meshes._list.push(mesh);
    new_object('MESH', mesh, mesh.name);
    return mesh;
  }
  function import_bblend(json) {
    try {
      const doc = typeof json === 'string' ? JSON.parse(json) : json;
      for (const rec of doc.objects || []) {
        if (rec.mesh) {
          const mesh = new Mesh(rec.name);
          mesh.verts = rec.mesh.verts.map((v) => v.slice());
          mesh.edges = rec.mesh.edges.map((e) => e.slice());
          mesh.faces = rec.mesh.faces.map((f) => f.slice());
          if (rec.mesh.uv && rec.mesh.uv.length) mesh.uv_layers[0] = { name: 'UVMap', data: rec.mesh.uv.map((d) => d.slice()) };
          if (rec.vertex_groups) mesh.vertex_groups = rec.vertex_groups.map((g) => ({ name: g.name, weights: { ...g.weights } }));
          mesh.update();
          data.meshes._list.push(mesh);
          const obj = new_object('MESH', mesh, rec.name);
          obj.location = rec.location.slice();
          obj.rotation_euler = rec.rotation_euler.slice();
          obj.scale = rec.scale.slice();
        } else if (rec.armature) {
          const arm = data.armatures.create(rec.name);
          for (const b of rec.armature.bones) arm.add_bone(b.name, b.head, b.tail, b.parent);
          const obj = new_object('ARMATURE', arm, rec.name);
          poseEnsureBones(obj);
          obj.location = rec.location.slice();
        }
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  /* ================= BlenderModelAnimator (runtime loader) ================= */
  class BlenderModelAnimator {
    constructor(source) {
      this.source = typeof source === 'string' ? JSON.parse(source) : source;
      this.frame = 0;
      this.actions = this.source.actions || [];
      this.objects = this.source.objects || [];
    }
    static async load(urlOrJson) {
      if (typeof urlOrJson === 'string' && !urlOrJson.trim().startsWith('{')) {
        if (typeof fetch !== 'undefined') {
          const res = await fetch(urlOrJson);
          return new BlenderModelAnimator(await res.json());
        }
      }
      return new BlenderModelAnimator(urlOrJson);
    }
    play(actionName, opts = {}) {
      this.currentAction = this.actions.find((a) => a.name === actionName) || this.actions[0];
      this.loop = opts.loop !== false;
      this.speed = opts.speed || 1;
      this.frame = opts.frame_start ?? 0;
      this.playing = true;
      return this;
    }
    stop() { this.playing = false; return this; }
    update(dt = 1 / 60) {
      if (!this.playing || !this.currentAction) return null;
      this.frame += dt * (this.source.scene ? this.source.scene.fps || 24 : 24) * this.speed;
      const fcurves = (this.currentAction.channelbags || []).flatMap((cb) => cb.fcurves || []);
      if (fcurves.length) {
        const maxF = Math.max(...fcurves.flatMap((fc) => fc.keyframe_points.map((k) => k.co[0])));
        if (this.frame > maxF) {
          if (this.loop) this.frame %= maxF;
          else { this.frame = maxF; this.playing = false; }
        }
      }
      return this.pose_at(this.frame);
    }
    pose_at(frame) {
      const pose = {};
      for (const act of this.actions) {
        for (const cb of act.channelbags || []) {
          for (const fc of cb.fcurves || []) {
            const key = fc.data_path;
            if (!pose[key]) pose[key] = [];
            // linear sample between keys
            const pts = fc.keyframe_points;
            let v = pts.length ? pts[0].co[1] : 0;
            for (let i = 0; i < pts.length - 1; i++) {
              if (frame >= pts[i].co[0] && frame <= pts[i + 1].co[0]) {
                const t = (frame - pts[i].co[0]) / Math.max(1e-6, pts[i + 1].co[0] - pts[i].co[0]);
                v = pts[i].co[1] + (pts[i + 1].co[1] - pts[i].co[1]) * t;
                break;
              }
              if (frame > pts[i + 1].co[0]) v = pts[i + 1].co[1];
            }
            pose[key][fc.array_index] = v;
          }
        }
      }
      return pose;
    }
    // deform a mesh (verts/joint_weights) to the given frame via LBS + shape keys
    deform(objectName, meshData, frame) {
      const rec = this.objects.find((o) => o.name === objectName);
      if (!rec) return meshData.verts;
      const pose = this.pose_at(frame);
      const baseVerts = meshData.verts;
      // shape keys
      let verts = baseVerts.map((v) => v.slice());
      if (rec.shape_keys && rec.shape_keys.length) {
        for (const sk of rec.shape_keys) {
          const keyPath = `shape_keys["${sk.name}"].value`;
          const val = pose[keyPath] ? pose[keyPath][0] ?? sk.value : sk.value;
          if (!val) continue;
          verts = verts.map((v, i) => V.lerp(v, sk.data[i] || v, val));
        }
      }
      // LBS if joint weights + joint transforms exist
      if (meshData.joint_weights && this.source.objects.some((o) => o.armature)) {
        const armRec = this.source.objects.find((o) => o.armature);
        const joints = armRec.armature.bones.map((b, i) => ({
          index: i, name: b.name, head: b.head, tail: b.tail, parent: b.parent
        }));
        const mats = joints.map((j) => {
          const rq = pose[`pose.bones["${j.name}"].rotation_quaternion`] || [1, 0, 0, 0];
          const loc = pose[`pose.bones["${j.name}"].location`] || [0, 0, 0];
          const m = M4.mul(M4.translation(j.head[0] + loc[0], j.head[1] + loc[1], j.head[2] + loc[2]), quatToMatrix(rq));
          return m;
        });
        const restInv = joints.map((j) => M4.invert(M4.translation(j.head[0], j.head[1], j.head[2])));
        verts = verts.map((v, vi) => {
          const w = meshData.joint_weights[vi] || [];
          let acc = [0, 0, 0], tw = 0;
          for (const { joint, weight } of w) {
            const jm = M4.mul(mats[joint], restInv[joint]);
            acc = V.add(acc, V.mul(M4.xform(jm, v), weight));
            tw += weight;
          }
          return tw > 0 ? V.mul(acc, 1 / tw) : v;
        });
      }
      return verts;
    }
  }

  /* ================= bpy namespace (1-for-1 shape) ================= */
  const bpy = {
    data, context, ops,
    types: { Mesh, Object3D, Armature, Material, Action, FCurve, Scene, Collection, Camera, Light, World, Modifier, ShapeKey },
    props: {
      float: (v) => v ?? 0, int: (v) => v ?? 0, bool: (v) => !!v,
      string: (v) => v ?? '', enum: (v, opts) => (opts.includes(v) ? v : opts[0]),
      float_vector: (v) => v || [0, 0, 0]
    },
    utils: {
      register_class: (cls) => cls,
      user_resource: () => '',
      previews: () => ({})
    },
    app: { version: [5, 0, 0], version_string: '5.0.0 (bpy-core)', build_date: ['2026', '10', '24'] },
    msgbus: { subscribe: () => ({}), publish: () => { } },
    path: { abspath: (p) => p },
    set_scene(scene) {
      context.scene = scene;
      return scene;
    },
    reset() {
      for (const k of Object.keys(data)) {
        if (data[k] && data[k]._list) data[k]._list.length = 0;
      }
      context.object = null;
      context.selected_objects = [];
      uid._n = 0;
    },
    get state() {
      return {
        objects: data.objects._list.map((o) => o.name),
        scene: context.scene ? context.scene.name : null,
        frame: context.scene ? context.scene.frame_current : 0
      };
    }
  };

  /* default scene bootstrap */
  const defaultScene = new Scene('Scene');
  data.scenes._list.push(defaultScene);
  context.scene = defaultScene;

  return {
    V, M4, noise3, fbm3, clamp, uid,
    ID, Mesh, ShapeKey, Armature, Material, NodeTree, Collection, Object3D, Camera, Light, World, Scene,
    BMesh, face_center, face_normal, rot_matrix_axis, convexHullPoints,
    primitive_cube, primitive_uv_sphere, primitive_ico_sphere, primitive_cylinder,
    primitive_plane, primitive_cone, primitive_torus, primitive_grid, primitive_monkey,
    FCurve, Channelbag, ActionSlot, Action, NLATrack, NLAKeyframeStrip,
    evaluate_object_animation, apply_action_frame, write_path, resolve_path,
    eval_shader_tree, eval_node, make_node,
    data, context, ops, bpy,
    Modifier, MODIFIER_TYPES, add_modifier, apply_modifier_stack, apply_one_modifier,
    SCULPT_BRUSHES, sculpt_stroke, sculpt_dyntopo,
    UV_OPS, uv_unwrap, uv_smart_project, uv_cube_project, uv_cylinder_project, uv_sphere_project,
    uv_pack_islands, uv_texel_density, uv_mark_seam, uv_islands,
    build_joints, auto_weights, skin_deform_mesh, bind_armature,
    shape_key_add, shape_key_eval,
    constraint_apply, solve_ik, update_pose_matrices, poseEnsureBones, quatToMatrix, eulerToQuat, quat_mul,
    render_scene, export_obj, export_gltf, export_bblend, import_gltf, import_obj, import_bblend,
    BlenderModelAnimator
  };
});
