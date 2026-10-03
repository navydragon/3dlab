import machines from '../../../../content/domain/machines.json';
import machineComponents from '../../../../content/domain/machine-components.json';
import operations from '../../../../content/domain/operations.json';
import machineRoles from '../../../../content/domain/machine-roles.json';
import processes from '../../../../content/domain/processes.json';
import processStages from '../../../../content/domain/process-stages.json';
import { createDomainRepository } from '../../repository';
import type { RepositoryLoad } from '../../repository';
import type { domainFiles } from './manifest';

// Bundler-specific imports stay here. Shape and graph failures remain explicit.
export const localDomainContent = {
  machines,
  machineComponents,
  operations,
  machineRoles,
  processes,
  processStages,
} satisfies Record<keyof typeof domainFiles, unknown>;
let loaded: RepositoryLoad | undefined;
export function loadLocalDomainRepository(): RepositoryLoad {
  loaded ??= createDomainRepository(localDomainContent);
  return loaded;
}
