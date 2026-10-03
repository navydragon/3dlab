import type { DomainRepository, MachineUse } from '../content/repository';
import type { Process, ProcessStage, MachineRole } from '../domain/entities';
import { isLearningSectionId } from '../domain/ids';
import type {
  MachineId,
  ProcessId,
  ProcessStageId,
  LearningSectionId,
} from '../domain/ids';
import { getMachineOverview, getProcessOverview } from './domain-queries';

function section(id: string, name: string) {
  if (!isLearningSectionId(id))
    throw new Error('Invalid application section ID');
  return Object.freeze({ id, name });
}
export const machineSections = Object.freeze([
  section('overview', 'Обзор'),
  section('applications', 'Где применяется'),
]);

export interface OriginContext {
  readonly processId: ProcessId;
  readonly stageId: ProcessStageId;
}
export function validateMachineOrigin(
  repository: DomainRepository,
  machineId: MachineId,
  origin: OriginContext | null | undefined,
) {
  if (origin === undefined) return { status: 'none' } as const;
  if (origin === null) return { status: 'invalid' } as const;
  const process = repository.getProcess(origin.processId);
  const stage = repository.getProcessStage(origin.stageId);
  const participates = repository
    .getWhereUsed(machineId)
    ?.some(
      (use) =>
        use.process.id === origin.processId && use.stage.id === origin.stageId,
    );
  if (!process || !stage || stage.processId !== process.id || !participates)
    return { status: 'invalid' } as const;
  return { status: 'valid', context: origin, process, stage } as const;
}
function groupUsage(uses: readonly MachineUse[]) {
  const groups = new Map<
    ProcessId,
    {
      process: Process;
      stages: Map<
        ProcessStageId,
        { stage: ProcessStage; roles: MachineRole[] }
      >;
    }
  >();
  for (const use of uses) {
    let group = groups.get(use.process.id);
    if (!group) {
      group = { process: use.process, stages: new Map() };
      groups.set(use.process.id, group);
    }
    let stage = group.stages.get(use.stage.id);
    if (!stage) {
      stage = { stage: use.stage, roles: [] };
      group.stages.set(use.stage.id, stage);
    }
    stage.roles.push(use.role);
  }
  return Object.freeze(
    [...groups.values()].map((group) =>
      Object.freeze({
        process: group.process,
        stages: Object.freeze(
          [...group.stages.values()].map((entry) =>
            Object.freeze({
              stage: entry.stage,
              roles: Object.freeze(entry.roles),
            }),
          ),
        ),
      }),
    ),
  );
}
export function getMachinePage(
  repository: DomainRepository,
  machineId: MachineId,
  sectionId: LearningSectionId | undefined,
  origin: OriginContext | null | undefined,
) {
  const overview = getMachineOverview(repository, machineId);
  if (!overview) return { status: 'missing-machine' } as const;
  const selectedSection = machineSections.find(
    (entry) => entry.id === (sectionId ?? 'overview'),
  );
  if (!selectedSection)
    return { status: 'missing-section', machine: overview.machine } as const;
  const operations = overview.machine.operationIds.map((id) => {
    const operation = repository.getOperation(id);
    if (!operation) throw new Error('Validated operation reference is missing');
    return operation;
  });
  return {
    status: 'ready',
    ...overview,
    operations: Object.freeze(operations),
    sections: machineSections,
    selectedSection,
    usage: groupUsage(overview.whereUsed),
    origin: validateMachineOrigin(repository, machineId, origin),
  } as const;
}
export function getProcessPage(
  repository: DomainRepository,
  processId: ProcessId,
  selection: ProcessStageId | null | undefined,
) {
  const overview = getProcessOverview(repository, processId);
  if (!overview) return { status: 'missing-process' } as const;
  const selected = overview.stages.find(
    (entry) => entry.stage.id === selection,
  );
  const stageSelection =
    selection === undefined
      ? ({ status: 'none' } as const)
      : selected
        ? ({ status: 'selected', detail: selected } as const)
        : ({ status: 'invalid' } as const);
  return { status: 'ready', ...overview, selection: stageSelection } as const;
}
