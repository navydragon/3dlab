import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import records from '../../content/learning/productivity.json';
import rawScenario from '../../content/simulation/base-earthworks-scenario.json';
import { createProductivityRepository } from '../../src/content/productivity-repository';
import { createSimulationScenarioRepository } from '../../src/content/simulation-scenario-repository';
import { loadLocalDomainRepository } from '../../src/content/adapters/local/repository';
import { parameterIds } from '../../src/domain/productivity';
const loaded = loadLocalDomainRepository();
const scenarios = createSimulationScenarioRepository([rawScenario]);
if (loaded.status !== 'loaded' || scenarios.status !== 'valid')
  throw new Error('Bad fixtures');
const domain = loaded.repository;
const load = (input: unknown = records) =>
  createProductivityRepository(input, domain, scenarios.repository);
describe('reviewed S3 learning contract', () => {
  it('loads exact four canonical parameters with frozen prose/source records, no duplicated numeric scenario', () => {
    const result = load();
    if (result.status !== 'loaded') throw new Error('Bad pack');
    const r = result.repository.list()[0]!;
    expect(r.parameters.map((p) => p.parameterId)).toEqual(parameterIds);
    expect(result.repository.get(r.machineId)).toBe(r);
    expect(Object.isFrozen(r.parameters[0]!.notes)).toBe(true);
    for (const source of r.sources)
      expect(
        readFileSync(
          new URL('../../' + source.location, import.meta.url),
          'utf8',
        ),
      ).not.toBe('');
    expect(r).not.toHaveProperty('input');
    expect(r).not.toHaveProperty('ranges');
  });
  it('preserves reviewed explanatory copy verbatim after whitespace normalization', () => {
    const doc = readFileSync(
      new URL(
        '../../docs/product/s3-productivity-content-pack.md',
        import.meta.url,
      ),
      'utf8',
    );
    const approved = [...doc.matchAll(/"([\s\S]*?)"/g)].map((m) =>
      m[1]!.replace(/\s+/g, ' ').trim(),
    );
    const r = records[0]!;
    for (const p of r.parameters)
      for (const text of [p.definition, p.causalExplanation, ...p.notes])
        expect(approved).toContain(text);
    for (const text of [
      r.machineVsSystem,
      r.predictionPrompt,
      r.explanationPrompt,
      r.theoreticalExplanation,
    ])
      expect(approved).toContain(text);
    for (const formula of r.relationships) expect(doc).toContain(formula);
  });
  const mutations: [string, (r: typeof records) => void][] = [
    [
      'wrong machine',
      (r) => {
        r[0]!.machineId = 'dump-truck';
      },
    ],
    [
      'unknown machine',
      (r) => {
        r[0]!.machineId = 'missing';
      },
    ],
    [
      'missing scenario',
      (r) => {
        r[0]!.sourceScenarioId = 'missing';
      },
    ],
    [
      'model mismatch',
      (r) => {
        r[0]!.simulationModelId = 'foreign';
      },
    ],
    [
      'unknown parameter',
      (r) => {
        r[0]!.parameters[0]!.parameterId = 'other';
      },
    ],
    [
      'duplicate parameter',
      (r) => {
        r[0]!.parameters[1]!.parameterId = r[0]!.parameters[0]!.parameterId;
      },
    ],
    [
      'missing parameter',
      (r) => {
        r[0]!.parameters.pop();
      },
    ],
    [
      'missing prose',
      (r) => {
        r[0]!.parameters[0]!.definition = '';
      },
    ],
    [
      'unknown source',
      (r) => {
        r[0]!.sourceRefs = ['missing'];
      },
    ],
    [
      'missing source',
      (r) => {
        r[0]!.parameters[0]!.sourceRefs = [];
      },
    ],
    [
      'duplicate record',
      (r) => {
        r.push(r[0]!);
      },
    ],
    [
      'duplicate source',
      (r) => {
        r[0]!.sources.push(r[0]!.sources[0]!);
      },
    ],
  ];
  it.each(mutations)('rejects %s', (_, mutate) => {
    const r = structuredClone(records);
    mutate(r);
    expect(load(r).status).toBe('invalid');
  });
});

it('rejects a scenario/model mismatch even when the model itself is supported', () => {
  const scenario = scenarios.repository.list()[0]!;
  const mismatched = {
    ...scenario,
    modelId: 'foreign' as typeof scenario.modelId,
  };
  expect(
    createProductivityRepository(records, domain, {
      list: () => [mismatched],
      get: () => mismatched,
    }).status,
  ).toBe('invalid');
});
