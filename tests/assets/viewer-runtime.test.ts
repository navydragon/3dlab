import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Mesh } from 'three';
import metadata from '../../content/3d/xe215c.json';
import { asset3dSchema } from '../../src/content/schemas/asset3d';
import { SceneRuntime } from '../../src/visualization/scene-runtime';
import {
  animationClip,
  assetUrl,
  resolveMappings,
  showAll,
} from '../../src/visualization/viewer-logic';
const asset = asset3dSchema.parse(metadata);
const bucket = asset.nodeMappings.find((m) => m.componentId === 'bucket')!;
const boom = asset.nodeMappings.find((m) => m.componentId === 'boom')!;
async function runtime() {
  const buffer = await readFile(
    new URL('../../public/' + asset.uri, import.meta.url),
  );
  const gltf = await new GLTFLoader().parseAsync(
    buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ),
    '',
  );
  return new SceneRuntime(
    gltf.scene,
    asset,
    gltf.animations,
    'excavator-working-cycle',
  );
}
function transforms(r: SceneRuntime) {
  const result: number[][] = [];
  r.scene.traverse((o) =>
    result.push([...o.position, ...o.quaternion, ...o.scale]),
  );
  return result;
}
describe('production renderer logic', () => {
  it('resolves root/subpath/absolute configured bases without a root shortcut', () => {
    expect(assetUrl(asset.uri, '/')).toBe('/' + asset.uri);
    expect(assetUrl(asset.uri, '/laboratory/')).toBe(
      '/laboratory/' + asset.uri,
    );
    expect(assetUrl(asset.uri, 'https://example.test/lab')).toBe(
      'https://example.test/lab/' + asset.uri,
    );
  });
  it('requires all declared meshes exactly once and reports missing/duplicate/group nodes', () => {
    const nodes = asset.nodeMappings.flatMap((m) =>
      m.sceneNodes.map((name) => ({ name, mesh: true, selectable: true })),
    );
    expect(
      resolveMappings(asset, nodes).components.get(bucket.componentId),
    ).toEqual(bucket.sceneNodes);
    expect(() => resolveMappings(asset, nodes.slice(1))).toThrow();
    expect(() => resolveMappings(asset, [...nodes, nodes[0]!])).toThrow();
    expect(() =>
      resolveMappings(
        asset,
        nodes.map((n, i) => ({ ...n, mesh: i !== 0 })),
      ),
    ).toThrow();
  });
  it('resolves real GLTFLoader meshes and excludes all six auxiliary direct hits', async () => {
    const r = await runtime();
    expect(r.originals.size).toBe(101);
    for (const m of asset.nodeMappings)
      for (const name of m.sceneNodes) {
        const node = r.scene.getObjectByName(name)!;
        expect(r.mappings.hits.get(name)).toBe(
          node.userData.edu_selectable === true ? m.componentId : undefined,
        );
      }
    expect(r.mappings.hits.size).toBe(95);
    r.dispose();
  });
  it('highlights full mesh sets reversibly, keeps other materials untouched and disposes clones', async () => {
    const r = await runtime();
    const mesh = r.scene.getObjectByName(bucket.sceneNodes[0]!) as Mesh;
    const original = mesh.material;
    r.select(bucket.componentId);
    let disposed = false;
    const highlighted = Array.isArray(mesh.material)
      ? mesh.material[0]!
      : mesh.material;
    highlighted.addEventListener('dispose', () => {
      disposed = true;
    });
    for (const [object, material] of r.originals)
      expect(object.material === material).toBe(
        !bucket.sceneNodes.includes(object.name),
      );
    r.select(boom.componentId);
    expect(mesh.material).toBe(original);
    expect(disposed).toBe(true);
    r.select(null);
    expect(
      [...r.originals].every(
        ([object, material]) => object.material === material,
      ),
    ).toBe(true);
    r.dispose();
  });
  it('hide/isolate/show-all target meshes while preserving canonical groups and transforms', async () => {
    const r = await runtime();
    const neutral = transforms(r);
    r.visibility({ hidden: [bucket.componentId], isolated: null });
    for (const [mesh] of r.originals)
      expect(mesh.visible).toBe(!bucket.sceneNodes.includes(mesh.name));
    r.visibility({ hidden: [], isolated: bucket.componentId });
    for (const [mesh] of r.originals)
      expect(mesh.visible).toBe(bucket.sceneNodes.includes(mesh.name));
    for (const name of asset.production!.canonicalNodes)
      expect(r.scene.getObjectByName(name)?.visible).toBe(true);
    r.visibility(showAll);
    expect([...r.originals.keys()].every((mesh) => mesh.visible)).toBe(true);
    expect(transforms(r)).toEqual(neutral);
    r.dispose();
  });
  it('uses explicit mapped clips and distinguishes missing mapping/actual clip', () => {
    expect(animationClip(asset, [], 'unknown')).toEqual({
      status: 'unsupported',
      reason: 'unmapped',
    });
    expect(
      animationClip(asset, ['unrelated'], 'excavator-working-cycle'),
    ).toEqual({ status: 'unsupported', reason: 'missing-clip' });
    expect(
      animationClip(
        asset,
        [asset.animationMappings[0]!.clip],
        'excavator-working-cycle',
      ).status,
    ).toBe('available');
  });
  it('pauses without pose change and repeatedly restores exact static neutral, not digging time zero', async () => {
    const r = await runtime();
    const neutral = transforms(r);
    for (let repeat = 0; repeat < 5; repeat++) {
      r.play();
      r.update(0.01);
      expect(transforms(r)).not.toEqual(neutral);
      r.update(2);
      r.pause();
      const paused = transforms(r);
      r.update(1);
      expect(transforms(r)).toEqual(paused);
      r.select(bucket.componentId);
      r.visibility({ hidden: [], isolated: bucket.componentId });
      r.play();
      r.update(0.1);
      r.reset();
      expect(transforms(r)).toEqual(neutral);
      expect(r.pose).toBe('neutral');
      expect(
        (r.scene.getObjectByName(bucket.sceneNodes[0]!) as Mesh).visible,
      ).toBe(true);
      r.visibility(showAll);
    }
    r.dispose();
    const remounted = await runtime();
    expect(transforms(remounted)).toEqual(neutral);
    remounted.dispose();
  });
});
