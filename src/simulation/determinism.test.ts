import { describe, expect, it } from 'vitest';
import { calculate } from './calculate.ts';
import { MODEL_ID } from './contracts.ts';
import { input, success } from '../../tests/simulation/fixture.ts';

describe('determinism and result invariants', () => {
  it('does not mutate frozen input and returns identical fresh payloads', () => {
    const value = input();
    Object.freeze(value.excavator);
    Object.freeze(value.truck);
    Object.freeze(value.task);
    Object.freeze(value);
    const snapshot = structuredClone(value);
    const a = calculate(value);
    for (let i = 0; i < 10; i++) expect(calculate(value)).toEqual(a);
    expect(value).toEqual(snapshot);
    expect(a.modelId).toBe(MODEL_ID);
    expect(Object.keys(a).sort()).toEqual([
      'intermediates',
      'metrics',
      'modelId',
      'status',
    ]);
  });
  for (const truckCount of [1, 2, 3, 4, 5, 17]) {
    it.each([0, 2, 4, 100])(
      `maintains numerical invariants for N=${truckCount}, D=%s`,
      (haulDistanceKm) => {
        const r = success(input({ truck: { truckCount, haulDistanceKm } }));
        for (const n of [
          ...Object.values(r.metrics),
          ...Object.values(r.intermediates),
        ]) {
          expect(Number.isFinite(n)).toBe(true);
          expect(n).toBeGreaterThanOrEqual(0);
        }
        for (const id of [
          'effective-bucket-volume',
          'excavator-standalone-productivity',
          'system-productivity',
          'project-duration',
        ] as const)
          expect(r.metrics[id]).toBeGreaterThan(0);
        for (const id of ['bucket-passes', 'balanced-truck-count'] as const) {
          expect(Number.isInteger(r.metrics[id])).toBe(true);
          expect(r.metrics[id]).toBeGreaterThanOrEqual(1);
        }
        for (const id of [
          'excavator-transport-utilization',
          'excavator-idle-share',
          'truck-wait-share',
        ] as const)
          expect(r.metrics[id]).toBeLessThanOrEqual(1);
      },
    );
  }
});
