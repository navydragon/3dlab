import type { ProductionSystemId } from '../domain/ids';
import type { ProductionSystemRepository } from '../content/production-system-repository';
import type { DomainRepository } from '../content/repository';

/** Content join only; experiment selection/state/calculation belongs to a later slice. */
export function getProductionSystemOverview(
  systems: ProductionSystemRepository,
  domain: DomainRepository,
  id: ProductionSystemId,
) {
  const system = systems.get(id);
  if (!system) return { status: 'missing-system' } as const;
  const process = domain.getProcess(system.processId);
  const scenarios = systems.getSupportedScenarios(id);
  const participants = system.participantDefinitions.map((definition) => ({
    definition,
    machine: domain.getMachine(definition.machineId),
    role: domain.getMachineRole(definition.roleId),
  }));
  if (!process || !scenarios || participants.some((p) => !p.machine || !p.role))
    return { status: 'invalid-dependencies' } as const;
  return {
    status: 'ready',
    system,
    process,
    participants: Object.freeze(
      participants.map((p) =>
        Object.freeze({
          definition: p.definition,
          machine: p.machine!,
          role: p.role!,
        }),
      ),
    ),
    scenarios,
  } as const;
}
