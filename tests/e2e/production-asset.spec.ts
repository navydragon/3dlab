import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { asset3dSchema } from '../../src/content/schemas/asset3d';
import { inspectGlb, validateMapping } from '../../scripts/glb-inspection';

test('production static pipeline serves exact GLB and its application manifest', async ({
  request,
}) => {
  const response = await request.get('/assets/3d/xe215c/v1_0_0/manifest.json');
  expect(response.ok()).toBe(true);
  const manifest = asset3dSchema.parse(await response.json());
  const asset = await request.get('/' + manifest.uri);
  expect(asset.ok()).toBe(true);
  expect(asset.headers()['content-type']).not.toContain('text/html');
  const bytes = await asset.body();
  expect(bytes.length).toBe(manifest.production?.sizeBytes);
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(
    manifest.production?.sha256,
  );
  expect(() => validateMapping(manifest, inspectGlb(bytes))).not.toThrow();
});
