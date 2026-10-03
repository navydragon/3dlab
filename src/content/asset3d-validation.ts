import type { DomainGraph } from '../domain/entities';
import type { Asset3D } from '../domain/asset3d';
import type { ValidationIssue } from './validation';
import { asset3dSchema } from './schemas/asset3d.ts';

export type Asset3DValidation =
  | { readonly status: 'valid'; readonly asset: Asset3D }
  | { readonly status: 'invalid'; readonly issues: readonly ValidationIssue[] };

// Graph must already have passed domain validation. No binary/topology claims here.
export function validateAsset3D(
  input: unknown,
  graph: DomainGraph,
): Asset3DValidation {
  const parsed = asset3dSchema.safeParse(input);
  if (!parsed.success)
    return {
      status: 'invalid',
      issues: parsed.error.issues.map((issue) => ({
        phase: 'shape',
        code: issue.code,
        path: issue.path.map((part) =>
          typeof part === 'number' ? part : String(part),
        ),
        message: issue.message,
      })),
    };
  const asset = parsed.data;
  const issues: ValidationIssue[] = [];
  if (!graph.machines.some((machine) => machine.id === asset.subjectId))
    issues.push({
      phase: 'graph',
      code: 'missing-machine',
      path: ['subjectId'],
      message: 'Asset subject machine does not exist',
    });
  asset.nodeMappings.forEach((mapping, index) => {
    const component = graph.machineComponents.find(
      (entry) => entry.id === mapping.componentId,
    );
    if (!component)
      issues.push({
        phase: 'graph',
        code: 'missing-component',
        path: ['nodeMappings', index, 'componentId'],
        message: 'Mapped component does not exist',
      });
    else if (component.machineId !== asset.subjectId)
      issues.push({
        phase: 'graph',
        code: 'component-owner',
        path: ['nodeMappings', index, 'componentId'],
        message: 'Mapped component belongs to another machine',
      });
  });
  return issues.length
    ? { status: 'invalid', issues }
    : { status: 'valid', asset };
}

export function validateAsset3DCollection(
  inputs: readonly unknown[],
  graph: DomainGraph,
) {
  const assets: Asset3D[] = [];
  const issues: ValidationIssue[] = [];
  const ids = new Set<string>();
  inputs.forEach((input, index) => {
    const result = validateAsset3D(input, graph);
    if (result.status === 'invalid')
      issues.push(
        ...result.issues.map((issue) => ({
          ...issue,
          path: [index, ...issue.path],
        })),
      );
    else {
      if (ids.has(result.asset.id))
        issues.push({
          phase: 'graph',
          code: 'duplicate-asset-id',
          path: [index, 'id'],
          message: 'Duplicate asset metadata ID',
        });
      ids.add(result.asset.id);
      assets.push(result.asset);
    }
  });
  return issues.length
    ? ({ status: 'invalid', issues } as const)
    : ({ status: 'valid', assets: Object.freeze(assets) } as const);
}
