import { z } from 'zod';
import {
  isStableId,
  isMachineId,
  isMachineComponentId,
  isProcessId,
  isProcessStageId,
  isMachineRoleId,
} from '../domain/ids.ts';
import type {
  MachineId,
  MachineComponentId,
  ProcessId,
  ProcessStageId,
  MachineRoleId,
} from '../domain/ids';
import type {
  FoundationPack,
  MachineFoundation,
  ComponentFoundation,
  ProcessFoundation,
  StageFoundation,
} from '../domain/foundation';
import type { DomainRepository } from './repository';

const text = z.string().trim().min(1);
const strings = z.array(text).min(1).readonly();
const stableId = z.custom<string>(isStableId);
const machineId = z.custom<MachineId>(isMachineId);
const componentId = z.custom<MachineComponentId>(isMachineComponentId);
const processId = z.custom<ProcessId>(isProcessId);
const stageId = z.custom<ProcessStageId>(isProcessStageId);
const roleId = z.custom<MachineRoleId>(isMachineRoleId);
const refs = z
  .array(stableId)
  .min(1)
  .refine((a) => new Set(a).size === a.length, 'Duplicate source reference')
  .readonly();
const sourced = { sourceRefs: refs };
const group = z
  .strictObject({
    ...sourced,
    componentIds: z
      .array(componentId)
      .min(1)
      .refine(
        (a) => new Set(a).size === a.length,
        'Duplicate component reference',
      )
      .readonly(),
    purpose: text.optional(),
  })
  .readonly();
export const foundationSchema = z
  .strictObject({
    version: z.literal('1.0'),
    sources: z
      .array(
        z
          .strictObject({
            id: stableId,
            title: text,
            location: text,
            scope: text,
          })
          .readonly(),
      )
      .min(1)
      .readonly(),
    machines: z
      .array(
        z
          .strictObject({
            ...sourced,
            machineId,
            overview: z
              .strictObject({
                purpose: text,
                systemContext: text,
                scopeNote: text,
              })
              .readonly(),
            constructionIntro: text.optional(),
            applicationsIntro: text.optional(),
            workingPrinciple: z
              .strictObject({
                intro: text,
                paragraphs: strings,
                chain: strings,
                groups: z.array(group).min(1).readonly(),
                explanations: strings,
              })
              .readonly()
              .optional(),
            transportCycle: z
              .strictObject({
                steps: strings,
                factors: z
                  .array(
                    z
                      .strictObject({
                        ...sourced,
                        name: text,
                        explanation: text,
                      })
                      .readonly(),
                  )
                  .min(1)
                  .readonly(),
                distanceExplanation: text,
                followUp: text,
              })
              .readonly()
              .optional(),
          })
          .readonly(),
      )
      .readonly(),
    components: z
      .array(
        z
          .strictObject({
            ...sourced,
            machineId,
            componentId,
            explanation: text,
          })
          .readonly(),
      )
      .readonly(),
    processes: z
      .array(
        z
          .strictObject({
            ...sourced,
            processId,
            introduction: text,
            truckCycle: strings,
            excavatorCycle: strings,
            synthesis: text,
            causalChain: strings,
            systemsIntro: text,
          })
          .readonly(),
      )
      .readonly(),
    stages: z
      .array(
        z
          .strictObject({
            ...sourced,
            processId,
            stageId,
            goal: text,
            input: text,
            activity: text,
            result: text,
            handoff: text,
            modelNotes: z.array(text).readonly(),
            participantNotes: z
              .array(
                z
                  .strictObject({
                    ...sourced,
                    machineId,
                    roleId,
                    note: text,
                    factors: strings,
                  })
                  .readonly(),
              )
              .min(1)
              .readonly(),
          })
          .readonly(),
      )
      .readonly(),
  })
  .readonly() satisfies z.ZodType<FoundationPack>;

export interface FoundationIssue {
  readonly path: readonly PropertyKey[];
  readonly message: string;
}
export interface FoundationRepository {
  getMachine(id: MachineId): MachineFoundation | undefined;
  getComponent(id: MachineComponentId): ComponentFoundation | undefined;
  getProcess(id: ProcessId): ProcessFoundation | undefined;
  getStage(id: ProcessStageId): StageFoundation | undefined;
  readonly sources: FoundationPack['sources'];
}
export type FoundationLoad =
  | { readonly status: 'loaded'; readonly repository: FoundationRepository }
  | { readonly status: 'invalid'; readonly issues: readonly FoundationIssue[] };

export function createFoundationRepository(
  input: unknown,
  domain: DomainRepository,
): FoundationLoad {
  const parsed = foundationSchema.safeParse(input);
  if (!parsed.success)
    return {
      status: 'invalid',
      issues: parsed.error.issues.map((i) => ({
        path: i.path,
        message: i.message,
      })),
    };
  const pack = parsed.data;
  const issues: FoundationIssue[] = [];
  const fail = (path: readonly PropertyKey[], message: string) =>
    issues.push({ path, message });
  const unique = <T>(
    records: readonly T[],
    key: (record: T) => string,
    path: string,
  ) => {
    const seen = new Set<string>();
    records.forEach((record, i) => {
      const id = key(record);
      if (seen.has(id)) fail([path, i], 'Duplicate learning record');
      seen.add(id);
    });
  };
  unique(pack.sources, (r) => r.id, 'sources');
  unique(pack.machines, (r) => r.machineId, 'machines');
  unique(pack.components, (r) => r.componentId, 'components');
  unique(pack.processes, (r) => r.processId, 'processes');
  unique(pack.stages, (r) => r.stageId, 'stages');
  const sourceIds = new Set(pack.sources.map((s) => s.id));
  const provenance = (
    record: { readonly sourceRefs: readonly string[] },
    path: readonly PropertyKey[],
  ) =>
    record.sourceRefs.forEach((id, i) => {
      if (!sourceIds.has(id))
        fail([...path, 'sourceRefs', i], 'Unknown source reference');
    });
  const componentOwner = (
    machine: MachineId,
    id: MachineComponentId,
    path: readonly PropertyKey[],
  ) => {
    if (
      !domain
        .getMachineComponents(machine)
        ?.some((c) => c.id === id && c.machineId === machine)
    )
      fail(path, 'Component does not belong to machine');
  };
  pack.machines.forEach((r, i) => {
    provenance(r, ['machines', i]);
    if (!domain.getMachine(r.machineId))
      fail(['machines', i], 'Unknown machine');
    r.workingPrinciple?.groups.forEach((g, j) => {
      const p = ['machines', i, 'workingPrinciple', 'groups', j];
      provenance(g, p);
      g.componentIds.forEach((id) => componentOwner(r.machineId, id, p));
    });
    r.transportCycle?.factors.forEach((f, j) =>
      provenance(f, ['machines', i, 'transportCycle', 'factors', j]),
    );
  });
  pack.components.forEach((r, i) => {
    provenance(r, ['components', i]);
    componentOwner(r.machineId, r.componentId, ['components', i]);
  });
  pack.processes.forEach((r, i) => {
    provenance(r, ['processes', i]);
    if (!domain.getProcess(r.processId))
      fail(['processes', i], 'Unknown process');
  });
  pack.stages.forEach((r, i) => {
    const p = ['stages', i];
    provenance(r, p);
    const stage = domain.getProcessStage(r.stageId);
    if (
      !domain.getProcess(r.processId) ||
      !stage ||
      stage.processId !== r.processId
    )
      fail(p, 'Stage does not belong to process');
    unique(
      r.participantNotes,
      (n) => n.roleId + ':' + n.machineId,
      'stages.' + i + '.participantNotes',
    );
    r.participantNotes.forEach((n, j) => {
      provenance(n, [...p, 'participantNotes', j]);
      if (
        !domain.getMachine(n.machineId) ||
        !stage?.machineRoleIds.includes(n.roleId) ||
        !domain
          .getMachineRole(n.roleId)
          ?.eligibleMachineIds.includes(n.machineId)
      )
        fail([...p, 'participantNotes', j], 'Not an actual stage participant');
    });
  });
  // S1 pack completeness is a reviewed delivery obligation, not UI dispatch.
  const requiredMachines = domain
    .listMachines()
    .filter((m) => ['excavator', 'dump-truck'].includes(m.id));
  for (const m of requiredMachines) {
    if (!pack.machines.some((r) => r.machineId === m.id))
      fail(['machines'], 'Missing required S1 machine');
    if (m.id === 'excavator')
      for (const c of domain.getMachineComponents(m.id) ?? []) {
        if (
          pack.components.filter(
            (r) => r.componentId === c.id && r.machineId === m.id,
          ).length !== 1
        )
          fail(
            ['components'],
            'Each approved excavator component must occur exactly once',
          );
      }
  }
  for (const p of domain
    .listProcesses()
    .filter((p) => p.id === 'excavation-haul')) {
    if (!pack.processes.some((r) => r.processId === p.id))
      fail(['processes'], 'Missing required S1 process');
    for (const stage of domain.getProcessStages(p.id) ?? []) {
      const r = pack.stages.find((r) => r.stageId === stage.id);
      if (!r) fail(['stages'], 'Missing required S1 stage');
      for (const roleId of stage.machineRoleIds)
        for (const machineId of domain.getMachineRole(roleId)
          ?.eligibleMachineIds ?? []) {
          if (
            !r?.participantNotes.some(
              (n) => n.roleId === roleId && n.machineId === machineId,
            )
          )
            fail(['stages'], 'Missing required participant note');
        }
    }
  }
  if (issues.length) return { status: 'invalid', issues };
  const machines = new Map(pack.machines.map((r) => [r.machineId, r]));
  const components = new Map(pack.components.map((r) => [r.componentId, r]));
  const processes = new Map(pack.processes.map((r) => [r.processId, r]));
  const stages = new Map(pack.stages.map((r) => [r.stageId, r]));
  return {
    status: 'loaded',
    repository: Object.freeze({
      sources: pack.sources,
      getMachine: (id: MachineId) => machines.get(id),
      getComponent: (id: MachineComponentId) => components.get(id),
      getProcess: (id: ProcessId) => processes.get(id),
      getStage: (id: ProcessStageId) => stages.get(id),
    }),
  };
}
