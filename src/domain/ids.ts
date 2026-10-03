declare const idKind: unique symbol;

type Id<Kind extends string> = string & { readonly [idKind]: Kind };
export type MachineId = Id<'Machine'>;
export type ProcessId = Id<'Process'>;
export type ProcessStageId = Id<'ProcessStage'>;
export type LearningSectionId = Id<'LearningSection'>;
export type MachineComponentId = Id<'MachineComponent'>;
export type OperationId = Id<'Operation'>;
export type MachineRoleId = Id<'MachineRole'>;
export type Asset3DId = Id<'Asset3D'>;

export function isAsset3DId(value: unknown): value is Asset3DId {
  return isStableId(value);
}

// Structural identity only: these guards do not establish content existence.
export function isStableId(value: unknown): value is string {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export function isMachineComponentId(
  value: unknown,
): value is MachineComponentId {
  return isStableId(value);
}
export function isOperationId(value: unknown): value is OperationId {
  return isStableId(value);
}
export function isMachineRoleId(value: unknown): value is MachineRoleId {
  return isStableId(value);
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
