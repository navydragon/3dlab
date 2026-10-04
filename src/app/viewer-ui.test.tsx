// @vitest-environment jsdom
import '../test/setup';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
vi.mock('../visualization/ProductionViewer', () => ({
  default: () => (
    <p role="status">WebGL недоступен. Текстовый список доступен.</p>
  ),
}));
function open(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
describe('asset-backed machine sections and accessible fallback', () => {
  it('keeps section links under a configured router base', () => {
    render(
      <MemoryRouter
        basename="/laboratory"
        initialEntries={['/laboratory/machines/excavator']}
      >
        <App />
      </MemoryRouter>,
    );
    expect(screen.getByRole('link', { name: 'Конструкция' })).toHaveAttribute(
      'href',
      '/laboratory/machines/excavator/construction',
    );
  });
  it('derives sections from production asset availability', () => {
    const view = open('/machines/excavator');
    expect(
      screen.getByRole('link', { name: 'Конструкция' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Рабочий цикл' }),
    ).toBeInTheDocument();
    view.unmount();
    open('/machines/dump-truck');
    expect(
      screen.queryByRole('link', { name: 'Конструкция' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Рабочий цикл' }),
    ).not.toBeInTheDocument();
  });
  it('preserves return context, displays canonical bucket information and keeps text selection usable on 3D failure', async () => {
    const user = userEvent.setup();
    open(
      '/machines/excavator/construction?fromProcess=excavation-haul&fromStage=excavation-stage',
    );
    await screen.findByText(/WebGL недоступен/);
    await user.click(screen.getByRole('button', { name: 'Ковш' }));
    expect(screen.getByRole('button', { name: 'Ковш' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    const details = screen.getByRole('article', {
      name: 'Выбранный компонент',
    });
    expect(
      within(details).getByRole('heading', { name: 'Ковш' }),
    ).toBeInTheDocument();
    expect(details).toHaveTextContent(
      'Ковш непосредственно взаимодействует с грунтом.',
    );
    expect(screen.getByRole('link', { name: 'Рабочий цикл' })).toHaveAttribute(
      'href',
      '/machines/excavator/working-cycle?fromProcess=excavation-haul&fromStage=excavation-stage',
    );
    await user.click(screen.getByRole('link', { name: 'Рабочий цикл' }));
    expect(screen.getByRole('link', { name: /Назад к этапу/ })).toHaveAttribute(
      'href',
      '/processes/excavation-haul?stageId=excavation-stage',
    );
    expect(
      screen.getByRole('button', { name: 'Воспроизвести' }),
    ).toBeDisabled();
  });
});
