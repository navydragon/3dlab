import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, sep, basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { readAssetMetadataFiles } from '../../scripts/asset-metadata-files';
const directories: string[] = [];
afterEach(async () => {
  for (const directory of directories.splice(0)) {
    const target = resolve(directory);
    if (
      !target.startsWith(resolve(tmpdir()) + sep) ||
      !basename(target).startsWith('3dlab-assets-test-')
    )
      throw new Error('Unsafe fixture cleanup path');
    await rm(target, { recursive: true, force: true });
  }
});
async function directory() {
  const path = await mkdtemp(resolve(tmpdir(), '3dlab-assets-test-'));
  directories.push(path);
  return { path, url: pathToFileURL(path + sep) };
}
describe('production metadata discovery', () => {
  it('supports zero metadata and ignores gitkeep', async () => {
    const folder = await directory();
    await writeFile(resolve(folder.path, '.gitkeep'), '');
    expect(await readAssetMetadataFiles(folder.url)).toEqual([]);
  });
  it('discovers new nested JSON automatically without a manifest and preserves filenames', async () => {
    const folder = await directory();
    await mkdir(resolve(folder.path, 'nested'));
    await writeFile(
      resolve(folder.path, 'test-only.json'),
      '{"id":"test-only"}',
    );
    await writeFile(
      resolve(folder.path, 'nested', 'test-nested.json'),
      '{"id":"test-nested"}',
    );
    const files = await readAssetMetadataFiles(folder.url);
    expect(files.map((file) => file.file)).toEqual([
      'nested/test-nested.json',
      'test-only.json',
    ]);
    expect(files[0]?.data).toEqual({ id: 'test-nested' });
  });
  it('does not silently ignore malformed JSON', async () => {
    const folder = await directory();
    await writeFile(resolve(folder.path, 'test-invalid.json'), '{');
    await expect(readAssetMetadataFiles(folder.url)).rejects.toThrow();
  });
});
