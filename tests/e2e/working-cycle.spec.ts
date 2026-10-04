import { expect, test } from '@playwright/test';

test('S2 pedagogical production cycle: phases, navigation, rates, pause and neutral', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page
    .getByRole('main')
    .getByRole('link', { name: /Машины/ })
    .click();
  await page
    .getByRole('link', { name: 'Гидравлический экскаватор', exact: true })
    .click();
  await page.getByRole('link', { name: 'Рабочий цикл', exact: true }).click();
  await expect(page.locator('[data-viewer-state]')).toHaveAttribute(
    'data-viewer-state',
    'ready',
  );
  const phases = page.getByRole('list', { name: 'Порядок учебных фаз' });
  await expect(phases.getByRole('button')).toHaveText([
    '1. Разработка грунта',
    '2. Заполнение ковша',
    '3. Подъём',
    '4. Поворот к разгрузке',
    '5. Разгрузка',
    '6. Обратный поворот и возврат',
  ]);
  await phases.getByRole('button', { name: '2. Заполнение ковша' }).click();
  await expect(
    page.getByRole('article', { name: 'Объяснение фазы' }),
  ).toContainText(
    'Заполнить ковш и перевести его в положение удержания материала.',
  );
  await expect(page.locator('[data-current-phase]')).toHaveAttribute(
    'data-current-phase',
    'bucket-filling',
  );
  await expect(page.locator('[data-visual-time]')).toHaveAttribute(
    'data-visual-time',
    '0',
  );
  await phases.getByRole('button', { name: '3. Подъём' }).click();
  await expect(page.locator('[data-current-phase]')).toHaveAttribute(
    'data-current-phase',
    'lifting',
  );
  await page.getByRole('button', { name: 'Предыдущая фаза' }).click();
  await expect(page.locator('[data-current-phase]')).toHaveAttribute(
    'data-current-phase',
    'bucket-filling',
  );
  await page.getByRole('button', { name: '0.5×', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '0.5×', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Ковш', exact: true }).click();
  await page.getByRole('button', { name: 'Скрыть выбранный' }).click();
  await page.getByRole('button', { name: 'Воспроизвести' }).click();
  await expect(page.locator('[data-current-phase]')).toHaveAttribute(
    'data-current-phase',
    'bucket-filling',
  );
  await expect
    .poll(async () =>
      Number(
        await page
          .locator('[data-visual-time]')
          .getAttribute('data-visual-time'),
      ),
    )
    .toBeGreaterThan(0);
  await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  await expect(page.locator('[data-pose]')).toHaveAttribute(
    'data-pose',
    'paused',
  );
  const frozen = await page
    .locator('[data-visual-time]')
    .getAttribute('data-visual-time');
  await page.waitForTimeout(250);
  await expect(page.locator('[data-visual-time]')).toHaveAttribute(
    'data-visual-time',
    frozen!,
  );
  await page
    .getByRole('button', { name: 'Сбросить в нейтральную позу' })
    .click();
  await expect(page.locator('[data-pose]')).toHaveAttribute(
    'data-pose',
    'neutral',
  );
  await expect(page.locator('[data-current-phase]')).toHaveAttribute(
    'data-current-phase',
    'none',
  );
  await expect(page.getByText('Скрыто компонентов: 1')).toBeVisible();
  await phases.getByRole('button', { name: '1. Разработка грунта' }).click();
  await expect(page.locator('[data-pose]')).toHaveAttribute(
    'data-pose',
    'paused',
  );
  await expect(page.locator('[data-current-phase]')).toHaveAttribute(
    'data-current-phase',
    'excavation',
  );
  await expect(
    page.getByText(/Шкала показывает визуальное время учебной/),
  ).toBeVisible();
  // Actual playback crosses the approved return boundary and wraps to the first
  // positive filling interval; no per-phase equal-time inference is involved.
  await phases.getByRole('button', { name: '5. Разгрузка' }).click();
  await page.getByRole('button', { name: '2×', exact: true }).click();
  await page.getByRole('button', { name: 'Воспроизвести' }).click();
  await expect(page.locator('[data-current-phase]')).toHaveAttribute(
    'data-current-phase',
    'return',
  );
  await expect(page.locator('[data-current-phase]')).toHaveAttribute(
    'data-current-phase',
    'bucket-filling',
  );
  await page.getByRole('button', { name: 'Пауза', exact: true }).click();
  expect(errors).toEqual([]);
});

test('S2 direct load, reload, semantic process return and narrow layout', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(
    '/machines/excavator/working-cycle?fromProcess=excavation-haul&fromStage=excavation-stage',
  );
  await page.reload();
  await expect(page.locator('[data-viewer-state]')).toHaveAttribute(
    'data-viewer-state',
    'ready',
  );
  await expect(
    page.getByRole('link', { name: /Назад к этапу/ }),
  ).toHaveAttribute(
    'href',
    '/processes/excavation-haul?stageId=excavation-stage',
  );
  await page
    .getByRole('button', { name: '6. Обратный поворот и возврат' })
    .click();
  await expect(
    page.getByRole('article', { name: 'Объяснение фазы' }),
  ).toContainText(
    'Сначала поворотная платформа возвращает поднятое рабочее оборудование',
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await expect(page.locator('[data-pose]')).toHaveAttribute(
    'data-pose',
    'neutral',
  );
  await page.getByRole('link', { name: /Назад к этапу/ }).click();
  await expect(page).toHaveURL(/stageId=excavation-stage/);
});
