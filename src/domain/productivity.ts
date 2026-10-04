import type { MachineId, ScenarioId, SimulationModelId } from './ids';
export const parameterIds = [
  'bucket-capacity',
  'bucket-fill-factor',
  'cycle-time',
  'time-utilization',
] as const;
export type ParameterId = (typeof parameterIds)[number];
export const productivityOutputIds = [
  'q_eff',
  'cycles_per_hour_60',
  'Q_exc_60',
  'Q_exc',
] as const;
export type ProductivityOutputId = (typeof productivityOutputIds)[number];
export interface ProductivityLearning {
  readonly machineId: MachineId;
  readonly sourceScenarioId: ScenarioId;
  readonly simulationModelId: SimulationModelId;
  readonly sources: readonly {
    readonly id: string;
    readonly location: string;
    readonly scope: string;
  }[];
  readonly sourceRefs: readonly string[];
  readonly illustrativeNotice: string;
  readonly parameters: readonly {
    readonly parameterId: ParameterId;
    readonly name: string;
    readonly symbol: string;
    readonly unit: string;
    readonly definition: string;
    readonly causalExplanation: string;
    readonly notes: readonly string[];
    readonly sourceRefs: readonly string[];
  }[];
  readonly relationships: readonly string[];
  readonly outputs: readonly {
    readonly id: ProductivityOutputId;
    readonly name: string;
    readonly unit: string;
  }[];
  readonly theoreticalExplanation: string;
  readonly machineVsSystem: string;
  readonly predictionPrompt: string;
  readonly explanationPrompt: string;
}
