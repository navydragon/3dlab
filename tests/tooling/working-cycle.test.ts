import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import pack from '../../content/learning/working-cycle.json';
import metadata from '../../content/3d/xe215c.json';
import { loadLocalDomainRepository } from '../../src/content/adapters/local/repository';
import { asset3dSchema as parseAsset } from '../../src/content/schemas/asset3d';
import { createWorkingCycleRepository } from '../../src/content/working-cycle-repository';
import { resolveWorkingPhase } from '../../src/application/working-cycle';
import { phaseIds } from '../../src/domain/working-cycle';
import { asset3dSchema } from '../../src/content/schemas/asset3d';
import type { AssetRepository } from '../../src/content/asset-repository';

const loaded = loadLocalDomainRepository();
if (loaded.status !== 'loaded') throw new Error('Invalid fixture');
const domain = loaded.repository;
const actualAsset = parseAsset.parse(metadata);
const localAssetRepository: AssetRepository = {
  resolve: (id) =>
    id === actualAsset.subjectId
      ? { status: 'available', asset: actualAsset }
      : { status: 'unavailable' },
};
const load = (
  input: unknown = pack,
  assets: AssetRepository = localAssetRepository,
) => createWorkingCycleRepository(input, domain, assets);
const valid = load();
if (valid.status !== 'loaded') throw new Error('Invalid S2 fixture');
const cycle = valid.repository.get(
  domain.listMachines().find((m) => m.id === 'excavator')!.id,
)!;
describe('S2 reviewed learning overlay', () => {
  it('loads six ordered phases, freezes nested records, resolves components and file provenance', () => {
    expect(cycle.phases.map((p) => p.phaseId)).toEqual(phaseIds);
    expect(cycle.phases.map((p) => p.order)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const phase of cycle.phases) {
      expect(Object.isFrozen(phase.componentIds)).toBe(true);
      for (const id of phase.componentIds)
        expect(
          domain
            .getMachineComponents(cycle.machineId)!
            .some((c) => c.id === id),
        ).toBe(true);
    }
    expect(Object.isFrozen(cycle.visual.segments[0])).toBe(true);
    for (const source of cycle.sources)
      expect(
        readFileSync(
          new URL('../../' + source.location, import.meta.url),
          'utf8',
        ).length,
      ).toBeGreaterThan(0);
    expect(
      valid.repository.get(
        domain.listMachines().find((m) => m.id === 'dump-truck')!.id,
      ),
    ).toBeUndefined();
  });
  it('retains every approved name, goal, movement and note in reviewed pack', () => {
    const doc = readFileSync(
      new URL(
        '../../docs/product/s2-working-cycle-content-pack.md',
        import.meta.url,
      ),
      'utf8',
    );
    const statements = [...doc.matchAll(/"([\s\S]*?)"/g)].map((m) =>
      m[1]!.replace(/\s+/g, ' ').trim(),
    );
    for (const p of cycle.phases)
      for (const text of [
        p.goal,
        p.movement,
        ...(p.visualNote ? [p.visualNote] : []),
      ])
        expect(statements).toContain(text);
    expect(doc).toContain(cycle.timingNotice);
    expect(doc).toContain(cycle.overlapNotice);
  });
  const mutations: [string, (p: typeof pack) => void][] = [
    [
      'duplicate phase',
      (p) => {
        p.phases[1]!.phaseId = p.phases[0]!.phaseId;
      },
    ],
    [
      'missing phase',
      (p) => {
        p.phases.pop();
      },
    ],
    [
      'wrong order',
      (p) => {
        p.phases[0]!.order = 2;
      },
    ],
    [
      'wrong machine',
      (p) => {
        p.machineId = 'dump-truck';
      },
    ],
    [
      'unknown machine',
      (p) => {
        p.machineId = 'missing';
      },
    ],
    [
      'unknown component',
      (p) => {
        p.phases[0]!.componentIds[0] = 'missing';
      },
    ],
    [
      'duplicate component',
      (p) => {
        p.phases[0]!.componentIds.push('boom');
      },
    ],
    [
      'unknown asset',
      (p) => {
        p.visual.assetId = 'missing';
      },
    ],
    [
      'wrong asset version',
      (p) => {
        p.visual.assetVersion = '2.0.0';
      },
    ],
    [
      'wrong activity',
      (p) => {
        p.activity = 'unknown';
      },
    ],
    [
      'wrong overlay activity',
      (p) => {
        p.visual.activity = 'unknown';
      },
    ],
    [
      'negative anchor',
      (p) => {
        p.visual.segments[0]!.startSeconds = -1;
      },
    ],
    [
      'infinite anchor',
      (p) => {
        p.visual.segments[0]!.startSeconds = Infinity;
      },
    ],
    [
      'nan anchor',
      (p) => {
        p.visual.segments[0]!.startSeconds = NaN;
      },
    ],
    [
      'nonmonotonic range',
      (p) => {
        p.visual.segments[2]!.endSeconds = 0;
      },
    ],
    [
      'beyond endpoint',
      (p) => {
        p.visual.segments[5]!.endSeconds = 12;
      },
    ],
    [
      'unapproved boundary',
      (p) => {
        p.visual.segments[1]!.endSeconds = 1;
      },
    ],
    [
      'invented excavation duration',
      (p) => {
        p.visual.segments[0]!.endSeconds = 0.001;
      },
    ],
    [
      'unknown provenance',
      (p) => {
        p.sourceRefs = ['missing'];
      },
    ],
    [
      'duplicate source',
      (p) => {
        p.sources.push(p.sources[0]!);
      },
    ],
    [
      'wrong milestone',
      (p) => {
        p.visual.segments[4]!.milestones[0]!.timeSeconds = 7;
      },
    ],
  ];
  it.each(mutations)('rejects %s', (_, mutate) => {
    const p = structuredClone(pack);
    mutate(p);
    expect(load(p).status).toBe('invalid');
  });
  it('rejects invalid/ambiguous asset resolution, wrong subject and unmapped/missing actual clip evidence', () => {
    for (const status of ['invalid', 'ambiguous', 'unavailable'] as const)
      expect(load(pack, { resolve: () => ({ status }) }).status).toBe(
        'invalid',
      );
    const asset = asset3dSchema.parse(metadata);
    for (const changed of [
      {
        ...asset,
        subjectId: domain.listMachines().find((m) => m.id === 'dump-truck')!.id,
      },
      { ...asset, animationMappings: [] },
      { ...asset, production: { ...asset.production!, clips: [] } },
    ])
      expect(
        load(pack, { resolve: () => ({ status: 'available', asset: changed }) })
          .status,
      ).toBe('invalid');
  });
  it('keeps the duplicate zero anchors intentional and actual production endpoint', () => {
    expect(
      cycle.visual.segments.slice(0, 2).map((s) => s.startSeconds),
    ).toEqual([0, 0]);
    expect(cycle.visual.segments[0]!.endSeconds).toBeUndefined();
    expect(cycle.visual.segments[5]!.endSeconds).toBe(
      metadata.production.clips[0]!.durationSeconds,
    );
  });
});
describe('pure visual phase resolution', () => {
  it('has only a point excavation anchor, with filling for any positive first-segment time', () => {
    expect(resolveWorkingPhase(cycle, 0)).toBe('excavation');
    expect(resolveWorkingPhase(cycle, Number.MIN_VALUE)).toBe('bucket-filling');
    expect(resolveWorkingPhase(cycle, 0.001)).toBe('bucket-filling');
  });
  it.each(cycle.visual.segments.slice(2))(
    'resolves exact and adjacent $phaseId boundary',
    (segment) => {
      const i = cycle.visual.segments.indexOf(segment);
      expect(resolveWorkingPhase(cycle, segment.startSeconds - 1e-8)).toBe(
        cycle.visual.segments[i - 1]!.phaseId,
      );
      expect(resolveWorkingPhase(cycle, segment.startSeconds)).toBe(
        segment.phaseId,
      );
      expect(resolveWorkingPhase(cycle, segment.startSeconds + 1e-8)).toBe(
        segment.phaseId,
      );
    },
  );
  it('resolves final return endpoint, rejects out of range and restarts at loop zero', () => {
    const end = cycle.visual.segments[5]!.endSeconds!;
    expect(resolveWorkingPhase(cycle, end - 1e-8)).toBe('return');
    expect(resolveWorkingPhase(cycle, end)).toBe('return');
    expect(resolveWorkingPhase(cycle, end + 1e-8)).toBeNull();
    expect(resolveWorkingPhase(cycle, -1)).toBeNull();
    expect(resolveWorkingPhase(cycle, NaN)).toBeNull();
    expect(resolveWorkingPhase(cycle, 0)).toBe('excavation');
  });
});
