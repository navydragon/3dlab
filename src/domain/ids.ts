declare const idKind: unique symbol;

type Id<Kind extends string> = string & { readonly [idKind]: Kind };
export type MachineId = Id<'Machine'>;
export type ProcessId = Id<'Process'>;
export type ProcessStageId = Id<'ProcessStage'>;
export type LearningSectionId = Id<'LearningSection'>;
export type MachineComponentId = Id<'MachineComponent'>;

// Structural identity only: these guards do not establish content existence.
function isStableId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function isMachineId(value: unknown): value is MachineId {
  return isStableId(value);
}
export function isProcessId(value: unknown): value is ProcessId {
  return isStableId(value);
}
export function isProcessStageId(value: unknown): value is ProcessStageId {
  return isStableId(value);
}
export function isLearningSectionId(
  value: unknown,
): value is LearningSectionId {
  return isStableId(value);
}
