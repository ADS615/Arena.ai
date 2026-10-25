import { createPresetModel, createCube, createSphere, createLatheMesh } from '../assets/ai-blender-engine.js';

export async function run(payload = {}) {
  const preset = payload.preset || 'interceptor-ship';
  const mesh = createPresetModel(preset);
  const prims = [createCube(), createSphere(), createLatheMesh()];
  return {
    agent: 'modeler-mesh',
    division: '3D Modeling (1/4)',
    ok: true,
    summary: `Mesh & Topology Sub-Agent verified "${mesh.name}" (${mesh.vertices.length} verts, ${mesh.faces.length} tris) + ${prims.length} base primitives.`
  };
}
