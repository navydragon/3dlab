import { readdir, readFile } from 'node:fs/promises';

// One Asset3D record per JSON file. Discovery is developer-side I/O, not domain code.
export async function readAssetMetadataFiles(
  directory: URL,
): Promise<readonly { readonly file: string; readonly data: unknown }[]> {
  const files: { file: string; data: unknown }[] = [];
  for (const entry of (await readdir(directory, { withFileTypes: true })).sort(
    (a, b) => a.name.localeCompare(b.name),
  )) {
    if (entry.isDirectory()) {
      for (const nested of await readAssetMetadataFiles(
        new URL(encodeURIComponent(entry.name) + '/', directory),
      ))
        files.push({ file: entry.name + '/' + nested.file, data: nested.data });
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      const data: unknown = JSON.parse(
        await readFile(
          new URL(encodeURIComponent(entry.name), directory),
          'utf8',
        ),
      );
      files.push({ file: entry.name, data });
    }
  }
  return files;
}
