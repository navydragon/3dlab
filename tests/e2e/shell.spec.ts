import { expect, test } from '@playwright/test';

test('Home → Machines works using keyboard navigation on the production build', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText(
    'Машины и механизированные процессы',
  );
  const link = page.getByRole('main').getByRole('link', { name: /Машины/ });
  await link.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/machines');
  await expect(
    page.getByRole('heading', { name: 'Машины', exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('main')).toBeFocused();
  await expect(
    page.getByText(/Проверенный контент ещё не подключён/),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('direct process URL and reload preserve routing test IDs', async ({
  page,
}) => {
  // Routing test IDs only: these are not domain/content records.
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/processes/example?stageId=example-stage');
  await expect(
    page.getByRole('heading', { name: 'Процесс', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('example', { exact: true })).toBeVisible();
  await expect(page.getByText('example-stage', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByText('example-stage', { exact: true })).toBeVisible();
  await expect(
    page.getByText(/Наличие адреса не подтверждает наличие сущности/),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test('narrow-screen shell remains readable and unknown routes recover', async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('/');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await expect(
    page.getByRole('main').getByRole('link', { name: /Процессы/ }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/shell-narrow.png',
    fullPage: true,
  });
  await page.goto('/does-not-exist');
  await expect(
    page.getByRole('heading', { name: 'Страница не найдена' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'На главную' }).click();
  await expect(page).toHaveURL('/');
});
