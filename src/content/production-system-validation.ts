import { z } from 'zod';
import type { ProductionSystem } from '../domain/production-system';
import type { DomainRepository } from './repository';
import type { SimulationScenarioRepository } from './simulation-scenario-repository';
import type { ValidationIssue } from './validation';
import { productionSystemSchema } from './schemas/production-system.ts';
import { getSupportedSimulationModel } from './supported-simulation-models.ts';

export type ProductionSystemValidation =
  | { readonly status: 'valid'; readonly systems: readonly ProductionSystem[] }
  | { readonly status: 'invalid'; readonly issues: readonly ValidationIssue[] };

export function validateProductionSystems(
  raw: unknown,
  domain: DomainRepository,
  scenarios: SimulationScenarioRepository,
): ProductionSystemValidation {
  const parsed = z.array(productionSystemSchema).readonly().safeParse(raw);
  if (!parsed.success)
    return {
      status: 'invalid',
      issues: parsed.error.issues.map((issue) => ({
        phase: 'shape',
        code: issue.code,
        path: issue.path.map((segment) =>
          typeof segment === 'number' ? segment : String(segment),
        ),
        message: issue.message,
      })),
    };
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  const issue = (
    code: string,
    path: readonly (string | number)[],
    message: string,
  ) => issues.push({ phase: 'graph', code, path, message });
  parsed.data.forEach((system, index) => {
    if (seen.has(system.id))
      issue('duplicate-id', [index, 'id'], `Duplicate system ID: ${system.id}`);
    seen.add(system.id);
    if (!domain.getProcess(system.processId))
      issue(
        'missing-process',
        [index, 'processId'],
        `Process not found: ${system.processId}`,
      );
    system.participantDefinitions.forEach((p, pi) => {
      if (!domain.getMachine(p.machineId))
        issue(
          'missing-machine',
          [index, 'participantDefinitions', pi, 'machineId'],
          `Machine not found: ${p.machineId}`,
        );
      const role = domain.getMachineRole(p.roleId);
      if (!role)
        issue(
          'missing-role',
          [index, 'participantDefinitions', pi, 'roleId'],
          `Role not found: ${p.roleId}`,
        );
      else if (!role.eligibleMachineIds.includes(p.machineId))
        issue(
          'ineligible-machine',
          [index, 'participantDefinitions', pi, 'machineId'],
          `Role ${p.roleId} does not permit ${p.machineId}`,
        );
    });
    const model = getSupportedSimulationModel(system.simulationModelId);
    if (!model)
      issue(
        'unsupported-model',
        [index, 'simulationModelId'],
        `Unsupported model: ${system.simulationModelId}`,
      );
    else if (!model.acceptsStructure(system.participantDefinitions))
      issue(
        'model-structure',
        [index, 'participantDefinitions'],
        'Participants do not match the v1 single-excavator model',
      );
    system.supportedScenarioIds.forEach((id, si) => {
      const path = [index, 'supportedScenarioIds', si];
      const scenario = scenarios.get(id);
      if (!scenario) {
        issue('missing-scenario', path, `Scenario not found: ${id}`);
        return;
      }
      if (scenario.modelId !== system.simulationModelId) {
        issue(
          'scenario-model-mismatch',
          path,
          `Scenario ${id} uses ${scenario.modelId}, system uses ${system.simulationModelId}`,
        );
        return;
      }
      if (model)
        system.participantDefinitions.forEach((p, pi) => {
          const count = model.participantCount(p, scenario);
          if (
            count === undefined ||
            count < p.minCount ||
            (p.maxCount !== null && count > p.maxCount)
          )
            issue(
              'scenario-count',
              path,
              `Scenario ${id}: participant ${pi} count ${count} violates ${p.minCount}..${p.maxCount ?? 'unbounded'}`,
            );
        });
    });
  });
  return issues.length
    ? { status: 'invalid', issues }
    : { status: 'valid', systems: parsed.data };
}
