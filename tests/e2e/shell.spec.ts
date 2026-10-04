import { expect, test } from '@playwright/test';
const processName =
  'Разработка грунта с погрузкой в автосамосвалы и транспортированием';
test('Home → Machines → Excavator → Where used → process', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const main = page.getByRole('main');
  const entry = main.getByRole('link', { name: /Машины/ });
  await entry.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/machines');
  await expect(main).toBeFocused();
  await expect(main.getByRole('link', { name: 'Автосамосвал' })).toBeVisible();
  await main.getByRole('link', { name: 'Гидравлический экскаватор' }).click();
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Гидравлический экскаватор',
  );
  await expect(
    main.getByRole('heading', { name: 'Ковш', exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/machine-overview.png',
    fullPage: true,
  });
  await page
    .getByRole('region', { name: 'Где применяется' })
    .getByRole('link', { name: processName })
    .click();
  await expect(page).toHaveURL(
    '/processes/excavation-haul?fromMachine=excavator',
  );
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(processName);
  expect(errors).toEqual([]);
});

test('process detour preserves context across machine sections and exact return/reload', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page
    .getByRole('main')
    .getByRole('link', { name: /Процессы/ })
    .click();
  await page.getByRole('main').getByRole('link', { name: processName }).click();
  const stage = page.getByRole('link', {
    name: 'Разработка грунта',
    exact: true,
  });
  await stage.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(
    '/processes/excavation-haul?stageId=excavation-stage',
  );
  await expect(stage).toHaveAttribute('aria-current', 'step');
  const detail = page.getByRole('region', { name: 'Этап: Разработка грунта' });
  await expect(
    detail.getByRole('heading', { name: 'Гидравлический экскаватор' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/process-stage.png',
    fullPage: true,
  });
  await detail
    .getByRole('heading', { name: 'Гидравлический экскаватор', exact: true })
    .click();
  await detail.getByRole('link', { name: /Изучить машину/ }).click();
  await expect(page).toHaveURL(
    '/machines/excavator?fromProcess=excavation-haul&fromStage=excavation-stage',
  );
  await page
    .getByRole('navigation', { name: 'Разделы машины' })
    .getByRole('link', { name: 'Где применяется' })
    .click();
  await expect(page).toHaveURL(
    '/machines/excavator/applications?fromProcess=excavation-haul&fromStage=excavation-stage',
  );
  await page.reload();
  await page
    .getByRole('link', { name: /Назад к этапу «Разработка грунта»/ })
    .click();
  await expect(page).toHaveURL(
    '/processes/excavation-haul?stageId=excavation-stage',
  );
  await expect(stage).toHaveAttribute('aria-current', 'step');
  await expect(detail).toBeVisible();
  await page.reload();
  await expect(stage).toHaveAttribute('aria-current', 'step');
  expect(errors).toEqual([]);
});

test('browser Back keeps its ordinary history behavior during a machine detour', async ({
  page,
}) => {
  await page.goto('/processes/excavation-haul?stageId=excavation-stage');
  await page
    .getByRole('region', { name: /^Этап:/ })
    .getByRole('heading', { name: 'Гидравлический экскаватор', exact: true })
    .click();
  await page.getByRole('link', { name: /Изучить машину/ }).click();
  await page
    .getByRole('navigation', { name: 'Разделы машины' })
    .getByRole('link', { name: 'Где применяется' })
    .click();
  await page.goBack();
  await expect(page).toHaveURL(
    '/machines/excavator?fromProcess=excavation-haul&fromStage=excavation-stage',
  );
  await page.goBack();
  await expect(page).toHaveURL(
    '/processes/excavation-haul?stageId=excavation-stage',
  );
  await expect(
    page.getByRole('region', { name: 'Этап: Разработка грунта' }),
  ).toBeVisible();
});

test('narrow screens remain readable; invalid stages and entities recover', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/processes/excavation-haul?stageId=excavation-stage');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/process-narrow.png',
    fullPage: true,
  });
  await page.goto('/processes/excavation-haul?stageId=missing');
  await expect(page.getByRole('alert')).toContainText('Этап не найден');
  for (const name of [
    'Разработка грунта',
    'Погрузка',
    'Транспортирование',
    'Разгрузка',
  ]) {
    await expect(
      page.getByRole('link', { name, exact: true }),
    ).not.toHaveAttribute('aria-current', 'step');
  }
  await page.getByRole('link', { name: 'К обзору процесса' }).click();
  await expect(page).toHaveURL('/processes/excavation-haul');
  await page.goto(
    '/machines/excavator?fromProcess=excavation-haul&fromStage=haul-stage',
  );
  await expect(page.getByRole('link', { name: /Назад к этапу/ })).toHaveCount(
    0,
  );
  await expect(page.getByRole('alert')).toContainText(
    'Контекст возврата некорректен',
  );
  await page.goto('/processes/example?stageId=example-stage');
  await expect(
    page.getByRole('heading', { name: 'Процесс не найден' }),
  ).toBeVisible();
  await page.goto('/does-not-exist');
  await expect(
    page.getByRole('heading', { name: 'Страница не найдена' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'На главную' }).click();
  await expect(page).toHaveURL('/');
});
