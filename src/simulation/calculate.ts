import {
  MODEL_ID,
  type SimulationInput,
  type SimulationIssue,
  type SimulationResult,
} from './contracts.ts';
import { validateSimulationInput } from './validation.ts';

/** Authoritative calculation order and formulas: simulation-model §§7–16. */
export function calculate(input: SimulationInput): SimulationResult {
  const validation = validateSimulationInput(input);
  if (validation.status === 'invalid')
    return { status: 'error', modelId: MODEL_ID, issues: validation.issues };
  const { excavator: e, truck: t, task } = validation.input;
  // 3600 seconds/hour, 60 seconds/minute and 60 minutes/hour are unit conversions.
  const qEff = e.bucketCapacityM3Loose * e.bucketFillFactor;
  const cyclesPerHour60 = 3600 / e.cycleTimeSeconds;
  const qExc60 = (qEff * 3600) / e.cycleTimeSeconds;
  const qExc = qExc60 * e.timeUtilizationFactor;
  const passes = Math.ceil(t.capacityM3Loose / qEff);
  const load = (passes * e.cycleTimeSeconds) / 60;
  const ceiling = (t.capacityM3Loose * 60) / load;
  const loaded = (t.haulDistanceKm / t.loadedSpeedKmh) * 60;
  const empty = (t.haulDistanceKm / t.emptySpeedKmh) * 60;
  const away = loaded + t.unloadingTimeMinutes + empty;
  const free = load + away;
  const mf = (t.truckCount * load) / free;
  const balance = Math.ceil(free / load);
  const utilization = Math.min(1, mf);
  const idle = 1 - utilization;
  const system60 = ceiling * utilization;
  const system = system60 * e.timeUtilizationFactor;
  const wait = Math.max(0, t.truckCount * load - free);
  const realized = free + wait;
  const waitShare = wait / realized;
  const duration = task.workVolumeM3Loose / system;
  const hourly = e.hourlyCostCU + t.truckCount * t.hourlyCostCU;
  const total = duration * hourly;
  const unit = total / task.workVolumeM3Loose;
  const metrics = {
    'effective-bucket-volume': qEff,
    'bucket-passes': passes,
    'truck-loading-time': load,
    'loaded-travel-time': loaded,
    'empty-travel-time': empty,
    'truck-free-cycle-time': free,
    'match-factor': mf,
    'balanced-truck-count': balance,
    'excavator-transport-utilization': utilization,
    'excavator-idle-share': idle,
    'truck-wait-time': wait,
    'truck-wait-share': waitShare,
    'excavator-standalone-productivity': qExc,
    'system-productivity': system,
    'project-duration': duration,
    'system-hourly-cost': hourly,
    'total-operating-cost': total,
    'unit-operating-cost': unit,
  };
  const intermediates = {
    cyclesPerHour60,
    excavatorProductivityM3LoosePerHour60: qExc60,
    loadingCeilingM3LoosePerHour60: ceiling,
    truckAwayTimeMinutes: away,
    systemProductivityM3LoosePerHour60: system60,
    truckRealizedCycleMinutes: realized,
  };
  const issues: SimulationIssue[] = [];
  for (const [group, values] of Object.entries({ metrics, intermediates })) {
    for (const [name, value] of Object.entries(values)) {
      if (!Number.isFinite(value) || value < 0)
        issues.push({
          phase: 'calculation',
          code: 'numerical_range',
          path: [group, name],
        });
    }
  }
  // Detect underflow and loss of discrete-count precision without practical input limits.
  for (const name of [
    'effective-bucket-volume',
    'truck-loading-time',
    'truck-free-cycle-time',
    'match-factor',
    'excavator-standalone-productivity',
    'system-productivity',
    'project-duration',
  ] as const) {
    if (metrics[name] === 0)
      issues.push({
        phase: 'calculation',
        code: 'numerical_range',
        path: ['metrics', name],
      });
  }
  for (const name of ['bucket-passes', 'balanced-truck-count'] as const) {
    if (!Number.isSafeInteger(metrics[name]) || metrics[name] < 1)
      issues.push({
        phase: 'calculation',
        code: 'numerical_range',
        path: ['metrics', name],
      });
  }
  return issues.length
    ? { status: 'error', modelId: MODEL_ID, issues }
    : { status: 'success', modelId: MODEL_ID, metrics, intermediates };
}
