import { describe, expect, it } from 'vitest';
import { createProductionSystemRepository } from '../content/production-system-repository';
import { localProductionSystems } from '../content/adapters/local/production-systems';
import { getProductionSystemOverview } from './production-system-queries';
import { isProductionSystemId, isProcessId, isScenarioId } from '../domain/ids';
import {
  system,
  systems,
  dependencies,
  localDomainContent,
} from '../../tests/simulation/production-system-fixture';

function systemId(value: string) {
  if (!isProductionSystemId(value)) throw new Error('Invalid ID');
  return value;
}
function processId(value: string) {
  if (!isProcessId(value)) throw new Error('Invalid ID');
  return value;
}
function scenarioId(value: string) {
  if (!isScenarioId(value)) throw new Error('Invalid ID');
  return value;
}
const deps = dependencies();
function repository(
  raw: unknown = systems,
  domain = deps.domain,
  scenarios = deps.scenarios,
) {
  const result = createProductionSystemRepository(raw, domain, scenarios);
  if (result.status !== 'valid') throw new Error('Invalid test repository');
  return result.repository;
}
describe('production system repository and application foundation', () => {
  it('joins canonical frozen systems/process/machines/roles/scenarios without copying', () => {
    const repo = repository();
    const id = systemId(system().id);
    const canonical = repo.list()[0]!;
    expect(repo.get(id)).toBe(canonical);
    expect(repo.getByProcess(processId(system().processId))?.[0]).toBe(
      canonical,
    );
    const scenario = deps.scenarios.get(
      scenarioId(system().supportedScenarioIds[0]!),
    );
    expect(repo.getSupportedScenarios(id)?.[0]).toBe(scenario);
    const query = getProductionSystemOverview(repo, deps.domain, id);
    if (query.status !== 'ready') throw new Error('Missing fixture');
    expect(query.system).toBe(canonical);
    expect(query.process).toBe(deps.domain.getProcess(canonical.processId));
    expect(query.scenarios[0]).toBe(scenario);
    query.participants.forEach((p) => {
      expect(p.machine).toBe(deps.domain.getMachine(p.definition.machineId));
      expect(p.role).toBe(deps.domain.getMachineRole(p.definition.roleId));
    });
    for (const object of [
      repo,
      repo.list(),
      canonical,
      canonical.participantDefinitions,
      canonical.participantDefinitions[0],
      canonical.supportedScenarioIds,
      repo.getSupportedScenarios(id),
    ])
      expect(Object.isFrozen(object)).toBe(true);
    expect(query).not.toHaveProperty('selectedScenario');
    expect(query).not.toHaveProperty('metrics');
    expect(canonical).not.toHaveProperty('truckCount');
  });
  it('has explicit absence and no default scenario', () => {
    const repo = repository();
    const missing = systemId('missing');
    expect(repo.get(missing)).toBeUndefined();
    expect(repo.getSupportedScenarios(missing)).toBeUndefined();
    expect(repo.getByProcess(processId('missing'))).toBeUndefined();
    expect(getProductionSystemOverview(repo, deps.domain, missing)).toEqual({
      status: 'missing-system',
    });
  });
  it('rejects invalid/duplicate repository creation', () => {
    expect(
      createProductionSystemRepository(
        [system(), system()],
        deps.domain,
        deps.scenarios,
      ).status,
    ).toBe('invalid');
    expect(
      createProductionSystemRepository(
        [{ ...system(), processId: 'missing' }],
        deps.domain,
        deps.scenarios,
      ).status,
    ).toBe('invalid');
  });
  it('relationships follow a second system/process fixture rather than canonical IDs', () => {
    const graph = structuredClone(localDomainContent);
    const otherProcess = 'test-other-process';
    graph.processes.push({
      ...graph.processes[0]!,
      id: otherProcess,
      stageIds: [],
    });
    const altered = dependencies(graph);
    const other = {
      ...system(),
      id: 'test-other-system',
      processId: otherProcess,
      name: 'Test only',
    };
    const repo = repository(
      [system(), other],
      altered.domain,
      altered.scenarios,
    );
    expect(repo.list()).toHaveLength(2);
    const id = systemId(other.id);
    expect(
      repo.getByProcess(processId(otherProcess))?.map((s) => s.id),
    ).toEqual([other.id]);
    expect(
      repo.getByProcess(processId(system().processId))?.map((s) => s.id),
    ).toEqual([system().id]);
    const query = getProductionSystemOverview(repo, altered.domain, id);
    if (query.status !== 'ready') throw new Error('Missing second system');
    expect(query.process.id).toBe(otherProcess);
    expect(query.scenarios[0]).toBe(altered.scenarios.list()[0]);
  });
  it('valid process without systems resolves to an empty list', () => {
    expect(repository([]).getByProcess(processId(system().processId))).toEqual(
      [],
    );
  });
  it('local adapter validates dependencies without connecting UI', () => {
    expect(localProductionSystems.status).toBe('valid');
    if (localProductionSystems.status === 'valid')
      expect(localProductionSystems.repository.list().map((s) => s.id)).toEqual(
        [system().id],
      );
  });
});
