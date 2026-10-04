import { describe, it } from 'vitest';
import { close, input, success } from '../../tests/simulation/fixture.ts';

describe('documented N=1…5 baseline oracles (§21)', () => {
  const rows = [
    [
      1, 0.3298969072, 0.3298969072, 0.6701030928, 0, 14.55, 0, 41.07216495,
      24.34738956, 250, 6086.84739, 6.08684739,
    ],
    [
      2, 0.6597938144, 0.6597938144, 0.3402061856, 0, 14.55, 0, 82.1443299,
      12.17369478, 320, 3895.582329, 3.895582329,
    ],
    [
      3, 0.9896907216, 0.9896907216, 0.0103092784, 0, 14.55, 0, 123.21649485,
      8.11579652, 390, 3165.160643, 3.165160643,
    ],
    [
      4, 1.3195876289, 1, 0, 4.65, 19.2, 0.2421875, 124.5, 8.032128514, 460,
      3694.779116, 3.694779116,
    ],
    [
      5, 1.6494845361, 1, 0, 9.45, 24, 0.39375, 124.5, 8.032128514, 530,
      4257.028112, 4.257028112,
    ],
  ] as const;
  for (const [
    count,
    mf,
    utilization,
    idle,
    wait,
    realized,
    waitShare,
    productivity,
    duration,
    hourly,
    total,
    unit,
  ] of rows) {
    it(`matches all documented outputs for ${count} trucks`, () => {
      const { metrics: m, intermediates: i } = success(
        input({ truck: { truckCount: count } }),
      );
      close(m['match-factor'], mf);
      close(m['excavator-transport-utilization'], utilization);
      close(m['excavator-idle-share'], idle);
      close(m['truck-wait-time'], wait);
      close(i.truckRealizedCycleMinutes, realized);
      close(m['truck-wait-share'], waitShare);
      close(m['system-productivity'], productivity);
      close(m['project-duration'], duration);
      close(m['system-hourly-cost'], hourly);
      close(m['total-operating-cost'], total);
      close(m['unit-operating-cost'], unit);
    });
  }
});
