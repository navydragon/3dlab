import { readFile } from 'node:fs/promises';
import { domainFiles } from '../src/content/adapters/local/manifest.ts';
import { validateDomainContent } from '../src/content/validation.ts';
import { validateAsset3DCollection } from '../src/content/asset3d-validation.ts';
import { readAssetMetadataFiles } from './asset-metadata-files.ts';
import { createSimulationScenarioRepository } from '../src/content/simulation-scenario-repository.ts';
import { createDomainRepository } from '../src/content/repository.ts';
import { validateProductionSystems } from '../src/content/production-system-validation.ts';
import { readSimulationScenarioFiles } from './simulation-scenario-files.ts';

try {
  const collections = await Promise.all(
    Object.entries(domainFiles).map(async ([key, file]) => {
      const data: unknown = JSON.parse(
        await readFile(
          new URL(`../content/domain/${file}`, import.meta.url),
          'utf8',
        ),
      );
      return [key, data] as const;
    }),
  );
  const validation = validateDomainContent(Object.fromEntries(collections));
  if (validation.status === 'invalid') {
    for (const issue of validation.issues)
      console.error(
        `${issue.phase}:${issue.code} ${issue.path.join('.')} — ${issue.message}`,
      );
    process.exitCode = 1;
  } else {
    console.log(
      `Domain content valid: ${Object.entries(validation.graph)
        .map(([name, records]) => `${records.length} ${name}`)
        .join(', ')}.`,
    );
    const domain = createDomainRepository(validation.graph);
    if (domain.status !== 'loaded')
      throw new Error('Domain repository invalid');
    const scenarioFiles = await readSimulationScenarioFiles(
      new URL('../content/simulation/', import.meta.url),
    );
    const scenarios = createSimulationScenarioRepository(
      scenarioFiles.map((file) => file.data),
    );
    if (scenarios.status === 'invalid') {
      for (const issue of scenarios.issues) {
        const index = issue.path[0];
        const file =
          typeof index === 'number' ? scenarioFiles[index]?.file : undefined;
        console.error(
          `simulation ${file ?? ''} ${issue.phase}:${issue.code} ${issue.path.slice(1).join('.')} — ${issue.message}`,
        );
      }
      process.exitCode = 1;
      console.error(
        'Production systems skipped: invalid scenario dependencies.',
      );
    } else {
      console.log(
        `Simulation content valid: ${scenarios.repository.list().length} scenarios (${scenarios.repository
          .list()
          .map((record) => record.scenarioId)
          .join(', ')}).`,
      );
      const systemsRaw: unknown = JSON.parse(
        await readFile(
          new URL('../content/domain/production-systems.json', import.meta.url),
          'utf8',
        ),
      );
      const systems = validateProductionSystems(
        systemsRaw,
        domain.repository,
        scenarios.repository,
      );
      if (systems.status === 'invalid') {
        for (const issue of systems.issues)
          console.error(
            `production-systems ${issue.phase}:${issue.code} ${issue.path.join('.')} — ${issue.message}`,
          );
        process.exitCode = 1;
      } else
        console.log(
          `Production systems valid: ${systems.systems.length} (${systems.systems.map((system) => system.id).join(', ')}).`,
        );
    }
    const files = await readAssetMetadataFiles(
      new URL('../content/3d/', import.meta.url),
    );
    const assets = validateAsset3DCollection(
      files.map((file) => file.data),
      validation.graph,
    );
    if (assets.status === 'invalid') {
      for (const issue of assets.issues) {
        const index = issue.path[0];
        const file = typeof index === 'number' ? files[index]?.file : undefined;
        console.error(
          `${file ?? '3d'} ${issue.phase}:${issue.code} ${issue.path.slice(1).join('.')} — ${issue.message}`,
        );
      }
      process.exitCode = 1;
    } else
      console.log(
        `3D metadata valid: ${assets.assets.length} assets (topology not inspected).`,
      );
  }
} catch (error: unknown) {
  console.error(
    'Content could not be loaded:',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
}
