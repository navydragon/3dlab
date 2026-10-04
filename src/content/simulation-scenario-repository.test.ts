import { describe, expect, it } from 'vitest';
import baseline from '../../content/simulation/base-earthworks-scenario.json';
import { isScenarioId } from '../domain/ids';
import { simulationScenarioSchema } from './simulation-scenario';
import { validateSimulationScenarios } from './simulation-scenario-validation';
import { createSimulationScenarioRepository } from './simulation-scenario-repository';
import { localSimulationScenarios } from './adapters/local/simulation-scenarios';

const second = {
  ...baseline,
  scenarioId: 'test-second-scenario',
  source: 'Test-only independent source',
  isIllustrative: false,
};
function id(value: string) {
  if (!isScenarioId(value)) throw new Error('Invalid fixture');
  return value;
}
describe('scenario collection and read-only repository', () => {
  it('accepts a second explicit ID/source/boolean without adding production content', () => {
    expect(simulationScenarioSchema.parse(second)).toEqual(second);
    const result = validateSimulationScenarios([baseline, second]);
    expect(result.status).toBe('valid');
    if (result.status === 'valid')
      expect(result.scenarios.map((s) => s.scenarioId)).toEqual([
        baseline.scenarioId,
        second.scenarioId,
      ]);
  });
  it.each([
    [baseline, baseline],
    [baseline, { ...second, scenarioId: 'Bad ID' }],
    [baseline, { ...second, modelId: 'earthworks' }],
    [baseline, { ...second, source: '   ' }],
    [baseline, {}],
    [
      baseline,
      {
        ...second,
        input: {
          ...second.input,
          truck: { ...second.input.truck, truckCount: 0 },
        },
      },
    ],
  ])(
    'fails entire collection and repository on invalid/ambiguous content %j',
    (...records) => {
      const result = validateSimulationScenarios(records);
      expect(result.status).toBe('invalid');
      if (result.status === 'invalid') {
        expect(result.issues.length).toBeGreaterThan(0);
        expect(result.issues[0]?.path[0]).toBe(1);
        expect(result).not.toHaveProperty('scenarios');
      }
      expect(createSimulationScenarioRepository(records).status).toBe(
        'invalid',
      );
    },
  );
  it('returns explicit duplicate ID code and position', () => {
    const result = validateSimulationScenarios([baseline, baseline]);
    if (result.status !== 'invalid')
      throw new Error('Expected duplicate error');
    expect(result.issues[0]).toMatchObject({
      code: 'duplicate-id',
      path: [1, 'scenarioId'],
    });
  });
  it('lists/gets shared frozen records with no default and no calculations', () => {
    const mutable = structuredClone(second);
    const result = createSimulationScenarioRepository([baseline, mutable]);
    if (result.status !== 'valid') throw new Error('Invalid fixtures');
    const repo = result.repository;
    expect(repo.list()).toHaveLength(2);
    expect(repo.get(id(second.scenarioId))).toBe(repo.list()[1]);
    expect(repo.get(id('missing'))).toBeUndefined();
    const record = repo.get(id(second.scenarioId))!;
    for (const object of [
      repo,
      repo.list(),
      record,
      record.input,
      record.input.excavator,
      record.input.truck,
      record.input.task,
    ])
      expect(Object.isFrozen(object)).toBe(true);
    mutable.input.truck.truckCount = 8;
    expect(record.input.truck.truckCount).toBe(1);
    expect(() =>
      Object.assign(record.input.truck, { truckCount: 9 }),
    ).toThrow();
    expect(record).not.toHaveProperty('metrics');
  });
  it('accepts empty collection without a hidden default', () => {
    const result = createSimulationScenarioRepository([]);
    if (result.status !== 'valid') throw new Error('Invalid empty collection');
    expect(result.repository.list()).toEqual([]);
    expect(result.repository.get(id(baseline.scenarioId))).toBeUndefined();
  });
  it('local Vite adapter loads the unchanged illustrative baseline only', () => {
    if (localSimulationScenarios.status !== 'valid')
      throw new Error('Invalid local content');
    expect(localSimulationScenarios.repository.list()).toEqual([baseline]);
    expect(
      localSimulationScenarios.repository.get(id(baseline.scenarioId))
        ?.isIllustrative,
    ).toBe(true);
  });
});
