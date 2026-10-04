import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import pack from '../../content/learning/foundation.json';
import { loadLocalDomainRepository } from '../../src/content/adapters/local/repository';
import { createFoundationRepository } from '../../src/content/foundation-repository';
const loaded = loadLocalDomainRepository();
if (loaded.status !== 'loaded') throw new Error('Invalid fixture domain');
const domain = loaded.repository;
const load = (input: unknown = pack) =>
  createFoundationRepository(input, domain);
describe('reviewed S1 content boundary', () => {
  it('loads canonical records with explicit sources and exactly nine component functions', () => {
    const result = load();
    expect(result.status).toBe('loaded');
    if (result.status !== 'loaded') return;
    expect(result.repository.sources).toHaveLength(4);
    const excavator = domain.listMachines().find((m) => m.id === 'excavator')!;
    const components = domain.getMachineComponents(excavator.id)!;
    expect(components).toHaveLength(9);
    for (const c of components)
      expect(result.repository.getComponent(c.id)?.machineId).toBe(
        excavator.id,
      );
    expect(
      result.repository.getMachine(excavator.id)?.workingPrinciple,
    ).toBeDefined();
    const truck = domain.listMachines().find((m) => m.id === 'dump-truck')!;
    expect(
      result.repository.getMachine(truck.id)?.workingPrinciple,
    ).toBeUndefined();
    expect(
      result.repository.getMachine(truck.id)?.transportCycle?.factors,
    ).toHaveLength(6);
    for (const process of domain.listProcesses())
      for (const s of domain.getProcessStages(process.id)!)
        expect(result.repository.getStage(s.id)?.processId).toBe(process.id);
  });
  it('freezes nested records and arrays without mutating source', () => {
    const result = load();
    if (result.status !== 'loaded') throw new Error('Invalid content');
    const machine = result.repository.getMachine(domain.listMachines()[0]!.id)!;
    expect(Reflect.set(machine.overview, 'purpose', 'changed')).toBe(false);
    expect(Object.isFrozen(machine.workingPrinciple?.groups)).toBe(true);
    expect(
      Object.isFrozen(machine.workingPrinciple?.groups[0]?.componentIds),
    ).toBe(true);
    expect(Reflect.set(result.repository.sources[0]!, 'scope', 'changed')).toBe(
      false,
    );
    expect(pack.machines[0]!.overview.purpose).not.toBe('changed');
  });
  it('preserves every approved explanatory statement in the checked-in reviewed pack', () => {
    const document = readFileSync(
      new URL(
        '../../docs/product/s1-foundation-content-pack.md',
        import.meta.url,
      ),
      'utf8',
    );
    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
    const approved = [...document.matchAll(/"([\s\S]*?)"/g)].map((m) =>
      normalize(m[1]!),
    );
    const texts = [
      ...pack.components.map((c) => c.explanation),
      ...pack.machines.flatMap((m) => [
        m.overview.purpose,
        m.overview.systemContext,
        m.overview.scopeNote,
        ...('workingPrinciple' in m
          ? [
              m.workingPrinciple!.intro,
              m.workingPrinciple!.paragraphs.join('\n\n'),
              ...m.workingPrinciple!.explanations,
            ]
          : []),
        ...('transportCycle' in m
          ? [
              ...m.transportCycle!.factors.map((f) => f.explanation),
              m.transportCycle!.distanceExplanation,
              m.transportCycle!.followUp,
            ]
          : []),
        ...('constructionIntro' in m
          ? [m.constructionIntro!, m.applicationsIntro!]
          : []),
      ]),
      ...pack.processes.flatMap((p) => [
        p.introduction,
        p.synthesis,
        p.systemsIntro,
      ]),
      ...pack.stages.flatMap((s) => [
        s.goal,
        s.input,
        s.activity,
        s.result,
        s.handoff,
        ...s.participantNotes.map((n) => n.note),
        ...s.modelNotes,
      ]),
    ];
    for (const text of texts) expect(approved, text).toContain(normalize(text));
  });
  it.each<readonly [string, (p: typeof pack) => void]>([
    ['unknown field', (p: typeof pack) => Object.assign(p, { surprise: true })],
    [
      'blank text',
      (p: typeof pack) => {
        p.stages[0]!.goal = ' ';
      },
    ],
    [
      'bad ID syntax',
      (p: typeof pack) => {
        p.machines[0]!.machineId = 'Invalid';
      },
    ],
    [
      'unknown source',
      (p: typeof pack) => {
        p.components[0]!.sourceRefs = ['missing'];
      },
    ],
    [
      'duplicate source ref',
      (p: typeof pack) => {
        p.components[0]!.sourceRefs.push(p.components[0]!.sourceRefs[0]!);
      },
    ],
    [
      'unknown machine',
      (p: typeof pack) => {
        p.machines[0]!.machineId = 'missing';
      },
    ],
    [
      'wrong component owner',
      (p: typeof pack) => {
        p.components[0]!.machineId = 'dump-truck';
      },
    ],
    [
      'unknown group member',
      (p: typeof pack) => {
        p.machines[0]!.workingPrinciple!.groups[0]!.componentIds = ['missing'];
      },
    ],
    [
      'unknown process',
      (p: typeof pack) => {
        p.processes[0]!.processId = 'missing';
      },
    ],
    [
      'wrong stage process',
      (p: typeof pack) => {
        p.stages[0]!.processId = 'missing';
      },
    ],
    [
      'unknown stage',
      (p: typeof pack) => {
        p.stages[0]!.stageId = 'missing';
      },
    ],
    [
      'not stage participant',
      (p: typeof pack) => {
        p.stages[0]!.participantNotes[0]!.machineId = 'dump-truck';
      },
    ],
    [
      'not stage role',
      (p: typeof pack) => {
        p.stages[0]!.participantNotes[0]!.roleId = 'soil-haul-vehicle';
      },
    ],
    [
      'missing component',
      (p: typeof pack) => {
        p.components.pop();
      },
    ],
    [
      'missing machine',
      (p: typeof pack) => {
        p.machines.pop();
      },
    ],
    [
      'missing process',
      (p: typeof pack) => {
        p.processes.pop();
      },
    ],
    [
      'missing stage',
      (p: typeof pack) => {
        p.stages.pop();
      },
    ],
    [
      'missing participant',
      (p: typeof pack) => {
        p.stages[1]!.participantNotes.pop();
      },
    ],
    [
      'duplicate participant',
      (p: typeof pack) => {
        p.stages[1]!.participantNotes.push(p.stages[1]!.participantNotes[0]!);
      },
    ],
    ...(
      ['machines', 'components', 'processes', 'stages', 'sources'] as const
    ).map(
      (key) =>
        [
          'duplicate ' + key,
          (p: typeof pack) => {
            (p[key] as unknown[]).push(p[key][0]);
          },
        ] as const,
    ),
  ])('rejects %s using test-only mutations', (_name, mutate) => {
    const fixture = structuredClone(pack);
    mutate(fixture);
    expect(load(fixture).status).toBe('invalid');
  });
});
