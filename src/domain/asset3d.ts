import type { Asset3DId, MachineId, MachineComponentId } from './ids';

// External names are exact asset identifiers, never educational/domain identities.
export interface SceneNodeMapping {
  readonly componentId: MachineComponentId;
  readonly sceneNodes: readonly string[];
}
export interface AnimationMapping {
  readonly activity: string;
  readonly clip: string;
}
export interface CameraPreset {
  readonly id: string;
  readonly position: readonly [number, number, number];
  readonly target: readonly [number, number, number];
}
export interface Asset3D {
  readonly id: Asset3DId;
  readonly subjectType: 'machine';
  readonly subjectId: MachineId;
  readonly uri: string;
  readonly format: 'glb' | 'gltf';
  readonly version: string;
  readonly nodeMappings: readonly SceneNodeMapping[];
  readonly animationMappings: readonly AnimationMapping[];
  readonly cameraPresets?: readonly CameraPreset[] | undefined;
}
