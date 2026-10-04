import type {
  Asset3DId,
  MachineId,
  MachineComponentId,
  LearningActivityId,
} from './ids';

// External names are exact asset identifiers, never educational/domain identities.
export interface SceneNodeMapping {
  readonly componentId: MachineComponentId;
  readonly sceneNodes: readonly string[];
}
export interface AnimationMapping {
  readonly activity: LearningActivityId;
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
  readonly production?:
    | {
        readonly sha256: string;
        readonly sizeBytes: number;
        readonly units: 'meters';
        readonly upAxis: 'Y';
        readonly canonicalNodes: readonly string[];
        readonly statistics: {
          readonly nodes: number;
          readonly meshes: number;
          readonly triangles: number;
          readonly materials: number;
          readonly textures: number;
        };
        readonly clips: readonly {
          readonly name: string;
          readonly durationSeconds: number;
          readonly loopable: boolean;
          readonly animatedCanonicalNodes: readonly string[];
          readonly animatedAuxiliaryNodes: readonly string[];
          readonly restSemantics: string;
          readonly timingSemantics: 'visual-demonstration';
        }[];
        readonly mappingNotes: readonly string[];
        readonly limitations: readonly string[];
      }
    | undefined;
}
