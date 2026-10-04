import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readSimulationScenarioFiles } from '../../scripts/simulation-scenario-files';

describe('deterministic scenario-only JSON discovery', () => {
  it('reads sorted recursive records, ignores non-JSON, and never drops malformed JSON', async () => {
    const directory = await mkdtemp(
      join(tmpdir(), '3dlab-scenario-discovery-'),
    );
    try {
      await mkdir(join(directory, 'nested'));
      await writeFile(join(directory, 'z.json'), '{}');
      await writeFile(join(directory, 'a.json'), '{}');
      await writeFile(join(directory, 'README.md'), 'Not a scenario');
      await writeFile(join(directory, 'nested', 'b.json'), '{}');
      const url = pathToFileURL(directory + '/');
      const first = await readSimulationScenarioFiles(url);
      expect(first.map((f) => f.file)).toEqual([
        'a.json',
        'nested/b.json',
        'z.json',
      ]);
      expect(await readSimulationScenarioFiles(url)).toEqual(first);
      await writeFile(join(directory, 'bad.json'), '{');
      await expect(readSimulationScenarioFiles(url)).rejects.toThrow(
        'bad.json',
      );
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });
});
