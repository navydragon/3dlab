import { describe, expect, it } from 'vitest';
import { domainGraphSchema } from './schemas/domain';
import { validateDomainContent } from './validation';
import { createDomainRepository } from './repository';
import {
  localDomainContent,
  loadLocalDomainRepository,
} from './adapters/local/repository';
import {
  isMachineId,
  isOperationId,
  isProcessId,
  isProcessStageId,
  isMachineRoleId,
} from '../domain/ids';
import {
  getMachineCatalog,
  getMachineOverview,
  getProcessOverview,
  getWhereMachineIsUsed,
} from '../application/domain-queries';

type Fixture = typeof localDomainContent;
function record<T>(items: readonly T[], predicate: (item: T) => boolean): T {
  const found = items.find(predicate);
  if (!found) throw new Error('Missing test fixture record');
  return found;
}
function repository() {
  const loaded = loadLocalDomainRepository();
  if (loaded.status !== 'loaded')
    throw new Error('Production graph is invalid');
  return loaded.repository;
}

describe('production shape validation', () => {
  it('accepts the six real collections', () => {
    expect(validateDomainContent(localDomainContent).status).toBe('valid');
  });
  it.each([
    [
      'missing name',
      (fixture: Fixture) => {
        record(fixture.machines, (item) => item.id === 'excavator').name = '';
      },
    ],
    [
      'invalid ID',
      (fixture: Fixture) => {
        record(fixture.machines, (item) => item.id === 'excavator').id =
          'Invalid ID';
      },
    ],
    [
      'invalid component ID',
      (fixture: Fixture) => {
        record(fixture.machineComponents, (item) => item.id === 'bucket').id =
          '/bucket';
      },
    ],
    [
      'nonpositive sequence',
      (fixture: Fixture) => {
        record(
          fixture.processStages,
          (item) => item.id === 'excavation-stage',
        ).sequence = 0;
      },
    ],
    [
      'duplicate references',
      (fixture: Fixture) => {
        record(
          fixture.machines,
          (item) => item.id === 'excavator',
        ).operationIds.push('excavation');
      },
    ],
  ])('rejects %s', (_name, change) => {
    const fixture = structuredClone(localDomainContent);
    change(fixture);
    const result = validateDomainContent(fixture);
    expect(result.status).toBe('invalid');
    if (result.status === 'invalid')
      expect(result.issues.some((issue) => issue.phase === 'shape')).toBe(true);
  });
  it('rejects malformed and unexpected record fields', () => {
    expect(domainGraphSchema.safeParse(null).success).toBe(false);
    expect(
      domainGraphSchema.safeParse({
        ...localDomainContent,
        machines: [
          { ...localDomainContent.machines[0], unexpectedField: 'test-only' },
        ],
      }).success,
    ).toBe(false);
  });
});

describe('graph integrity', () => {
  it.each([
    [
      'duplicate-id',
      (fixture: Fixture) => {
        fixture.machines.push(
          structuredClone(
            record(fixture.machines, (item) => item.id === 'excavator'),
          ),
        );
      },
    ],
    [
      'missing-component',
      (fixture: Fixture) => {
        record(
          fixture.machines,
          (item) => item.id === 'excavator',
        ).componentIds.push('missing-component');
      },
    ],
    [
      'component-ownership',
      (fixture: Fixture) => {
        record(
          fixture.machineComponents,
          (item) => item.id === 'bucket',
        ).machineId = 'dump-truck';
      },
    ],
    [
      'missing-operation',
      (fixture: Fixture) => {
        record(
          fixture.machines,
          (item) => item.id === 'excavator',
        ).operationIds.push('missing-operation');
      },
    ],
    [
      'missing-operation',
      (fixture: Fixture) => {
        record(
          fixture.processStages,
          (item) => item.id === 'loading-stage',
        ).operationId = 'missing-operation';
      },
    ],
    [
      'missing-stage',
      (fixture: Fixture) => {
        record(
          fixture.processes,
          (item) => item.id === 'excavation-haul',
        ).stageIds.push('missing-stage');
      },
    ],
    [
      'stage-ownership',
      (fixture: Fixture) => {
        record(
          fixture.processStages,
          (item) => item.id === 'loading-stage',
        ).processId = 'missing-process';
      },
    ],
    [
      'duplicate-sequence',
      (fixture: Fixture) => {
        record(
          fixture.processStages,
          (item) => item.id === 'loading-stage',
        ).sequence = 1;
      },
    ],
    [
      'stage-order',
      (fixture: Fixture) => {
        record(
          fixture.processes,
          (item) => item.id === 'excavation-haul',
        ).stageIds.reverse();
      },
    ],
    [
      'missing-role',
      (fixture: Fixture) => {
        record(
          fixture.processStages,
          (item) => item.id === 'loading-stage',
        ).machineRoleIds.push('missing-role');
      },
    ],
    [
      'missing-eligible-machine',
      (fixture: Fixture) => {
        record(
          fixture.machineRoles,
          (item) => item.id === 'soil-haul-vehicle',
        ).eligibleMachineIds.push('missing-machine');
      },
    ],
    [
      'missing-machine',
      (fixture: Fixture) => {
        record(
          fixture.machineComponents,
          (item) => item.id === 'bucket',
        ).machineId = 'missing-machine';
      },
    ],
    [
      'unlisted-component',
      (fixture: Fixture) => {
        record(
          fixture.machines,
          (item) => item.id === 'excavator',
        ).componentIds = ['bucket'];
      },
    ],
    [
      'unlisted-stage',
      (fixture: Fixture) => {
        record(
          fixture.processes,
          (item) => item.id === 'excavation-haul',
        ).stageIds = ['excavation-stage'];
      },
    ],
  ])(
    'reports structured %s issues and refuses a repository',
    (code, change) => {
      const fixture = structuredClone(localDomainContent);
      change(fixture);
      const result = createDomainRepository(fixture);
      expect(result.status).toBe('invalid');
      if (result.status === 'invalid')
        expect(result.issues).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              phase: 'graph',
              code,
              path: expect.any(Array),
              message: expect.any(String),
            }),
          ]),
        );
      expect('repository' in result).toBe(false);
    },
  );
  it('detects duplicate IDs in every entity collection', () => {
    for (const key of [
      'machines',
      'machineComponents',
      'operations',
      'machineRoles',
      'processes',
      'processStages',
    ] as const) {
      const records = localDomainContent[key];
      const result = validateDomainContent({
        ...localDomainContent,
        [key]: [...records, records[0]],
      });
      expect(result.status).toBe('invalid');
      if (result.status === 'invalid')
        expect(
          result.issues.some(
            (issue) => issue.code === 'duplicate-id' && issue.path[0] === key,
          ),
        ).toBe(true);
    }
  });
});

describe('read-only canonical repository and application queries', () => {
  it('surfaces a broken adapter invariant instead of hiding a missing role', () => {
    const repo = repository();
    const id = 'excavation-haul';
    if (!isProcessId(id)) throw new Error('Invalid fixture ID');
    expect(() =>
      getProcessOverview({ ...repo, getMachineRole: () => undefined }, id),
    ).toThrow('Repository invariant violated');
  });
  it('returns both machines, canonical identity and bucket components', () => {
    const repo = repository();
    const id = 'excavator';
    if (!isMachineId(id)) throw new Error('Invalid fixture ID');
    expect(repo.listMachines().map((machine) => machine.id)).toEqual([
      'excavator',
      'dump-truck',
    ]);
    expect(repo.getMachine(id)).toBe(repo.listMachines()[0]);
    expect(
      repo
        .getMachineComponents(id)
        ?.some((component) => component.id === 'bucket'),
    ).toBe(true);
    expect(getMachineCatalog(repo)).toBe(repo.listMachines());
    expect(getMachineOverview(repo, id)?.machine).toBe(repo.getMachine(id));
    expect(loadLocalDomainRepository()).toBe(loadLocalDomainRepository());
  });
  it('returns stages in canonical order regardless of collection order', () => {
    const id = 'excavation-haul';
    if (!isProcessId(id)) throw new Error('Invalid fixture ID');
    const fixture = structuredClone(localDomainContent);
    fixture.processStages.reverse();
    const loaded = createDomainRepository(fixture);
    if (loaded.status !== 'loaded')
      throw new Error('Unexpected invalid fixture');
    expect(loaded.repository.getProcess(id)?.name).toBe(
      'Разработка грунта с погрузкой в автосамосвалы и транспортированием',
    );
    expect(
      loaded.repository.getProcessStages(id)?.map((stage) => stage.id),
    ).toEqual([
      'excavation-stage',
      'loading-stage',
      'haul-stage',
      'unloading-stage',
    ]);
  });
  it.each(['excavator', 'dump-truck'])(
    'derives where-used for %s and shares machine records with process queries',
    (id) => {
      if (!isMachineId(id)) throw new Error('Invalid fixture ID');
      const processId = 'excavation-haul';
      if (!isProcessId(processId)) throw new Error('Invalid fixture ID');
      const repo = repository();
      const uses = getWhereMachineIsUsed(repo, id);
      expect(uses?.length).toBeGreaterThan(0);
      expect(
        uses?.every(
          (use) =>
            use.process === repo.getProcess(processId) &&
            use.stage === repo.getProcessStage(use.stage.id) &&
            use.role === repo.getMachineRole(use.role.id),
        ),
      ).toBe(true);
      const process = getProcessOverview(repo, processId);
      const resolvedMachines =
        process?.stages.flatMap((stage) =>
          stage.participants.flatMap((participant) => participant.machines),
        ) ?? [];
      expect(resolvedMachines).toContain(repo.getMachine(id));
      expect(uses?.some((use) => use.stage.id === 'loading-stage')).toBe(true);
    },
  );
  it('derives relations after test-only identity changes without machine-specific branches', () => {
    const fixture = structuredClone(localDomainContent);
    record(fixture.machines, (item) => item.id === 'excavator').id =
      'routing-test-machine';
    fixture.machineComponents.forEach((component) => {
      component.machineId = 'routing-test-machine';
    });
    record(
      fixture.machineRoles,
      (item) => item.id === 'excavation-lead-machine',
    ).eligibleMachineIds = ['routing-test-machine'];
    const loaded = createDomainRepository(fixture);
    const id = 'routing-test-machine';
    if (loaded.status !== 'loaded' || !isMachineId(id))
      throw new Error('Invalid test graph');
    expect(
      loaded.repository.getWhereUsed(id)?.map((use) => use.stage.id),
    ).toEqual(['excavation-stage', 'loading-stage']);
  });
  it('returns undefined for missing IDs and empty components for a known truck', () => {
    const repo = repository();
    const id = 'missing';
    if (
      !isMachineId(id) ||
      !isProcessId(id) ||
      !isProcessStageId(id) ||
      !isOperationId(id) ||
      !isMachineRoleId(id)
    )
      throw new Error('Invalid fixture ID');
    expect(repo.getMachine(id)).toBeUndefined();
    expect(repo.getMachineComponents(id)).toBeUndefined();
    expect(repo.getWhereUsed(id)).toBeUndefined();
    expect(repo.getProcess(id)).toBeUndefined();
    expect(repo.getProcessStages(id)).toBeUndefined();
    expect(repo.getProcessStage(id)).toBeUndefined();
    expect(repo.getOperation(id)).toBeUndefined();
    expect(repo.getMachineRole(id)).toBeUndefined();
    expect(getMachineOverview(repo, id)).toBeUndefined();
    expect(getProcessOverview(repo, id)).toBeUndefined();
    const truck = 'dump-truck';
    if (!isMachineId(truck)) throw new Error('Invalid fixture ID');
    expect(repo.getMachineComponents(truck)).toEqual([]);
  });
  it('prevents mutation through records, reference lists, query arrays and input aliases', () => {
    const fixture = structuredClone(localDomainContent);
    const loaded = createDomainRepository(fixture);
    const id = 'excavator';
    if (loaded.status !== 'loaded' || !isMachineId(id))
      throw new Error('Invalid fixture');
    const repo = loaded.repository;
    const machine = repo.getMachine(id);
    if (!machine) throw new Error('Missing fixture');
    expect(Reflect.set(machine, 'name', 'mutated')).toBe(false);
    expect(Reflect.set(machine.componentIds, '0', 'mutated')).toBe(false);
    expect(Object.isFrozen(repo.listMachines())).toBe(true);
    expect(Object.isFrozen(repo.getMachineComponents(id))).toBe(true);
    expect(Object.isFrozen(repo.getWhereUsed(id))).toBe(true);
    record(fixture.machines, (item) => item.id === 'excavator').name =
      'mutated';
    expect(machine.name).toBe('Гидравлический экскаватор');
  });
});
