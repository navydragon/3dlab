import { expect, test } from '@playwright/test';
const name = 'Механизированный комплекс: экскаватор и автосамосвалы';
const overview = '/systems/excavator-haul-system';
const url = overview + '?scenario=base-earthworks-scenario';
test('Acceptance Flow 5: Home → task → explicit scenario → N3/N4 → A/B', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await page.getByRole('link', { name: /Производственная задача/ }).click();
  await expect(page).toHaveURL('/systems');
  await page.getByRole('link', { name }).click();
  await expect(page).toHaveURL(overview);
  await expect(page.getByRole('spinbutton')).toHaveCount(0);
  await page.getByRole('link', { name: 'base-earthworks-scenario' }).click();
  await expect(page).toHaveURL(url);
  const count = page.getByRole('spinbutton', {
    name: 'Количество автосамосвалов',
  });
  await count.fill('3');
  await page.getByRole('button', { name: 'Рассчитать', exact: true }).click();
  await expect(
    page.getByRole('article', { name: 'Производительность комплекса' }),
  ).toContainText('123,22');
  await expect(
    page.getByRole('article', { name: 'Общие эксплуатационные затраты' }),
  ).toContainText('3165,16');
  await page.getByRole('button', { name: 'Сохранить вариант' }).click();
  await page.getByRole('button', { name: /Увеличить количество/ }).click();
  await expect(page.getByRole('status')).toContainText('рассчитайте заново');
  await expect(
    page.getByRole('button', { name: 'Сохранить вариант' }),
  ).toBeDisabled();
  await page.getByRole('combobox').selectOption('increase');
  await page.getByRole('button', { name: 'Рассчитать', exact: true }).click();
  await expect(
    page.getByRole('article', { name: 'Производительность комплекса' }),
  ).toContainText('124,50');
  await expect(
    page.getByRole('article', { name: 'Общие эксплуатационные затраты' }),
  ).toContainText('3694,78');
  await expect(
    page.getByRole('progressbar', { name: /Простой экскаватора/ }),
  ).toHaveAttribute('value', '0');
  await expect(
    page.getByRole('progressbar', { name: /Доля ожидания/ }),
  ).toHaveAccessibleName('Доля ожидания автосамосвала: 24,2 %');
  await page.getByRole('button', { name: 'Сохранить вариант' }).click();
  const table = page.getByRole('table');
  await expect(
    table.getByRole('row', { name: 'Количество автосамосвалов 3 4 +1' }),
  ).toBeVisible();
  await expect(
    table.getByRole('row', { name: /Производительность комплекса/ }),
  ).toContainText('123,22 м³ (рыхл.)/ч124,50 м³ (рыхл.)/ч+1,28');
  await expect(
    table.getByRole('row', { name: /Простой экскаватора/ }),
  ).toContainText('1,0 %0,0 %-1,0 п.п.');
  await expect(
    table.getByRole('row', { name: /Ожидание автосамосвала за цикл/ }),
  ).toContainText('0,00 мин4,65 мин+4,65 мин');
  await expect(
    table.getByRole('row', { name: /Общие эксплуатационные затраты/ }),
  ).toContainText('3165,16 CU3694,78 CU+529,62 CU');
  await expect(
    page.getByRole('button', { name: 'Сохранить вариант' }),
  ).toBeDisabled();
  await expect(
    page.getByText(/лучший вариант|оптимальный парк|рекомендуемый парк/i),
  ).toHaveCount(0);
  await page
    .getByRole('textbox', { name: 'Какой вариант вы бы выбрали и почему?' })
    .fill('Сопоставляю время и стоимость.');
  await page.screenshot({
    path: 'test-results/system-experiment-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(count).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/system-experiment-narrow.png',
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Сбросить к источнику' }).click();
  await expect(count).toHaveValue('1');
  await expect(table).toBeVisible();
  await page.getByRole('button', { name: 'Очистить сравнение' }).click();
  await expect(table).toHaveCount(0);
  expect(errors).toEqual([]);
});
test('process entry derives related system; direct source reload resets unsaved state', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('main')
    .getByRole('link', { name: /Процессы/ })
    .click();
  await page
    .getByRole('main')
    .getByRole('link', {
      name: 'Разработка грунта с погрузкой в автосамосвалы и транспортированием',
    })
    .click();
  await page.getByRole('link', { name }).click();
  await expect(page).toHaveURL(overview);
  await page.goto(url);
  const count = page.getByRole('spinbutton');
  await expect(count).toHaveValue('1');
  await count.fill('4');
  await page.getByRole('button', { name: 'Рассчитать', exact: true }).click();
  await page.getByRole('button', { name: 'Сохранить вариант' }).click();
  await page.reload();
  await expect(page).toHaveURL(url);
  await expect(count).toHaveValue('1');
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Результат расчёта' }),
  ).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Вариант A' })).toBeVisible();
});
test('invalid or unavailable source has explicit recovery and no fallback calculation', async ({
  page,
}) => {
  await page.goto(overview + '?scenario=a&scenario=a');
  await expect(
    page.getByRole('heading', { name: 'Некорректный адрес' }),
  ).toBeVisible();
  await expect(page.getByRole('spinbutton')).toHaveCount(0);
  await page.getByRole('link', { name: 'На главную' }).click();
  await expect(page).toHaveURL('/');
  await page.goto(overview + '?scenario=missing');
  await expect(page.getByRole('alert')).toContainText(
    'не найден или не поддерживается',
  );
  await expect(page.getByRole('spinbutton')).toHaveCount(0);
  await page.getByRole('link', { name: 'base-earthworks-scenario' }).click();
  await expect(page).toHaveURL(url);
  await page.getByRole('spinbutton').fill('0');
  await page.getByRole('button', { name: 'Рассчитать', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('положительное целое');
  await page.getByRole('spinbutton').fill('3');
  await page.getByRole('button', { name: 'Рассчитать', exact: true }).click();
  await expect(
    page.getByRole('article', { name: 'Производительность комплекса' }),
  ).toContainText('123,22');
});
