import type { Asset3D } from '../domain/asset3d';
import type { MachineComponentId, LearningActivityId } from '../domain/ids';
import type { Visibility } from './contracts';
export function assetUrl(uri: string, base: string) {
  return `${base.endsWith('/') ? base : base + '/'}${uri}`;
}
export interface SceneEntry {
  readonly name: string;
  readonly mesh: boolean;
  readonly selectable: boolean;
}
export function resolveMappings(
  asset: Asset3D,
  entries: readonly SceneEntry[],
) {
  const components = new Map<MachineComponentId, readonly string[]>();
  const hits = new Map<string, MachineComponentId>();
  for (const mapping of asset.nodeMappings) {
    for (const name of mapping.sceneNodes) {
      const found = entries.filter((entry) => entry.name === name);
      if (found.length !== 1 || !found[0]?.mesh)
        throw new Error(
          'Required mesh mapping cannot resolve uniquely: ' + name,
        );
      if (found[0].selectable) hits.set(name, mapping.componentId);
    }
    components.set(mapping.componentId, mapping.sceneNodes);
  }
  return { components, hits };
}
export function meshVisible(component: MachineComponentId, mode: Visibility) {
  return (
    !mode.hidden.includes(component) &&
    (mode.isolated === null || mode.isolated === component)
  );
}
export function animationClip(
  asset: Asset3D,
  clips: readonly string[],
  activity: LearningActivityId,
) {
  const mapping = asset.animationMappings.find(
    (entry) => entry.activity === activity,
  );
  if (!mapping) return { status: 'unsupported', reason: 'unmapped' } as const;
  return clips.includes(mapping.clip)
    ? ({ status: 'available', clip: mapping.clip } as const)
    : ({ status: 'unsupported', reason: 'missing-clip' } as const);
}
