// @vitest-environment jsdom
import '../test/setup';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import pack from '../../content/learning/foundation.json';
import {
  loadLocalDomainRepository,
  localDomainContent,
} from '../content/adapters/local/repository';
import { createDomainRepository } from '../content/repository';
vi.mock('../visualization/ProductionViewer', () => ({
  default: () => <p>Test-only viewer fallback</p>,
}));
function open(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}
const crumbs = () =>
  within(screen.getByRole('navigation', { name: 'Хлебные крошки' }));
describe('S1 approved learning presentation', () => {
  it('shows approved overview and capability-driven sections for both machines', () => {
    const view = open('/machines/excavator');
    expect(
      screen.getByText(pack.machines[0]!.overview.purpose),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Как работает' })).toHaveAttribute(
      'href',
      '/machines/excavator/working-principle',
    );
    expect(crumbs().getByText('Гидравлический экскаватор')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      crumbs().queryByRole('link', { name: 'Гидравлический экскаватор' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Параметры' }),
    ).not.toBeInTheDocument();
    view.unmount();
    open('/machines/dump-truck');
    expect(
      screen.getByText(pack.machines[1]!.overview.purpose),
    ).toBeInTheDocument();
    expect(
      screen.getByText(pack.machines[1]!.transportCycle!.distanceExplanation),
    ).toBeInTheDocument();
    for (const f of pack.machines[1]!.transportCycle!.factors)
      expect(screen.getByText(f.explanation)).toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Как работает' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('link', { name: 'Конструкция' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/21900|128\.5|9625|XE215C/),
    ).not.toBeInTheDocument();
  });
  it('resolves all nine approved functions on accessible selection, including power unit', async () => {
    open('/machines/excavator/construction');
    const user = userEvent.setup();
    const domain = loadLocalDomainRepository();
    if (domain.status !== 'loaded') throw new Error('Invalid domain');
    const machine = domain.repository
      .listMachines()
      .find((m) => m.id === 'excavator')!;
    for (const c of domain.repository.getMachineComponents(machine.id)!) {
      await user.click(screen.getByRole('button', { name: c.name }));
      expect(
        screen.getByRole('article', { name: 'Выбранный компонент' }),
      ).toHaveTextContent(
        pack.components.find((r) => r.componentId === c.id)!.explanation,
      );
    }
  });
  it('shows the approved principle, functional grouping and semantic breadcrumb', () => {
    open('/machines/excavator/working-principle');
    const content = pack.machines[0]!.workingPrinciple!;
    const section = screen.getByRole('region', { name: 'Как работает' });
    for (const p of content.paragraphs)
      expect(within(section).getByText(p)).toBeInTheDocument();
    for (const item of content.chain)
      expect(
        within(section).getByText(item, { exact: true }),
      ).toBeInTheDocument();
    expect(crumbs().getByText('Как работает')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      crumbs().queryByRole('link', { name: 'Как работает' }),
    ).not.toBeInTheDocument();
    expect(
      crumbs().getByRole('link', { name: 'Гидравлический экскаватор' }),
    ).toHaveAttribute('href', '/machines/excavator');
  });
  it.each(pack.stages)(
    'teaches $stageId with canonical disclosure and no scenario numbers',
    async (stage) => {
      open('/processes/excavation-haul?stageId=' + stage.stageId);
      const user = userEvent.setup();
      const region = screen.getByRole('region', { name: /^Этап:/ });
      for (const key of [
        'goal',
        'input',
        'activity',
        'result',
        'handoff',
      ] as const)
        expect(within(region).getByText(stage[key])).toBeInTheDocument();
      const summary = region.querySelector('.card summary')!;
      const detail = summary.closest('details')!;
      expect(detail.open).toBe(false);
      await user.click(summary);
      expect(detail.open).toBe(true);
      expect(
        within(detail).getByText(stage.participantNotes[0]!.note),
      ).toBeInTheDocument();
      const action = within(detail).getByRole('link', {
        name: /Изучить машину/,
      });
      expect(action).toHaveAttribute(
        'href',
        '/machines/' +
          stage.participantNotes[0]!.machineId +
          '?fromProcess=excavation-haul&fromStage=' +
          stage.stageId,
      );
      expect(detail.textContent).not.toMatch(/1\.2|0\.9|24|1000|180|70/);
      await user.click(summary);
      expect(detail.open).toBe(false);
      expect(screen.getByRole('link', { current: 'step' })).toHaveAttribute(
        'href',
        '/processes/excavation-haul?stageId=' + stage.stageId,
      );
      const current = crumbs().getByText(
        screen.getByRole('link', { current: 'step' }).textContent!,
      );
      expect(current).toHaveAttribute('aria-current', 'page');
    },
  );
  it('preserves valid machine origin through stage choice, overview and explicit return', async () => {
    open('/machines/excavator/applications');
    const user = userEvent.setup();
    await user.click(
      within(screen.getByRole('region', { name: 'Где применяется' })).getByRole(
        'link',
        { name: localDomainContent.processes[0]!.name },
      ),
    );
    expect(
      screen.getByRole('link', { name: 'Вернуться к машине' }),
    ).toHaveAttribute('href', '/machines/excavator/applications');
    const stage = screen.getByRole('link', {
      name: 'Разработка грунта',
    });
    expect(stage).toHaveAttribute(
      'href',
      '/processes/excavation-haul?stageId=excavation-stage&fromMachine=excavator',
    );
    await user.click(stage);
    expect(
      screen.getByRole('link', { name: 'К обзору процесса' }),
    ).toHaveAttribute(
      'href',
      '/processes/excavation-haul?fromMachine=excavator',
    );
    await user.click(screen.getByRole('link', { name: 'Вернуться к машине' }));
    expect(
      screen.getByRole('link', { name: 'Где применяется', current: 'page' }),
    ).toBeInTheDocument();
  });
  it.each(['missing', 'Invalid', 'excavator&fromMachine=dump-truck', ''])(
    'rejects stale/malformed origin %s without disabling the process',
    (origin) => {
      open('/processes/excavation-haul?fromMachine=' + origin);
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Контекст машины некорректен',
      );
      expect(
        screen.queryByRole('link', { name: 'Вернуться к машине' }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    },
  );
  it('rejects existing but unrelated machine origin through graph membership', () => {
    const fixture = structuredClone(localDomainContent);
    fixture.machines.push({
      id: 'unrelated',
      name: 'Test-only unrelated',
      componentIds: [],
      operationIds: [],
    });
    const content = createDomainRepository(fixture);
    render(
      <MemoryRouter
        initialEntries={['/processes/excavation-haul?fromMachine=unrelated']}
      >
        <App content={content} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Контекст машины некорректен',
    );
    expect(
      screen.queryByRole('link', { name: 'Вернуться к машине' }),
    ).not.toBeInTheDocument();
  });
  it('uses canonical system breadcrumb without a current-item self link', () => {
    open('/systems/excavator-haul-system');
    const title = screen.getByRole('heading', { level: 1 }).textContent!;
    expect(crumbs().getByText(title)).toHaveAttribute('aria-current', 'page');
    expect(
      crumbs().queryByRole('link', { name: title }),
    ).not.toBeInTheDocument();
    expect(
      crumbs().getByRole('link', { name: 'Производственная задача' }),
    ).toHaveAttribute('href', '/systems');
  });
  it('reports invalid learning explicitly and retains canonical pages', () => {
    render(
      <MemoryRouter initialEntries={['/machines/excavator']}>
        <App
          learning={{
            status: 'invalid',
            issues: [{ path: [], message: 'test-only failure' }],
          }}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Учебные материалы не прошли проверку',
    );
    expect(
      screen.queryByRole('link', { name: 'Как работает' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Учебное описание машины недоступно.'),
    ).toBeInTheDocument();
  });
});
