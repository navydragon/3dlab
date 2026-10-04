// @vitest-environment jsdom
import '../test/setup';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from './App';
import {
  createDomainRepository,
  type RepositoryLoad,
} from '../content/repository';
import { localDomainContent } from '../content/adapters/local/repository';

const processName =
  'Разработка грунта с погрузкой в автосамосвалы и транспортированием';
const context = '?fromProcess=excavation-haul&fromStage=excavation-stage';
function open(path = '/', content?: RepositoryLoad) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App {...(content ? { content } : {})} />
    </MemoryRouter>,
  );
}
function main() {
  return within(screen.getByRole('main'));
}
function selectedDetails() {
  return screen.getByRole('region', { name: 'Этап: Разработка грунта' });
}

describe('domain-backed application', () => {
  it('renders semantic home and three learning entry links', () => {
    open();
    expect(main().getByRole('heading', { level: 1 })).toHaveTextContent(
      'Машины и механизированные процессы',
    );
    expect(main().getByRole('link', { name: /Машины/ })).toHaveAttribute(
      'href',
      '/machines',
    );
    expect(main().getByRole('link', { name: /Процессы/ })).toHaveAttribute(
      'href',
      '/processes',
    );
    expect(
      screen.getByRole('navigation', { name: 'Основная навигация' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'К содержимому' })).toHaveAttribute(
      'href',
      '#main-content',
    );
    expect(
      screen.getByRole('link', { name: /Производственная задача/ }),
    ).toHaveAttribute('href', '/systems');
  });
  it('supports keyboard catalog navigation, canonical machine links and page focus', async () => {
    const user = userEvent.setup();
    open();
    main()
      .getByRole('link', { name: /Машины/ })
      .focus();
    await user.keyboard('{Enter}');
    expect(screen.getByRole('main')).toHaveFocus();
    expect(
      main().getByRole('link', { name: 'Гидравлический экскаватор' }),
    ).toHaveAttribute('href', '/machines/excavator');
    expect(main().getByRole('link', { name: 'Автосамосвал' })).toHaveAttribute(
      'href',
      '/machines/dump-truck',
    );
    await user.click(
      main().getByRole('link', { name: 'Гидравлический экскаватор' }),
    );
    expect(main().getByRole('heading', { level: 1 })).toHaveTextContent(
      'Гидравлический экскаватор',
    );
    expect(main().getByRole('heading', { name: 'Ковш' })).toBeInTheDocument();
    expect(
      main()
        .getAllByRole('heading', { level: 3 })
        .filter((heading) => heading.textContent !== processName),
    ).toHaveLength(9);
    expect(main().getAllByRole('link', { name: processName })).toHaveLength(1);
  });
  it('opens real Processes catalog and canonical process in graph order', async () => {
    const user = userEvent.setup();
    open();
    await user.click(main().getByRole('link', { name: /Процессы/ }));
    expect(main().getByRole('link', { name: processName })).toHaveAttribute(
      'href',
      '/processes/excavation-haul',
    );
    await user.click(main().getByRole('link', { name: processName }));
    const stages = main()
      .getAllByRole('link')
      .filter((link) => link.hasAttribute('aria-controls'));
    expect(stages.map((link) => link.textContent)).toEqual([
      'Разработка грунта',
      'Погрузка',
      'Транспортирование',
      'Разгрузка',
    ]);
    expect(
      main().queryByRole('link', { name: /Изучить машину/ }),
    ).not.toBeInTheDocument();
  });
  it('selects a stage with an accessible link and renders canonical compact card/context', async () => {
    const user = userEvent.setup();
    open('/processes/excavation-haul');
    const stage = main().getByRole('link', {
      name: 'Разработка грунта',
    });
    stage.focus();
    await user.keyboard('{Enter}');
    expect(stage).toHaveAttribute('aria-current', 'step');
    expect(stage).toHaveAttribute('aria-controls', selectedDetails().id);
    expect(
      within(selectedDetails()).getByRole('heading', {
        name: 'Гидравлический экскаватор',
      }),
    ).toBeInTheDocument();
    expect(
      within(selectedDetails()).getByRole('link', { name: /Изучить машину/ }),
    ).toHaveAttribute('href', '/machines/excavator' + context);
  });
  it('preserves validated origin across sections and returns to the exact process stage', async () => {
    const user = userEvent.setup();
    open('/processes/excavation-haul?stageId=excavation-stage');
    await user.click(
      within(selectedDetails()).getByRole('link', { name: /Изучить машину/ }),
    );
    expect(
      main().getByRole('link', { name: /Назад к этапу «Разработка грунта»/ }),
    ).toHaveAttribute(
      'href',
      '/processes/excavation-haul?stageId=excavation-stage',
    );
    const section = within(
      screen.getByRole('navigation', { name: 'Разделы машины' }),
    ).getByRole('link', { name: 'Где применяется' });
    expect(section).toHaveAttribute(
      'href',
      '/machines/excavator/applications' + context,
    );
    await user.click(section);
    expect(section).toHaveAttribute('aria-current', 'page');
    expect(
      main().queryByRole('heading', { name: 'Компоненты' }),
    ).not.toBeInTheDocument();
    const overview = main().getByRole('link', { name: 'Обзор' });
    expect(overview).toHaveAttribute(
      'href',
      '/machines/excavator/overview' + context,
    );
    await user.click(overview);
    expect(main().getByRole('heading', { name: 'Ковш' })).toBeInTheDocument();
    await user.click(main().getByRole('link', { name: /Назад к этапу/ }));
    expect(selectedDetails()).toBeInTheDocument();
    expect(
      main().getByRole('link', { name: 'Разработка грунта' }),
    ).toHaveAttribute('aria-current', 'step');
  });
  it('uses graph-derived Where used links with validated machine origin', async () => {
    open('/machines/dump-truck');
    const region = screen.getByRole('region', { name: 'Где применяется' });
    expect(
      within(region).getAllByRole('link', { name: processName }),
    ).toHaveLength(1);
    expect(
      within(region).getByRole('link', {
        name: 'Транспортирование',
      }),
    ).toHaveAttribute(
      'href',
      '/processes/excavation-haul?stageId=haul-stage&fromMachine=dump-truck',
    );
    await userEvent
      .setup()
      .click(within(region).getByRole('link', { name: processName }));
    expect(main().getByRole('heading', { level: 1 })).toHaveTextContent(
      processName,
    );
  });
  it.each([
    ['/machines/missing', 'Машина не найдена'],
    ['/processes/missing', 'Процесс не найден'],
    ['/machines/excavator/unknown', 'Раздел машины не найден'],
    ['/does-not-exist', 'Страница не найдена'],
    ['/machines/Invalid', 'Некорректный адрес'],
  ])('has an explicit missing/invalid state: %s', (path, title) => {
    open(path);
    expect(main().getByRole('heading', { name: title })).toBeInTheDocument();
  });
  it.each([
    'missing-stage',
    '',
    'Invalid',
    'excavation-stage&stageId=loading-stage',
  ])('does not replace an invalid stage selection: %s', (stage) => {
    open('/processes/excavation-haul?stageId=' + stage);
    expect(main().getByRole('alert')).toHaveTextContent('Этап не найден');
    expect(
      main().queryByRole('link', { current: 'step' }),
    ).not.toBeInTheDocument();
    expect(
      main().queryByRole('link', { name: /Изучить машину/ }),
    ).not.toBeInTheDocument();
    expect(
      main().getByRole('link', { name: 'К обзору процесса' }),
    ).toHaveAttribute('href', '/processes/excavation-haul');
  });
  it.each([
    '?fromProcess=excavation-haul',
    '?fromProcess=missing&fromStage=excavation-stage',
    '?fromProcess=excavation-haul&fromStage=missing',
    '?fromProcess=excavation-haul&fromStage=haul-stage',
  ])(
    'rejects an untrusted machine origin while keeping hierarchy navigation: %s',
    (origin) => {
      open('/machines/excavator' + origin);
      expect(main().getByRole('heading', { level: 1 })).toHaveTextContent(
        'Гидравлический экскаватор',
      );
      expect(main().getByRole('alert')).toHaveTextContent(
        'Контекст возврата некорректен',
      );
      expect(
        main().queryByRole('link', { name: /Назад к этапу/ }),
      ).not.toBeInTheDocument();
      expect(main().getByRole('link', { name: 'К машинам' })).toHaveAttribute(
        'href',
        '/machines',
      );
      expect(main().getByRole('link', { name: 'Обзор' })).toHaveAttribute(
        'href',
        '/machines/excavator/overview',
      );
    },
  );
  it('has no contextual return on a direct machine URL', () => {
    open('/machines/excavator');
    expect(main().queryByRole('alert')).not.toBeInTheDocument();
    expect(
      main().queryByRole('link', { name: /Назад к этапу/ }),
    ).not.toBeInTheDocument();
  });
  it('rejects a stage from another process in selection and contextual return', () => {
    const fixture = structuredClone(localDomainContent);
    fixture.processes.push({
      id: 'other-process',
      name: 'Test-only process',
      stageIds: ['other-stage'],
    });
    fixture.processStages.push({
      id: 'other-stage',
      name: 'Test-only stage',
      processId: 'other-process',
      operationId: 'excavation',
      sequence: 1,
      machineRoleIds: ['excavation-lead-machine'],
    });
    const content = createDomainRepository(fixture);
    expect(content.status).toBe('loaded');
    const process = open(
      '/processes/excavation-haul?stageId=other-stage',
      content,
    );
    expect(main().getByRole('alert')).toHaveTextContent('Этап не найден');
    process.unmount();
    open(
      '/machines/excavator?fromProcess=excavation-haul&fromStage=other-stage',
      content,
    );
    expect(
      main().queryByRole('link', { name: /Назад к этапу/ }),
    ).not.toBeInTheDocument();
    expect(main().getByRole('alert')).toHaveTextContent(
      'Контекст возврата некорректен',
    );
  });
  it('shows a clear content error instead of an empty catalog or stack trace', () => {
    const content = createDomainRepository({});
    expect(content.status).toBe('invalid');
    open('/machines', content);
    expect(
      main().getByRole('heading', { name: 'Ошибка загрузки контента' }),
    ).toBeInTheDocument();
    expect(main().getByRole('alert')).toHaveTextContent(
      'Предметные данные не прошли проверку',
    );
    expect(main().queryByText(/В каталоге пока нет/)).not.toBeInTheDocument();
    expect(
      main().queryByRole('link', { name: 'Гидравлический экскаватор' }),
    ).not.toBeInTheDocument();
    expect(main().queryByText(/Error:|at .*\.tsx/)).not.toBeInTheDocument();
  });
});
