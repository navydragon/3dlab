import { describe, expect, it } from 'vitest';
import { createDomainRepository } from '../content/repository';
import {
  localDomainContent,
  loadLocalDomainRepository,
} from '../content/adapters/local/repository';
import {
  isMachineId,
  isProcessId,
  isProcessStageId,
  isLearningSectionId,
} from '../domain/ids';
import { getMachineCatalog, getProcessCatalog } from './domain-queries';
import {
  getMachinePage,
  getProcessPage,
  validateMachineOrigin,
} from './page-queries';

function machineId(value: string) {
  if (!isMachineId(value)) throw new Error('Invalid fixture ID');
  return value;
}
function processId(value: string) {
  if (!isProcessId(value)) throw new Error('Invalid fixture ID');
  return value;
}
function stageId(value: string) {
  if (!isProcessStageId(value)) throw new Error('Invalid fixture ID');
  return value;
}
function sectionId(value: string) {
  if (!isLearningSectionId(value)) throw new Error('Invalid fixture ID');
  return value;
}
function repository() {
  const loaded = loadLocalDomainRepository();
  if (loaded.status !== 'loaded') throw new Error('Invalid content');
  return loaded.repository;
}
const origin = {
  processId: processId('excavation-haul'),
  stageId: stageId('excavation-stage'),
};
function twoProcesses() {
  const fixture = structuredClone(localDomainContent);
  fixture.processes.push({
    id: 'other-process',
    name: 'Test-only process',
    stageIds: ['other-stage'],
  });
  fixture.processStages.push({
    id: 'other-stage',
    name: 'Test-only stage',
    processId: 'other-process',
    operationId: 'excavation',
    sequence: 1,
    machineRoleIds: ['excavation-lead-machine'],
  });
  const loaded = createDomainRepository(fixture);
  if (loaded.status !== 'loaded') throw new Error('Invalid test fixture');
  return loaded.repository;
}
describe('application page queries', () => {
  it('catalogs preserve canonical repository record identity', () => {
    const repo = repository();
    expect(getMachineCatalog(repo)).toBe(repo.listMachines());
    expect(getProcessCatalog(repo)).toBe(repo.listProcesses());
    expect(getProcessCatalog(repo)[0]).toBe(repo.getProcess(origin.processId));
  });
  it('resolves canonical machine, components and operations and groups stages by process', () => {
    const repo = repository();
    const view = getMachinePage(
      repo,
      machineId('excavator'),
      undefined,
      undefined,
    );
    if (view.status !== 'ready') throw new Error('Missing page');
    expect(view.machine).toBe(repo.getMachine(machineId('excavator')));
    expect(view.operations.map((operation) => operation.id)).toEqual([
      'excavation',
      'loading',
    ]);
    expect(view.components.some((component) => component.id === 'bucket')).toBe(
      true,
    );
    expect(view.usage).toHaveLength(1);
    expect(view.usage[0]?.stages.map((entry) => entry.stage.id)).toEqual([
      'excavation-stage',
      'loading-stage',
    ]);
    expect(view.usage[0]?.process).toBe(repo.getProcess(origin.processId));
    expect(
      getMachinePage(repo, machineId('unknown'), undefined, undefined).status,
    ).toBe('missing-machine');
    expect(
      getMachinePage(
        repo,
        machineId('excavator'),
        sectionId('unknown'),
        undefined,
      ).status,
    ).toBe('missing-section');
  });
  it('returns ordered stages with canonical compact machine records through roles', () => {
    const repo = repository();
    const view = getProcessPage(repo, origin.processId, origin.stageId);
    if (view.status !== 'ready' || view.selection.status !== 'selected')
      throw new Error('Missing selected stage');
    expect(view.stages.map((entry) => entry.stage.id)).toEqual([
      'excavation-stage',
      'loading-stage',
      'haul-stage',
      'unloading-stage',
    ]);
    expect(view.selection.detail.participants[0]?.machines[0]).toBe(
      repo.getMachine(machineId('excavator')),
    );
    expect(getProcessPage(repo, origin.processId, undefined)).toMatchObject({
      selection: { status: 'none' },
    });
    expect(getProcessPage(repo, processId('unknown'), undefined).status).toBe(
      'missing-process',
    );
  });
  it('rejects missing, malformed and foreign stages without defaulting to another stage', () => {
    const repo = twoProcesses();
    for (const id of [stageId('missing'), stageId('other-stage'), null]) {
      expect(getProcessPage(repo, origin.processId, id)).toMatchObject({
        status: 'ready',
        selection: { status: 'invalid' },
      });
    }
  });
  it('validates process/stage existence, ownership and machine participation for return', () => {
    const repo = twoProcesses();
    expect(
      validateMachineOrigin(repo, machineId('excavator'), origin).status,
    ).toBe('valid');
    expect(
      validateMachineOrigin(repo, machineId('excavator'), undefined).status,
    ).toBe('none');
    expect(
      validateMachineOrigin(repo, machineId('excavator'), null).status,
    ).toBe('invalid');
    for (const context of [
      { ...origin, processId: processId('missing') },
      { ...origin, stageId: stageId('missing') },
      { ...origin, stageId: stageId('other-stage') },
    ])
      expect(
        validateMachineOrigin(repo, machineId('excavator'), context).status,
      ).toBe('invalid');
    expect(
      validateMachineOrigin(repo, machineId('dump-truck'), origin).status,
    ).toBe('invalid');
    expect(
      validateMachineOrigin(repo, machineId('missing'), origin).status,
    ).toBe('invalid');
  });
  it('follows changed graph eligibility instead of entity-specific branches', () => {
    const fixture = structuredClone(localDomainContent);
    const role = fixture.machineRoles.find(
      (entry) => entry.id === 'excavation-lead-machine',
    );
    if (!role) throw new Error('Missing fixture role');
    role.eligibleMachineIds = ['dump-truck'];
    const loaded = createDomainRepository(fixture);
    if (loaded.status !== 'loaded') throw new Error('Invalid fixture graph');
    expect(
      validateMachineOrigin(loaded.repository, machineId('dump-truck'), origin)
        .status,
    ).toBe('valid');
    expect(
      validateMachineOrigin(loaded.repository, machineId('excavator'), origin)
        .status,
    ).toBe('invalid');
    const view = getProcessPage(
      loaded.repository,
      origin.processId,
      origin.stageId,
    );
    if (view.status !== 'ready' || view.selection.status !== 'selected')
      throw new Error('Missing selected stage');
    expect(view.selection.detail.participants[0]?.machines[0]).toBe(
      loaded.repository.getMachine(machineId('dump-truck')),
    );
  });
});
