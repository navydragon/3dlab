import { describe, expect, it } from 'vitest';
import {
  formatMetric,
  primaryMetrics,
  directionText,
} from './experiment-format';
describe('experiment presentation', () => {
  it('formats fractions as percentages and signed deltas as percentage points', () => {
    const ratio = 0.2421875;
    expect(formatMetric('truck-wait-share', ratio)).toBe('24,2 %');
    expect(formatMetric('excavator-idle-share', -0.01030927835, true)).toBe(
      '-1,0 п.п.',
    );
    expect(ratio).toBe(0.2421875);
    expect(formatMetric('system-hourly-cost', 70, true)).toBe('+70,00 CU/ч');
    expect(formatMetric('balanced-truck-count', 4)).toBe('4 шт.');
    expect(formatMetric('match-factor', 1.32)).toBe('1,32');
  });
  it('prioritizes canonical KPIs and neutral exact directions', () => {
    expect(primaryMetrics).toEqual([
      'system-productivity',
      'project-duration',
      'total-operating-cost',
    ]);
    expect(directionText.same).toBe('производительность не изменилась');
  });
});
