// @vitest-environment jsdom
import '../test/setup';
import { useEffect } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import pack from '../../content/learning/working-cycle.json';
import { App } from './App';
import type {
  ViewerCommand,
  ViewerLoadState,
  ViewerAnimationState,
  VisualProgress,
} from '../visualization/contracts';
const sent = vi.hoisted(() => [] as ViewerCommand[]);
vi.mock('../visualization/ProductionViewer', () => ({
  default: function Mock({
    command,
    onLoad,
    onAnimation,
    onProgress,
  }: {
    command: ViewerCommand;
    onLoad: (s: ViewerLoadState) => void;
    onAnimation: (s: ViewerAnimationState) => void;
    onProgress: (s: VisualProgress) => void;
  }) {
    useEffect(() => {
      onLoad({ status: 'ready' });
    }, [onLoad]);
    useEffect(() => {
      sent.push(command);
      onAnimation({
        status: 'available',
        playback: command.kind === 'play' ? 'playing' : 'paused',
      });
      if (command.kind !== 'set-playback-rate')
        onProgress({
          pose:
            command.kind === 'reset'
              ? 'neutral'
              : command.kind === 'play'
                ? 'playing'
                : 'paused',
          timeSeconds: command.kind === 'seek' ? command.timeSeconds : 0,
          durationSeconds: 11.666666984558105,
        });
    }, [command, onAnimation, onProgress]);
    return <p>Тестовый renderer</p>;
  },
}));
function open() {
  return render(
    <MemoryRouter initialEntries={['/machines/excavator/working-cycle']}>
      <App />
    </MemoryRouter>,
  );
}
describe('S2 accessible working cycle', () => {
  it('offers six phases in order, approved explanations and canonical names, intentional shared zero and bounded navigation', async () => {
    const user = userEvent.setup();
    open();
    await screen.findByText('Тестовый renderer');
    const list = screen.getByRole('list', { name: 'Порядок учебных фаз' });
    expect(
      within(list)
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(pack.phases.map((p) => `${p.order}. ${p.name}`));
    for (const phase of pack.phases) {
      await user.click(
        within(list).getByRole('button', {
          name: `${phase.order}. ${phase.name}`,
        }),
      );
      const explanation = screen.getByRole('article', {
        name: 'Объяснение фазы',
      });
      expect(explanation).toHaveTextContent(phase.goal);
      expect(explanation).toHaveTextContent(phase.movement);
      expect(explanation).toHaveTextContent('Ковш');
      expect(
        screen.getByText(`Текущая учебная фаза: ${phase.name}`),
      ).toBeInTheDocument();
      expect(sent.at(-1)).toMatchObject({
        kind: 'seek',
        timeSeconds: pack.visual.segments[phase.order - 1]!.startSeconds,
      });
      expect(
        within(list).getByRole('button', {
          name: `${phase.order}. ${phase.name}`,
        }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(
        screen
          .getByRole('button', { name: 'Предыдущая фаза' })
          .hasAttribute('disabled'),
      ).toBe(phase.order === 1);
      expect(
        screen
          .getByRole('button', { name: 'Следующая фаза' })
          .hasAttribute('disabled'),
      ).toBe(phase.order === 6);
    }
    await user.click(screen.getByRole('button', { name: 'Предыдущая фаза' }));
    expect(
      screen.getByText('Текущая учебная фаза: Разгрузка'),
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Следующая фаза' }));
    expect(
      screen.getByText('Текущая учебная фаза: Обратный поворот и возврат'),
    ).toBeInTheDocument();
    expect(screen.getByText(pack.timingNotice)).toBeInTheDocument();
    expect(screen.getByText(pack.overlapNotice)).toBeInTheDocument();
  });
  it('keeps rates visual-only, distinguishes clip zero from neutral and coexists with selection/visibility', async () => {
    const user = userEvent.setup();
    open();
    await screen.findByText('Тестовый renderer');
    expect(
      screen.getByText(/Нейтральная поза — вне клипа/),
    ).toBeInTheDocument();
    const rates = screen.getByRole('group', {
      name: 'Визуальная скорость воспроизведения',
    });
    for (const rate of [0.5, 1, 2]) {
      await user.click(within(rates).getByRole('button', { name: `${rate}×` }));
      expect(sent.at(-1)).toMatchObject({ kind: 'set-playback-rate', rate });
      expect(
        within(rates).getByRole('button', { name: `${rate}×` }),
      ).toHaveAttribute('aria-pressed', 'true');
      expect(
        screen.getByText(/Нейтральная поза — вне клипа/),
      ).toBeInTheDocument();
    }
    await user.click(screen.getByRole('button', { name: 'Ковш' }));
    await user.click(screen.getByRole('button', { name: 'Скрыть выбранный' }));
    await user.click(
      screen.getByRole('button', { name: '2. Заполнение ковша' }),
    );
    expect(
      screen.getByText('Текущая учебная фаза: Заполнение ковша'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/Нейтральная поза — вне клипа/),
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Сбросить в нейтральную позу' }),
    );
    expect(
      screen.getByText(/Нейтральная поза — вне клипа/),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Текущая учебная фаза: не выбрана'),
    ).toBeInTheDocument();
    expect(screen.getByText('Скрыто компонентов: 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ковш' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await user.click(
      screen.getByRole('button', { name: '1. Разработка грунта' }),
    );
    expect(sent.at(-1)).toMatchObject({ kind: 'seek', timeSeconds: 0 });
    expect(
      screen.getByText('Текущая учебная фаза: Разработка грунта'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Воспроизвести' })).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Изолировать выбранный' }),
    ).toBeEnabled();
  });
});
