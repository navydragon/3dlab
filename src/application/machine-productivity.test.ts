import { describe, expect, it } from 'vitest';
import records from '../../content/learning/productivity.json';
import scenarioRaw from '../../content/simulation/base-earthworks-scenario.json';
import { createProductivityRepository } from '../content/productivity-repository';
import { createSimulationScenarioRepository } from '../content/simulation-scenario-repository';
import { loadLocalDomainRepository } from '../content/adapters/local/repository';
import {
  initialMachineExperiment,
  reduceMachineExperiment,
  resolveProductivity,
  runMachineExperiment,
  sourceParameter,
  oneFactorInput,
  parameterPolicy,
} from './machine-productivity';
import { parameterIds } from '../domain/productivity';
import type { ParameterId } from '../domain/productivity';
const domain = loadLocalDomainRepository();
const scenarios = createSimulationScenarioRepository([scenarioRaw]);
if (domain.status !== 'loaded' || scenarios.status !== 'valid')
  throw new Error('Invalid fixtures');
const learning = createProductivityRepository(
  records,
  domain.repository,
  scenarios.repository,
);
if (learning.status !== 'loaded') throw new Error('Invalid learning');
const machine = domain.repository
  .listMachines()
  .find((m) => m.id === 'excavator')!;
const record = learning.repository.get(machine.id)!;
const resolved = resolveProductivity(record, scenarios.repository, machine.id);
if (resolved.status !== 'ready') throw new Error('Invalid experiment');
const source = resolved.source;
const oracles: [ParameterId, string, number[], string][] = [
  ['bucket-capacity', '1.5', [1.35, 150, 202.5, 168.075], 'increase'],
  ['bucket-fill-factor', '1', [1.2, 150, 180, 149.4], 'increase'],
  ['cycle-time', '30', [1.08, 120, 129.6, 107.568], 'decrease'],
  ['time-utilization', '0.9', [1.08, 150, 162, 145.8], 'increase'],
];
describe('S3 pure real-core machine experiment', () => {
  it('resolves explicit canonical source and baseline, keeping source frozen', () => {
    expect(source.scenario).toBe(
      scenarios.repository.get(source.scenario.scenarioId),
    );
    expect(source.scenario.scenarioId).toBe('base-earthworks-scenario');
    [
      source.baseline.q_eff,
      source.baseline.cycles_per_hour_60,
      source.baseline.Q_exc_60,
      source.baseline.Q_exc,
    ].forEach((v, i) =>
      expect(v).toBeCloseTo([1.08, 150, 162, 134.46][i]!, 10),
    );
    expect(Object.isFrozen(source.scenario.input.excavator)).toBe(true);
  });
  it.each(oracles)(
    'maps only %s and reads actual accepted outputs',
    (id, value, expected, direction) => {
      const snapshot = JSON.stringify(source.scenario);
      const result = runMachineExperiment(source, id, value);
      if (result.status !== 'success') throw new Error('Failed calculation');
      Object.values(result.latest.values).forEach((v, i) =>
        expect(v).toBeCloseTo(expected[i]!, 10),
      );
      expect(result.latest.observed).toBe(direction);
      const changed = Object.entries(result.latest.input.excavator).filter(
        ([key, v]) =>
          v !==
          source.scenario.input.excavator[
            key as keyof typeof source.scenario.input.excavator
          ],
      );
      expect(changed).toHaveLength(1);
      expect(sourceParameter(result.latest.input, id)).toBe(Number(value));
      expect(result.latest.input.truck).toEqual(source.scenario.input.truck);
      expect(result.latest.input.task).toEqual(source.scenario.input.task);
      expect(JSON.stringify(source.scenario)).toBe(snapshot);
      expect(Object.isFrozen(result.latest.input.excavator)).toBe(true);
    },
  );
  it('switches from edited cycle to capacity using source, clearing candidate/prediction/result and avoiding accumulated changes', () => {
    let state = initialMachineExperiment(source, 'cycle-time');
    state = reduceMachineExperiment(source, state, {
      type: 'edit',
      value: '30',
    });
    state = reduceMachineExperiment(source, state, {
      type: 'predict',
      value: 'decrease',
    });
    state = reduceMachineExperiment(source, state, { type: 'calculate' });
    expect(state.latest!.input.excavator.cycleTimeSeconds).toBe(30);
    state = reduceMachineExperiment(source, state, {
      type: 'select',
      id: 'bucket-capacity',
    });
    expect(state).toEqual(initialMachineExperiment(source, 'bucket-capacity'));
    state = reduceMachineExperiment(source, state, {
      type: 'edit',
      value: '1.5',
    });
    state = reduceMachineExperiment(source, state, { type: 'calculate' });
    expect(state.latest!.input.excavator).toEqual({
      ...source.scenario.input.excavator,
      bucketCapacityM3Loose: 1.5,
    });
    expect(state.latest!.values.Q_exc).toBeCloseTo(168.075, 10);
  });
  it('prediction is independent, observed direction compares to baseline, edits are stale and reset restores source', () => {
    let state = initialMachineExperiment(source, 'cycle-time');
    state = reduceMachineExperiment(source, state, {
      type: 'predict',
      value: 'increase',
    });
    expect(state.latest).toBeNull();
    state = reduceMachineExperiment(source, state, {
      type: 'edit',
      value: '30',
    });
    state = reduceMachineExperiment(source, state, { type: 'calculate' });
    const before = state.latest;
    state = reduceMachineExperiment(source, state, {
      type: 'edit',
      value: '28',
    });
    expect(state.latest).toBe(before);
    expect(state.stale).toBe(true);
    state = reduceMachineExperiment(source, state, { type: 'calculate' });
    expect(state.latest!.observed).toBe('decrease'); // 28 improves vs 30, still below SOURCE.
    state = reduceMachineExperiment(source, state, { type: 'reset' });
    expect(state).toEqual(initialMachineExperiment(source, 'cycle-time'));
    state = reduceMachineExperiment(source, state, { type: 'calculate' });
    expect(state.latest!.observed).toBe('same');
  });
  it.each(parameterIds)(
    'rejects mathematical invalid values for %s without normalizing source or result',
    (id) => {
      for (const value of ['', '0', '-1', 'Infinity', 'NaN', '1e999']) {
        const result = runMachineExperiment(source, id, value);
        expect(result.status).toBe('error');
        if (result.status === 'error') {
          expect(result.issues.length).toBeGreaterThan(0);
          expect(result.issues[0]!.phase).toBe('input');
        }
        let state = initialMachineExperiment(source, id);
        state = reduceMachineExperiment(source, state, { type: 'edit', value });
        state = reduceMachineExperiment(source, state, { type: 'calculate' });
        expect(state.latest).toBeNull();
        expect(state.candidate).toBe(value);
        expect(state.error!.length).toBeGreaterThan(0);
      }
    },
  );
  it('permits fill >1, rejects utilization >1 and adds no practical range', () => {
    expect(
      runMachineExperiment(source, 'bucket-fill-factor', '1.2').status,
    ).toBe('success');
    expect(runMachineExperiment(source, 'time-utilization', '1.2').status).toBe(
      'error',
    );
    for (const id of parameterIds)
      expect(parameterPolicy(id).max).toBe(
        id === 'time-utilization' ? 1 : undefined,
      );
    expect(runMachineExperiment(source, 'bucket-capacity', '100').status).toBe(
      'success',
    );
    expect(runMachineExperiment(source, 'cycle-time', '10000').status).toBe(
      'success',
    );
  });
  it('returns explicit absent/unsupported/model mismatch states', () => {
    expect(
      resolveProductivity(undefined, scenarios.repository, machine.id).status,
    ).toBe('unavailable');
    expect(
      resolveProductivity(
        record,
        { list: () => [], get: () => undefined },
        machine.id,
      ).status,
    ).toBe('missing-scenario');
    const foreign = {
      ...record,
      simulationModelId: 'foreign' as typeof record.simulationModelId,
    };
    expect(
      resolveProductivity(foreign, scenarios.repository, machine.id).status,
    ).toBe('unsupported-model');
    expect(
      runMachineExperiment({ ...source, learning: foreign }, 'cycle-time', '30')
        .status,
    ).toBe('unsupported-model');
    const mismatch = {
      ...source.scenario,
      modelId: 'foreign' as typeof source.scenario.modelId,
    };
    expect(
      resolveProductivity(
        record,
        { list: () => [], get: () => mismatch },
        machine.id,
      ).status,
    ).toBe('unsupported-model');
  });
  it('returns explicit numerical-range failure without a fabricated practical limit', () => {
    const result = runMachineExperiment(source, 'bucket-capacity', '1e-300');
    expect(result.status).toBe('error');
    if (result.status === 'error')
      expect(result.issues.some((i) => i.phase === 'calculation')).toBe(true);
    const copy = oneFactorInput(source.scenario.input, 'bucket-capacity', 1.5);
    expect(copy.excavator).not.toBe(source.scenario.input.excavator);
  });
});

it('keeps incorrect prediction ungraded and exposes baseline numerical failure', () => {
  let state = initialMachineExperiment(source, 'cycle-time');
  state = reduceMachineExperiment(source, state, { type: 'edit', value: '30' });
  state = reduceMachineExperiment(source, state, {
    type: 'predict',
    value: 'increase',
  });
  state = reduceMachineExperiment(source, state, { type: 'calculate' });
  expect(state.prediction).toBe('increase');
  expect(state.latest!.observed).toBe('decrease');
  expect(state.error).toBeNull();
  const extreme = {
    ...source.scenario,
    input: oneFactorInput(source.scenario.input, 'bucket-capacity', 1e-300),
  };
  expect(
    resolveProductivity(
      record,
      { list: () => [extreme], get: () => extreme },
      machine.id,
    ).status,
  ).toBe('calculation-error');
});
