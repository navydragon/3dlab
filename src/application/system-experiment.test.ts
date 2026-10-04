import { describe, expect, it } from 'vitest';
import {
  dependencies,
  systems,
} from '../../tests/simulation/production-system-fixture';
import { createProductionSystemRepository } from '../content/production-system-repository';
import type {
  ProductionSystemId,
  ScenarioId,
  SimulationModelId,
} from '../domain/ids';
import {
  compareVariants,
  copyInput,
  explainResult,
  getParticipantCounts,
  getRelatedSystems,
  getSystemsCatalog,
  initialExperiment,
  reduceExperiment,
  resolveExperiment,
  runExperiment,
  updateTruckCount,
} from './system-experiment';
import type { ExperimentSource } from './system-experiment';

const deps = dependencies();
const loaded = createProductionSystemRepository(
  systems,
  deps.domain,
  deps.scenarios,
);
if (loaded.status !== 'valid') throw new Error('Fixture invalid');
const repo = loaded.repository;
const id = repo.list()[0]!.id;
const scenario = repo.getSupportedScenarios(id)![0]!;
const source: ExperimentSource = { system: repo.get(id)!, scenario };
function calculated(n: number) {
  const result = runExperiment(source, updateTruckCount(scenario.input, n));
  if (result.status !== 'success') throw new Error('Expected success');
  return result.variant;
}
describe('system experiment orchestration', () => {
  it('reports exact unchanged/decreased directions without a near-balance threshold', () => {
    let state = reduceExperiment(source, initialExperiment(source), {
      type: 'count',
      value: 4,
    });
    state = reduceExperiment(source, state, { type: 'calculate' });
    state = reduceExperiment(source, state, { type: 'count', value: 5 });
    state = reduceExperiment(source, state, { type: 'calculate' });
    expect(state.observed).toBe('same');
    state = reduceExperiment(source, state, { type: 'count', value: 3 });
    state = reduceExperiment(source, state, { type: 'calculate' });
    expect(state.observed).toBe('decrease');
  });
  it('resolves explicit immutable source, overview, missing and unsupported sources without defaults', () => {
    expect(resolveExperiment(repo, deps.domain, id, undefined).status).toBe(
      'overview',
    );
    const resolved = resolveExperiment(
      repo,
      deps.domain,
      id,
      scenario.scenarioId,
    );
    expect(resolved.status).toBe('experiment');
    if (resolved.status === 'experiment') {
      expect(resolved.source.scenario).toBe(scenario);
      expect(resolved.editable.maxCount).toBeNull();
    }
    expect(
      resolveExperiment(repo, deps.domain, id, 'not-supported' as ScenarioId)
        .status,
    ).toBe('scenario-unavailable');
    expect(
      resolveExperiment(
        repo,
        deps.domain,
        'missing' as ProductionSystemId,
        scenario.scenarioId,
      ).status,
    ).toBe('missing-system');
    const broken = {
      ...repo,
      get: () => ({
        ...source.system,
        simulationModelId: 'other-model' as SimulationModelId,
      }),
    };
    expect(
      resolveExperiment(broken, deps.domain, id, scenario.scenarioId).status,
    ).toBe('unsupported-model');
    expect(getSystemsCatalog(repo, deps.domain).status).toBe('ready');
    expect(getRelatedSystems(repo, source.system.processId)).toEqual([
      source.system,
    ]);
  });
  it('copies inputs and changes only working truck count', () => {
    const copy = copyInput(scenario.input);
    expect(copy).toEqual(scenario.input);
    expect(copy).not.toBe(scenario.input);
    expect(copy.truck).not.toBe(scenario.input.truck);
    const changed = updateTruckCount(copy, 3);
    expect(scenario.input.truck.truckCount).toBe(1);
    expect(copy.truck.truckCount).toBe(1);
    expect(changed.excavator).toEqual(copy.excavator);
    expect(changed.task).toEqual(copy.task);
    expect(getParticipantCounts(source, changed)).toEqual([1, 3]);
  });
  it.each([0, -1, 1.5, NaN, Infinity])(
    'rejects invalid count %s explicitly',
    (n) => {
      expect(
        runExperiment(source, updateTruckCount(scenario.input, n)),
      ).toMatchObject({ status: 'error', error: { code: 'invalid-input' } });
    },
  );
  it('respects content bounds and dispatches by model ID without an artificial max', () => {
    expect(
      runExperiment(source, updateTruckCount(scenario.input, 1000)).status,
    ).toBe('success');
    const limited = {
      ...source,
      system: {
        ...source.system,
        participantDefinitions: source.system.participantDefinitions.map(
          (p) => ({
            ...p,
            minCount: p.maxCount === null ? 2 : p.minCount,
            maxCount: p.maxCount === null ? 4 : p.maxCount,
          }),
        ),
      },
    };
    for (const n of [1, 5])
      expect(
        runExperiment(limited, updateTruckCount(scenario.input, n)),
      ).toMatchObject({
        status: 'error',
        error: { code: 'count-constraints' },
      });
    expect(
      runExperiment(
        {
          ...source,
          system: {
            ...source.system,
            simulationModelId: 'unsupported' as SimulationModelId,
          },
        },
        scenario.input,
      ),
    ).toMatchObject({ status: 'error', error: { code: 'unsupported-model' } });
    expect(
      runExperiment(source, updateTruckCount(scenario.input, Number.MAX_VALUE)),
    ).toMatchObject({ status: 'error', error: { code: 'calculation' } });
  });
  it('retains exact N3/N4 core oracles and justified explanations', () => {
    const a = calculated(3);
    const b = calculated(4);
    expect(a.result.metrics['system-productivity']).toBeCloseTo(
      123.2164948453608,
      12,
    );
    expect(a.result.metrics['project-duration']).toBeCloseTo(
      8.11579651941098,
      12,
    );
    expect(a.result.metrics['total-operating-cost']).toBeCloseTo(
      3165.160642570282,
      10,
    );
    expect(a.result.metrics['excavator-idle-share']).toBeCloseTo(
      0.0103092783505154,
      14,
    );
    expect(a.result.metrics['truck-wait-time']).toBe(0);
    expect(b.result.metrics['system-productivity']).toBe(124.5);
    expect(b.result.metrics['project-duration']).toBeCloseTo(
      8.032128514056225,
      12,
    );
    expect(b.result.metrics['total-operating-cost']).toBeCloseTo(
      3694.779116465864,
      10,
    );
    expect(b.result.metrics['excavator-idle-share']).toBe(0);
    expect(b.result.metrics['truck-wait-time']).toBeCloseTo(4.65, 12);
    expect(b.result.metrics['truck-wait-share']).toBeCloseTo(0.2421875, 12);
    expect(explainResult(a)).toEqual({
      transportLimited: true,
      waiting: false,
    });
    expect(explainResult(b)).toEqual({
      transportLimited: false,
      waiting: true,
    });
  });
  it('saves frozen independent snapshots, stales edits, resets without altering A/B, never overwrites full slots', () => {
    let state = initialExperiment(source);
    state = reduceExperiment(source, state, { type: 'count', value: 3 });
    state = reduceExperiment(source, state, { type: 'calculate' });
    state = reduceExperiment(source, state, { type: 'save' });
    const a = state.saved[0]!;
    expect(Object.isFrozen(a)).toBe(true);
    expect(Object.isFrozen(a.input.truck)).toBe(true);
    expect(Object.isFrozen(a.result.metrics)).toBe(true);
    state = reduceExperiment(source, state, { type: 'count', value: 4 });
    expect(state.stale).toBe(true);
    expect(state.latest).toBe(a);
    expect(reduceExperiment(source, state, { type: 'save' })).toBe(state);
    state = reduceExperiment(source, state, {
      type: 'predict',
      value: 'increase',
    });
    state = reduceExperiment(source, state, { type: 'calculate' });
    expect(state.observed).toBe('increase');
    expect(state.prediction).toBe('increase');
    state = reduceExperiment(source, state, { type: 'save' });
    const b = state.saved[1]!;
    expect(a.input.truck.truckCount).toBe(3);
    expect(b.input.truck.truckCount).toBe(4);
    expect(reduceExperiment(source, state, { type: 'save' })).toBe(state);
    const comparison = compareVariants(a, b);
    expect(comparison.status).toBe('available');
    if (comparison.status === 'available') {
      expect(comparison.truckCountDelta).toBe(1);
      expect(comparison.deltas['system-productivity']).toBeCloseTo(
        1.2835051546392,
        12,
      );
      expect(comparison.deltas['system-hourly-cost']).toBe(70);
      expect(comparison.deltas['excavator-idle-share']).toBe(
        -a.result.metrics['excavator-idle-share'],
      );
    }
    state = reduceExperiment(source, state, { type: 'reset' });
    expect(state.working).toEqual(scenario.input);
    expect(state.stale).toBe(true);
    expect(state.saved).toEqual([a, b]);
    state = reduceExperiment(source, state, { type: 'clear' });
    expect(state.saved).toEqual([null, null]);
    expect(
      compareVariants(a, { ...b, scenarioId: 'other' as ScenarioId }).status,
    ).toBe('incompatible');
  });
  it('clears latest success on failed recalculation but preserves saved variant', () => {
    let state = reduceExperiment(source, initialExperiment(source), {
      type: 'calculate',
    });
    state = reduceExperiment(source, state, { type: 'save' });
    state = reduceExperiment(source, state, { type: 'count', value: NaN });
    state = reduceExperiment(source, state, { type: 'calculate' });
    expect(state.latest).toBeNull();
    expect(state.error?.code).toBe('invalid-input');
    expect(state.saved[0]).not.toBeNull();
  });
});
