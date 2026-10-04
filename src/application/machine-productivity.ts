import type {
  ProductivityLearning,
  ParameterId,
  ProductivityOutputId,
} from '../domain/productivity';
import type { MachineId } from '../domain/ids';
import type { SimulationScenario } from '../content/simulation-scenario';
import type { SimulationScenarioRepository } from '../content/simulation-scenario-repository';
import type { DomainRepository } from '../content/repository';
import type { ProductionSystemRepository } from '../content/production-system-repository';
import { getSupportedSimulationModel } from '../content/supported-simulation-models';
import type {
  SimulationInput,
  SimulationResult,
  SimulationIssue,
} from '../simulation/contracts';
import { validateSimulationInput } from '../simulation/validation';

const fields = {
  'bucket-capacity': 'bucketCapacityM3Loose',
  'bucket-fill-factor': 'bucketFillFactor',
  'cycle-time': 'cycleTimeSeconds',
  'time-utilization': 'timeUtilizationFactor',
} as const;
export function sourceParameter(input: SimulationInput, id: ParameterId) {
  return input.excavator[fields[id]];
}
export function parameterPolicy(id: ParameterId) {
  return { max: id === 'time-utilization' ? 1 : undefined } as const;
}
type Success = Extract<SimulationResult, { status: 'success' }>;
export type StandaloneValues = Readonly<Record<ProductivityOutputId, number>>;
export function standaloneValues(result: Success): StandaloneValues {
  return Object.freeze({
    q_eff: result.metrics['effective-bucket-volume'],
    cycles_per_hour_60: result.intermediates.cyclesPerHour60,
    Q_exc_60: result.intermediates.excavatorProductivityM3LoosePerHour60,
    Q_exc: result.metrics['excavator-standalone-productivity'],
  });
}
export interface ProductivitySource {
  readonly learning: ProductivityLearning;
  readonly scenario: SimulationScenario;
  readonly baseline: StandaloneValues;
}
export function resolveProductivity(
  learning: ProductivityLearning | undefined,
  scenarios: SimulationScenarioRepository,
  machineId: MachineId,
) {
  if (!learning || learning.machineId !== machineId)
    return { status: 'unavailable' } as const;
  const model = getSupportedSimulationModel(learning.simulationModelId);
  if (!model || model.standaloneMachineId !== machineId)
    return { status: 'unsupported-model' } as const;
  const scenario = scenarios.get(learning.sourceScenarioId);
  if (!scenario) return { status: 'missing-scenario' } as const;
  if (scenario.modelId !== model.id)
    return { status: 'unsupported-model' } as const;
  const baseline = model.calculate(scenario.input);
  if (baseline.status === 'error')
    return { status: 'calculation-error', issues: baseline.issues } as const;
  return {
    status: 'ready',
    source: Object.freeze({
      learning,
      scenario,
      baseline: standaloneValues(baseline),
    }),
  } as const;
}
export function relatedMachineSystems(
  systems: ProductionSystemRepository,
  domain: DomainRepository,
  id: MachineId,
) {
  const processes = new Set(
    domain.getWhereUsed(id)?.map((use) => use.process.id),
  );
  return systems
    .list()
    .filter(
      (s) =>
        processes.has(s.processId) &&
        s.participantDefinitions.some((p) => p.machineId === id),
    );
}
export type Direction = 'increase' | 'decrease' | 'same';
export function numericalDirection(before: number, after: number): Direction {
  return after > before ? 'increase' : after < before ? 'decrease' : 'same';
}
export interface MachineLatest {
  readonly input: SimulationInput;
  readonly values: StandaloneValues;
  readonly observed: Direction;
}
export interface MachineExperimentState {
  readonly selected: ParameterId;
  readonly candidate: string;
  readonly prediction: Direction | null;
  readonly latest: MachineLatest | null;
  readonly stale: boolean;
  readonly error: readonly SimulationIssue[] | null;
}
export function initialMachineExperiment(
  source: ProductivitySource,
  selected: ParameterId = 'bucket-capacity',
): MachineExperimentState {
  return {
    selected,
    candidate: String(sourceParameter(source.scenario.input, selected)),
    prediction: null,
    latest: null,
    stale: false,
    error: null,
  };
}
// Rebuild every input group from SOURCE. No previous result/working input is accepted.
export function oneFactorInput(
  source: SimulationInput,
  id: ParameterId,
  value: number,
): SimulationInput {
  return {
    excavator: { ...source.excavator, [fields[id]]: value },
    truck: { ...source.truck },
    task: { ...source.task },
  };
}
export function runMachineExperiment(
  source: ProductivitySource,
  id: ParameterId,
  candidate: string,
) {
  const model = getSupportedSimulationModel(source.learning.simulationModelId);
  if (
    !model ||
    model.standaloneMachineId !== source.learning.machineId ||
    source.scenario.modelId !== model.id
  )
    return { status: 'unsupported-model' } as const;
  if (candidate.trim() === '')
    return {
      status: 'error',
      issues: [
        {
          phase: 'input',
          code: 'required_number',
          path: ['excavator', fields[id]],
        } satisfies SimulationIssue,
      ],
    } as const;
  const input = oneFactorInput(source.scenario.input, id, Number(candidate));
  const validation = validateSimulationInput(input);
  if (validation.status === 'invalid')
    return { status: 'error', issues: validation.issues } as const;
  const result = model.calculate(input);
  if (result.status === 'error') return result;
  const values = standaloneValues(result);
  const snapshot = Object.freeze({
    excavator: Object.freeze(input.excavator),
    truck: Object.freeze(input.truck),
    task: Object.freeze(input.task),
  });
  return {
    status: 'success',
    latest: Object.freeze({
      input: snapshot,
      values,
      observed: numericalDirection(source.baseline.Q_exc, values.Q_exc),
    }),
  } as const;
}
export type MachineExperimentAction =
  | { type: 'select'; id: ParameterId }
  | { type: 'edit'; value: string }
  | { type: 'predict'; value: Direction }
  | { type: 'reset' }
  | { type: 'calculate' };
export function reduceMachineExperiment(
  source: ProductivitySource,
  state: MachineExperimentState,
  action: MachineExperimentAction,
): MachineExperimentState {
  switch (action.type) {
    case 'select':
      return initialMachineExperiment(source, action.id);
    case 'reset':
      return initialMachineExperiment(source, state.selected);
    case 'predict':
      return { ...state, prediction: action.value };
    case 'edit':
      return {
        ...state,
        candidate: action.value,
        stale: state.latest !== null,
        error: null,
        prediction: null,
      };
    case 'calculate': {
      const result = runMachineExperiment(
        source,
        state.selected,
        state.candidate,
      );
      if (result.status !== 'success')
        return {
          ...state,
          latest: null,
          stale: false,
          error: result.status === 'error' ? result.issues : [],
        };
      return { ...state, latest: result.latest, stale: false, error: null };
    }
  }
}
