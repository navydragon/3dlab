import type {
  InputValidation,
  SimulationInput,
  SimulationIssue,
} from './contracts.ts';

export function validateSimulationInput(raw: unknown): InputValidation {
  const issues: SimulationIssue[] = [];
  const record = (value: unknown): Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const root = record(raw);
  const check = (
    group: string,
    field: string,
    rule: 'positive' | 'nonnegative' | 'utilization' | 'integer',
  ) => {
    const value = record(root[group])[field];
    const path = [group, field];
    let code: SimulationIssue['code'] | undefined;
    if (typeof value !== 'number') code = 'required_number';
    else if (!Number.isFinite(value)) code = 'nonfinite';
    else if (rule === 'integer' && !Number.isInteger(value))
      code = 'not_integer';
    else if (
      rule === 'nonnegative'
        ? value < 0
        : value <= 0 || (rule === 'utilization' && value > 1)
    )
      code = 'out_of_range';
    if (code) issues.push({ phase: 'input', code, path });
  };
  for (const field of [
    'bucketCapacityM3Loose',
    'bucketFillFactor',
    'cycleTimeSeconds',
  ])
    check('excavator', field, 'positive');
  check('excavator', 'timeUtilizationFactor', 'utilization');
  check('excavator', 'hourlyCostCU', 'nonnegative');
  for (const field of ['capacityM3Loose', 'loadedSpeedKmh', 'emptySpeedKmh'])
    check('truck', field, 'positive');
  for (const field of [
    'haulDistanceKm',
    'unloadingTimeMinutes',
    'hourlyCostCU',
  ])
    check('truck', field, 'nonnegative');
  check('truck', 'truckCount', 'integer');
  check('task', 'workVolumeM3Loose', 'positive');
  // The complete explicit numerical shape has been checked above; no defaults/coercion.
  return issues.length
    ? { status: 'invalid', issues }
    : {
        status: 'valid',
        input: raw as SimulationInput,
      };
}
