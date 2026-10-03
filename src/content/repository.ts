import type {
  Machine,
  MachineComponent,
  Operation,
  Process,
  ProcessStage,
  MachineRole,
} from '../domain/entities';
import type {
  MachineId,
  OperationId,
  ProcessId,
  ProcessStageId,
  MachineRoleId,
} from '../domain/ids';
import { validateDomainContent } from './validation';
import type { ValidationIssue } from './validation';

export interface MachineUse {
  readonly process: Process;
  readonly stage: ProcessStage;
  readonly role: MachineRole;
}
export interface DomainRepository {
  listMachines(): readonly Machine[];
  getMachine(id: MachineId): Machine | undefined;
  getMachineComponents(id: MachineId): readonly MachineComponent[] | undefined;
  getOperation(id: OperationId): Operation | undefined;
  getProcess(id: ProcessId): Process | undefined;
  getProcessStages(id: ProcessId): readonly ProcessStage[] | undefined;
  getProcessStage(id: ProcessStageId): ProcessStage | undefined;
  getMachineRole(id: MachineRoleId): MachineRole | undefined;
  getWhereUsed(id: MachineId): readonly MachineUse[] | undefined;
}
export type RepositoryLoad =
  | { readonly status: 'loaded'; readonly repository: DomainRepository }
  | { readonly status: 'invalid'; readonly issues: readonly ValidationIssue[] };

export function createDomainRepository(input: unknown): RepositoryLoad {
  const validated = validateDomainContent(input);
  if (validated.status === 'invalid') return validated;
  // Zod produces fresh, deeply frozen records/reference arrays; callers cannot
  // mutate the source JSON or the private indexes through repository results.
  const graph = validated.graph;
  const machines = new Map(graph.machines.map((record) => [record.id, record]));
  const components = new Map(
    graph.machineComponents.map((record) => [record.id, record]),
  );
  const operations = new Map(
    graph.operations.map((record) => [record.id, record]),
  );
  const processes = new Map(
    graph.processes.map((record) => [record.id, record]),
  );
  const stages = new Map(
    graph.processStages.map((record) => [record.id, record]),
  );
  const roles = new Map(
    graph.machineRoles.map((record) => [record.id, record]),
  );
  function required<T>(record: T | undefined): T {
    if (record === undefined)
      throw new Error('Validated graph invariant violated');
    return record;
  }
  const repository: DomainRepository = Object.freeze({
    listMachines: () => graph.machines,
    getMachine: (id: MachineId) => machines.get(id),
    getMachineComponents: (id: MachineId) => {
      const machine = machines.get(id);
      return machine
        ? Object.freeze(
            machine.componentIds.map((componentId) =>
              required(components.get(componentId)),
            ),
          )
        : undefined;
    },
    getOperation: (id: OperationId) => operations.get(id),
    getProcess: (id: ProcessId) => processes.get(id),
    getProcessStages: (id: ProcessId) => {
      const process = processes.get(id);
      return process
        ? Object.freeze(
            process.stageIds.map((stageId) => required(stages.get(stageId))),
          )
        : undefined;
    },
    getProcessStage: (id: ProcessStageId) => stages.get(id),
    getMachineRole: (id: MachineRoleId) => roles.get(id),
    getWhereUsed: (id: MachineId) => {
      if (!machines.has(id)) return undefined;
      const uses: MachineUse[] = [];
      for (const process of graph.processes)
        for (const stageId of process.stageIds) {
          const stage = required(stages.get(stageId));
          for (const roleId of stage.machineRoleIds) {
            const role = required(roles.get(roleId));
            if (role.eligibleMachineIds.includes(id))
              uses.push(Object.freeze({ process, stage, role }));
          }
        }
      return Object.freeze(uses);
    },
  });
  return { status: 'loaded', repository };
}
