// Meshy GLB → game GLB. Shape is kept as received unless a triangle target is
// given; textures become 1024px WebP. Reproduce from assets/models/raw/:
//   npm i --no-save @gltf-transform/core@4.1.1 @gltf-transform/extensions@4.1.1 @gltf-transform/functions@4.1.1 meshoptimizer@0.22.0 sharp@0.33.5
//   node scripts/optimize-models.mjs assets/models/raw/butterfly-egg-meshy.glb assets/models/butterfly-egg.glb 48000
//   node scripts/optimize-models.mjs assets/models/raw/butterfly-larva-meshy.glb assets/models/butterfly-larva.glb
// Do not decimate in Blender: its glTF import splits vertices at UV seams and
// Decimate then pulls the two sides apart, which is what tore the earlier models.
// meshoptimizer keeps seam vertices together, and this script refuses to write a
// model that gained open edges (holes) compared with the raw file.
import { NodeIO } from '@gltf-transform/core';
import { EXTTextureWebP } from '@gltf-transform/extensions';
import { dedup, prune, weld, simplify, textureCompress } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';

const [raw, out, target] = process.argv.slice(2);
if (!raw || !out) throw new Error('Usage: node scripts/optimize-models.mjs <raw.glb> <out.glb> [targetTriangles]');
const io = new NodeIO().registerExtensions([EXTTextureWebP]);
const doc = await io.read(raw);

// Open edges after merging vertices that share a position; zero-area triangles are skipped.
function openEdges(d) {
  let open = 0, tris = 0;
  for (const mesh of d.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
    const pos = prim.getAttribute('POSITION'), idx = prim.getIndices(), ids = new Map(), id = [];
    for (let i = 0; i < pos.getCount(); i++) {
      const key = pos.getElement(i, []).map(v => Math.round(v * 1e6)).join(',');
      if (!ids.has(key)) ids.set(key, ids.size);
      id.push(ids.get(key));
    }
    const edges = new Map(), n = idx ? idx.getCount() : pos.getCount(), at = i => id[idx ? idx.getScalar(i) : i];
    for (let i = 0; i < n; i += 3) {
      const t = [at(i), at(i + 1), at(i + 2)];
      tris++;
      if (new Set(t).size < 3) continue;
      for (const [a, b] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]) {
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        edges.set(key, (edges.get(key) || 0) + 1);
      }
    }
    for (const count of edges.values()) if (count === 1) open++;
  }
  return { tris, open };
}

const before = openEdges(doc);
const steps = [dedup(), prune()];
if (target) {
  await MeshoptSimplifier.ready;
  steps.push(weld(), simplify({ simplifier: MeshoptSimplifier, ratio: Number(target) / before.tris, error: 0.002, lockBorder: true }));
}
steps.push(textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 88 }), prune());
await doc.transform(...steps);
const after = openEdges(doc);
if (after.open > before.open) throw new Error(`Simplification opened ${after.open - before.open} edges; not writing ${out}`);
await io.write(out, doc);
console.log(JSON.stringify({ raw, out, before, after }));
