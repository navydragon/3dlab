import records from '../../../../content/learning/productivity.json';
import { createProductivityRepository } from '../../productivity-repository';
import type { DomainRepository } from '../../repository';
import { localSimulationScenarios } from './simulation-scenarios';
export function loadLocalProductivity(domain: DomainRepository) {
  if (localSimulationScenarios.status === 'invalid')
    return {
      learning: {
        status: 'invalid',
        issues: localSimulationScenarios.issues,
      } as const,
      scenarios: null,
    };
  return {
    learning: createProductivityRepository(
      records,
      domain,
      localSimulationScenarios.repository,
    ),
    scenarios: localSimulationScenarios.repository,
  };
}
