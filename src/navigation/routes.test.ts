import { describe, expect, it } from 'vitest';
import {
  machinePath,
  machineSectionPath,
  parseMachineRoute,
  parseProcessRoute,
  parseReturnContext,
  processPath,
} from './routes';

describe('URL identity and contextual navigation', () => {
  it('builds canonical routes and preserves a structured return origin', () => {
    // All IDs here are routing fixtures, not production domain definitions.
    const machine = parseMachineRoute('example-machine', 'example-section');
    const process = parseProcessRoute(
      'example-process',
      '?stageId=example-stage',
    );
    const context = parseReturnContext(
      '?fromProcess=example-process&fromStage=example-stage',
    );
    if (
      !machine.ok ||
      !machine.value.sectionId ||
      !process.ok ||
      !context.ok ||
      !context.value
    )
      throw new Error('Invalid test fixture');
    expect(machinePath(machine.value.machineId)).toBe(
      '/machines/example-machine',
    );
    expect(machinePath(machine.value.machineId, context.value)).toBe(
      '/machines/example-machine?fromProcess=example-process&fromStage=example-stage',
    );
    expect(
      machineSectionPath(
        machine.value.machineId,
        machine.value.sectionId,
        context.value,
      ),
    ).toBe(
      '/machines/example-machine/example-section?fromProcess=example-process&fromStage=example-stage',
    );
    expect(processPath(process.value.processId, process.value.stageId)).toBe(
      '/processes/example-process?stageId=example-stage',
    );
    expect(processPath(process.value.processId)).toBe(
      '/processes/example-process',
    );
  });

  it('reads an optional stage without mirroring URL state', () => {
    expect(parseProcessRoute('example', '?stageId=example-stage')).toEqual({
      ok: true,
      value: { processId: 'example', stageId: 'example-stage' },
    });
    expect(parseProcessRoute('example', '')).toEqual({
      ok: true,
      value: { processId: 'example', stageId: undefined },
    });
  });

  it.each([
    '?stageId=',
    '?stageId=Example',
    '?stageId=one&stageId=two',
    '?stageId=https%3A%2F%2Fexample.com',
  ])('rejects malformed/ambiguous stage query %s', (query) => {
    expect(parseProcessRoute('example', query).ok).toBe(false);
  });

  it.each(['', 'Example', 'with space', '../elsewhere', 'trailing-', 'a/b'])(
    'rejects invalid entity ID %s',
    (id) => {
      expect(parseMachineRoute(id).ok).toBe(false);
      expect(parseProcessRoute(id, '').ok).toBe(false);
    },
  );

  it('distinguishes absent origin from malformed and external origins', () => {
    expect(parseReturnContext('')).toEqual({ ok: true, value: undefined });
    for (const query of [
      '?fromProcess=example',
      '?fromStage=example-stage',
      '?fromProcess=example&fromStage=',
      '?fromProcess=https://example.com&fromStage=example-stage',
      '?fromProcess=one&fromProcess=two&fromStage=stage',
    ]) {
      expect(parseReturnContext(query).ok).toBe(false);
    }
    expect(parseMachineRoute('example', 'Invalid').ok).toBe(false);
  });
});
