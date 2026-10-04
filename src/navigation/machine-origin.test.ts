import { describe, expect, it } from 'vitest';
import { parseMachineOrigin, parseProcessRoute, processPath } from './routes';
import { isMachineId, isProcessId, isProcessStageId } from '../domain/ids';
describe('separate machine → process origin query', () => {
  it.each([
    '?fromMachine=Invalid',
    '?fromMachine=',
    '?fromMachine=excavator&fromMachine=dump-truck',
  ])('rejects malformed/duplicate %s', (query) => {
    expect(parseMachineOrigin(query)).toEqual({ ok: false });
    expect(parseProcessRoute('excavation-haul', query).ok).toBe(true);
  });
  it('parses absence and syntax without promoting existence to trusted origin', () => {
    expect(parseMachineOrigin('')).toEqual({ ok: true, value: undefined });
    expect(parseMachineOrigin('?fromMachine=missing')).toEqual({
      ok: true,
      value: 'missing',
    });
  });
  it('builds selected-stage and overview addresses preserving only explicit origin', () => {
    const machine = 'excavator',
      process = 'excavation-haul',
      stage = 'excavation-stage';
    if (
      !isMachineId(machine) ||
      !isProcessId(process) ||
      !isProcessStageId(stage)
    )
      throw new Error('Invalid test IDs');
    expect(processPath(process, stage, machine)).toBe(
      '/processes/excavation-haul?stageId=excavation-stage&fromMachine=excavator',
    );
    expect(processPath(process, undefined, machine)).toBe(
      '/processes/excavation-haul?fromMachine=excavator',
    );
    expect(processPath(process, stage)).toBe(
      '/processes/excavation-haul?stageId=excavation-stage',
    );
  });
});
