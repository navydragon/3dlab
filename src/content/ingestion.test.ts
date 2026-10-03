import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { validateContent } from './ingestion';

// Infrastructure-only fixture: no machine, lesson, engineering value or formula.
const fixtureSchema = z.strictObject({
  fixtureId: z.literal('ingestion-test'),
  revision: z.number().int().positive(),
});

describe('content ingestion boundary', () => {
  it('returns only validated schema output', () => {
    expect(
      validateContent(fixtureSchema, {
        fixtureId: 'ingestion-test',
        revision: 1,
      }),
    ).toEqual({
      ok: true,
      value: { fixtureId: 'ingestion-test', revision: 1 },
    });
  });
  it.each([
    null,
    { fixtureId: 'ingestion-test', revision: '1' },
    { fixtureId: 'ingestion-test', revision: 0 },
    { fixtureId: 'ingestion-test', revision: 1, unexpected: true },
  ])('rejects invalid test data %j', (data) => {
    const result = validateContent(fixtureSchema, data);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.issues.length).toBeGreaterThan(0);
  });
});
