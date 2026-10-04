import { expect, test } from '@playwright/test';
test('S3 Flow E: parameters → one-factor standalone productivity, stale/reset and utilization', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('main')
    .getByRole('link', { name: /Машины/ })
    .click();
  await page
    .getByRole('link', { name: 'Гидравлический экскаватор', exact: true })
    .click();
  await page.getByRole('link', { name: 'Параметры', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Вместимость ковша', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Коэффициент наполнения', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Продолжительность рабочего цикла',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', {
      name: 'Коэффициент использования рабочего времени',
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/Расчётное время рабочего цикла не определяется/),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Перейти к эксперименту с производительностью' })
    .click();
  await expect(
    page.getByRole('region', { name: 'Исходный расчёт' }),
  ).toContainText('134,460 м³/ч');
  const factors = page.getByRole('group', { name: 'Выберите один параметр' });
  const input = page.getByRole('spinbutton');
  const calculate = page.getByRole('button', {
    name: 'Рассчитать',
    exact: true,
  });
  await factors
    .getByRole('radio', { name: 'Продолжительность рабочего цикла' })
    .check();
  await input.fill('30');
  await expect(page.getByRole('table')).toHaveCount(0);
  await page.getByRole('radio', { name: 'Уменьшится', exact: true }).check();
  await calculate.click();
  const table = page.getByRole('table', {
    name: 'Исходное и после изменения одного параметра',
  });
  await expect(
    table.getByRole('row').filter({ hasText: 'cycles_per_hour_60' }),
  ).toContainText('120,000');
  await expect(
    table.getByRole('row').filter({ hasText: 'Q_exc_60' }),
  ).toContainText('129,600');
  await expect(
    table.getByRole('row').filter({ hasText: '(Q_exc),' }),
  ).toContainText('107,568');
  await expect(
    page.getByRole('region', { name: 'Причина изменения' }),
  ).toContainText('Число циклов за условные 60 минут: уменьшилось');
  await input.fill('28');
  await expect(page.getByText(/Предыдущий результат устарел/)).toBeVisible();
  await expect(table).toHaveCount(0);
  await page.getByRole('button', { name: 'Вернуть исходное значение' }).click();
  await expect(input).toHaveValue('24');
  await factors
    .getByRole('radio', { name: 'Коэффициент использования рабочего времени' })
    .check();
  await input.fill('0.90');
  await page.getByRole('radio', { name: 'Увеличится', exact: true }).check();
  await calculate.click();
  await expect(
    table.getByRole('row').filter({ hasText: '(Q_exc),' }),
  ).toContainText('145,800');
  for (const name of [
    'Фактический объём материала за цикл',
    'Число циклов за условные 60 минут',
    'Теоретическая производительность',
  ])
    await expect(
      page.getByRole('region', { name: 'Причина изменения' }),
    ).toContainText(`${name}: не изменилось`);
  await expect(
    page.getByRole('link', { name: /К производственной системе/ }),
  ).toHaveAttribute('href', '/systems/excavator-haul-system');
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.reload();
  await expect(page.getByRole('spinbutton')).toHaveValue('1.2');
  await expect(page.getByRole('table')).toHaveCount(0);
});
test('S3 process detour preserves source stage through parameters/productivity/cycle/applications', async ({
  page,
}) => {
  await page.goto('/processes/excavation-haul?stageId=excavation-stage');
  const region = page.getByRole('region', { name: 'Этап: Разработка грунта' });
  await region
    .getByRole('heading', { name: 'Гидравлический экскаватор', exact: true })
    .click();
  await region.getByRole('link', { name: /Изучить машину/ }).click();
  for (const name of [
    'Параметры',
    'Производительность',
    'Рабочий цикл',
    'Где применяется',
  ]) {
    await page
      .getByRole('navigation', { name: 'Разделы машины' })
      .getByRole('link', { name, exact: true })
      .click();
    await expect(page).toHaveURL(
      /fromProcess=excavation-haul&fromStage=excavation-stage/,
    );
    await page.reload();
    await expect(
      page.getByRole('link', { name: /Назад к этапу/ }),
    ).toHaveAttribute(
      'href',
      '/processes/excavation-haul?stageId=excavation-stage',
    );
  }
  await page.getByRole('link', { name: /Назад к этапу/ }).click();
  await expect(page).toHaveURL(
    '/processes/excavation-haul?stageId=excavation-stage',
  );
  await expect(
    page.getByRole('region', { name: 'Этап: Разработка грунта' }),
  ).toBeVisible();
});
