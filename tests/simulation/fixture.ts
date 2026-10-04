import { expect } from 'vitest';
import scenario from '../../content/simulation/base-earthworks-scenario.json';
import { simulationScenarioSchema } from '../../src/content/simulation-scenario.ts';
import { calculate } from '../../src/simulation/calculate.ts';
import type {
  SimulationInput,
  SimulationResult,
} from '../../src/simulation/contracts.ts';

const baseline = simulationScenarioSchema.parse(scenario).input;
export function input(
  overrides: {
    excavator?: Partial<SimulationInput['excavator']>;
    truck?: Partial<SimulationInput['truck']>;
    task?: Partial<SimulationInput['task']>;
  } = {},
): SimulationInput {
  return {
    excavator: { ...baseline.excavator, ...overrides.excavator },
    truck: { ...baseline.truck, ...overrides.truck },
    task: { ...baseline.task, ...overrides.task },
  };
}
export function success(
  value: SimulationInput = input(),
): Extract<SimulationResult, { status: 'success' }> {
  const result = calculate(value);
  if (result.status !== 'success') throw new Error(JSON.stringify(result));
  return result;
}
export function close(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(
    expected === 0 ? 1e-12 : Math.abs(expected) * 1e-6,
  );
}
