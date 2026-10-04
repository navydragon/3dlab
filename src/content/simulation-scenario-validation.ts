import {
  simulationScenarioSchema,
  type SimulationScenario,
} from './simulation-scenario.ts';
import type { ValidationIssue } from './validation.ts';

export type ScenarioCollectionValidation =
  | {
      readonly status: 'valid';
      readonly scenarios: readonly SimulationScenario[];
    }
  | { readonly status: 'invalid'; readonly issues: readonly ValidationIssue[] };

export function validateSimulationScenarios(
  records: readonly unknown[],
): ScenarioCollectionValidation {
  const scenarios: SimulationScenario[] = [];
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  records.forEach((raw, index) => {
    const parsed = simulationScenarioSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues)
        issues.push({
          phase: 'shape',
          code: issue.code,
          path: [
            index,
            ...issue.path.map((segment) =>
              typeof segment === 'number' ? segment : String(segment),
            ),
          ],
          message: issue.message,
        });
      return;
    }
    if (seen.has(parsed.data.scenarioId))
      issues.push({
        phase: 'graph',
        code: 'duplicate-id',
        path: [index, 'scenarioId'],
        message: `Duplicate scenario ID: ${parsed.data.scenarioId}`,
      });
    seen.add(parsed.data.scenarioId);
    scenarios.push(parsed.data);
  });
  return issues.length
    ? { status: 'invalid', issues }
    : { status: 'valid', scenarios: Object.freeze(scenarios) };
}
