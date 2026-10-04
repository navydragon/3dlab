import { z } from 'zod';
import { EXCAVATOR_WORKING_CYCLE } from '../domain/activities.ts';
import { isMachineId, isMachineComponentId } from '../domain/ids.ts';
import type { MachineId, MachineComponentId } from '../domain/ids';
import { phaseIds } from '../domain/working-cycle.ts';
import type { WorkingCycle } from '../domain/working-cycle';
import type { DomainRepository } from './repository';
import type { AssetRepository } from './asset-repository';

const text = z.string().trim().min(1);
const refs = z
  .array(text)
  .min(1)
  .refine((a) => new Set(a).size === a.length, 'Duplicate reference')
  .readonly();
const time = z.number().finite().nonnegative();
export const workingCycleSchema = z
  .strictObject({
    version: z.literal('1.0'),
    machineId: z.custom<MachineId>(isMachineId),
    activity: z.literal(EXCAVATOR_WORKING_CYCLE),
    sources: z
      .array(
        z.strictObject({ id: text, location: text, scope: text }).readonly(),
      )
      .min(1)
      .readonly(),
    sourceRefs: refs,
    timingNotice: text,
    overlapNotice: text,
    phases: z
      .array(
        z
          .strictObject({
            phaseId: z.enum(phaseIds),
            order: z.number().int().min(1).max(6),
            name: text,
            goal: text,
            movement: text,
            componentIds: z
              .array(z.custom<MachineComponentId>(isMachineComponentId))
              .min(1)
              .refine(
                (a) => new Set(a).size === a.length,
                'Duplicate component',
              )
              .readonly(),
            sourceRefs: refs,
            visualNote: text.optional(),
          })
          .readonly(),
      )
      .length(6)
      .readonly(),
    visual: z
      .strictObject({
        assetId: text,
        assetVersion: text,
        activity: z.literal(EXCAVATOR_WORKING_CYCLE),
        sourceRefs: refs,
        segments: z
          .array(
            z
              .strictObject({
                phaseId: z.enum(phaseIds),
                startSeconds: time,
                endSeconds: time.optional(),
                milestones: z
                  .array(
                    z
                      .strictObject({ timeSeconds: time, meaning: text })
                      .readonly(),
                  )
                  .readonly(),
              })
              .readonly(),
          )
          .length(6)
          .readonly(),
      })
      .readonly(),
  })
  .readonly();

export type WorkingCycleLoad =
  | {
      readonly status: 'loaded';
      readonly repository: {
        get(machineId: MachineId): WorkingCycle | undefined;
      };
    }
  | {
      readonly status: 'invalid';
      readonly issues: readonly {
        readonly path: readonly PropertyKey[];
        readonly message: string;
      }[];
    };

// Only metadata evidence is needed here; binary/actual-clip integrity is independently
// checked by assets:validate and real GLTF tests. No renderer dependency.
export function createWorkingCycleRepository(
  input: unknown,
  domain: DomainRepository,
  assets: AssetRepository,
): WorkingCycleLoad {
  const parsed = workingCycleSchema.safeParse(input);
  if (!parsed.success)
    return { status: 'invalid', issues: parsed.error.issues };
  const record = parsed.data;
  const issues: { path: PropertyKey[]; message: string }[] = [];
  const fail = (path: PropertyKey[], message: string) =>
    issues.push({ path, message });
  const components = domain.getMachineComponents(record.machineId);
  if (!domain.getMachine(record.machineId))
    fail(['machineId'], 'Unknown machine');
  const sourceIds = record.sources.map((s) => s.id);
  if (new Set(sourceIds).size !== sourceIds.length)
    fail(['sources'], 'Duplicate source');
  for (const [path, references] of [
    ['sourceRefs', record.sourceRefs],
    ['visual.sourceRefs', record.visual.sourceRefs],
    ...record.phases.map((p) => [p.phaseId, p.sourceRefs] as const),
  ] as const)
    if (references.some((id) => !sourceIds.includes(id)))
      fail([path], 'Unknown provenance reference');
  record.phases.forEach((p, i) => {
    if (p.phaseId !== phaseIds[i] || p.order !== i + 1)
      fail(['phases', i], 'Expected six ordered approved phases');
    if (p.componentIds.some((id) => !components?.some((c) => c.id === id)))
      fail(
        ['phases', i, 'componentIds'],
        'Component does not belong to machine',
      );
  });
  const resolution = assets.resolve(record.machineId);
  const asset =
    resolution.status === 'available' ? resolution.asset : undefined;
  if (
    !asset ||
    asset.id !== record.visual.assetId ||
    asset.version !== record.visual.assetVersion ||
    asset.subjectId !== record.machineId ||
    asset.subjectType !== 'machine'
  )
    fail(
      ['visual'],
      'Asset must uniquely resolve with matching machine, ID and version',
    );
  const mapping = asset?.animationMappings.filter(
    (m) => m.activity === record.activity,
  );
  const clip =
    mapping?.length === 1
      ? asset?.production?.clips.find((c) => c.name === mapping[0]!.clip)
      : undefined;
  if (!clip || clip.timingSemantics !== 'visual-demonstration')
    fail(
      ['visual', 'activity'],
      'Activity must map to evidenced production clip',
    );
  const duration = clip?.durationSeconds ?? 0;
  const approved = [
    [0],
    [0, 40 / 24],
    [40 / 24, 80 / 24],
    [80 / 24, 130 / 24],
    [130 / 24, 190 / 24],
    [190 / 24, duration],
  ];
  record.visual.segments.forEach((s, i) => {
    const expected = approved[i]!;
    if (s.phaseId !== phaseIds[i] || s.startSeconds !== expected[0])
      fail(['visual', 'segments', i], 'Unexpected authored anchor or order');
    if (
      i === 0
        ? s.endSeconds !== undefined
        : s.endSeconds === undefined ||
          (i === 5
            ? Math.abs(s.endSeconds - duration) > 1e-6
            : s.endSeconds !== expected[1])
    )
      fail(
        ['visual', 'segments', i, 'endSeconds'],
        'Unexpected range endpoint',
      );
    if (
      s.startSeconds > duration ||
      (s.endSeconds !== undefined &&
        (s.endSeconds < s.startSeconds ||
          s.endSeconds > duration + (i === 5 ? 1e-6 : 0)))
    )
      fail(['visual', 'segments', i], 'Range outside production clip');
    const milestones = i === 4 ? [165 / 24] : i === 5 ? [235 / 24] : [];
    if (
      s.milestones.length !== milestones.length ||
      s.milestones.some(
        (m, j) =>
          m.timeSeconds !== milestones[j] ||
          m.timeSeconds < s.startSeconds ||
          m.timeSeconds > (s.endSeconds ?? s.startSeconds),
      )
    )
      fail(
        ['visual', 'segments', i, 'milestones'],
        'Unexpected authored milestone',
      );
  });
  if (issues.length) return { status: 'invalid', issues };
  return {
    status: 'loaded',
    repository: Object.freeze({
      get: (id: MachineId) => (id === record.machineId ? record : undefined),
    }),
  };
}
