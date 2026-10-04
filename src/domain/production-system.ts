import type {
  ProductionSystemId,
  ProcessId,
  MachineRoleId,
  MachineId,
  SimulationModelId,
  ScenarioId,
} from './ids';

/** Allowed structure, never the current experimental count. */
export interface SystemParticipantDefinition {
  readonly roleId: MachineRoleId;
  readonly machineId: MachineId;
  readonly minCount: number;
  readonly maxCount: number | null;
}
export interface ProductionSystem {
  readonly id: ProductionSystemId;
  readonly name: string;
  readonly processId: ProcessId;
  readonly participantDefinitions: readonly SystemParticipantDefinition[];
  readonly simulationModelId: SimulationModelId;
  readonly supportedScenarioIds: readonly ScenarioId[];
}
