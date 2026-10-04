import { describe, expect, it } from 'vitest';
import { close, input, success } from '../../tests/simulation/fixture.ts';

describe('documented D=4 km sensitivity (§22)', () => {
  it('reproduces N=3 and reduces productivity relative to 2 km', () => {
    const { metrics: m } = success(
      input({ truck: { haulDistanceKm: 4, truckCount: 3 } }),
    );
    close(m['truck-free-cycle-time'], 23.3);
    close(m['match-factor'], 0.6180257511);
    close(m['excavator-transport-utilization'], 0.6180257511);
    close(m['system-productivity'], 76.94420601);
    close(m['project-duration'], 12.99643241);
    close(m['truck-wait-time'], 0);
    expect(m['system-productivity']).toBeLessThan(
      success(input({ truck: { truckCount: 3 } })).metrics[
        'system-productivity'
      ],
    );
    expect(m['balanced-truck-count']).toBe(5);
  });
  it('reproduces N=5 saturation and waiting', () => {
    const { metrics: m } = success(
      input({ truck: { haulDistanceKm: 4, truckCount: 5 } }),
    );
    close(m['truck-free-cycle-time'], 23.3);
    close(m['match-factor'], 1.0300429185);
    close(m['excavator-transport-utilization'], 1);
    close(m['system-productivity'], 124.5);
    close(m['truck-wait-time'], 0.7);
    close(m['truck-wait-share'], 0.0291666667);
  });
});
