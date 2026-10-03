import type {
  MachineId,
  MachineComponentId,
  OperationId,
  ProcessId,
  ProcessStageId,
  MachineRoleId,
} from './ids';

export interface Machine {
  readonly id: MachineId;
  readonly name: string;
  readonly description?: string | undefined;
  readonly componentIds: readonly MachineComponentId[];
  readonly operationIds: readonly OperationId[];
}
export interface MachineComponent {
  readonly id: MachineComponentId;
  readonly machineId: MachineId;
  readonly name: string;
  readonly description?: string | undefined;
}
export interface Operation {
  readonly id: OperationId;
  readonly name: string;
  readonly description?: string | undefined;
}
export interface Process {
  readonly id: ProcessId;
  readonly name: string;
  readonly description?: string | undefined;
  readonly stageIds: readonly ProcessStageId[];
}
export interface ProcessStage {
  readonly id: ProcessStageId;
  readonly processId: ProcessId;
  readonly operationId: OperationId;
  readonly sequence: number;
  readonly name: string;
  readonly description?: string | undefined;
  readonly machineRoleIds: readonly MachineRoleId[];
}
export interface MachineRole {
  readonly id: MachineRoleId;
  readonly name: string;
  readonly eligibleMachineIds: readonly MachineId[];
}

export interface DomainGraph {
  readonly machines: readonly Machine[];
  readonly machineComponents: readonly MachineComponent[];
  readonly operations: readonly Operation[];
  readonly machineRoles: readonly MachineRole[];
  readonly processes: readonly Process[];
  readonly processStages: readonly ProcessStage[];
}
