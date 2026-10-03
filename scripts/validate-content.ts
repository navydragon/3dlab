import { readFile } from 'node:fs/promises';
import { domainFiles } from '../src/content/adapters/local/manifest.ts';
import { validateDomainContent } from '../src/content/validation.ts';

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
  }
} catch (error: unknown) {
  console.error(
    'Content could not be loaded:',
    error instanceof Error ? error.message : String(error),
  );
  process.exitCode = 1;
}
