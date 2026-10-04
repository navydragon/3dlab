import type { Asset3D } from '../domain/asset3d';
import type { MachineId } from '../domain/ids';
import type { DomainGraph } from '../domain/entities';
import { validateAsset3DCollection } from './asset3d-validation';

export type AssetResolution =
  | { readonly status: 'available'; readonly asset: Asset3D }
  | { readonly status: 'unavailable' | 'ambiguous' | 'invalid' };
export interface AssetRepository {
  resolve(machineId: MachineId): AssetResolution;
}
export function createAssetRepository(
  inputs: readonly unknown[],
  graph: DomainGraph,
): AssetRepository {
  const validation = validateAsset3DCollection(inputs, graph);
  return Object.freeze({
    resolve(machineId: MachineId): AssetResolution {
      if (validation.status !== 'valid') return { status: 'invalid' };
      const assets = validation.assets.filter(
        (asset) => asset.subjectId === machineId,
      );
      if (assets.length > 1) return { status: 'ambiguous' };
      const asset = assets[0];
      return asset ? { status: 'available', asset } : { status: 'unavailable' };
    },
  });
}
