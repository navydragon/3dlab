import {
  readFile,
  writeFile,
  mkdir,
  copyFile,
  readdir,
} from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { format } from 'prettier';
import {
  inspectGlb,
  componentFor,
  canonicalNodes,
  validateMapping,
} from './glb-inspection.ts';
import { validateDomainContent } from '../src/content/validation.ts';
import { validateAsset3D } from '../src/content/asset3d-validation.ts';
import { domainFiles } from '../src/content/adapters/local/manifest.ts';

const root = new URL('../', import.meta.url);
const source = new URL('models/xe215c/stage_08/excavator.glb', root);
const metadata = new URL('content/3d/xe215c.json', root);
const uri = 'assets/3d/xe215c/v1_0_0/excavator.glb';
const publicManifest = new URL(
  'public/assets/3d/xe215c/v1_0_0/manifest.json',
  root,
);
const out = new URL('models/xe215c/stage_09/', root);
const encode = (value: unknown) =>
  format(JSON.stringify(value), { parser: 'json' });
async function matches(file: URL, value: unknown) {
  return (
    JSON.stringify(JSON.parse(await readFile(file, 'utf8'))) ===
    JSON.stringify(value)
  );
}

export async function immutableHashes() {
  const result: Record<string, string> = {};
  async function walk(directory: URL, relative: string) {
    for (const entry of (
      await readdir(directory, { withFileTypes: true })
    ).sort((a, b) => a.name.localeCompare(b.name))) {
      const name = relative + entry.name;
      const url = new URL(
        encodeURIComponent(entry.name) + (entry.isDirectory() ? '/' : ''),
        directory,
      );
      if (entry.isDirectory()) await walk(url, name + '/');
      else
        result[name] = createHash('sha256')
          .update(await readFile(url))
          .digest('hex');
    }
  }
  for (let i = 1; i <= 8; i++) {
    const relative = `models/xe215c/stage_${String(i).padStart(2, '0')}/`;
    await walk(new URL(relative, root), relative);
  }
  for (const file of (
    await readdir(new URL('scripts/blender/', root))
  ).sort()) {
    if (/^(stage_|check_stage_)0[1-8].*\.py$/.test(file)) {
      const name = 'scripts/blender/' + file;
      result[name] = createHash('sha256')
        .update(await readFile(new URL(name, root)))
        .digest('hex');
    }
  }
  return result;
}

export async function stage09(generate = false) {
  const before = await immutableHashes();
  const bytes = await readFile(source);
  const glb = inspectGlb(bytes);
  const rawGraph = Object.fromEntries(
    await Promise.all(
      Object.entries(domainFiles).map(async ([key, file]) => [
        key,
        JSON.parse(
          await readFile(new URL('content/domain/' + file, root), 'utf8'),
        ) as unknown,
      ]),
    ),
  );
  const domain = validateDomainContent(rawGraph);
  if (domain.status !== 'valid') throw new Error('Invalid domain content');
  const machine = domain.graph.machines.find((m) => m.id === 'excavator');
  if (!machine) throw new Error('Missing excavator domain entity');
  const meshes = glb.nodes.filter((n) => n.mesh !== null);
  const manifest = {
    id: 'excavator-main',
    subjectType: 'machine',
    subjectId: machine.id,
    uri,
    format: 'glb',
    version: '1.0.0',
    nodeMappings: machine.componentIds.map((componentId) => ({
      componentId,
      sceneNodes: meshes
        .filter((n) => componentFor(n) === componentId)
        .map((n) => n.name)
        .sort(),
    })),
    animationMappings: [
      {
        activity: 'excavator-working-cycle',
        clip: 'excavator_work_cycle_demo',
      },
    ],
    production: {
      sha256: glb.sha256,
      sizeBytes: glb.sizeBytes,
      units: 'meters',
      upAxis: 'Y',
      canonicalNodes,
      statistics: glb.statistics,
      clips: glb.clips.map((c) => ({
        name: c.name,
        durationSeconds: c.durationSeconds,
        loopable: c.loopable,
        animatedCanonicalNodes: c.animatedCanonicalNodes,
        animatedAuxiliaryNodes: c.animatedAuxiliaryNodes,
        restSemantics:
          'Static node TRS is the neutral rest pose. Clip time zero is its digging pose; stopping playback alone does not restore static TRS.',
        timingSemantics: 'visual-demonstration',
      })),
      mappingNotes: [
        'edu_component is authoritative for 95 production meshes. Six edu_role=auxiliary, edu_subsystem=bucket-linkage meshes join bucket-cylinder for full highlight/hide/isolate sets.',
        'Auxiliary meshes retain edu_selectable=false: direct hit selection must respect that flag. Canonical transform nodes are never visibility targets; mapped meshes are.',
      ],
      limitations: [
        'Sampled demonstration clip; duration is visual playback time, never engineering cycle time or a productivity input.',
        'Interactive procedural hydraulics are not exported. Stage 08 sampled interpolation has measured maximum control-time surface error 0.1484 mm.',
        'No viewer exists yet in the application. This stage supplies validated metadata and static public assets, not rendered select/highlight/hide/isolate controls.',
        'Browser rendering performance and target-device material appearance remain unmeasured.',
      ],
    },
  };
  const valid = validateAsset3D(manifest, domain.graph);
  if (valid.status !== 'valid') throw new Error(JSON.stringify(valid.issues));
  if (valid.asset.nodeMappings.length !== 9)
    throw new Error('Expected nine components');
  validateMapping(valid.asset, glb);
  const inspection = {
    stage: '09',
    source: 'models/xe215c/stage_08/excavator.glb',
    immutableHashes: before,
    ...glb,
    meshOwnership: meshes.map((n) => ({
      node: n.name,
      mesh: n.mesh,
      componentId: componentFor(n),
      source:
        typeof n.extras.edu_component === 'string'
          ? 'edu_component'
          : 'explicit bucket-linkage auxiliary policy',
      selectable: n.extras.edu_selectable,
    })),
    componentCounts: Object.fromEntries(
      manifest.nodeMappings.map((m) => [m.componentId, m.sceneNodes.length]),
    ),
    manifest: 'content/3d/xe215c.json',
    publicManifest: 'public/assets/3d/xe215c/v1_0_0/manifest.json',
  };
  if (generate) {
    await mkdir(new URL('content/3d/', root), { recursive: true });
    await mkdir(new URL('./', publicManifest), { recursive: true });
    await mkdir(out, { recursive: true });
    await writeFile(metadata, await encode(manifest));
    await writeFile(publicManifest, await encode(manifest));
    await copyFile(source, new URL('public/' + uri, root));
    await writeFile(new URL('inspection.json', out), await encode(inspection));
  } else {
    if (
      !(await matches(metadata, manifest)) ||
      !(await matches(publicManifest, manifest)) ||
      !(await matches(new URL('inspection.json', out), inspection))
    )
      throw new Error('Stale manifest/inspection; regenerate Stage 09');
  }
  if (!(await readFile(new URL('public/' + uri, root))).equals(bytes))
    throw new Error('Public GLB differs from immutable source');
  if (JSON.stringify(before) !== JSON.stringify(await immutableHashes()))
    throw new Error('Immutable stages changed');
  console.log(
    `Stage 09 valid: ${glb.sizeBytes} bytes, ${meshes.length} meshes mapped across nine domain components; ${glb.clips[0]?.durationSeconds}s clip.`,
  );
  return { manifest: valid.asset, glb, inspection };
}

if (
  process.argv[1] &&
  pathToFileURL(resolve(process.argv[1])).href === import.meta.url
)
  await stage09(process.argv.includes('--generate'));
