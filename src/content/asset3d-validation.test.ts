import { describe, expect, it } from 'vitest';
import { asset3dSchema } from './schemas/asset3d';
import {
  validateAsset3D,
  validateAsset3DCollection,
} from './asset3d-validation';
import { validateDomainContent } from './validation';
import { localDomainContent } from './adapters/local/repository';

function graph() {
  const result = validateDomainContent(localDomainContent);
  if (result.status !== 'valid') throw new Error('Invalid production domain');
  return result.graph;
}
// Synthetic metadata only, no matching production binary is claimed.
function fixture() {
  return {
    id: 'test-asset',
    subjectType: 'machine',
    subjectId: 'excavator',
    uri: 'assets/3d/test-only.glb',
    format: 'glb',
    version: 'test-version',
    nodeMappings: [
      { componentId: 'bucket', sceneNodes: ['test-node-a', 'test-node-b'] },
    ],
    animationMappings: [{ activity: 'test-activity', clip: 'test-clip' }],
    cameraPresets: [
      { id: 'test-camera', position: [1, 2, 3], target: [0, 0, 0] },
    ],
  };
}
type Fixture = ReturnType<typeof fixture>;
describe('3D metadata schema', () => {
  it('accepts test-only metadata, preserves exact external names and freezes parsed data', () => {
    const input = fixture();
    input.nodeMappings[0]?.sceneNodes.push('Test node with spaces');
    const asset = asset3dSchema.parse(input);
    expect(asset.nodeMappings[0]?.sceneNodes).toContain(
      'Test node with spaces',
    );
    expect(Object.isFrozen(asset)).toBe(true);
    expect(Object.isFrozen(asset.nodeMappings[0]?.sceneNodes)).toBe(true);
  });
  it.each([
    [
      'format',
      (f: Fixture) => {
        f.format = 'fbx';
      },
    ],
    [
      'empty URI',
      (f: Fixture) => {
        f.uri = '';
      },
    ],
    [
      'empty version',
      (f: Fixture) => {
        f.version = ' ';
      },
    ],
    [
      'asset ID',
      (f: Fixture) => {
        f.id = 'Invalid ID';
      },
    ],
    [
      'subject ID',
      (f: Fixture) => {
        f.subjectId = '/excavator';
      },
    ],
    [
      'subject type',
      (f: Fixture) => {
        f.subjectType = 'process';
      },
    ],
    [
      'component ID',
      (f: Fixture) => {
        f.nodeMappings[0] = {
          componentId: 'Bad ID',
          sceneNodes: ['test-node'],
        };
      },
    ],
    [
      'duplicate node',
      (f: Fixture) => {
        f.nodeMappings[0]?.sceneNodes.push('test-node-a');
      },
    ],
    [
      'empty nodes',
      (f: Fixture) => {
        f.nodeMappings[0] = { componentId: 'bucket', sceneNodes: [] };
      },
    ],
    [
      'blank node',
      (f: Fixture) => {
        f.nodeMappings[0] = { componentId: 'bucket', sceneNodes: [' '] };
      },
    ],
    [
      'duplicate component',
      (f: Fixture) => {
        f.nodeMappings.push({
          componentId: 'bucket',
          sceneNodes: ['test-node-c'],
        });
      },
    ],
    [
      'ambiguous node',
      (f: Fixture) => {
        f.nodeMappings.push({
          componentId: 'boom',
          sceneNodes: ['test-node-a'],
        });
      },
    ],
    [
      'blank clip',
      (f: Fixture) => {
        f.animationMappings[0] = { activity: 'test-activity', clip: ' ' };
      },
    ],
    [
      'invalid activity',
      (f: Fixture) => {
        f.animationMappings[0] = { activity: 'Bad ID', clip: 'test-clip' };
      },
    ],
    [
      'duplicate activity',
      (f: Fixture) => {
        f.animationMappings.push({
          activity: 'test-activity',
          clip: 'test-other-clip',
        });
      },
    ],
    [
      'duplicate camera',
      (f: Fixture) => {
        f.cameraPresets.push({
          id: 'test-camera',
          position: [4, 5, 6],
          target: [0, 0, 0],
        });
      },
    ],
    [
      'nonfinite camera',
      (f: Fixture) => {
        f.cameraPresets[0] = {
          id: 'test-camera',
          position: [Infinity, 2, 3],
          target: [0, 0, 0],
        };
      },
    ],
    [
      'bad camera vector',
      (f: Fixture) => {
        f.cameraPresets[0] = {
          id: 'test-camera',
          position: [1, 2],
          target: [0, 0, 0],
        };
      },
    ],
    [
      'camera at target',
      (f: Fixture) => {
        f.cameraPresets[0] = {
          id: 'test-camera',
          position: [0, 0, 0],
          target: [0, 0, 0],
        };
      },
    ],
  ])('rejects %s', (_name, mutate) => {
    const input = fixture();
    mutate(input);
    expect(asset3dSchema.safeParse(input).success).toBe(false);
  });
  it.each([
    'C:\\local\\test.glb',
    '/Users/local/test.glb',
    '/home/local/test.glb',
    '/assets/3d/test.glb',
    'https://example.test/test.glb',
    'assets/3d/../test.glb',
    'assets/3d/%2e%2e/test.glb',
    'assets/3d/test.glb?x=1',
    'assets/3d/test.glb#x',
    'assets/3d/test.gltf',
  ])('rejects invalid or mismatching URI %s', (uri) => {
    expect(asset3dSchema.safeParse({ ...fixture(), uri }).success).toBe(false);
  });
  it('supports separate glTF, absent optional cameras and explicit unmapped interactions', () => {
    const { cameraPresets: _camera, ...input } = fixture();
    expect(_camera).toHaveLength(1);
    expect(
      asset3dSchema.safeParse({
        ...input,
        uri: 'assets/3d/test.gltf',
        format: 'gltf',
        nodeMappings: [],
        animationMappings: [],
      }).success,
    ).toBe(true);
  });
});
describe('3D metadata domain references', () => {
  it('validates canonical ownership without asserting topology exists', () => {
    expect(validateAsset3D(fixture(), graph())).toMatchObject({
      status: 'valid',
      asset: { subjectId: 'excavator' },
    });
  });
  it.each([
    ['missing-machine', { ...fixture(), subjectId: 'missing' }],
    [
      'missing-component',
      {
        ...fixture(),
        nodeMappings: [{ componentId: 'missing', sceneNodes: ['test-node'] }],
      },
    ],
    ['component-owner', { ...fixture(), subjectId: 'dump-truck' }],
  ])('returns structured %s issues', (code, input) => {
    const result = validateAsset3D(input, graph());
    if (result.status !== 'invalid')
      throw new Error('Expected invalid metadata');
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          phase: 'graph',
          code,
          path: expect.any(Array),
        }),
      ]),
    );
  });
  it('rejects duplicate mappings and empty nodes through the public validation boundary', () => {
    expect(
      validateAsset3D(
        {
          ...fixture(),
          nodeMappings: [{ componentId: 'bucket', sceneNodes: [] }],
        },
        graph(),
      ).status,
    ).toBe('invalid');
    expect(
      validateAsset3D(
        {
          ...fixture(),
          nodeMappings: [...fixture().nodeMappings, ...fixture().nodeMappings],
        },
        graph(),
      ).status,
    ).toBe('invalid');
  });
  it('accepts zero production assets and rejects duplicates/invalid files without partial success', () => {
    expect(validateAsset3DCollection([], graph())).toEqual({
      status: 'valid',
      assets: [],
    });
    const duplicate = validateAsset3DCollection(
      [fixture(), fixture()],
      graph(),
    );
    expect(duplicate).toMatchObject({
      status: 'invalid',
      issues: [{ code: 'duplicate-asset-id', path: [1, 'id'] }],
    });
    expect(validateAsset3DCollection([fixture(), {}], graph()).status).toBe(
      'invalid',
    );
  });
});
