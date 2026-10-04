import { describe, expect, it } from 'vitest';
import { METRIC_UNITS } from './contracts.ts';
import { close, input, success } from '../../tests/simulation/fixture.ts';

describe('formulas and intermediates (§§7–20)', () => {
  it('reproduces every baseline intermediate and all canonical IDs', () => {
    const { metrics: m, intermediates: i } = success();
    expect(Object.keys(m)).toEqual(Object.keys(METRIC_UNITS));
    expect(Object.keys(m)).toHaveLength(18);
    close(m['effective-bucket-volume'], 1.08);
    close(i.cyclesPerHour60, 150);
    close(i.excavatorProductivityM3LoosePerHour60, 162);
    close(m['excavator-standalone-productivity'], 134.46);
    expect(m['bucket-passes']).toBe(12);
    close(m['truck-loading-time'], 4.8);
    close(i.loadingCeilingM3LoosePerHour60, 150);
    close(m['loaded-travel-time'], 5);
    close(m['empty-travel-time'], 3.75);
    close(i.truckAwayTimeMinutes, 9.75);
    close(m['truck-free-cycle-time'], 14.55);
    expect(m['balanced-truck-count']).toBe(4);
  });
  it('keeps loading/MF/queue unchanged when k_time changes', () => {
    const a = success(
      input({
        excavator: { timeUtilizationFactor: 1 },
        truck: { truckCount: 4 },
      }),
    );
    const b = success(
      input({
        excavator: { timeUtilizationFactor: 0.5 },
        truck: { truckCount: 4 },
      }),
    );
    for (const id of [
      'truck-loading-time',
      'match-factor',
      'truck-wait-time',
    ] as const)
      expect(a.metrics[id]).toBe(b.metrics[id]);
    expect(b.metrics['system-productivity']).toBe(
      a.metrics['system-productivity'] * 0.5,
    );
    expect(b.metrics['excavator-standalone-productivity']).toBe(
      a.metrics['excavator-standalone-productivity'] * 0.5,
    );
    expect(b.metrics['project-duration']).toBe(
      a.metrics['project-duration'] * 2,
    );
  });
  it.each([1, 2, 3, 4, 5, 12])(
    'matches the equivalent minimum form for N=%i',
    (truckCount) => {
      const { metrics: m, intermediates: i } = success(
        input({ truck: { truckCount } }),
      );
      close(
        i.systemProductivityM3LoosePerHour60,
        Math.min(
          i.loadingCeilingM3LoosePerHour60,
          (truckCount * 12 * 60) / m['truck-free-cycle-time'],
        ),
      );
    },
  );
  it('charges a full last pass but delivers exact body volume', () => {
    const r = success(
      input({
        excavator: {
          bucketCapacityM3Loose: 2,
          bucketFillFactor: 1,
          cycleTimeSeconds: 30,
        },
        truck: { capacityM3Loose: 5 },
      }),
    );
    expect(r.metrics['bucket-passes']).toBe(3);
    expect(r.metrics['truck-loading-time']).toBe(1.5);
    expect(r.intermediates.loadingCeilingM3LoosePerHour60).toBe(200);
    expect(r.intermediates.excavatorProductivityM3LoosePerHour60).toBe(240);
  });
});
