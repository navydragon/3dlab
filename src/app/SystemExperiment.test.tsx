// @vitest-environment jsdom
import '../test/setup';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import type { ProductionSystemLoad } from '../content/production-system-repository';
import { localProductionSystems } from '../content/adapters/local/production-systems';
const systemName = 'Механизированный комплекс: экскаватор и автосамосвалы';
const overview = '/systems/excavator-haul-system';
const experiment = overview + '?scenario=base-earthworks-scenario';
function open(path = experiment, systems?: ProductionSystemLoad) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App {...(systems ? { systems } : {})} />
    </MemoryRouter>,
  );
}
function main() {
  return within(screen.getByRole('main'));
}
describe('production system UI', () => {
  it('supports keyboard stepper operation without inventing a maximum', async () => {
    const user = userEvent.setup();
    open();
    const plus = screen.getByRole('button', { name: /Увеличить количество/ });
    plus.focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('spinbutton')).toHaveValue(2);
    expect(plus).toHaveFocus();
    await user.tab({ shift: true });
    expect(screen.getByRole('spinbutton')).toHaveFocus();
    await user.clear(screen.getByRole('spinbutton'));
    await user.type(screen.getByRole('spinbutton'), '1000');
    await user.click(screen.getByRole('button', { name: 'Рассчитать' }));
    expect(
      screen.getByText('Рассчитано для 1000 автосамосвалов.'),
    ).toBeInTheDocument();
  });
  it('navigates Home/catalog/overview/explicit scenario with canonical content', async () => {
    const user = userEvent.setup();
    open('/');
    await user.click(
      main().getByRole('link', { name: /Производственная задача/ }),
    );
    expect(
      main().getByRole('heading', { name: 'Производственные системы' }),
    ).toBeInTheDocument();
    await user.click(main().getByRole('link', { name: systemName }));
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(
      main().getByRole('link', { name: 'Гидравлический экскаватор' }),
    ).toHaveAttribute('href', '/machines/excavator');
    await user.click(
      main().getByRole('link', { name: 'base-earthworks-scenario' }),
    );
    expect(
      screen.getByText('Иллюстративный учебный сценарий'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/не паспортные характеристики/),
    ).toBeInTheDocument();
    const count = screen.getByRole('spinbutton', {
      name: 'Количество автосамосвалов',
    });
    expect(count).toHaveValue(1);
    expect(count).toHaveAttribute('min', '1');
    expect(count).not.toHaveAttribute('max');
    expect(screen.getByRole('button', { name: /Уменьшить/ })).toBeDisabled();
    expect(
      screen.queryByRole('heading', { name: 'Результат расчёта' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Сохранить вариант' }),
    ).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Увеличить/ }));
    expect(count).toHaveValue(2);
    await user.click(screen.getByRole('button', { name: /Уменьшить/ }));
    expect(count).toHaveValue(1);
  });
  it('calculates N3/N4, marks stale, predicts direction, preserves A/B through reset, and clears explicitly', async () => {
    const user = userEvent.setup();
    open();
    const count = screen.getByRole('spinbutton');
    await user.clear(count);
    await user.type(count, '3');
    await user.click(screen.getByRole('button', { name: 'Рассчитать' }));
    expect(
      screen.getByRole('article', { name: 'Производительность комплекса' }),
    ).toHaveTextContent('123,22 м³ (рыхл.)/ч');
    expect(
      screen.getByRole('article', { name: 'Общие эксплуатационные затраты' }),
    ).toHaveTextContent('3165,16 CU');
    expect(
      Number(
        screen
          .getByRole('progressbar', { name: /Простой экскаватора/ })
          .getAttribute('value'),
      ),
    ).toBeCloseTo(0.0103092783505154, 14);
    expect(screen.getByText(/MF < 1/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Сохранить вариант' }));
    await user.click(screen.getByRole('button', { name: /Увеличить/ }));
    expect(screen.getByRole('status')).toHaveTextContent('рассчитайте заново');
    expect(
      screen.getByRole('button', { name: 'Сохранить вариант' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('article', { name: 'Производительность комплекса' }),
    ).toHaveTextContent('123,22');
    await user.selectOptions(
      screen.getByRole('combobox', {
        name: 'Как изменится производительность?',
      }),
      'increase',
    );
    await user.click(screen.getByRole('button', { name: 'Рассчитать' }));
    expect(screen.getByRole('status')).toHaveTextContent(
      'производительность увеличилась',
    );
    expect(screen.getByText(/MF ≥ 1/)).toBeInTheDocument();
    expect(screen.getByText(/ожидают в очереди/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Сохранить вариант' }));
    const table = within(screen.getByRole('table'));
    expect(
      table.getByRole('row', { name: 'Количество автосамосвалов 3 4 +1' }),
    ).toBeInTheDocument();
    expect(
      table.getByRole('row', { name: /Производительность комплекса/ }),
    ).toHaveTextContent('123,22 м³ (рыхл.)/ч124,50 м³ (рыхл.)/ч+1,28');
    expect(
      table.getByRole('row', { name: /Простой экскаватора/ }),
    ).toHaveTextContent('-1,0 п.п.');
    expect(
      table.getByRole('row', {
        name: 'Ожидание автосамосвала за цикл 0,00 мин 4,65 мин +4,65 мин',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Сохранить вариант' }),
    ).toBeDisabled();
    await user.type(
      screen.getByRole('textbox', {
        name: 'Какой вариант вы бы выбрали и почему?',
      }),
      'Зависит от цели',
    );
    await user.click(
      screen.getByRole('button', { name: 'Сбросить к источнику' }),
    );
    expect(count).toHaveValue(1);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('рассчитайте заново');
    expect(screen.getByRole('textbox')).toHaveValue('Зависит от цели');
    expect(
      screen.queryByText(/оптимальный|лучший вариант|рекомендуемый парк/i),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Очистить сравнение' }),
    );
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
  it('clears successful current result after invalid recalculation with accessible error', async () => {
    const user = userEvent.setup();
    open();
    await user.click(screen.getByRole('button', { name: 'Рассчитать' }));
    await user.clear(screen.getByRole('spinbutton'));
    await user.click(screen.getByRole('button', { name: 'Рассчитать' }));
    expect(screen.getByRole('alert')).toHaveTextContent(
      'конечное положительное целое',
    );
    expect(
      screen.queryByRole('heading', { name: 'Результат расчёта' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Сохранить вариант' }),
    ).toBeDisabled();
  });
  it.each(['?scenario=Bad_ID', '?scenario=a&scenario=a'])(
    'rejects malformed scenario %s without a baseline',
    (query) => {
      open(overview + query);
      expect(
        screen.getByRole('heading', { name: 'Некорректный адрес' }),
      ).toBeInTheDocument();
      expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    },
  );
  it('recovers from unavailable source through explicit selection', async () => {
    const user = userEvent.setup();
    open(overview + '?scenario=missing');
    expect(screen.getByRole('alert')).toHaveTextContent(
      'не найден или не поддерживается',
    );
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('link', { name: 'base-earthworks-scenario' }),
    );
    expect(screen.getByRole('spinbutton')).toHaveValue(1);
  });
  it('renders missing system recovery', () => {
    open('/systems/missing');
    expect(
      screen.getByRole('heading', { name: 'Комплекс не найден' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'К комплексам' })).toHaveAttribute(
      'href',
      '/systems',
    );
  });
  it('provides repository-derived process entry', () => {
    open('/processes/excavation-haul');
    expect(screen.getByRole('link', { name: systemName })).toHaveAttribute(
      'href',
      overview,
    );
  });
  it('isolates invalid systems configuration from process/machine content', async () => {
    const user = userEvent.setup();
    open('/systems', { status: 'invalid', issues: [] });
    expect(
      screen.getByRole('heading', { name: 'Комплексы недоступны' }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Процессы' }));
    await user.click(
      main().getByRole('link', {
        name: 'Разработка грунта с погрузкой в автосамосвалы и транспортированием',
      }),
    );
    expect(
      screen.queryByRole('link', { name: systemName }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('link', { name: 'Машины' }));
    await user.click(
      main().getByRole('link', { name: 'Гидравлический экскаватор' }),
    );
    expect(main().getByRole('heading', { level: 1 })).toHaveTextContent(
      'Гидравлический экскаватор',
    );
  });
  it('shows unsupported model explicitly instead of substituting one', () => {
    if (localProductionSystems.status !== 'valid')
      throw new Error('Fixture invalid');
    const repo = localProductionSystems.repository;
    const systems: ProductionSystemLoad = {
      status: 'valid',
      repository: {
        ...repo,
        get: (id) => {
          const system = repo.get(id);
          return system
            ? {
                ...system,
                simulationModelId:
                  'unsupported' as typeof system.simulationModelId,
              }
            : undefined;
        },
      },
    };
    open(experiment, systems);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Расчётная модель не поддерживается',
    );
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
  });
});
