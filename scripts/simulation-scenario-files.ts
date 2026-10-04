import { readdir, readFile } from 'node:fs/promises';

/** content/simulation is reserved for scenario JSON only; other content types go elsewhere. */
export async function readSimulationScenarioFiles(
  directory: URL,
): Promise<readonly { readonly file: string; readonly data: unknown }[]> {
  const files: { file: string; data: unknown }[] = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort(
    (a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0),
  )) {
    const url = new URL(
      encodeURIComponent(entry.name) + (entry.isDirectory() ? '/' : ''),
      directory,
    );
    if (entry.isDirectory()) {
      for (const nested of await readSimulationScenarioFiles(url))
        files.push({ file: entry.name + '/' + nested.file, data: nested.data });
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      try {
        files.push({
          file: entry.name,
          data: JSON.parse(await readFile(url, 'utf8')) as unknown,
        });
      } catch (error) {
        throw new Error(`Cannot load simulation scenario ${url.pathname}`, {
          cause: error,
        });
      }
    }
  }
  return files;
}
