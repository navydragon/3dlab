import type { DomainGraph } from '../domain/entities';
import { domainGraphSchema } from './schemas/domain.ts';

export interface ValidationIssue {
  readonly phase: 'shape' | 'graph' | 'load';
  readonly code: string;
  readonly path: readonly (string | number)[];
  readonly message: string;
}
export type DomainValidation =
  | { readonly status: 'valid'; readonly graph: DomainGraph }
  | { readonly status: 'invalid'; readonly issues: readonly ValidationIssue[] };

export function validateGraph(graph: DomainGraph): readonly ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const issue = (
    code: string,
    path: readonly (string | number)[],
    message: string,
  ) => issues.push({ phase: 'graph', code, path, message });
  for (const collection of [
    'machines',
    'machineComponents',
    'operations',
    'machineRoles',
    'processes',
    'processStages',
  ] as const) {
    const records: readonly { readonly id: string }[] = graph[collection];
    const seen = new Set<string>();
    records.forEach((record, index) => {
      if (seen.has(record.id))
        issue(
          'duplicate-id',
          [collection, index, 'id'],
          `Duplicate ID: ${record.id}`,
        );
      seen.add(record.id);
    });
  }
  // An ambiguous ID cannot safely be used for reference resolution.
  if (issues.length) return issues;
  const machines = new Map(graph.machines.map((record) => [record.id, record]));
  const components = new Map(
    graph.machineComponents.map((record) => [record.id, record]),
  );
  const operations = new Set(graph.operations.map((record) => record.id));
  const roles = new Map(
    graph.machineRoles.map((record) => [record.id, record]),
  );
  const processes = new Map(
    graph.processes.map((record) => [record.id, record]),
  );
  const stages = new Map(
    graph.processStages.map((record) => [record.id, record]),
  );

  graph.machines.forEach((machine, index) => {
    machine.componentIds.forEach((id, referenceIndex) => {
      const path = ['machines', index, 'componentIds', referenceIndex];
      const component = components.get(id);
      if (!component)
        issue('missing-component', path, `Component not found: ${id}`);
      else if (component.machineId !== machine.id)
        issue(
          'component-ownership',
          path,
          `Component ${id} belongs to another machine`,
        );
    });
    machine.operationIds.forEach((id, referenceIndex) => {
      if (!operations.has(id))
        issue(
          'missing-operation',
          ['machines', index, 'operationIds', referenceIndex],
          `Operation not found: ${id}`,
        );
    });
  });
  graph.machineComponents.forEach((component, index) => {
    const owner = machines.get(component.machineId);
    if (!owner)
      issue(
        'missing-machine',
        ['machineComponents', index, 'machineId'],
        `Machine not found: ${component.machineId}`,
      );
    else if (!owner.componentIds.includes(component.id))
      issue(
        'unlisted-component',
        ['machineComponents', index, 'id'],
        `Component ${component.id} is absent from its owner's componentIds`,
      );
  });
  graph.machineRoles.forEach((role, index) =>
    role.eligibleMachineIds.forEach((id, referenceIndex) => {
      if (!machines.has(id))
        issue(
          'missing-eligible-machine',
          ['machineRoles', index, 'eligibleMachineIds', referenceIndex],
          `Machine not found: ${id}`,
        );
    }),
  );
  graph.processes.forEach((process, index) => {
    const positions = new Set<number>();
    let previous = 0;
    process.stageIds.forEach((id, referenceIndex) => {
      const path = ['processes', index, 'stageIds', referenceIndex];
      const stage = stages.get(id);
      if (!stage) {
        issue('missing-stage', path, `Stage not found: ${id}`);
        return;
      }
      if (stage.processId !== process.id)
        issue(
          'stage-ownership',
          path,
          `Stage ${id} belongs to another process`,
        );
      if (positions.has(stage.sequence))
        issue(
          'duplicate-sequence',
          path,
          `Duplicate sequence: ${stage.sequence}`,
        );
      else if (stage.sequence <= previous)
        issue(
          'stage-order',
          path,
          'stageIds must agree with increasing sequence',
        );
      positions.add(stage.sequence);
      previous = stage.sequence;
    });
  });
  graph.processStages.forEach((stage, index) => {
    const process = processes.get(stage.processId);
    if (!process)
      issue(
        'missing-process',
        ['processStages', index, 'processId'],
        `Process not found: ${stage.processId}`,
      );
    else if (!process.stageIds.includes(stage.id))
      issue(
        'unlisted-stage',
        ['processStages', index, 'id'],
        `Stage ${stage.id} is absent from its owner's stageIds`,
      );
    if (!operations.has(stage.operationId))
      issue(
        'missing-operation',
        ['processStages', index, 'operationId'],
        `Operation not found: ${stage.operationId}`,
      );
    stage.machineRoleIds.forEach((id, referenceIndex) => {
      if (!roles.has(id))
        issue(
          'missing-role',
          ['processStages', index, 'machineRoleIds', referenceIndex],
          `Role not found: ${id}`,
        );
    });
  });
  return issues;
}

export function validateDomainContent(input: unknown): DomainValidation {
  const parsed = domainGraphSchema.safeParse(input);
  if (!parsed.success)
    return {
      status: 'invalid',
      issues: parsed.error.issues.map((issue) => ({
        phase: 'shape',
        code: issue.code,
        path: issue.path.map((part) =>
          typeof part === 'number' ? part : String(part),
        ),
        message: issue.message,
      })),
    };
  const issues = validateGraph(parsed.data);
  return issues.length
    ? { status: 'invalid', issues }
    : { status: 'valid', graph: parsed.data };
}
