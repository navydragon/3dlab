import { createSimulationScenarioRepository } from '../../simulation-scenario-repository';

// This directory is reserved for one earthworks scenario record per JSON file.
const files = import.meta.glob('../../../../content/simulation/**/*.json', {
  eager: true,
  import: 'default',
});
export const localSimulationScenarios = createSimulationScenarioRepository(
  Object.entries(files)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([, record]) => record),
);
