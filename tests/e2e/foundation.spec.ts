import { expect, test } from '@playwright/test';
import pack from '../../content/learning/foundation.json' with { type: 'json' };
const processName =
  'Разработка грунта с погрузкой в автосамосвалы и транспортированием';
test('S1 machine learning → trusted process origin → stage/reload → machine applications', async ({
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
    .getByRole('main')
    .getByRole('link', { name: 'Гидравлический экскаватор', exact: true })
    .click();
  await expect(
    page.getByText(pack.machines[0]!.overview.purpose),
  ).toBeVisible();
  const sections = page.getByRole('navigation', { name: 'Разделы машины' });
  await sections
    .getByRole('link', { name: 'Конструкция', exact: true })
    .click();
  await page.getByRole('button', { name: 'Ковш', exact: true }).click();
  await expect(
    page.getByRole('article', { name: 'Выбранный компонент' }),
  ).toContainText(
    pack.components.find((c) => c.componentId === 'bucket')!.explanation,
  );
  await sections
    .getByRole('link', { name: 'Как работает', exact: true })
    .click();
  await expect(
    page
      .getByRole('region', { name: 'Как работает' })
      .getByText(pack.machines[0]!.workingPrinciple!.paragraphs[0]!),
  ).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Хлебные крошки' })
      .getByText('Как работает'),
  ).toHaveAttribute('aria-current', 'page');
  await page.screenshot({
    path: 'test-results/s1-working-principle.png',
    fullPage: true,
  });
  await sections
    .getByRole('link', { name: 'Где применяется', exact: true })
    .click();
  await page
    .getByRole('region', { name: 'Где применяется' })
    .getByRole('link', { name: processName, exact: true })
    .click();
  await expect(page).toHaveURL(
    '/processes/excavation-haul?fromMachine=excavator',
  );
  await expect(
    page.getByText('Вы пришли из модуля «Гидравлический экскаватор».', {
      exact: false,
    }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'Разработка грунта', exact: true })
    .click();
  await expect(page).toHaveURL(
    '/processes/excavation-haul?stageId=excavation-stage&fromMachine=excavator',
  );
  await page.reload();
  await expect(
    page.getByRole('link', { name: 'Вернуться к машине' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'К обзору процесса' }).click();
  await expect(page).toHaveURL(
    '/processes/excavation-haul?fromMachine=excavator',
  );
  await page.goBack();
  await expect(page).toHaveURL(
    '/processes/excavation-haul?stageId=excavation-stage&fromMachine=excavator',
  );
  await page.getByRole('link', { name: 'Вернуться к машине' }).click();
  await expect(page).toHaveURL('/machines/excavator/applications');
  expect(errors).toEqual([]);
});
test('S1 process learning disclosure opens/closes without leaving stage and preserves module return', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('main')
    .getByRole('link', { name: /Процессы/ })
    .click();
  await page
    .getByRole('main')
    .getByRole('link', { name: processName, exact: true })
    .click();
  await page
    .getByRole('link', { name: 'Разработка грунта', exact: true })
    .click();
  const region = page.getByRole('region', { name: 'Этап: Разработка грунта' });
  const stage = pack.stages[0]!;
  for (const key of ['goal', 'input', 'activity', 'result', 'handoff'] as const)
    await expect(region.getByText(stage[key])).toBeVisible();
  const heading = region.getByRole('heading', {
    name: 'Гидравлический экскаватор',
    exact: true,
  });
  const action = region.getByRole('link', { name: /Изучить машину/ });
  await expect(heading).toBeVisible();
  await expect(action).not.toBeVisible();
  await heading.click();
  await expect(region.getByText(stage.participantNotes[0]!.note)).toBeVisible();
  await expect(action).toBeVisible();
  await heading.click();
  await expect(action).not.toBeVisible();
  await expect(page).toHaveURL(
    '/processes/excavation-haul?stageId=excavation-stage',
  );
  await heading.click();
  await action.click();
  await page
    .getByRole('navigation', { name: 'Разделы машины' })
    .getByRole('link', { name: 'Как работает' })
    .click();
  await page.getByRole('link', { name: /Назад к этапу/ }).click();
  await expect(page).toHaveURL(
    '/processes/excavation-haul?stageId=excavation-stage',
  );
  await expect(region.getByText(stage.goal)).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: 'test-results/s1-process-narrow.png',
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
test('S1 shallow truck teaching → canonical haul stage with truck origin', async ({
  page,
}) => {
  await page.goto('/');
  await page
    .getByRole('main')
    .getByRole('link', { name: /Машины/ })
    .click();
  await page
    .getByRole('main')
    .getByRole('link', { name: 'Автосамосвал', exact: true })
    .click();
  await expect(
    page.getByText(pack.machines[1]!.overview.purpose),
  ).toBeVisible();
  const cycle = page.getByRole('region', { name: 'Транспортный цикл' });
  for (const f of pack.machines[1]!.transportCycle!.factors)
    await expect(cycle.getByText(f.explanation)).toBeVisible();
  await expect(
    page
      .getByRole('navigation', { name: 'Разделы машины' })
      .getByRole('link', { name: 'Как работает' }),
  ).toHaveCount(0);
  await page
    .getByRole('region', { name: 'Где применяется' })
    .getByRole('link', { name: 'Транспортирование', exact: true })
    .click();
  await expect(page).toHaveURL(
    '/processes/excavation-haul?stageId=haul-stage&fromMachine=dump-truck',
  );
  const stage = page.getByRole('region', { name: 'Этап: Транспортирование' });
  await stage
    .getByRole('heading', { name: 'Автосамосвал', exact: true })
    .click();
  await expect(
    stage.getByText(pack.stages[2]!.participantNotes[0]!.note),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Вернуться к машине' }).click();
  await expect(page).toHaveURL('/machines/dump-truck/applications');
});
