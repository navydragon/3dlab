import { describe, expect, it } from 'vitest';
import scenario from '../../content/simulation/base-earthworks-scenario.json';
import { simulationScenarioSchema } from './simulation-scenario.ts';
import { calculate } from '../simulation/calculate.ts';

describe('illustrative scenario ingestion boundary', () => {
  it('validates production content and supplies explicit numerical input', () => {
    const parsed = simulationScenarioSchema.parse(scenario);
    expect(parsed.isIllustrative).toBe(true);
    expect(parsed.scenarioId).not.toBe(parsed.modelId);
    expect(calculate(parsed.input).status).toBe('success');
    expect(calculate(parsed.input)).not.toHaveProperty('scenarioId');
  });
  it.each([
    { ...scenario, modelId: 'earthworks' },
    { ...scenario, isIllustrative: 'false' },
    {
      ...scenario,
      input: {
        ...scenario.input,
        excavator: { ...scenario.input.excavator, cycleTimeSeconds: 0 },
      },
    },
    {
      ...scenario,
      input: {
        ...scenario.input,
        truck: { ...scenario.input.truck, loadedSpeedKmh: '24' },
      },
    },
    {
      ...scenario,
      input: { ...scenario.input, task: { workVolumeM3Loose: 0 } },
    },
    {
      ...scenario,
      input: {
        ...scenario.input,
        truck: { ...scenario.input.truck, truckCount: 1.5 },
      },
    },
    {
      ...scenario,
      input: {
        ...scenario.input,
        truck: { ...scenario.input.truck, capacityM3Bank: 12 },
      },
    },
  ])('rejects incorrect shape/units/model/constraints %j', (raw) =>
    expect(simulationScenarioSchema.safeParse(raw).success).toBe(false),
  );
});
