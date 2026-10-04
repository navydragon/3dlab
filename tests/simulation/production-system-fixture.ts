import systems from '../../content/domain/production-systems.json';
import baseline from '../../content/simulation/base-earthworks-scenario.json';
import { localDomainContent } from '../../src/content/adapters/local/repository';
import { createDomainRepository } from '../../src/content/repository';
import { createSimulationScenarioRepository } from '../../src/content/simulation-scenario-repository';

export { systems, baseline, localDomainContent };
export function system() {
  return structuredClone(systems[0]!);
}
export function dependencies(
  rawDomain: unknown = localDomainContent,
  rawScenarios: readonly unknown[] = [baseline],
) {
  const domain = createDomainRepository(rawDomain);
  const scenarios = createSimulationScenarioRepository(rawScenarios);
  if (domain.status !== 'loaded' || scenarios.status !== 'valid')
    throw new Error('Invalid test dependencies');
  return { domain: domain.repository, scenarios: scenarios.repository };
}
