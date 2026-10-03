import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();

describe('architectural import restrictions', () => {
  it.each([
    ['src/domain/ids.ts', 'react'],
    ['src/domain/ids.ts', 'react/jsx-runtime'],
    ['src/domain/ids.ts', 'react-router'],
    ['src/domain/ids.ts', 'zod'],
    ['src/domain/ids.ts', '../ui/pages/HomePage'],
    ['src/domain/ids.ts', '../navigation/routes'],
    ['src/domain/ids.ts', '../visualization/contracts'],
    ['src/application/content-state.ts', '../ui/components/ContentNotice'],
    ['src/application/content-state.ts', 'react'],
    ['src/content/ingestion.ts', '../navigation/routes'],
    ['src/simulation/future-core.ts', 'react'],
    ['src/simulation/future-core.ts', 'react-router'],
    ['src/simulation/future-core.ts', '../visualization/contracts'],
  ])('rejects %s importing %s', async (filePath, source) => {
    // Lint in-memory snippets: no invalid production file or future directory.
    const results = await eslint.lintText(
      `import type { Forbidden } from '${source}'; export type Example = Forbidden;`,
      { filePath },
    );
    expect(
      results
        .flatMap((result) => result.messages)
        .some(
          (message) =>
            message.ruleId === 'no-restricted-imports' &&
            message.severity === 2,
        ),
    ).toBe(true);
  });

  it('allows a plain domain type in application code', async () => {
    const results = await eslint.lintText(
      "import type { MachineId } from '../domain/ids'; export type Example = MachineId;",
      { filePath: 'src/application/content-state.ts' },
    );
    expect(results.flatMap((result) => result.messages)).toEqual([]);
  });

  it('rejects browser APIs in the domain', async () => {
    const results = await eslint.lintText(
      'export const example = window.location;',
      { filePath: 'src/domain/ids.ts' },
    );
    expect(
      results
        .flatMap((result) => result.messages)
        .some((message) => message.ruleId === 'no-restricted-globals'),
    ).toBe(true);
  });
});
