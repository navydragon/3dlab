import records from '../../../../content/domain/production-systems.json';
import { createProductionSystemRepository } from '../../production-system-repository';
import { loadLocalDomainRepository } from './repository';
import { localSimulationScenarios } from './simulation-scenarios';

function load() {
  const domain = loadLocalDomainRepository();
  if (domain.status === 'invalid') return domain;
  if (localSimulationScenarios.status === 'invalid')
    return localSimulationScenarios;
  return createProductionSystemRepository(
    records,
    domain.repository,
    localSimulationScenarios.repository,
  );
}
export const localProductionSystems = load();
