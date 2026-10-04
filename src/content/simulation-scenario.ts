import { z } from 'zod';
import { MODEL_ID } from '../simulation/contracts.ts';
import { validateSimulationInput } from '../simulation/validation.ts';
import { isScenarioId, type ScenarioId } from '../domain/ids.ts';

// Shapes at the external boundary; numerical constraints belong to the pure core.
const inputSchema = z
  .strictObject({
    excavator: z
      .strictObject({
        bucketCapacityM3Loose: z.number(),
        bucketFillFactor: z.number(),
        cycleTimeSeconds: z.number(),
        timeUtilizationFactor: z.number(),
        hourlyCostCU: z.number(),
      })
      .readonly(),
    truck: z
      .strictObject({
        capacityM3Loose: z.number(),
        haulDistanceKm: z.number(),
        loadedSpeedKmh: z.number(),
        emptySpeedKmh: z.number(),
        unloadingTimeMinutes: z.number(),
        truckCount: z.number(),
        hourlyCostCU: z.number(),
      })
      .readonly(),
    task: z.strictObject({ workVolumeM3Loose: z.number() }).readonly(),
  })
  .superRefine((input, ctx) => {
    const result = validateSimulationInput(input);
    if (result.status === 'invalid') {
      for (const issue of result.issues)
        ctx.addIssue({
          code: 'custom',
          path: [...issue.path],
          message: issue.code,
        });
    }
  })
  .readonly();

/** Numerical content record only, not the full future domain Scenario entity. */
export const simulationScenarioSchema = z
  .strictObject({
    scenarioId: z.custom<ScenarioId>(
      isScenarioId,
      'Expected a stable scenario ID',
    ),
    modelId: z.literal(MODEL_ID),
    isIllustrative: z.boolean(),
    source: z
      .string()
      .refine(
        (value) => value.trim().length > 0,
        'Expected nonblank source text',
      ),
    input: inputSchema,
  })
  .readonly();
export type SimulationScenario = z.infer<typeof simulationScenarioSchema>;
