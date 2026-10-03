import { z } from 'zod';
import {
  isMachineId,
  isMachineComponentId,
  isOperationId,
  isMachineRoleId,
  isProcessId,
  isProcessStageId,
} from '../../domain/ids.ts';
import type {
  MachineId,
  MachineComponentId,
  OperationId,
  MachineRoleId,
  ProcessId,
  ProcessStageId,
} from '../../domain/ids';
import type {
  Machine,
  MachineComponent,
  Operation,
  MachineRole,
  Process,
  ProcessStage,
  DomainGraph,
} from '../../domain/entities';

const text = z.string().trim().min(1);
const machineId = z.custom<MachineId>(
  isMachineId,
  'Expected a stable machine ID',
);
const componentId = z.custom<MachineComponentId>(
  isMachineComponentId,
  'Expected a stable component ID',
);
const operationId = z.custom<OperationId>(
  isOperationId,
  'Expected a stable operation ID',
);
const roleId = z.custom<MachineRoleId>(
  isMachineRoleId,
  'Expected a stable role ID',
);
const processId = z.custom<ProcessId>(
  isProcessId,
  'Expected a stable process ID',
);
const stageId = z.custom<ProcessStageId>(
  isProcessStageId,
  'Expected a stable stage ID',
);

function references<T>(schema: z.ZodType<T>) {
  return z
    .array(schema)
    .refine((ids) => new Set(ids).size === ids.length, 'Duplicate reference ID')
    .readonly();
}

export const machineSchema = z
  .strictObject({
    id: machineId,
    name: text,
    description: text.optional(),
    componentIds: references(componentId),
    operationIds: references(operationId),
  })
  .readonly() satisfies z.ZodType<Machine>;
export const componentSchema = z
  .strictObject({
    id: componentId,
    machineId,
    name: text,
    description: text.optional(),
  })
  .readonly() satisfies z.ZodType<MachineComponent>;
export const operationSchema = z
  .strictObject({
    id: operationId,
    name: text,
    description: text.optional(),
  })
  .readonly() satisfies z.ZodType<Operation>;
export const roleSchema = z
  .strictObject({
    id: roleId,
    name: text,
    eligibleMachineIds: references(machineId),
  })
  .readonly() satisfies z.ZodType<MachineRole>;
export const processSchema = z
  .strictObject({
    id: processId,
    name: text,
    description: text.optional(),
    stageIds: references(stageId),
  })
  .readonly() satisfies z.ZodType<Process>;
export const stageSchema = z
  .strictObject({
    id: stageId,
    processId,
    operationId,
    sequence: z.number().int().positive(),
    name: text,
    description: text.optional(),
    machineRoleIds: references(roleId),
  })
  .readonly() satisfies z.ZodType<ProcessStage>;

export const domainGraphSchema = z
  .strictObject({
    machines: z.array(machineSchema).readonly(),
    machineComponents: z.array(componentSchema).readonly(),
    operations: z.array(operationSchema).readonly(),
    machineRoles: z.array(roleSchema).readonly(),
    processes: z.array(processSchema).readonly(),
    processStages: z.array(stageSchema).readonly(),
  })
  .readonly() satisfies z.ZodType<DomainGraph>;
