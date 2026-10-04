import { readdir, readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { EXCAVATOR_WORKING_CYCLE } from '../../src/domain/activities';
import {
  isLearningActivityId,
  isScenarioId,
  isMachineId,
} from '../../src/domain/ids';
import {
  showAll,
  type ViewerCommand,
  type Visibility,
} from '../../src/visualization/contracts';
import { asset3dSchema } from '../../src/content/schemas/asset3d';
import metadata from '../../content/3d/xe215c.json';
import { createDomainRepository } from '../../src/content/repository';
import { localDomainContent } from '../../src/content/adapters/local/repository';
import { getMachinePage } from '../../src/application/page-queries';

describe('plain viewer contracts and canonical activity', () => {
  it('uses plain command/visibility values and branded structural IDs', () => {
    const command: ViewerCommand = { kind: 'reset', sequence: 1 };
    const visibility: Visibility = showAll;
    expect(command).toEqual({ kind: 'reset', sequence: 1 });
    expect(visibility).toEqual({ hidden: [], isolated: null });
    expect(isLearningActivityId(EXCAVATOR_WORKING_CYCLE)).toBe(true);
    expect(isScenarioId('test-scenario')).toBe(true);
    expect(isLearningActivityId('Bad ID')).toBe(false);
    expect(isScenarioId('Bad ID')).toBe(false);
  });
  it('validates unchanged production activity and exposes working-cycle capability', () => {
    const asset = asset3dSchema.parse(metadata);
    expect(asset.animationMappings[0]?.activity).toBe(EXCAVATOR_WORKING_CYCLE);
    const domain = createDomainRepository(localDomainContent);
    const machine = 'excavator';
    if (domain.status !== 'loaded' || !isMachineId(machine))
      throw new Error('Invalid fixture');
    const page = getMachinePage(
      domain.repository,
      machine,
      undefined,
      undefined,
      { status: 'available', asset },
    );
    if (page.status !== 'ready') throw new Error('Missing page');
    expect(
      page.sections.some((section) => section.id === 'working-cycle'),
    ).toBe(true);
    const absent = getMachinePage(
      domain.repository,
      machine,
      undefined,
      undefined,
      { status: 'available', asset: { ...asset, animationMappings: [] } },
    );
    if (absent.status !== 'ready') throw new Error('Missing page');
    expect(
      absent.sections.some((section) => section.id === 'working-cycle'),
    ).toBe(false);
  });
  it('has one canonical literal declaration in production TS/TSX', async () => {
    const hits: string[] = [];
    async function walk(directory: URL) {
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        const url = new URL(
          entry.name + (entry.isDirectory() ? '/' : ''),
          directory,
        );
        if (entry.isDirectory()) await walk(url);
        else if (
          /\.tsx?$/.test(entry.name) &&
          !/\.test\.tsx?$/.test(entry.name)
        ) {
          const text = await readFile(url, 'utf8');
          text
            .match(/['"]excavator-working-cycle['"]/g)
            ?.forEach(() => hits.push(url.pathname));
        }
      }
    }
    await walk(new URL('../../src/', import.meta.url));
    await walk(new URL('../../scripts/', import.meta.url));
    expect(hits).toHaveLength(1);
    expect(hits[0]).toMatch(/src\/domain\/activities\.ts$/);
  });
});
