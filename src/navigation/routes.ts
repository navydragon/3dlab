import {
  isMachineId,
  isProcessId,
  isProcessStageId,
  isLearningSectionId,
} from '../domain/ids';
import type {
  MachineId,
  ProcessId,
  ProcessStageId,
  LearningSectionId,
} from '../domain/ids';

export const routes = {
  home: '/',
  machines: '/machines',
  machine: '/machines/:machineId',
  machineSection: '/machines/:machineId/:sectionId',
  processes: '/processes',
  process: '/processes/:processId',
} as const;

export interface ReturnContext {
  readonly processId: ProcessId;
  readonly stageId: ProcessStageId;
}

function returnQuery(context?: ReturnContext): string {
  return context
    ? `?${new URLSearchParams({ fromProcess: context.processId, fromStage: context.stageId })}`
    : '';
}

export function machinePath(id: MachineId, context?: ReturnContext): string {
  return `${routes.machines}/${encodeURIComponent(id)}${returnQuery(context)}`;
}
export function machineSectionPath(
  id: MachineId,
  section: LearningSectionId,
  context?: ReturnContext,
): string {
  return `${routes.machines}/${encodeURIComponent(id)}/${encodeURIComponent(section)}${returnQuery(context)}`;
}
export function processPath(id: ProcessId, stage?: ProcessStageId): string {
  return `${routes.processes}/${encodeURIComponent(id)}${stage ? `?${new URLSearchParams({ stageId: stage })}` : ''}`;
}

type Parsed<T> =
  { readonly ok: true; readonly value: T } | { readonly ok: false };

export function parseMachineRoute(
  machineId: unknown,
  sectionId?: unknown,
): Parsed<{
  readonly machineId: MachineId;
  readonly sectionId: LearningSectionId | undefined;
}> {
  if (
    !isMachineId(machineId) ||
    (sectionId !== undefined && !isLearningSectionId(sectionId))
  ) {
    return { ok: false };
  }
  return { ok: true, value: { machineId, sectionId } };
}

export function parseProcessRoute(
  processId: unknown,
  search: string,
): Parsed<{
  readonly processId: ProcessId;
  readonly stageId: ProcessStageId | undefined;
}> {
  const query = new URLSearchParams(search);
  const stages = query.getAll('stageId');
  const stageId = stages[0];
  if (
    !isProcessId(processId) ||
    stages.length > 1 ||
    (stageId !== undefined && !isProcessStageId(stageId))
  ) {
    return { ok: false };
  }
  return { ok: true, value: { processId, stageId } };
}

// Parse identity only; application queries validate ownership and participation
// before enabling a contextual-return action. Never accept a raw return URL.
export function parseReturnContext(
  search: string,
): Parsed<ReturnContext | undefined> {
  const query = new URLSearchParams(search);
  const processes = query.getAll('fromProcess');
  const stages = query.getAll('fromStage');
  if (processes.length === 0 && stages.length === 0)
    return { ok: true, value: undefined };
  const processId = processes[0];
  const stageId = stages[0];
  if (
    processes.length !== 1 ||
    stages.length !== 1 ||
    !isProcessId(processId) ||
    !isProcessStageId(stageId)
  ) {
    return { ok: false };
  }
  return { ok: true, value: { processId, stageId } };
}
