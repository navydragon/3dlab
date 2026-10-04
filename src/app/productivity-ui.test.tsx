// @vitest-environment jsdom
import '../test/setup';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import records from '../../content/learning/productivity.json';
import { App } from './App';
const pack = records[0]!;
function open(path = '/machines/excavator/productivity') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
const input = () => screen.getByRole('spinbutton');
const comparison = () =>
  screen.queryByRole('table', {
    name: 'Исходное и после изменения одного параметра',
  });
describe('S3 parameters and standalone learning UI', () => {
  it('derives seven ordered sections from capability, approved definitions/source values and no truck deep module', async () => {
    const user = userEvent.setup();
    const view = open('/machines/excavator/parameters');
    expect(
      within(screen.getByRole('navigation', { name: 'Разделы машины' }))
        .getAllByRole('link')
        .map((l) => l.textContent),
    ).toEqual([
      'Обзор',
      'Конструкция',
      'Как работает',
      'Рабочий цикл',
      'Параметры',
      'Производительность',
      'Где применяется',
    ]);
    for (const p of pack.parameters) {
      expect(screen.getByText(p.definition)).toBeInTheDocument();
      expect(screen.getByText(p.causalExplanation)).toBeInTheDocument();
      expect(screen.getByText(`${p.symbol} — ${p.unit}`)).toBeInTheDocument();
    }
    expect(screen.getByText(pack.parameters[2]!.notes[0]!)).toBeInTheDocument();
    expect(screen.getByText(pack.illustrativeNotice)).toBeInTheDocument();
    expect(screen.getByText('1,200 м³ (рыхл.)')).toBeInTheDocument();
    expect(screen.getByText('24,000 с')).toBeInTheDocument();
    await user.click(
      screen.getByRole('link', {
        name: 'Перейти к эксперименту с производительностью',
      }),
    );
    expect(
      screen.getByRole('region', { name: 'Исходный расчёт' }),
    ).toHaveTextContent('134,460 м³/ч');
    view.unmount();
    open('/machines/dump-truck');
    expect(
      screen.queryByRole('link', { name: 'Параметры' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Производительность' }),
    ).not.toBeInTheDocument();
  });
  it('uses one editable factor, explicit prediction/calculation, stale comparison, source switch/reset and actual causes', async () => {
    const user = userEvent.setup();
    open();
    expect(screen.getAllByRole('spinbutton')).toHaveLength(1);
    const factors = screen.getByRole('group', {
      name: 'Выберите один параметр',
    });
    expect(within(factors).getAllByRole('radio')).toHaveLength(4);
    await user.click(
      within(factors).getByRole('radio', {
        name: 'Продолжительность рабочего цикла',
      }),
    );
    await user.clear(input());
    await user.type(input(), '30');
    expect(comparison()).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Рассчитать' })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: 'Уменьшится' }));
    await user.click(screen.getByRole('button', { name: 'Рассчитать' }));
    expect(comparison()).toHaveTextContent('120,000');
    expect(comparison()).toHaveTextContent('129,600');
    expect(comparison()).toHaveTextContent('107,568');
    expect(
      screen.getByRole('region', { name: 'Причина изменения' }),
    ).toHaveTextContent('Число циклов за условные 60 минут: уменьшилось');
    await user.clear(input());
    await user.type(input(), '28');
    expect(
      screen.getByText(/Предыдущий результат устарел/),
    ).toBeInTheDocument();
    expect(comparison()).not.toBeInTheDocument();
    await user.click(
      within(factors).getByRole('radio', { name: 'Вместимость ковша' }),
    );
    expect(input()).toHaveValue(1.2);
    expect(
      screen.queryByText(/Предыдущий результат устарел/),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Уменьшится' })).not.toBeChecked();
    await user.clear(input());
    await user.type(input(), '1.5');
    await user.click(screen.getByRole('radio', { name: 'Увеличится' }));
    await user.click(screen.getByRole('button', { name: 'Рассчитать' }));
    expect(comparison()).toHaveTextContent('168,075');
    await user.click(
      screen.getByRole('button', { name: 'Вернуть исходное значение' }),
    );
    expect(input()).toHaveValue(1.2);
    expect(comparison()).not.toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: pack.explanationPrompt }),
    ).toBeInTheDocument();
    expect(screen.getByText(pack.machineVsSystem)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /К производственной системе/ }),
    ).toHaveAttribute('href', '/systems/excavator-haul-system');
  });
  it('has no sliders/practical limits; accepts fill >1 and errors on utilization >1 and empty/zero', async () => {
    const user = userEvent.setup();
    open();
    expect(screen.queryByRole('slider')).not.toBeInTheDocument();
    expect(input()).toHaveAttribute('step', 'any');
    expect(input()).not.toHaveAttribute('min');
    expect(input()).not.toHaveAttribute('max');
    await user.click(
      screen.getByRole('radio', { name: 'Продолжительность рабочего цикла' }),
    );
    expect(input()).not.toHaveAttribute('max');
    await user.click(
      screen.getByRole('radio', {
        name: 'Коэффициент наполнения',
      }),
    );
    expect(input()).not.toHaveAttribute('max');
    await user.clear(input());
    await user.type(input(), '1.2');
    await user.click(screen.getByRole('radio', { name: 'Увеличится' }));
    await user.click(screen.getByRole('button', { name: 'Рассчитать' }));
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(comparison()).toBeInTheDocument();
    await user.click(
      screen.getByRole('radio', {
        name: 'Коэффициент использования рабочего времени',
      }),
    );
    expect(input()).toHaveAttribute('max', '1');
    await user.clear(input());
    await user.type(input(), '1.2');
    await user.click(screen.getByRole('radio', { name: 'Увеличится' }));
    await user.click(screen.getByRole('button', { name: 'Рассчитать' }));
    expect(screen.getByRole('alert')).toHaveTextContent('out_of_range');
    expect(input()).toHaveAttribute('aria-invalid', 'true');
    expect(input()).toHaveAttribute('aria-describedby', 'machine-input-error');
    await user.clear(input());
    await user.click(screen.getByRole('radio', { name: 'Не изменится' }));
    await user.click(screen.getByRole('button', { name: 'Рассчитать' }));
    expect(screen.getByRole('alert')).toHaveTextContent('required_number');
    expect(input()).toHaveValue(null);
    await user.type(input(), '0');
    await user.click(screen.getByRole('radio', { name: 'Не изменится' }));
    await user.click(screen.getByRole('button', { name: 'Рассчитать' }));
    expect(screen.getByRole('alert')).toHaveTextContent('out_of_range');
    expect(input()).toHaveValue(0);
  });
  it('does not invent sections when validated productivity content is unavailable', () => {
    render(
      <MemoryRouter initialEntries={['/machines/excavator']}>
        <App
          productivity={{
            learning: { status: 'invalid', issues: [] },
            scenarios: null,
          }}
        />
      </MemoryRouter>,
    );
    expect(
      screen.queryByRole('link', { name: 'Параметры' }),
    ).not.toBeInTheDocument();
  });
});
