import type {
  MachineId,
  MachineComponentId,
  ProcessId,
  ProcessStageId,
  MachineRoleId,
} from './ids';

export interface Provenanced {
  readonly sourceRefs: readonly string[];
}
export interface FoundationSource {
  readonly id: string;
  readonly title: string;
  readonly location: string;
  readonly scope: string;
}
export interface FoundationGroup extends Provenanced {
  readonly componentIds: readonly MachineComponentId[];
  readonly purpose?: string | undefined;
}
export interface MachineFoundation extends Provenanced {
  readonly machineId: MachineId;
  readonly overview: {
    readonly purpose: string;
    readonly systemContext: string;
    readonly scopeNote: string;
  };
  readonly constructionIntro?: string | undefined;
  readonly applicationsIntro?: string | undefined;
  readonly workingPrinciple?:
    | {
        readonly intro: string;
        readonly paragraphs: readonly string[];
        readonly chain: readonly string[];
        readonly groups: readonly FoundationGroup[];
        readonly explanations: readonly string[];
      }
    | undefined;
  readonly transportCycle?:
    | {
        readonly steps: readonly string[];
        readonly factors: readonly (Provenanced & {
          readonly name: string;
          readonly explanation: string;
        })[];
        readonly distanceExplanation: string;
        readonly followUp: string;
      }
    | undefined;
}
export interface ComponentFoundation extends Provenanced {
  readonly machineId: MachineId;
  readonly componentId: MachineComponentId;
  readonly explanation: string;
}
export interface ProcessFoundation extends Provenanced {
  readonly processId: ProcessId;
  readonly introduction: string;
  readonly truckCycle: readonly string[];
  readonly excavatorCycle: readonly string[];
  readonly synthesis: string;
  readonly causalChain: readonly string[];
  readonly systemsIntro: string;
}
export interface ParticipantFoundation extends Provenanced {
  readonly machineId: MachineId;
  readonly roleId: MachineRoleId;
  readonly note: string;
  readonly factors: readonly string[];
}
export interface StageFoundation extends Provenanced {
  readonly processId: ProcessId;
  readonly stageId: ProcessStageId;
  readonly goal: string;
  readonly input: string;
  readonly activity: string;
  readonly result: string;
  readonly handoff: string;
  readonly modelNotes: readonly string[];
  readonly participantNotes: readonly ParticipantFoundation[];
}
export interface FoundationPack {
  readonly version: '1.0';
  readonly sources: readonly FoundationSource[];
  readonly machines: readonly MachineFoundation[];
  readonly components: readonly ComponentFoundation[];
  readonly processes: readonly ProcessFoundation[];
  readonly stages: readonly StageFoundation[];
}
