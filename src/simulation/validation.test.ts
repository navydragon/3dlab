import { describe, expect, it } from 'vitest';
import { validateSimulationInput } from './validation.ts';
import { calculate } from './calculate.ts';
import type { SimulationInput } from './contracts.ts';
import { input } from '../../tests/simulation/fixture.ts';

describe('input validation (§23)', () => {
  const fields = [
    ['excavator', 'bucketCapacityM3Loose'],
    ['excavator', 'bucketFillFactor'],
    ['excavator', 'cycleTimeSeconds'],
    ['excavator', 'timeUtilizationFactor'],
    ['excavator', 'hourlyCostCU'],
    ['truck', 'capacityM3Loose'],
    ['truck', 'haulDistanceKm'],
    ['truck', 'loadedSpeedKmh'],
    ['truck', 'emptySpeedKmh'],
    ['truck', 'unloadingTimeMinutes'],
    ['truck', 'truckCount'],
    ['truck', 'hourlyCostCU'],
    ['task', 'workVolumeM3Loose'],
  ] as const;
  for (const [group, field] of fields) {
    it.each([NaN, Infinity, -Infinity, -1, undefined, '1'])(
      `rejects ${group}.${field}=%s with structured path`,
      (value) => {
        const raw = structuredClone(input()) as unknown as Record<
          string,
          Record<string, unknown>
        >;
        raw[group]![field] = value;
        const r = validateSimulationInput(raw);
        expect(r.status).toBe('invalid');
        if (r.status === 'invalid')
          expect(r.issues).toContainEqual(
            expect.objectContaining({ phase: 'input', path: [group, field] }),
          );
        expect(calculate(raw as unknown as SimulationInput).status).toBe(
          'error',
        );
      },
    );
  }
  it.each([null, undefined, {}, [], { excavator: null, truck: null }])(
    'rejects missing/invalid objects %j without throwing',
    (raw) => {
      expect(validateSimulationInput(raw).status).toBe('invalid');
      expect(calculate(raw as unknown as SimulationInput).status).toBe('error');
    },
  );
  it.each([
    { excavator: { cycleTimeSeconds: 0 } },
    { excavator: { bucketCapacityM3Loose: 0 } },
    { excavator: { bucketFillFactor: 0 } },
    { excavator: { timeUtilizationFactor: 0 } },
    { excavator: { timeUtilizationFactor: 1.01 } },
    { truck: { capacityM3Loose: 0 } },
    { truck: { loadedSpeedKmh: 0 } },
    { truck: { emptySpeedKmh: 0 } },
    { truck: { truckCount: 0 } },
    { truck: { truckCount: 1.5 } },
    { task: { workVolumeM3Loose: 0 } },
  ])('rejects prohibited zero/bounds %j', (overrides) =>
    expect(validateSimulationInput(input(overrides)).status).toBe('invalid'),
  );
  it('accepts documented boundaries without practical ranges or fill ceiling', () => {
    expect(
      validateSimulationInput(
        input({
          excavator: {
            bucketFillFactor: 2,
            timeUtilizationFactor: 1,
            hourlyCostCU: 0,
          },
          truck: {
            haulDistanceKm: 0,
            unloadingTimeMinutes: 0,
            hourlyCostCU: 0,
          },
        }),
      ).status,
    ).toBe('valid');
  });
});
