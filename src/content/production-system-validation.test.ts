import { describe, expect, it } from 'vitest';
import { productionSystemSchema } from './schemas/production-system';
import { validateProductionSystems } from './production-system-validation';
import type { SimulationScenario } from './simulation-scenario';
import { getSupportedSimulationModel } from './supported-simulation-models';
import { calculate } from '../simulation/calculate';
import {
  system,
  systems,
  baseline,
  dependencies,
  localDomainContent,
} from '../../tests/simulation/production-system-fixture';
import { isProductionSystemId, isSimulationModelId } from '../domain/ids';

const deps = dependencies();
function codes(raw: unknown, domain = deps.domain, scenarios = deps.scenarios) {
  const result = validateProductionSystems(raw, domain, scenarios);
  expect(result.status).toBe('invalid');
  if (result.status !== 'invalid') throw new Error('Expected invalid content');
  return result.issues.map((issue) => issue.code);
}
describe('production system shape', () => {
  it('accepts canonical fixture and required stable IDs', () => {
    expect(productionSystemSchema.parse(system())).toEqual(system());
    expect(isProductionSystemId(system().id)).toBe(true);
    expect(isSimulationModelId(system().simulationModelId)).toBe(true);
    expect(isProductionSystemId('Bad ID')).toBe(false);
    expect(isSimulationModelId('Bad ID')).toBe(false);
  });
  it.each([
    { id: 'Bad ID' },
    { processId: 'Bad ID' },
    { simulationModelId: 'Bad ID' },
    { name: ' ' },
    { supportedScenarioIds: [] },
    { supportedScenarioIds: ['Bad ID'] },
    { supportedScenarioIds: ['test', 'test'] },
    { participantDefinitions: [] },
    {
      participantDefinitions: [
        { ...system().participantDefinitions[0], roleId: 'Bad ID' },
      ],
    },
    {
      participantDefinitions: [
        { ...system().participantDefinitions[0], machineId: 'Bad ID' },
      ],
    },
    {
      participantDefinitions: [
        system().participantDefinitions[0],
        system().participantDefinitions[0],
      ],
    },
    { currentTruckCount: 3 },
  ])('rejects malformed/duplicate/extra structure %j', (override) =>
    expect(
      productionSystemSchema.safeParse({ ...system(), ...override }).success,
    ).toBe(false),
  );
  it.each([0, -1, 1.5, NaN, Infinity, '1', null])(
    'rejects minCount=%s',
    (minCount) => {
      expect(
        productionSystemSchema.safeParse({
          ...system(),
          participantDefinitions: [
            { ...system().participantDefinitions[0], minCount },
          ],
        }).success,
      ).toBe(false);
    },
  );
  it.each([0, -1, 1.5, NaN, Infinity, '2'])(
    'rejects maxCount=%s',
    (maxCount) => {
      expect(
        productionSystemSchema.safeParse({
          ...system(),
          participantDefinitions: [
            { ...system().participantDefinitions[0], maxCount },
          ],
        }).success,
      ).toBe(false);
    },
  );
  it('rejects max < min and accepts null maximum', () => {
    const raw = system();
    raw.participantDefinitions[1]!.minCount = 3;
    raw.participantDefinitions[1]!.maxCount = 2;
    expect(productionSystemSchema.safeParse(raw).success).toBe(false);
    expect(productionSystemSchema.safeParse(system()).success).toBe(true);
  });
  it.each([null, {}, [{}]])(
    'returns structured shape errors for invalid collection %j',
    (raw) => {
      const r = validateProductionSystems(raw, deps.domain, deps.scenarios);
      expect(r.status).toBe('invalid');
      if (r.status === 'invalid') expect(r.issues[0]?.phase).toBe('shape');
    },
  );
});
describe('production system reference graph and model counts', () => {
  it('validates production references and the actual registered implementation', () => {
    const result = validateProductionSystems(
      systems,
      deps.domain,
      deps.scenarios,
    );
    expect(result.status).toBe('valid');
    const id = system().simulationModelId;
    if (!isSimulationModelId(id)) throw new Error('Invalid test ID');
    expect(getSupportedSimulationModel(id)?.calculate).toBe(calculate);
  });
  it('rejects duplicate system IDs', () =>
    expect(codes([system(), system()])).toContain('duplicate-id'));
  it('rejects missing process', () =>
    expect(codes([{ ...system(), processId: 'missing-process' }])).toContain(
      'missing-process',
    ));
  it('rejects missing machine', () => {
    const raw = system();
    raw.participantDefinitions[0]!.machineId = 'missing-machine';
    expect(codes([raw])).toContain('missing-machine');
  });
  it('rejects missing role', () => {
    const raw = system();
    raw.participantDefinitions[0]!.roleId = 'missing-role';
    expect(codes([raw])).toContain('missing-role');
  });
  it('checks eligibility from role records, not machine names', () => {
    const graph = structuredClone(localDomainContent);
    graph.machineRoles[0]!.eligibleMachineIds = ['dump-truck'];
    const altered = dependencies(graph);
    expect(codes([system()], altered.domain)).toContain('ineligible-machine');
  });
  it('rejects missing scenario', () =>
    expect(
      codes([{ ...system(), supportedScenarioIds: ['missing-scenario'] }]),
    ).toContain('missing-scenario'));
  it('rejects unsupported stable model ID', () =>
    expect(
      codes([{ ...system(), simulationModelId: 'unsupported-model' }]),
    ).toContain('unsupported-model'));
  it('independently rejects a scenario/model mismatch at the reference boundary', () => {
    // A hypothetical foreign-model record; bypass shape only to exercise the join check.
    const scenario = deps.scenarios.list()[0]!;
    const foreign = {
      ...deps.scenarios,
      get: () =>
        ({
          ...scenario,
          modelId: 'other-model',
        }) as unknown as SimulationScenario,
    };
    expect(codes([system()], deps.domain, foreign)).toContain(
      'scenario-model-mismatch',
    );
  });
  it('rejects scenario truck count below minimum', () => {
    const raw = system();
    raw.participantDefinitions[1]!.minCount = 2;
    expect(codes([raw])).toContain('scenario-count');
  });
  it('rejects scenario truck count above finite maximum', () => {
    const raw = system();
    raw.participantDefinitions[1]!.maxCount = 1;
    const altered = dependencies(localDomainContent, [
      {
        ...baseline,
        input: {
          ...baseline.input,
          truck: { ...baseline.input.truck, truckCount: 2 },
        },
      },
    ]);
    expect(codes([raw], altered.domain, altered.scenarios)).toContain(
      'scenario-count',
    );
  });
  it('null maximum introduces no arbitrary truck cap', () => {
    const altered = dependencies(localDomainContent, [
      {
        ...baseline,
        input: {
          ...baseline.input,
          truck: { ...baseline.input.truck, truckCount: 1000000 },
        },
      },
    ]);
    expect(
      validateProductionSystems(systems, altered.domain, altered.scenarios)
        .status,
    ).toBe('valid');
  });
  it.each([
    { minCount: 2, maxCount: 2 },
    { minCount: 1, maxCount: 2 },
    { minCount: 1, maxCount: null },
  ])('requires exact fixed excavator definition %j', (override) => {
    const raw = system();
    raw.participantDefinitions[0] = {
      ...raw.participantDefinitions[0]!,
      ...override,
    };
    expect(codes([raw])).toContain('model-structure');
  });
  it('model-specific count adapter has explicit, testable semantics', () => {
    const raw = system();
    const id = raw.simulationModelId;
    if (!isSimulationModelId(id)) throw new Error('Invalid fixture ID');
    const model = getSupportedSimulationModel(id)!;
    const parsed = productionSystemSchema.parse(raw);
    const scenario = deps.scenarios.list()[0]!;
    expect(
      model.participantCount(parsed.participantDefinitions[0]!, scenario),
    ).toBe(1);
    expect(
      model.participantCount(parsed.participantDefinitions[1]!, scenario),
    ).toBe(scenario.input.truck.truckCount);
  });
});
