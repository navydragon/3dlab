import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  inspectGlb,
  validateMapping,
  componentFor,
} from '../../scripts/glb-inspection';
import { stage09 } from '../../scripts/stage_09_assets';
import { asset3dSchema } from '../../src/content/schemas/asset3d';
import { readAssetMetadataFiles } from '../../scripts/asset-metadata-files';

const root = new URL('../../', import.meta.url);
const bytes = await readFile(
  new URL('models/xe215c/stage_08/excavator.glb', root),
);
const glb = inspectGlb(bytes);
const asset = asset3dSchema.parse(
  JSON.parse(await readFile(new URL('content/3d/xe215c.json', root), 'utf8')),
);
type Mutable<T> = T extends string | number | boolean | undefined | null
  ? T
  : { -readonly [P in keyof T]: Mutable<T[P]> };
const mutableAsset = () =>
  structuredClone(asset) as unknown as Mutable<typeof asset>;

describe('real production XE215C mapping', () => {
  it('validates domain IDs, manifest, public bytes, inspection and immutable hashes', async () => {
    await expect(stage09()).resolves.toBeDefined();
    const files = await readAssetMetadataFiles(new URL('content/3d/', root));
    expect(
      files.some((file) => asset3dSchema.parse(file.data).id === asset.id),
    ).toBe(true);
  });
  it('provides complete disjoint mesh sets for selection/highlight/hide/isolate', () => {
    const meshNames = new Set(
      glb.nodes.filter((n) => n.mesh !== null).map((n) => n.name),
    );
    const all = new Set(asset.nodeMappings.flatMap((m) => m.sceneNodes));
    expect(all).toEqual(meshNames);
    expect(all.size).toBe(101);
    expect(asset.nodeMappings).toHaveLength(9);
    for (const mapping of asset.nodeMappings) {
      expect(mapping.sceneNodes.length).toBeGreaterThan(0);
      const target = new Set(mapping.sceneNodes);
      const isolated = glb.nodes.filter(
        (n) => n.mesh !== null && target.has(n.name),
      );
      const remaining = glb.nodes.filter(
        (n) => n.mesh !== null && !target.has(n.name),
      );
      expect(isolated.map((n) => n.name).sort()).toEqual(
        [...mapping.sceneNodes].sort(),
      );
      expect(isolated.length + remaining.length).toBe(101);
      expect(
        isolated.every((n) => componentFor(n) === mapping.componentId),
      ).toBe(true);
    }
  });
  it('keeps nonselectable linkage auxiliary classification explicit', () => {
    const auxiliaries = glb.nodes.filter(
      (n) => n.mesh !== null && n.extras.edu_role === 'auxiliary',
    );
    expect(auxiliaries).toHaveLength(6);
    expect(
      auxiliaries.every(
        (n) =>
          n.extras.edu_selectable === false &&
          componentFor(n) === 'bucket-cylinder',
      ),
    ).toBe(true);
    expect(
      asset.nodeMappings.find((m) => m.componentId === 'bucket-cylinder')
        ?.sceneNodes,
    ).toHaveLength(11);
  });
  it('detects stale integrity, dangling names, omitted meshes, wrong IDs and changed canonical chain', () => {
    const stale = mutableAsset();
    stale.production!.sha256 = '0'.repeat(64);
    expect(() => validateMapping(stale, glb)).toThrow('integrity');
    const dangling = mutableAsset();
    dangling.nodeMappings[0]!.sceneNodes[0] = 'PIVOT_BUCKET';
    expect(() => validateMapping(dangling, glb)).toThrow('Missing mapped');
    const missing = mutableAsset();
    missing.nodeMappings[0]!.sceneNodes.pop();
    expect(() => validateMapping(missing, glb)).toThrow('Unmapped');
    const wrong = mutableAsset();
    wrong.nodeMappings[0]!.sceneNodes.push('boom');
    expect(() => validateMapping(wrong, glb)).toThrow('wrong component');
    const broken = structuredClone(glb);
    broken.nodes.find((n) => n.name === 'NODE_BUCKET')!.parent = 'NODE_BOOM';
    expect(() => validateMapping(asset, broken)).toThrow('Canonical chain');
  });
  it('finds one loopable visual clip by name with seconds, independent of rest TRS', () => {
    expect(glb.clips).toHaveLength(1);
    const clip = glb.clips.find(
      (c) => c.name === asset.animationMappings[0]?.clip,
    );
    expect(clip?.name).toBe('excavator_work_cycle_demo');
    expect(clip?.durationSeconds).toBeCloseTo(280 / 24, 5);
    expect(clip?.loopable).toBe(true);
    expect(clip?.animatedCanonicalNodes).toEqual([
      'NODE_BOOM',
      'NODE_BUCKET',
      'NODE_STICK',
      'NODE_UPPERSTRUCTURE',
    ]);
    expect(clip?.animatedAuxiliaryNodes).toHaveLength(20);
    expect(asset.production?.clips[0]?.timingSemantics).toBe(
      'visual-demonstration',
    );
  });
  it('resolves identical name mappings after actual GLB node indices are reversed', () => {
    // Repack only a test buffer; production GLB remains immutable. Update all
    // index references, keeping its semantic graph and animation unchanged.
    const jsonEnd = 20 + bytes.readUInt32LE(12);
    const json: {
      nodes: { children?: number[] }[];
      scenes: { nodes: number[] }[];
      animations: { channels: { target: { node: number } }[] }[];
    } = JSON.parse(bytes.toString('utf8', 20, jsonEnd));
    const reindex = (i: number) => json.nodes.length - 1 - i;
    json.nodes.reverse();
    for (const node of json.nodes)
      if (node.children) node.children = node.children.map(reindex);
    for (const scene of json.scenes) scene.nodes = scene.nodes.map(reindex);
    for (const clip of json.animations)
      for (const channel of clip.channels)
        channel.target.node = reindex(channel.target.node);
    const rawJson = Buffer.from(JSON.stringify(json));
    const padded = Buffer.alloc(Math.ceil(rawJson.length / 4) * 4, 32);
    rawJson.copy(padded);
    const header = Buffer.alloc(20);
    header.write('glTF');
    header.writeUInt32LE(2, 4);
    header.writeUInt32LE(20 + padded.length + bytes.length - jsonEnd, 8);
    header.writeUInt32LE(padded.length, 12);
    header.writeUInt32LE(0x4e4f534a, 16);
    const reordered = inspectGlb(
      Buffer.concat([header, padded, bytes.subarray(jsonEnd)]),
    );
    const changed = mutableAsset();
    changed.production!.sha256 = reordered.sha256;
    changed.production!.sizeBytes = reordered.sizeBytes;
    expect(() => validateMapping(changed, reordered)).not.toThrow();
    expect(reordered.nodes[0]?.name).not.toBe(glb.nodes[0]?.name);
  });
});
