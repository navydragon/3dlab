import { z } from 'zod';
import {
  isAsset3DId,
  isLearningActivityId,
  isMachineId,
  isMachineComponentId,
  isStableId,
} from '../../domain/ids.ts';
import type {
  Asset3DId,
  LearningActivityId,
  MachineId,
  MachineComponentId,
} from '../../domain/ids';
import type { Asset3D } from '../../domain/asset3d';

const text = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0, 'Expected nonblank text');
const stableName = z.custom<string>(isStableId, 'Expected a stable ID');
const vector = z
  .tuple([z.number().finite(), z.number().finite(), z.number().finite()])
  .readonly();

// Base-relative URI resolved against Vite BASE_URL by the future loading adapter.
// Restrict to the chosen public directory; never accept developer filesystem paths.
const uri = text.refine(
  (value) =>
    /^assets\/3d\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.(glb|gltf)$/.test(value),
  'Expected assets/3d/...glb or .gltf web asset URI',
);
const nodeMapping = z
  .strictObject({
    componentId: z.custom<MachineComponentId>(
      isMachineComponentId,
      'Expected a stable component ID',
    ),
    sceneNodes: z
      .array(text)
      .min(1)
      .refine(
        (names) => new Set(names).size === names.length,
        'Duplicate scene node name',
      )
      .readonly(),
  })
  .readonly();
const animationMapping = z
  .strictObject({
    activity: z.custom<LearningActivityId>(
      isLearningActivityId,
      'Expected a stable activity ID',
    ),
    clip: text,
  })
  .readonly();
const camera = z
  .strictObject({ id: stableName, position: vector, target: vector })
  .refine(
    (value) =>
      value.position.some(
        (coordinate, index) => coordinate !== value.target[index],
      ),
    'Camera position and target must differ',
  )
  .readonly();

const production = z
  .strictObject({
    sha256: z.string().regex(/^[a-f0-9]{64}$/),
    sizeBytes: z.number().int().positive(),
    units: z.literal('meters'),
    upAxis: z.literal('Y'),
    canonicalNodes: z.array(text).min(1).readonly(),
    statistics: z
      .strictObject({
        nodes: z.number().int().positive(),
        meshes: z.number().int().positive(),
        triangles: z.number().int().positive(),
        materials: z.number().int().nonnegative(),
        textures: z.number().int().nonnegative(),
      })
      .readonly(),
    clips: z
      .array(
        z
          .strictObject({
            name: text,
            durationSeconds: z.number().finite().positive(),
            loopable: z.boolean(),
            animatedCanonicalNodes: z.array(text).readonly(),
            animatedAuxiliaryNodes: z.array(text).readonly(),
            restSemantics: text,
            timingSemantics: z.literal('visual-demonstration'),
          })
          .readonly(),
      )
      .readonly(),
    mappingNotes: z.array(text).readonly(),
    limitations: z.array(text).readonly(),
  })
  .readonly();

export const asset3dSchema = z
  .strictObject({
    id: z.custom<Asset3DId>(isAsset3DId, 'Expected a stable asset ID'),
    subjectType: z.literal('machine'),
    subjectId: z.custom<MachineId>(isMachineId, 'Expected a stable machine ID'),
    uri,
    format: z.enum(['glb', 'gltf']),
    version: text,
    nodeMappings: z.array(nodeMapping).readonly(),
    animationMappings: z.array(animationMapping).readonly(),
    cameraPresets: z.array(camera).readonly().optional(),
    production: production.optional(),
  })
  .superRefine((asset, context) => {
    if (!asset.uri.endsWith('.' + asset.format))
      context.addIssue({
        code: 'custom',
        path: ['uri'],
        message: 'URI extension must match format',
      });
    const components = new Set<string>();
    const nodes = new Set<string>();
    asset.nodeMappings.forEach((mapping, index) => {
      if (components.has(mapping.componentId))
        context.addIssue({
          code: 'custom',
          path: ['nodeMappings', index, 'componentId'],
          message: 'Duplicate component mapping',
        });
      components.add(mapping.componentId);
      mapping.sceneNodes.forEach((node, nodeIndex) => {
        if (nodes.has(node))
          context.addIssue({
            code: 'custom',
            path: ['nodeMappings', index, 'sceneNodes', nodeIndex],
            message: 'Scene node has ambiguous mapping',
          });
        nodes.add(node);
      });
    });
    for (const [field, keys] of [
      [
        'animationMappings',
        asset.animationMappings.map((mapping) => mapping.activity),
      ],
      ['cameraPresets', asset.cameraPresets?.map((preset) => preset.id) ?? []],
    ] as const) {
      if (new Set(keys).size !== keys.length)
        context.addIssue({
          code: 'custom',
          path: [field],
          message: 'Duplicate mapping/preset identity',
        });
    }
  })
  .readonly() satisfies z.ZodType<Asset3D>;
