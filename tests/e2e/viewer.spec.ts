import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Mesh, PerspectiveCamera, Raycaster, Vector2, Vector3 } from 'three';
import metadata from '../../content/3d/xe215c.json' with { type: 'json' };
import { fitInspectionCamera } from '../../src/visualization/camera-fit';
async function bucketHit(width: number, height: number) {
  const bytes = await readFile(
    new URL('../../public/' + metadata.uri, import.meta.url),
  );
  const gltf = await new GLTFLoader().parseAsync(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    '',
  );
  gltf.scene.updateMatrixWorld(true);
  const camera = new PerspectiveCamera(42, width / height, 0.1, 200);
  fitInspectionCamera(camera, gltf.scene);
  const names = metadata.nodeMappings.find(
    (mapping) => mapping.componentId === 'bucket',
  )!.sceneNodes;
  const ray = new Raycaster();
  for (const name of names) {
    const mesh = gltf.scene.getObjectByName(name) as Mesh;
    const geometry = mesh.geometry;
    const index = geometry.index!;
    const vertices = geometry.getAttribute('position');
    for (let i = 0; i < index.count; i += 3) {
      const center = new Vector3();
      for (let j = 0; j < 3; j++)
        center.add(
          new Vector3().fromBufferAttribute(vertices, index.getX(i + j)),
        );
      center.divideScalar(3).applyMatrix4(mesh.matrixWorld).project(camera);
      if (Math.abs(center.x) >= 0.95 || Math.abs(center.y) >= 0.95) continue;
      ray.setFromCamera(new Vector2(center.x, center.y), camera);
      const first = ray.intersectObject(gltf.scene, true)[0]?.object;
      if (
        first &&
        names.includes(first.name) &&
        first.userData.edu_selectable === true
      )
        return { x: center.x, y: center.y };
    }
  }
  throw new Error('No visible selectable bucket surface');
}
test('production construction selection, visibility and context return', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page
    .getByRole('main')
    .getByRole('link', { name: /Машины/ })
    .click();
  await page
    .getByRole('link', { name: 'Гидравлический экскаватор', exact: true })
    .click();
  await page.getByRole('link', { name: 'Конструкция', exact: true }).click();
  await expect(page.locator('[data-viewer-state]')).toHaveAttribute(
    'data-viewer-state',
    'ready',
  );
  // Use actual model triangles/current framing instead of fixed screen pixels.
  await page.locator('canvas').scrollIntoViewIfNeeded();
  const box = (await page.locator('canvas').boundingBox())!;
  const hit = await bucketHit(box.width, box.height);
  await page.mouse.click(
    box.x + ((hit.x + 1) * box.width) / 2,
    box.y + ((1 - hit.y) * box.height) / 2,
  );
  await expect(
    page.getByRole('button', { name: 'Ковш', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Ковш', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Ковш', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(
    page.getByRole('article', { name: 'Выбранный компонент' }),
  ).toContainText('Ковш');
  await page.getByRole('button', { name: 'Скрыть выбранный' }).click();
  await expect(
    page.getByText('Скрыто компонентов: 1', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Показать всё' }).click();
  await page.getByRole('button', { name: 'Изолировать выбранный' }).click();
  await expect(
    page.getByText('Показан только выбранный компонент'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Показать всё' }).click();
  await page.screenshot({
    path: 'test-results/viewer-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('canvas')).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/viewer-narrow.png',
    fullPage: true,
  });
  await page.goto('/processes/excavation-haul?stageId=excavation-stage');
  await page
    .getByRole('region', { name: /^Этап:/ })
    .getByRole('heading', { name: 'Гидравлический экскаватор', exact: true })
    .click();
  await page.getByRole('link', { name: /Изучить машину/ }).click();
  await page.getByRole('link', { name: 'Конструкция', exact: true }).click();
  await page.getByRole('link', { name: /Назад к этапу/ }).click();
  await expect(page).toHaveURL(
    '/processes/excavation-haul?stageId=excavation-stage',
  );
  expect(errors).toEqual([]);
});
test('real production playback pause/reset and measured software Chromium cadence', async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') warnings.push(message.text());
  });
  let responseBytes = 0;
  page.on('response', async (response) => {
    if (response.url().endsWith('excavator.glb'))
      responseBytes = (await response.body()).length;
  });
  await page.addInitScript(() => {
    const records: unknown[] = [];
    Object.defineProperty(window, 'viewerMeasurements', { value: records });
    document.addEventListener('viewer-metrics', (event) =>
      records.push((event as CustomEvent).detail),
    );
  });
  await page.goto('/machines/excavator/working-cycle');
  await expect(page.locator('[data-viewer-state]')).toHaveAttribute(
    'data-viewer-state',
    'ready',
  );
  await expect(page.locator('[data-pose]')).toHaveAttribute(
    'data-pose',
    'neutral',
  );
  await page.waitForFunction(
    () =>
      (window as unknown as { viewerMeasurements: unknown[] })
        .viewerMeasurements.length >= 1,
  );
  await page.getByRole('button', { name: 'Воспроизвести' }).click();
  await expect(page.locator('[data-pose]')).toHaveAttribute(
    'data-pose',
    'playing',
  );
  await page.waitForFunction(() =>
    (
      window as unknown as { viewerMeasurements: { pose: string }[] }
    ).viewerMeasurements.some((m) => m.pose === 'playing'),
  );
  await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  await expect(page.locator('[data-pose]')).toHaveAttribute(
    'data-pose',
    'paused',
  );
  await page
    .getByRole('button', { name: 'Сбросить в нейтральную позу' })
    .click();
  await expect(page.locator('[data-pose]')).toHaveAttribute(
    'data-pose',
    'neutral',
  );
  await page.getByRole('button', { name: 'Воспроизвести' }).click();
  await page
    .getByRole('button', { name: 'Сбросить в нейтральную позу' })
    .click();
  await expect(page.locator('[data-pose]')).toHaveAttribute(
    'data-pose',
    'neutral',
  );
  const measurements = await page.evaluate(() => ({
    userAgent: navigator.userAgent,
    devicePixelRatio,
    records: (window as unknown as { viewerMeasurements: unknown[] })
      .viewerMeasurements,
  }));
  const report = {
    responseBytes,
    readyMs: await page
      .locator('[data-ready-ms]')
      .getAttribute('data-ready-ms'),
    ...measurements,
    errors,
    consoleErrors: warnings,
  };
  await info.attach('viewer-performance.json', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
  console.log('VIEWER_MEASUREMENTS ' + JSON.stringify(report));
  expect(responseBytes).toBe(600324);
  expect(errors).toEqual([]);
  expect(warnings).toEqual([]);
});
test('HTTP/decode/WebGL failures leave canonical text and navigation available', async ({
  page,
}) => {
  await page.route('**/excavator.glb', (route) =>
    route.fulfill({ status: 404, body: 'missing' }),
  );
  await page.goto('/machines/excavator/construction');
  await expect(page.locator('[data-viewer-state]')).toHaveAttribute(
    'data-viewer-state',
    'error',
  );
  await expect(page.locator('[data-viewer-error]')).toHaveAttribute(
    'data-viewer-error',
    'asset-load',
  );
  await page.getByRole('button', { name: 'Ковш', exact: true }).click();
  await expect(
    page.getByRole('article', { name: 'Выбранный компонент' }),
  ).toContainText('Ковш');
  await page.unroute('**/excavator.glb');
  await page.route('**/excavator.glb', (route) =>
    route.fulfill({ status: 200, body: 'invalid GLB' }),
  );
  await page.getByRole('button', { name: 'Повторить загрузку 3D' }).click();
  await expect(page.locator('[data-viewer-error]')).toHaveAttribute(
    'data-viewer-error',
    'asset-decode',
  );
  await page.addInitScript(() => {
    HTMLCanvasElement.prototype.getContext = (() =>
      null) as typeof HTMLCanvasElement.prototype.getContext;
  });
  await page.reload();
  await expect(page.locator('[data-viewer-state]')).toHaveAttribute(
    'data-viewer-state',
    'unsupported',
  );
  await expect(
    page.getByRole('button', { name: 'Ковш', exact: true }),
  ).toBeEnabled();
  await expect(
    page.getByRole('link', { name: 'Где применяется', exact: true }),
  ).toBeVisible();
});

test('real WebGL context loss disables 3D safely and retry starts neutral without another GLB download', async ({
  page,
}) => {
  let requests = 0;
  page.on('request', (request) => {
    if (request.url().endsWith('excavator.glb')) requests++;
  });
  await page.goto('/machines/excavator/working-cycle');
  await expect(page.locator('[data-viewer-state]')).toHaveAttribute(
    'data-viewer-state',
    'ready',
  );
  await page.getByRole('button', { name: 'Воспроизвести' }).click();
  await page
    .locator('canvas')
    .evaluate((canvas: HTMLCanvasElement) =>
      canvas
        .getContext('webgl2')!
        .getExtension('WEBGL_lose_context')!
        .loseContext(),
    );
  await expect(page.locator('[data-viewer-error]')).toHaveAttribute(
    'data-viewer-error',
    'context-lost',
  );
  await expect(
    page.getByRole('button', { name: 'Воспроизвести' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Ковш', exact: true }).click();
  await expect(
    page.getByRole('article', { name: 'Выбранный компонент' }),
  ).toContainText('Ковш');
  await page.getByRole('button', { name: 'Повторить загрузку 3D' }).click();
  await expect(page.locator('[data-viewer-state]')).toHaveAttribute(
    'data-viewer-state',
    'ready',
  );
  await expect(
    page.getByRole('button', { name: 'Воспроизвести' }),
  ).toBeEnabled();
  expect(requests).toBe(1);
  await expect(page.locator('[data-pose]')).toHaveAttribute(
    'data-pose',
    'neutral',
  );
});

test('missing real mapped mesh produces explicit node-mapping error, not a partial viewer', async ({
  page,
}) => {
  const bytes = await readFile(
    new URL('../../public/' + metadata.uri, import.meta.url),
  );
  const end = 20 + bytes.readUInt32LE(12);
  const json: { nodes: { name: string }[] } = JSON.parse(
    bytes.toString('utf8', 20, end),
  );
  const firstMapped = metadata.nodeMappings[0]!.sceneNodes[0]!;
  json.nodes.find((n) => n.name === firstMapped)!.name =
    'test-only-missing-map';
  const content = Buffer.from(JSON.stringify(json));
  const padded = Buffer.alloc(Math.ceil(content.length / 4) * 4, 32);
  content.copy(padded);
  const header = Buffer.from(bytes.subarray(0, 20));
  header.writeUInt32LE(20 + padded.length + bytes.length - end, 8);
  header.writeUInt32LE(padded.length, 12);
  await page.route('**/excavator.glb', (route) =>
    route.fulfill({
      status: 200,
      body: Buffer.concat([header, padded, bytes.subarray(end)]),
    }),
  );
  await page.goto('/machines/excavator/construction');
  await expect(page.locator('[data-viewer-error]')).toHaveAttribute(
    'data-viewer-error',
    'node-mapping',
  );
  await expect(
    page.getByText(/Связь 3D-модели с учебными компонентами/),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Ковш', exact: true }),
  ).toBeEnabled();
});
