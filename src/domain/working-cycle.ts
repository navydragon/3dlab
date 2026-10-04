import type { MachineId, MachineComponentId, LearningActivityId } from './ids';

export const phaseIds = [
  'excavation',
  'bucket-filling',
  'lifting',
  'swing-to-dump',
  'unloading',
  'return',
] as const;
export type WorkingPhaseId = (typeof phaseIds)[number];
export interface WorkingPhase {
  readonly phaseId: WorkingPhaseId;
  readonly order: number;
  readonly name: string;
  readonly goal: string;
  readonly movement: string;
  readonly componentIds: readonly MachineComponentId[];
  readonly sourceRefs: readonly string[];
  readonly visualNote?: string | undefined;
}
export interface VisualSegment {
  readonly phaseId: WorkingPhaseId;
  readonly startSeconds: number;
  readonly endSeconds?: number | undefined;
  readonly milestones: readonly {
    readonly timeSeconds: number;
    readonly meaning: string;
  }[];
}
export interface WorkingCycle {
  readonly version: '1.0';
  readonly machineId: MachineId;
  readonly activity: LearningActivityId;
  readonly sources: readonly {
    readonly id: string;
    readonly location: string;
    readonly scope: string;
  }[];
  readonly sourceRefs: readonly string[];
  readonly timingNotice: string;
  readonly overlapNotice: string;
  readonly phases: readonly WorkingPhase[];
  readonly visual: {
    readonly assetId: string;
    readonly assetVersion: string;
    readonly activity: LearningActivityId;
    readonly sourceRefs: readonly string[];
    readonly segments: readonly VisualSegment[];
  };
}
