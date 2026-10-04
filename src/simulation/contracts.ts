export const MODEL_ID = 'earthworks-deterministic-v1' as const;

/** All volumes use loose material; costs use illustrative currency units (CU). */
export interface SimulationInput {
  readonly excavator: {
    readonly bucketCapacityM3Loose: number;
    readonly bucketFillFactor: number;
    readonly cycleTimeSeconds: number;
    readonly timeUtilizationFactor: number;
    readonly hourlyCostCU: number;
  };
  readonly truck: {
    readonly capacityM3Loose: number;
    readonly haulDistanceKm: number;
    readonly loadedSpeedKmh: number;
    readonly emptySpeedKmh: number;
    readonly unloadingTimeMinutes: number;
    readonly truckCount: number;
    readonly hourlyCostCU: number;
  };
  readonly task: { readonly workVolumeM3Loose: number };
}

/** Canonical IDs from simulation-model §17. Shares are fractions, not percent. */
export const METRIC_UNITS = {
  'effective-bucket-volume': 'm3-loose',
  'bucket-passes': 'count',
  'truck-loading-time': 'min',
  'loaded-travel-time': 'min',
  'empty-travel-time': 'min',
  'truck-free-cycle-time': 'min',
  'match-factor': 'ratio',
  'balanced-truck-count': 'count',
  'excavator-transport-utilization': 'ratio',
  'excavator-idle-share': 'ratio',
  'truck-wait-time': 'min',
  'truck-wait-share': 'ratio',
  'excavator-standalone-productivity': 'm3-loose/h',
  'system-productivity': 'm3-loose/h',
  'project-duration': 'h',
  'system-hourly-cost': 'CU/h',
  'total-operating-cost': 'CU',
  'unit-operating-cost': 'CU/m3-loose',
} as const;

export type MetricId = keyof typeof METRIC_UNITS;
export type SimulationMetrics = Readonly<Record<MetricId, number>>;

export interface SimulationIntermediates {
  readonly cyclesPerHour60: number;
  readonly excavatorProductivityM3LoosePerHour60: number;
  readonly loadingCeilingM3LoosePerHour60: number;
  readonly truckAwayTimeMinutes: number;
  readonly systemProductivityM3LoosePerHour60: number;
  readonly truckRealizedCycleMinutes: number;
}

export interface SimulationIssue {
  readonly phase: 'input' | 'calculation';
  readonly code:
    | 'required_number'
    | 'nonfinite'
    | 'out_of_range'
    | 'not_integer'
    | 'numerical_range';
  readonly path: readonly string[];
}

export type InputValidation =
  | { readonly status: 'valid'; readonly input: SimulationInput }
  | { readonly status: 'invalid'; readonly issues: readonly SimulationIssue[] };

export type SimulationResult =
  | {
      readonly status: 'success';
      readonly modelId: typeof MODEL_ID;
      readonly metrics: SimulationMetrics;
      readonly intermediates: SimulationIntermediates;
    }
  | {
      readonly status: 'error';
      readonly modelId: typeof MODEL_ID;
      readonly issues: readonly SimulationIssue[];
    };
