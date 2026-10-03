import type { DomainRepository } from '../content/repository';
import type { MachineId, ProcessId } from '../domain/ids';

function required<T>(value: T | undefined): T {
  if (value === undefined)
    throw new Error(
      'Repository invariant violated: a validated reference is missing',
    );
  return value;
}

export function getMachineCatalog(repository: DomainRepository) {
  return repository.listMachines();
}
export function getMachineOverview(
  repository: DomainRepository,
  id: MachineId,
) {
  const machine = repository.getMachine(id);
  if (!machine) return undefined;
  return Object.freeze({
    machine,
    components: required(repository.getMachineComponents(id)),
    whereUsed: required(repository.getWhereUsed(id)),
  });
}
export function getWhereMachineIsUsed(
  repository: DomainRepository,
  id: MachineId,
) {
  return repository.getWhereUsed(id);
}
export function getProcessOverview(
  repository: DomainRepository,
  id: ProcessId,
) {
  const process = repository.getProcess(id);
  if (!process) return undefined;
  const stages = required(repository.getProcessStages(id));
  return Object.freeze({
    process,
    stages: Object.freeze(
      stages.map((stage) =>
        Object.freeze({
          stage,
          operation: required(repository.getOperation(stage.operationId)),
          participants: Object.freeze(
            stage.machineRoleIds.map((roleId) => {
              const role = required(repository.getMachineRole(roleId));
              return Object.freeze({
                role,
                machines: Object.freeze(
                  role.eligibleMachineIds.map((machineId) =>
                    required(repository.getMachine(machineId)),
                  ),
                ),
              });
            }),
          ),
        }),
      ),
    ),
  });
}
