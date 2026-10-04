import { z } from 'zod';
import {
  isMachineId,
  isScenarioId,
  isSimulationModelId,
} from '../domain/ids.ts';
import type { MachineId, ScenarioId, SimulationModelId } from '../domain/ids';
import { parameterIds, productivityOutputIds } from '../domain/productivity.ts';
import type { ProductivityLearning } from '../domain/productivity';
import type { DomainRepository } from './repository';
import type { SimulationScenarioRepository } from './simulation-scenario-repository';
import { getSupportedSimulationModel } from './supported-simulation-models.ts';
const text = z.string().trim().min(1);
const refs = z
  .array(text)
  .min(1)
  .refine((a) => new Set(a).size === a.length, 'Duplicate source ref')
  .readonly();
const schema = z
  .array(
    z
      .strictObject({
        machineId: z.custom<MachineId>(isMachineId),
        sourceScenarioId: z.custom<ScenarioId>(isScenarioId),
        simulationModelId: z.custom<SimulationModelId>(isSimulationModelId),
        sources: z
          .array(
            z
              .strictObject({ id: text, location: text, scope: text })
              .readonly(),
          )
          .min(1)
          .readonly(),
        sourceRefs: refs,
        illustrativeNotice: text,
        parameters: z
          .array(
            z
              .strictObject({
                parameterId: z.enum(parameterIds),
                name: text,
                symbol: text,
                unit: text,
                definition: text,
                causalExplanation: text,
                notes: z.array(text).readonly(),
                sourceRefs: refs,
              })
              .readonly(),
          )
          .length(4)
          .readonly(),
        relationships: z.array(text).length(4).readonly(),
        outputs: z
          .array(
            z
              .strictObject({
                id: z.enum(productivityOutputIds),
                name: text,
                unit: text,
              })
              .readonly(),
          )
          .length(4)
          .readonly(),
        theoreticalExplanation: text,
        machineVsSystem: text,
        predictionPrompt: text,
        explanationPrompt: text,
      })
      .readonly(),
  )
  .readonly();
export interface ProductivityRepository {
  get(id: MachineId): ProductivityLearning | undefined;
  list(): readonly ProductivityLearning[];
}
export type ProductivityLoad =
  | { readonly status: 'loaded'; readonly repository: ProductivityRepository }
  | {
      readonly status: 'invalid';
      readonly issues: readonly {
        readonly path: readonly PropertyKey[];
        readonly message: string;
      }[];
    };
export function createProductivityRepository(
  input: unknown,
  domain: DomainRepository,
  scenarios: SimulationScenarioRepository,
): ProductivityLoad {
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return { status: 'invalid', issues: parsed.error.issues };
  const issues: { path: PropertyKey[]; message: string }[] = [];
  const fail = (path: PropertyKey[], message: string) =>
    issues.push({ path, message });
  const machines = new Set<string>();
  parsed.data.forEach((r, i) => {
    const model = getSupportedSimulationModel(r.simulationModelId);
    if (
      !domain.getMachine(r.machineId) ||
      !model ||
      model.standaloneMachineId !== r.machineId
    )
      fail([i, 'machineId'], 'Unknown or unsupported machine/model pair');
    if (machines.has(r.machineId))
      fail([i, 'machineId'], 'Duplicate learning record');
    machines.add(r.machineId);
    const scenario = scenarios.get(r.sourceScenarioId);
    if (
      !scenario ||
      scenario.modelId !== r.simulationModelId ||
      !scenario.isIllustrative
    )
      fail(
        [i, 'sourceScenarioId'],
        'Missing or mismatched illustrative source',
      );
    if (r.parameters.some((p, j) => p.parameterId !== parameterIds[j]))
      fail(
        [i, 'parameters'],
        'Four unique ordered approved parameter IDs required',
      );
    if (r.outputs.some((o, j) => o.id !== productivityOutputIds[j]))
      fail([i, 'outputs'], 'Four unique ordered output IDs required');
    const sources = r.sources.map((s) => s.id);
    if (new Set(sources).size !== sources.length)
      fail([i, 'sources'], 'Duplicate source');
    for (const references of [
      r.sourceRefs,
      ...r.parameters.map((p) => p.sourceRefs),
    ])
      if (references.some((ref) => !sources.includes(ref)))
        fail([i, 'sourceRefs'], 'Unknown provenance');
  });
  if (issues.length) return { status: 'invalid', issues };
  const records = parsed.data;
  return {
    status: 'loaded',
    repository: Object.freeze({
      get: (id: MachineId) => records.find((r) => r.machineId === id),
      list: () => records,
    }),
  };
}
