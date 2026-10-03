// @vitest-environment jsdom
import '../test/setup';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from './App';

function open(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('application shell', () => {
  it('renders a semantic home with two equal entry links and no production-task feature', () => {
    open();
    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { level: 1 })).toHaveTextContent(
      'Машины и механизированные процессы',
    );
    expect(within(main).getByRole('link', { name: /Машины/ })).toHaveAttribute(
      'href',
      '/machines',
    );
    expect(
      within(main).getByRole('link', { name: /Процессы/ }),
    ).toHaveAttribute('href', '/processes');
    expect(
      screen.getByRole('navigation', { name: 'Основная навигация' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'К содержимому' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(
      screen.queryByRole('link', { name: /Производственная задача/ }),
    ).not.toBeInTheDocument();
  });

  it('supports keyboard navigation to Machines and focuses the new page landmark', async () => {
    const user = userEvent.setup();
    open();
    const link = within(screen.getByRole('main')).getByRole('link', {
      name: /Машины/,
    });
    link.focus();
    await user.keyboard('{Enter}');
    expect(
      screen.getByRole('heading', { name: 'Машины', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveFocus();
    expect(
      screen.getByRole('navigation').querySelector('[aria-current="page"]'),
    ).toHaveTextContent('Машины');
    expect(screen.getByText(/Каталог появится/)).toBeInTheDocument();
  });

  it('provides the Processes entry without a fabricated process', async () => {
    open();
    await userEvent.setup().click(
      within(screen.getByRole('main')).getByRole('link', {
        name: /Процессы/,
      }),
    );
    expect(
      screen.getByRole('heading', { name: 'Процессы', level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Проверенный контент ещё не подключён/),
    ).toBeInTheDocument();
  });

  it.each([
    '/machines/example-machine',
    '/machines/example-machine/example-section',
  ])('reads route parameters without claiming content exists: %s', (path) => {
    open(path);
    expect(screen.getByText('example-machine')).toBeInTheDocument();
    if (path.endsWith('example-section'))
      expect(screen.getByText('example-section')).toBeInTheDocument();
    expect(
      screen.getByText(/Наличие адреса не подтверждает наличие сущности/),
    ).toBeInTheDocument();
  });

  it('reads process stage selection from the URL', () => {
    open('/processes/example?stageId=example-stage');
    expect(
      screen.getByRole('heading', { name: 'Процесс' }),
    ).toBeInTheDocument();
    expect(screen.getByText('example')).toBeInTheDocument();
    expect(screen.getByText('example-stage')).toBeInTheDocument();
  });

  it('reports malformed optional context without losing the machine shell', () => {
    open('/machines/example?fromProcess=example');
    expect(screen.getByRole('heading', { name: 'Машина' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Контекст возврата некорректен',
    );
  });

  it.each([
    '/machines/Invalid',
    '/machines/example/Invalid',
    '/processes/example?stageId=',
  ])('rejects invalid route structure: %s', (path) => {
    open(path);
    expect(
      screen.getByRole('heading', { name: 'Некорректный адрес' }),
    ).toBeInTheDocument();
  });

  it('shows a not-found page for an unknown application route', () => {
    open('/does-not-exist');
    expect(
      screen.getByRole('heading', { name: 'Страница не найдена' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'На главную' })).toHaveAttribute(
      'href',
      '/',
    );
  });
});
