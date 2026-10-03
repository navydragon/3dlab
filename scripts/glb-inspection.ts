import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Asset3D } from '../src/domain/asset3d.ts';

const index = z.number().int().nonnegative();
const gltfSchema = z.object({
  asset: z.object({ version: z.literal('2.0') }),
  nodes: z.array(
    z.object({
      name: z.string().min(1),
      children: z.array(index).default([]),
      mesh: index.optional(),
      extras: z.record(z.string(), z.unknown()).default({}),
      translation: z.array(z.number()).optional(),
      rotation: z.array(z.number()).optional(),
      scale: z.array(z.number()).optional(),
    }),
  ),
  meshes: z.array(
    z.object({
      name: z.string(),
      primitives: z.array(
        z.object({
          indices: index,
          attributes: z.record(z.string(), index),
          material: index,
          mode: z.number().optional(),
        }),
      ),
    }),
  ),
  materials: z.array(z.object({ name: z.string() }).passthrough()),
  accessors: z.array(
    z.object({
      bufferView: index,
      byteOffset: index.default(0),
      componentType: z.number(),
      count: index,
      type: z.string(),
    }),
  ),
  bufferViews: z.array(
    z.object({
      byteOffset: index.default(0),
      byteLength: index,
      byteStride: index.optional(),
    }),
  ),
  buffers: z.array(z.object({ byteLength: index, uri: z.string().optional() })),
  animations: z.array(
    z.object({
      name: z.string(),
      channels: z.array(
        z.object({
          sampler: index,
          target: z.object({ node: index, path: z.string() }),
        }),
      ),
      samplers: z.array(
        z.object({
          input: index,
          output: index,
          interpolation: z.string().default('LINEAR'),
        }),
      ),
    }),
  ),
  scenes: z.array(z.object({ nodes: z.array(index) })),
  scene: index,
  images: z.array(z.unknown()).default([]),
  textures: z.array(z.unknown()).default([]),
  cameras: z.array(z.unknown()).default([]),
  skins: z.array(z.unknown()).default([]),
});
export type Glb = ReturnType<typeof inspectGlb>;
export const canonicalNodes = [
  'NODE_UNDERCARRIAGE',
  'NODE_UPPERSTRUCTURE',
  'NODE_BOOM',
  'NODE_STICK',
  'NODE_BUCKET',
];
function requireValue<T>(value: T | undefined, message: string): T {
  if (value === undefined) throw new Error(message);
  return value;
}
export function inspectGlb(bytes: Buffer) {
  if (
    bytes.toString('ascii', 0, 4) !== 'glTF' ||
    bytes.readUInt32LE(4) !== 2 ||
    bytes.readUInt32LE(8) !== bytes.length ||
    bytes.readUInt32LE(16) !== 0x4e4f534a
  )
    throw new Error('Invalid GLB header');
  const jsonEnd = 20 + bytes.readUInt32LE(12);
  const gltf = gltfSchema.parse(
    JSON.parse(bytes.toString('utf8', 20, jsonEnd)),
  );
  if (
    bytes.readUInt32LE(jsonEnd + 4) !== 0x004e4942 ||
    jsonEnd + 8 + bytes.readUInt32LE(jsonEnd) !== bytes.length
  )
    throw new Error('Invalid embedded GLB buffer');
  const binary = bytes.subarray(jsonEnd + 8);
  if (
    gltf.buffers.length !== 1 ||
    gltf.buffers[0]?.uri ||
    (gltf.buffers[0]?.byteLength ?? Infinity) > binary.length
  )
    throw new Error('External/missing buffer');
  function floats(accessorIndex: number) {
    const a = requireValue(gltf.accessors[accessorIndex], 'Missing accessor');
    const view = requireValue(
      gltf.bufferViews[a.bufferView],
      'Missing bufferView',
    );
    const size = requireValue(
      ({ SCALAR: 1, VEC3: 3, VEC4: 4 } as Record<string, number>)[a.type],
      'Unsupported animation accessor',
    );
    if (a.componentType !== 5126) throw new Error('Animation must use floats');
    return Array.from({ length: a.count }, (_, i) =>
      Array.from({ length: size }, (_, j) => {
        const offset =
          view.byteOffset +
          a.byteOffset +
          i * (view.byteStride ?? size * 4) +
          j * 4;
        if (offset + 4 > view.byteOffset + view.byteLength)
          throw new Error('Accessor out of bounds');
        const value = binary.readFloatLE(offset);
        if (!Number.isFinite(value)) throw new Error('Nonfinite animation');
        return value;
      }),
    );
  }
  const names = gltf.nodes.map((n) => n.name);
  if (new Set(names).size !== names.length)
    throw new Error('Ambiguous node names');
  const parents = new Map<number, number>();
  gltf.nodes.forEach((node, parent) =>
    node.children.forEach((child) => {
      if (!gltf.nodes[child] || parents.has(child))
        throw new Error('Invalid hierarchy');
      parents.set(child, parent);
    }),
  );
  const nodes = gltf.nodes.map((node, i) => {
    const visited = new Set([i]);
    let parent = parents.get(i);
    while (parent !== undefined) {
      if (visited.has(parent)) throw new Error('Cyclic hierarchy');
      visited.add(parent);
      parent = parents.get(parent);
    }
    const mesh =
      node.mesh === undefined
        ? undefined
        : requireValue(gltf.meshes[node.mesh], 'Missing mesh');
    return {
      name: node.name,
      parent: parents.has(i) ? names[parents.get(i)!] : null,
      children: node.children.map((j) => names[j]),
      mesh: mesh?.name ?? null,
      materials:
        mesh?.primitives.map(
          (p) =>
            requireValue(gltf.materials[p.material], 'Missing material').name,
        ) ?? [],
      extras: node.extras,
      restTRS: {
        translation: node.translation ?? [0, 0, 0],
        rotation: node.rotation ?? [0, 0, 0, 1],
        scale: node.scale ?? [1, 1, 1],
      },
    };
  });
  const clips = gltf.animations.map((animation) => {
    const times = animation.samplers.flatMap((s) => floats(s.input).flat());
    const start = Math.min(...times),
      end = Math.max(...times);
    const channels = animation.channels.map((channel) => {
      const sampler = requireValue(
        animation.samplers[channel.sampler],
        'Missing sampler',
      );
      const values = floats(sampler.output);
      const first = requireValue(values[0], 'Empty animation');
      const last = requireValue(values.at(-1), 'Empty animation');
      const direct = Math.max(...first.map((x, i) => Math.abs(x - last[i]!)));
      const negated = Math.max(...first.map((x, i) => Math.abs(x + last[i]!)));
      return {
        node: requireValue(names[channel.target.node], 'Missing animated node'),
        path: channel.target.path,
        interpolation: sampler.interpolation,
        endpointError:
          channel.target.path === 'rotation'
            ? Math.min(direct, negated)
            : direct,
      };
    });
    const animated = [...new Set(channels.map((c) => c.node))].sort();
    return {
      name: animation.name,
      startSeconds: start,
      durationSeconds: end - start,
      loopable: channels.every((c) => c.endpointError < 2e-5),
      channels,
      animatedCanonicalNodes: animated.filter((n) =>
        canonicalNodes.includes(n),
      ),
      animatedAuxiliaryNodes: animated.filter(
        (n) => !canonicalNodes.includes(n),
      ),
    };
  });
  let triangles = 0;
  for (const mesh of gltf.meshes)
    for (const primitive of mesh.primitives) {
      if ((primitive.mode ?? 4) !== 4)
        throw new Error('Non-triangle primitive');
      triangles +=
        requireValue(gltf.accessors[primitive.indices], 'Missing indices')
          .count / 3;
    }
  return {
    sha256: createHash('sha256').update(bytes).digest('hex'),
    sizeBytes: bytes.length,
    nodes,
    materials: gltf.materials,
    clips,
    statistics: {
      nodes: nodes.length,
      meshes: nodes.filter((n) => n.mesh !== null).length,
      triangles,
      materials: gltf.materials.length,
      textures: gltf.textures.length,
    },
    technicalResources:
      gltf.images.length + gltf.cameras.length + gltf.skins.length,
    roots: requireValue(
      gltf.scenes[gltf.scene],
      'Missing active scene',
    ).nodes.map((i) => names[i]),
  };
}

// Only explicit metadata policies classify production meshes. Names/indices never
// infer educational identity. The six nonselectable linkage meshes remain auxiliary.
export function componentFor(node: Glb['nodes'][number]): string {
  if (typeof node.extras.edu_component === 'string')
    return node.extras.edu_component;
  if (
    node.extras.edu_role === 'auxiliary' &&
    node.extras.edu_subsystem === 'bucket-linkage'
  )
    return 'bucket-cylinder';
  throw new Error('Unclassified production mesh: ' + node.name);
}

export function validateMapping(asset: Asset3D, glb: Glb) {
  const evidence = requireValue(
    asset.production,
    'Missing production manifest',
  );
  if (evidence.sha256 !== glb.sha256 || evidence.sizeBytes !== glb.sizeBytes)
    throw new Error('GLB integrity mismatch');
  if (JSON.stringify(evidence.statistics) !== JSON.stringify(glb.statistics))
    throw new Error('Statistics mismatch');
  const meshes = glb.nodes.filter((n) => n.mesh !== null);
  const mapped = new Set<string>();
  for (const mapping of asset.nodeMappings) {
    if (!mapping.sceneNodes.length) throw new Error('Empty component mapping');
    for (const name of mapping.sceneNodes) {
      const node = requireValue(
        meshes.find((n) => n.name === name),
        'Missing mapped production mesh: ' + name,
      );
      if (
        mapped.has(name) ||
        componentFor(node) !== mapping.componentId ||
        node.extras.edu_machine !== asset.subjectId
      )
        throw new Error('Ambiguous/wrong component mapping: ' + name);
      mapped.add(name);
    }
  }
  if (mapped.size !== meshes.length)
    throw new Error('Unmapped production meshes');
  canonicalNodes.forEach((name, i) => {
    const node = requireValue(
      glb.nodes.find((n) => n.name === name),
      'Missing canonical node',
    );
    if (node.mesh !== null || node.parent !== (canonicalNodes[i - 1] ?? null))
      throw new Error('Canonical chain mismatch');
  });
  if (
    JSON.stringify(evidence.canonicalNodes) !== JSON.stringify(canonicalNodes)
  )
    throw new Error('Canonical manifest mismatch');
  if (
    glb.technicalResources ||
    glb.statistics.textures ||
    glb.roots.length !== 1 ||
    glb.nodes.some((n) => n.mesh === null && !canonicalNodes.includes(n.name))
  )
    throw new Error('Unexpected technical resource/helper');
  if (
    asset.animationMappings.length !== glb.clips.length ||
    evidence.clips.length !== glb.clips.length
  )
    throw new Error('Clip count mismatch');
  for (const clip of glb.clips) {
    const record = requireValue(
      evidence.clips.find((c) => c.name === clip.name),
      'Missing clip evidence',
    );
    if (
      !asset.animationMappings.some((m) => m.clip === clip.name) ||
      record.durationSeconds !== clip.durationSeconds ||
      record.loopable !== clip.loopable ||
      JSON.stringify(record.animatedCanonicalNodes) !==
        JSON.stringify(clip.animatedCanonicalNodes) ||
      JSON.stringify(record.animatedAuxiliaryNodes) !==
        JSON.stringify(clip.animatedAuxiliaryNodes)
    )
      throw new Error('Clip contract mismatch');
  }
}
