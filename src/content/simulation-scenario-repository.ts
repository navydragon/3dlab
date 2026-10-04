import type { ScenarioId } from '../domain/ids.ts';
import type { SimulationScenario } from './simulation-scenario.ts';
import { validateSimulationScenarios } from './simulation-scenario-validation.ts';

export interface SimulationScenarioRepository {
  list(): readonly SimulationScenario[];
  get(id: ScenarioId): SimulationScenario | undefined;
}
export function createSimulationScenarioRepository(
  records: readonly unknown[],
) {
  const validation = validateSimulationScenarios(records);
  if (validation.status === 'invalid') return validation;
  const scenarios = validation.scenarios;
  const byId = new Map(scenarios.map((record) => [record.scenarioId, record]));
  const repository: SimulationScenarioRepository = Object.freeze({
    list: () => scenarios,
    get: (id: ScenarioId) => byId.get(id),
  });
  return { status: 'valid', repository } as const;
}
