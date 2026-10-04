import { describe, expect, it } from 'vitest';
import { calculate } from './calculate.ts';
import { close, input, success } from '../../tests/simulation/fixture.ts';

describe('edge cases and numerical failures', () => {
  it('supports zero distance with loading and unloading retained (§24)', () => {
    const { metrics: m, intermediates: i } = success(
      input({ truck: { haulDistanceKm: 0 } }),
    );
    expect(m['loaded-travel-time']).toBe(0);
    expect(m['empty-travel-time']).toBe(0);
    close(m['truck-free-cycle-time'], 5.8);
    close(i.truckAwayTimeMinutes, 1);
    close(m['system-productivity'], ((12 * 60) / 5.8) * 0.83);
  });
  it.each([
    [6, 3],
    [6.01, 4],
    [1, 1],
  ])(
    'discretizes body %s for effective bucket 2',
    (capacityM3Loose, passes) => {
      expect(
        success(
          input({
            excavator: { bucketCapacityM3Loose: 2, bucketFillFactor: 1 },
            truck: { capacityM3Loose },
          }),
        ).metrics['bucket-passes'],
      ).toBe(passes);
    },
  );
  it('accepts small positive cycles and speeds without invented lower bounds', () => {
    const r = success(
      input({
        excavator: { cycleTimeSeconds: 1e-9 },
        truck: {
          haulDistanceKm: 1e-9,
          loadedSpeedKmh: 1e-9,
          emptySpeedKmh: 1e-9,
        },
      }),
    );
    close(r.metrics['loaded-travel-time'], 60);
    expect(r.metrics['system-productivity']).toBeGreaterThan(0);
  });
  it('handles zero distance/unloading and zero costs without zero divisors', () => {
    const r = success(
      input({
        truck: { haulDistanceKm: 0, unloadingTimeMinutes: 0, hourlyCostCU: 0 },
        excavator: { hourlyCostCU: 0 },
      }),
    );
    expect(r.metrics['balanced-truck-count']).toBe(1);
    expect(r.metrics['excavator-transport-utilization']).toBe(1);
    expect(r.metrics['truck-wait-share']).toBe(0);
    expect(r.metrics['total-operating-cost']).toBe(0);
    expect(r.metrics['unit-operating-cost']).toBe(0);
  });
  it.each([
    {
      excavator: {
        bucketCapacityM3Loose: Number.MAX_VALUE,
        bucketFillFactor: 2,
      },
    },
    {
      excavator: {
        bucketCapacityM3Loose: Number.MIN_VALUE,
        bucketFillFactor: 0.5,
      },
    },
    { excavator: { cycleTimeSeconds: Number.MIN_VALUE } },
    {
      excavator: { timeUtilizationFactor: Number.MIN_VALUE },
      truck: { haulDistanceKm: 1e10 },
    },
    { truck: { loadedSpeedKmh: Number.MIN_VALUE } },
    { truck: { capacityM3Loose: 1e20 } },
    { truck: { truckCount: Number.MAX_VALUE, hourlyCostCU: Number.MAX_VALUE } },
    { task: { workVolumeM3Loose: Number.MAX_VALUE } },
  ])(
    'returns structured calculation error for representational failure %j',
    (overrides) => {
      const r = calculate(input(overrides));
      expect(r.status).toBe('error');
      if (r.status === 'error') {
        expect(r.issues.length).toBeGreaterThan(0);
        expect(r.issues.every((issue) => issue.phase === 'calculation')).toBe(
          true,
        );
        expect(r).not.toHaveProperty('metrics');
      }
    },
  );
});
