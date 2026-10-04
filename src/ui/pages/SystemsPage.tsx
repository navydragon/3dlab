import { Link, useLocation, useParams } from 'react-router';
import {
  getSystemsCatalog,
  resolveExperiment,
} from '../../application/system-experiment';
import {
  machinePath,
  parseSystemRoute,
  processPath,
  routes,
  systemPath,
} from '../../navigation/routes';
import { useDomainRepository } from '../providers/domain-context';
import { useSystemsContent } from '../providers/systems-context';
import { RouteErrorPage } from './RouteErrorPage';
import { EntityNotFound } from '../components/EntityNotFound';
import { SystemExperiment } from '../components/SystemExperiment';
import { Breadcrumbs } from '../components/Breadcrumbs';

function SystemsUnavailable() {
  return (
    <>
      <h1>Комплексы недоступны</h1>
      <p role="alert">
        Данные производственных систем не прошли проверку. Другие разделы
        лаборатории доступны.
      </p>
      <Link to={routes.home}>На главную</Link>
    </>
  );
}
export function SystemsCatalogPage() {
  const content = useSystemsContent();
  const domain = useDomainRepository();
  if (content.status === 'invalid') return <SystemsUnavailable />;
  const catalog = getSystemsCatalog(content.repository, domain);
  if (catalog.status !== 'ready') return <SystemsUnavailable />;
  return (
    <>
      <h1>Производственные системы</h1>
      <p>Выберите комплекс, затем исходный сценарий для эксперимента.</p>
      <ul className="card-list">
        {catalog.systems.map((view) => (
          <li className="card" key={view.system.id}>
            <h2>
              <Link to={systemPath(view.system.id)}>{view.system.name}</Link>
            </h2>
            <p>Процесс: {view.process.name}</p>
            <ul>
              {view.participants.map((p) => (
                <li key={p.definition.roleId}>
                  {p.machine.name} — {p.role.name}
                </li>
              ))}
            </ul>
            <p>
              Исходные сценарии:{' '}
              {view.scenarios.map((s) => s.scenarioId).join(', ') ||
                'Нет доступных сценариев'}
            </p>
          </li>
        ))}
      </ul>
      {catalog.systems.length === 0 && <p>Доступных комплексов пока нет.</p>}
    </>
  );
}
export function SystemPage() {
  const content = useSystemsContent();
  const domain = useDomainRepository();
  const { systemId } = useParams();
  const { search } = useLocation();
  const parsed = parseSystemRoute(systemId, search);
  if (!parsed.ok) return <RouteErrorPage invalid />;
  if (content.status === 'invalid') return <SystemsUnavailable />;
  const resolved = resolveExperiment(
    content.repository,
    domain,
    parsed.value.systemId,
    parsed.value.scenarioId,
  );
  if (resolved.status === 'missing-system')
    return (
      <EntityNotFound
        title="Комплекс не найден"
        recoveryPath={routes.systems}
        recoveryLabel="К комплексам"
      />
    );
  if (resolved.status === 'invalid-dependencies') return <SystemsUnavailable />;
  const { view } = resolved;
  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Главная', href: routes.home },
          { label: 'Производственная задача', href: routes.systems },
          { label: view.system.name },
        ]}
      />
      <p>
        <Link to={routes.systems}>К комплексам</Link>
      </p>
      <h1>{view.system.name}</h1>
      <p>
        Процесс:{' '}
        <Link to={processPath(view.process.id)}>{view.process.name}</Link>
      </p>
      <section aria-label="Состав комплекса">
        <h2>Состав комплекса</h2>
        <ul>
          {view.participants.map((p) => (
            <li key={p.definition.roleId}>
              <Link to={machinePath(p.machine.id)}>{p.machine.name}</Link> —{' '}
              {p.role.name}
            </li>
          ))}
        </ul>
      </section>
      {resolved.status === 'experiment' ? (
        <SystemExperiment
          key={view.system.id + ':' + resolved.source.scenario.scenarioId}
          source={resolved.source}
          editable={resolved.editable}
          participants={view.participants}
        />
      ) : (
        <>
          {resolved.status === 'scenario-unavailable' && (
            <p role="alert">
              Исходный сценарий не найден или не поддерживается этим комплексом.
              Выберите доступный сценарий.
            </p>
          )}
          {resolved.status === 'unsupported-model' && (
            <p role="alert">
              Расчётная модель не поддерживается. Расчёт недоступен.
            </p>
          )}
          <h2>Выбор исходного сценария</h2>
          <p>
            Сценарий задаёт исходные условия. Расчёт начнётся после явного
            запуска.
          </p>
          <ul>
            {view.scenarios.map((s) => (
              <li key={s.scenarioId}>
                <Link to={systemPath(view.system.id, s.scenarioId)}>
                  {s.scenarioId}
                </Link>
              </li>
            ))}
          </ul>
          {view.scenarios.length === 0 && <p>Поддерживаемых сценариев нет.</p>}
          {resolved.status !== 'overview' && (
            <Link to={systemPath(view.system.id)}>К обзору комплекса</Link>
          )}
        </>
      )}
    </>
  );
}
