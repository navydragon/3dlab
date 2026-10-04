import { describe, expect, it } from 'vitest';
import { parseSystemRoute, routes, systemPath } from './routes';
import type { ProductionSystemId, ScenarioId } from '../domain/ids';
const id = 'excavator-haul-system' as ProductionSystemId;
const scenario = 'base-earthworks-scenario' as ScenarioId;
describe('system routes', () => {
  it('builds catalog, overview and explicit source URLs', () => {
    expect(routes.systems).toBe('/systems');
    expect(routes.system).toBe('/systems/:systemId');
    expect(systemPath(id)).toBe('/systems/excavator-haul-system');
    expect(systemPath(id, scenario)).toBe(
      '/systems/excavator-haul-system?scenario=base-earthworks-scenario',
    );
    expect(parseSystemRoute(id, '')).toEqual({
      ok: true,
      value: { systemId: id, scenarioId: undefined },
    });
    expect(parseSystemRoute(id, '?scenario=' + scenario)).toEqual({
      ok: true,
      value: { systemId: id, scenarioId: scenario },
    });
  });
  it.each([
    '?scenario=',
    '?scenario=Bad_ID',
    '?scenario=a&scenario=b',
    '?scenario=a&scenario=a',
    '?scenario=%20',
    '?scenario=a%2Fb',
  ])('rejects malformed/duplicate source query %s', (query) =>
    expect(parseSystemRoute(id, query).ok).toBe(false),
  );
  it.each([undefined, '', 'Bad_ID', 'a/b'])('rejects invalid system %s', (id) =>
    expect(parseSystemRoute(id, '').ok).toBe(false),
  );
  it('leaves valid unavailable source for repository resolution', () =>
    expect(parseSystemRoute(id, '?scenario=unavailable').ok).toBe(true));
});
