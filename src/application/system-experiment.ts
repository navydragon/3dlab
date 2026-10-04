import type { ProductionSystemId, ScenarioId, ProcessId } from '../domain/ids';
import type { ProductionSystem } from '../domain/production-system';
import type { SimulationScenario } from '../content/simulation-scenario';
import type { DomainRepository } from '../content/repository';
import type { ProductionSystemRepository } from '../content/production-system-repository';
import { getProductionSystemOverview } from './production-system-queries';
import { getSupportedSimulationModel } from '../content/supported-simulation-models';
import { validateSimulationInput } from '../simulation/validation';
import type {
  SimulationInput,
  SimulationResult,
  SimulationIssue,
} from '../simulation/contracts';

export function getSystemsCatalog(
  systems: ProductionSystemRepository,
  domain: DomainRepository,
) {
  const views = systems
    .list()
    .map((system) => getProductionSystemOverview(systems, domain, system.id));
  if (views.some((view) => view.status !== 'ready'))
    return { status: 'invalid-dependencies' } as const;
  return {
    status: 'ready',
    systems: views.filter((view) => view.status === 'ready'),
  } as const;
}
export function getRelatedSystems(
  systems: ProductionSystemRepository,
  process: ProcessId,
) {
  return systems.getByProcess(process) ?? [];
}
export interface ExperimentSource {
  readonly system: ProductionSystem;
  readonly scenario: SimulationScenario;
}
export function resolveExperiment(
  systems: ProductionSystemRepository,
  domain: DomainRepository,
  id: ProductionSystemId,
  scenarioId: ScenarioId | undefined,
) {
  const view = getProductionSystemOverview(systems, domain, id);
  if (view.status !== 'ready') return view;
  if (scenarioId === undefined) return { status: 'overview', view } as const;
  const scenario = view.scenarios.find(
    (record) => record.scenarioId === scenarioId,
  );
  if (!scenario) return { status: 'scenario-unavailable', view } as const;
  const model = getSupportedSimulationModel(view.system.simulationModelId);
  if (!model) return { status: 'unsupported-model', view } as const;
  const editable = model.editableParticipant(
    view.system.participantDefinitions,
  );
  if (!editable) return { status: 'unsupported-model', view } as const;
  return {
    status: 'experiment',
    view,
    source: { system: view.system, scenario },
    editable,
  } as const;
}
export function copyInput(input: SimulationInput): SimulationInput {
  return {
    excavator: { ...input.excavator },
    truck: { ...input.truck },
    task: { ...input.task },
  };
}
export function updateTruckCount(
  input: SimulationInput,
  truckCount: number,
): SimulationInput {
  return { ...copyInput(input), truck: { ...input.truck, truckCount } };
}
type SuccessfulResult = Extract<SimulationResult, { status: 'success' }>;
export interface SavedVariant {
  readonly systemId: ProductionSystemId;
  readonly scenarioId: ScenarioId;
  readonly input: SimulationInput;
  readonly result: SuccessfulResult;
}
export interface ExperimentError {
  readonly code:
    'unsupported-model' | 'invalid-input' | 'count-constraints' | 'calculation';
  readonly issues: readonly SimulationIssue[];
}
export function runExperiment(
  source: ExperimentSource,
  input: SimulationInput,
):
  | { readonly status: 'success'; readonly variant: SavedVariant }
  | { readonly status: 'error'; readonly error: ExperimentError } {
  const model = getSupportedSimulationModel(source.system.simulationModelId);
  if (
    !model ||
    source.scenario.modelId !== model.id ||
    !model.acceptsStructure(source.system.participantDefinitions)
  )
    return {
      status: 'error',
      error: { code: 'unsupported-model', issues: [] },
    };
  const validation = validateSimulationInput(input);
  if (validation.status === 'invalid')
    return {
      status: 'error',
      error: { code: 'invalid-input', issues: validation.issues },
    };
  const countsScenario = { ...source.scenario, input };
  if (
    source.system.participantDefinitions.some((p) => {
      const count = model.participantCount(p, countsScenario);
      return (
        count === undefined ||
        count < p.minCount ||
        (p.maxCount !== null && count > p.maxCount)
      );
    })
  )
    return {
      status: 'error',
      error: { code: 'count-constraints', issues: [] },
    };
  const result = model.calculate(input);
  if (result.status === 'error')
    return {
      status: 'error',
      error: { code: 'calculation', issues: result.issues },
    };
  const snapshot = Object.freeze({
    excavator: Object.freeze({ ...input.excavator }),
    truck: Object.freeze({ ...input.truck }),
    task: Object.freeze({ ...input.task }),
  });
  const variant: SavedVariant = Object.freeze({
    systemId: source.system.id,
    scenarioId: source.scenario.scenarioId,
    input: snapshot,
    result: Object.freeze({
      ...result,
      metrics: Object.freeze({ ...result.metrics }),
      intermediates: Object.freeze({ ...result.intermediates }),
    }),
  });
  return { status: 'success', variant };
}
export type Prediction = 'none' | 'increase' | 'decrease' | 'same';
export interface ExperimentState {
  readonly working: SimulationInput;
  readonly latest: SavedVariant | null;
  readonly stale: boolean;
  readonly error: ExperimentError | null;
  readonly saved: readonly [SavedVariant | null, SavedVariant | null];
  readonly prediction: Prediction;
  readonly observed: Exclude<Prediction, 'none'> | null;
}
export function initialExperiment(source: ExperimentSource): ExperimentState {
  return {
    working: copyInput(source.scenario.input),
    latest: null,
    stale: false,
    error: null,
    saved: [null, null],
    prediction: 'none',
    observed: null,
  };
}
export type ExperimentAction =
  | { type: 'count'; value: number }
  | { type: 'calculate' }
  | { type: 'reset' }
  | { type: 'save' }
  | { type: 'clear' }
  | { type: 'predict'; value: Prediction };
export function reduceExperiment(
  source: ExperimentSource,
  state: ExperimentState,
  action: ExperimentAction,
): ExperimentState {
  switch (action.type) {
    case 'count':
      return {
        ...state,
        working: updateTruckCount(state.working, action.value),
        stale: state.latest !== null,
        error: null,
        observed: null,
        prediction: 'none',
      };
    case 'reset':
      return {
        ...state,
        working: copyInput(source.scenario.input),
        stale: state.latest !== null,
        error: null,
        prediction: 'none',
        observed: null,
      };
    case 'predict':
      return { ...state, prediction: action.value };
    case 'clear':
      return { ...state, saved: [null, null] };
    case 'save': {
      if (!state.latest || state.stale || state.error || state.saved[1])
        return state;
      return {
        ...state,
        saved: state.saved[0]
          ? [state.saved[0], state.latest]
          : [state.latest, null],
      };
    }
    case 'calculate': {
      const result = runExperiment(source, state.working);
      if (result.status === 'error')
        return {
          ...state,
          latest: null,
          stale: false,
          error: result.error,
          observed: null,
        };
      const before = state.latest?.result.metrics['system-productivity'];
      const after = result.variant.result.metrics['system-productivity'];
      const observed =
        before === undefined
          ? null
          : after > before
            ? 'increase'
            : after < before
              ? 'decrease'
              : 'same';
      return {
        ...state,
        latest: result.variant,
        stale: false,
        error: null,
        observed,
      };
    }
  }
}
export function compareVariants(a: SavedVariant, b: SavedVariant) {
  if (
    a.systemId !== b.systemId ||
    a.scenarioId !== b.scenarioId ||
    a.result.modelId !== b.result.modelId
  )
    return { status: 'incompatible' } as const;
  const deltas = Object.fromEntries(
    Object.entries(a.result.metrics).map(([id, value]) => [
      id,
      b.result.metrics[id as keyof typeof b.result.metrics] - value,
    ]),
  ) as Record<keyof typeof a.result.metrics, number>;
  return {
    status: 'available',
    truckCountDelta: b.input.truck.truckCount - a.input.truck.truckCount,
    deltas,
  } as const;
}
export function explainResult(variant: SavedVariant) {
  return {
    transportLimited: variant.result.metrics['match-factor'] < 1,
    waiting: variant.result.metrics['truck-wait-time'] > 0,
  };
}
export function getParticipantCounts(
  source: ExperimentSource,
  input: SimulationInput,
) {
  const model = getSupportedSimulationModel(source.system.simulationModelId);
  return source.system.participantDefinitions.map((definition) =>
    model?.participantCount(definition, { ...source.scenario, input }),
  );
}
