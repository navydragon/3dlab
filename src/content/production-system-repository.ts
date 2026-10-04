import type { ProductionSystem } from '../domain/production-system';
import type { ProductionSystemId, ProcessId } from '../domain/ids';
import type { SimulationScenario } from './simulation-scenario';
import type { DomainRepository } from './repository';
import type { SimulationScenarioRepository } from './simulation-scenario-repository';
import { validateProductionSystems } from './production-system-validation.ts';

export interface ProductionSystemRepository {
  list(): readonly ProductionSystem[];
  get(id: ProductionSystemId): ProductionSystem | undefined;
  getByProcess(id: ProcessId): readonly ProductionSystem[] | undefined;
  getSupportedScenarios(
    id: ProductionSystemId,
  ): readonly SimulationScenario[] | undefined;
}
export function createProductionSystemRepository(
  raw: unknown,
  domain: DomainRepository,
  scenarios: SimulationScenarioRepository,
) {
  const validation = validateProductionSystems(raw, domain, scenarios);
  if (validation.status === 'invalid') return validation;
  const systems = validation.systems;
  const byId = new Map(systems.map((system) => [system.id, system]));
  const supported = new Map(
    systems.map((system) => [
      system.id,
      Object.freeze(
        system.supportedScenarioIds.map((id) => {
          const scenario = scenarios.get(id);
          if (!scenario)
            throw new Error('Validated scenario invariant violated');
          return scenario;
        }),
      ),
    ]),
  );
  const repository: ProductionSystemRepository = Object.freeze({
    list: () => systems,
    get: (id: ProductionSystemId) => byId.get(id),
    getByProcess: (id: ProcessId) =>
      domain.getProcess(id)
        ? Object.freeze(systems.filter((system) => system.processId === id))
        : undefined,
    getSupportedScenarios: (id: ProductionSystemId) => supported.get(id),
  });
  return { status: 'valid', repository } as const;
}
export type ProductionSystemLoad = ReturnType<
  typeof createProductionSystemRepository
>;
