import { z } from 'zod';
import {
  isProductionSystemId,
  isProcessId,
  isMachineRoleId,
  isMachineId,
  isSimulationModelId,
  isScenarioId,
} from '../../domain/ids.ts';
import type {
  ProductionSystemId,
  ProcessId,
  MachineRoleId,
  MachineId,
  SimulationModelId,
  ScenarioId,
} from '../../domain/ids';
import type {
  ProductionSystem,
  SystemParticipantDefinition,
} from '../../domain/production-system';

const participantSchema = z
  .strictObject({
    roleId: z.custom<MachineRoleId>(
      isMachineRoleId,
      'Expected a stable role ID',
    ),
    machineId: z.custom<MachineId>(isMachineId, 'Expected a stable machine ID'),
    minCount: z.number().int().positive(),
    maxCount: z.number().int().positive().nullable(),
  })
  .refine(
    (value) => value.maxCount === null || value.maxCount >= value.minCount,
    { path: ['maxCount'], message: 'Maximum must be at least minimum' },
  )
  .readonly() satisfies z.ZodType<SystemParticipantDefinition>;

export const productionSystemSchema = z
  .strictObject({
    id: z.custom<ProductionSystemId>(
      isProductionSystemId,
      'Expected a stable production system ID',
    ),
    name: z.string().trim().min(1),
    processId: z.custom<ProcessId>(isProcessId, 'Expected a stable process ID'),
    participantDefinitions: z.array(participantSchema).min(1).readonly(),
    simulationModelId: z.custom<SimulationModelId>(
      isSimulationModelId,
      'Expected a stable simulation model ID',
    ),
    supportedScenarioIds: z
      .array(
        z.custom<ScenarioId>(isScenarioId, 'Expected a stable scenario ID'),
      )
      .min(1)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        'Duplicate scenario reference',
      )
      .readonly(),
  })
  .superRefine((system, ctx) => {
    const pairs = new Set<string>();
    system.participantDefinitions.forEach((participant, index) => {
      const key = participant.roleId + '/' + participant.machineId;
      if (pairs.has(key))
        ctx.addIssue({
          code: 'custom',
          path: ['participantDefinitions', index],
          message: 'Duplicate participant machine/role pair',
        });
      pairs.add(key);
    });
  })
  .readonly() satisfies z.ZodType<ProductionSystem>;
