import { ESLint } from 'eslint';
import { describe, expect, it } from 'vitest';

const eslint = new ESLint();

describe('architectural import restrictions', () => {
  for (const filePath of [
    'src/domain/entities.ts',
    'src/simulation/future-core.ts',
  ]) {
    it('rejects dynamic I/O imports in ' + filePath, async () => {
      const results = await eslint.lintText(
        "export const value = import('node:fs');",
        { filePath },
      );
      expect(
        results
          .flatMap((result) => result.messages)
          .some((message) => message.ruleId === 'no-restricted-syntax'),
      ).toBe(true);
    });
    it.each([
      'node:fs',
      'node:fs/promises',
      'fs',
      'fs/promises',
      'node:path',
      'path',
      'node:http',
      'http',
      'node:https',
      'https',
      'node:process',
      'process',
      'node:child_process',
      'child_process',
    ])('rejects Node I/O/runtime import %s in ' + filePath, async (source) => {
      const results = await eslint.lintText(
        `import * as runtime from '${source}'; export const value = runtime;`,
        { filePath },
      );
      expect(
        results
          .flatMap((result) => result.messages)
          .some((message) => message.ruleId === 'no-restricted-imports'),
      ).toBe(true);
    });
    it.each([
      'process.env',
      'Date.now()',
      'fetch("test")',
      'globalThis.localStorage',
      'Math.random()',
    ])(
      'rejects direct platform/clock API %s in ' + filePath,
      async (expression) => {
        const results = await eslint.lintText(
          `export const value = ${expression};`,
          { filePath },
        );
        expect(
          results
            .flatMap((result) => result.messages)
            .some(
              (message) =>
                message.ruleId === 'no-restricted-globals' ||
                message.ruleId === 'no-restricted-properties',
            ),
        ).toBe(true);
      },
    );
  }
  it('permits Node test tooling in colocated pure-layer test files', async () => {
    const results = await eslint.lintText(
      "import { readFile } from 'node:fs/promises'; export const testTool = readFile;",
      { filePath: 'src/domain/entities.test.ts' },
    );
    expect(results.flatMap((result) => result.messages)).toEqual([]);
  });
  it.each([
    [
      'react-hooks/rules-of-hooks',
      "import { useState } from 'react'; export function Example({ visible }: {visible: boolean}) { if (visible) useState(0); return null; }",
    ],
    [
      'react-hooks/exhaustive-deps',
      "import { useEffect } from 'react'; export function Example({ value }: {value: string}) { useEffect(() => { console.log(value); }, []); return null; }",
    ],
  ])('enforces %s', async (rule, source) => {
    const results = await eslint.lintText(source, {
      filePath: 'src/ui/components/Example.tsx',
    });
    expect(
      results
        .flatMap((result) => result.messages)
        .some((message) => message.ruleId === rule && message.severity === 2),
    ).toBe(true);
  });
  it.each([
    ['src/domain/ids.ts', 'react'],
    ['src/domain/asset3d.ts', 'react'],
    ['src/domain/asset3d.ts', 'three'],
    ['src/domain/asset3d.ts', '@react-three/fiber'],
    ['src/domain/asset3d.ts', 'zod'],
    ['src/content/schemas/asset3d.ts', 'three'],
    ['src/content/schemas/asset3d.ts', '@react-three/fiber'],
    ['src/domain/ids.ts', 'react/jsx-runtime'],
    ['src/domain/ids.ts', 'react-router'],
    ['src/domain/ids.ts', 'zod'],
    ['src/domain/ids.ts', '../ui/pages/HomePage'],
    ['src/domain/ids.ts', '../navigation/routes'],
    ['src/domain/ids.ts', '../visualization/contracts'],
    ['src/application/page-queries.ts', '../ui/pages/MachinePage'],
    ['src/application/page-queries.ts', 'react'],
    ['src/ui/pages/MachinePage.tsx', '../../../content/domain/machines.json'],
    ['src/ui/pages/MachinePage.tsx', 'zod'],
    ['src/ui/pages/MachinePage.tsx', '../../content/schemas/domain'],
    ['src/ui/pages/MachinePage.tsx', '../../content/adapters/local/repository'],
    ['src/content/ingestion.ts', '../navigation/routes'],
    ['src/simulation/future-core.ts', 'react'],
    ['src/simulation/future-core.ts', 'react-router'],
    ['src/simulation/calculate.ts', 'zod'],
    ['src/simulation/calculate.ts', 'three'],
    ['src/simulation/calculate.ts', '@react-three/fiber'],
    ['src/simulation/calculate.ts', '../content/simulation-scenario'],
    ['src/simulation/calculate.ts', '../application/page-queries'],
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
      { filePath: 'src/application/page-queries.ts' },
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
