import { z } from 'zod';
import { MODEL_ID } from '../simulation/contracts.ts';
import { validateSimulationInput } from '../simulation/validation.ts';

// Shapes at the external boundary; numerical constraints belong to the pure core.
const inputSchema = z
  .strictObject({
    excavator: z.strictObject({
      bucketCapacityM3Loose: z.number(),
      bucketFillFactor: z.number(),
      cycleTimeSeconds: z.number(),
      timeUtilizationFactor: z.number(),
      hourlyCostCU: z.number(),
    }),
    truck: z.strictObject({
      capacityM3Loose: z.number(),
      haulDistanceKm: z.number(),
      loadedSpeedKmh: z.number(),
      emptySpeedKmh: z.number(),
      unloadingTimeMinutes: z.number(),
      truckCount: z.number(),
      hourlyCostCU: z.number(),
    }),
    task: z.strictObject({ workVolumeM3Loose: z.number() }),
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
  });

/** Minimal checked-in illustrative scenario, not a full future Scenario entity. */
export const simulationScenarioSchema = z.strictObject({
  scenarioId: z.literal('base-earthworks-scenario'),
  modelId: z.literal(MODEL_ID),
  isIllustrative: z.literal(true),
  source: z.literal('docs/domain/simulation-model.md#19'),
  input: inputSchema,
});
