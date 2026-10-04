import { Link, useLocation, useParams } from 'react-router';
import { getMachinePage } from '../../application/page-queries';
import {
  machinePath,
  machineSectionPath,
  parseMachineRoute,
  parseReturnContext,
  processPath,
  routes,
} from '../../navigation/routes';
import { useDomainRepository } from '../providers/domain-context';
import { EntityNotFound } from '../components/EntityNotFound';
import { RouteErrorPage } from './RouteErrorPage';
import { useAssetRepository } from '../providers/asset-context';
import { MachineViewerSection } from '../components/MachineViewerSection';
import { useFoundationContent } from '../providers/foundation-context';
import { Breadcrumbs } from '../components/Breadcrumbs';
import {
  TransportLearning,
  WorkingPrinciple,
} from '../components/FoundationLearning';
export function MachinePage() {
  const repository = useDomainRepository();
  const assets = useAssetRepository();
  const learning = useFoundationContent();
  const { machineId, sectionId } = useParams();
  const { search } = useLocation();
  const route = parseMachineRoute(machineId, sectionId);
  const context = parseReturnContext(search);
  if (!route.ok) return <RouteErrorPage invalid />;
  const view = getMachinePage(
    repository,
    route.value.machineId,
    route.value.sectionId,
    context.ok ? context.value : null,
    assets.resolve(route.value.machineId),
    learning.status === 'loaded' ? learning.repository : undefined,
  );
  if (view.status === 'missing-machine')
    return (
      <EntityNotFound
        title="Машина не найдена"
        recoveryPath={routes.machines}
        recoveryLabel="К машинам"
      />
    );
  if (view.status === 'missing-section')
    return (
      <EntityNotFound
        title="Раздел машины не найден"
        recoveryPath={machinePath(view.machine.id)}
        recoveryLabel="К обзору машины"
      />
    );
  const origin =
    view.origin.status === 'valid' ? view.origin.context : undefined;
  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Главная', href: routes.home },
          { label: 'Машины', href: routes.machines },
          {
            label: view.machine.name,
            ...(view.selectedSection.id !== 'overview'
              ? { href: machinePath(view.machine.id, origin) }
              : {}),
          },
          ...(view.selectedSection.id !== 'overview'
            ? [{ label: view.selectedSection.name }]
            : []),
        ]}
      />
      <p>
        <Link to={routes.machines}>К машинам</Link>
      </p>
      {view.origin.status === 'valid' && (
        <p>
          <Link to={processPath(view.origin.process.id, view.origin.stage.id)}>
            ← Назад к этапу «{view.origin.stage.name}»
          </Link>
        </p>
      )}
      {view.origin.status === 'invalid' && (
        <p role="alert">
          Контекст возврата некорректен. Используйте навигацию по каталогу.
        </p>
      )}
      <h1>{view.machine.name}</h1>
      {learning.status === 'invalid' && (
        <p role="alert">
          Учебные материалы не прошли проверку. Предметная навигация доступна.
        </p>
      )}
      {view.machine.description && <p>{view.machine.description}</p>}
      <nav aria-label="Разделы машины">
        {view.sections.map((section) => (
          <Link
            key={section.id}
            to={machineSectionPath(view.machine.id, section.id, origin)}
            aria-current={
              view.selectedSection.id === section.id ? 'page' : undefined
            }
          >
            {section.name}
          </Link>
        ))}
      </nav>
      {view.selectedSection.id === 'construction' &&
        view.foundation?.constructionIntro && (
          <p>{view.foundation.constructionIntro}</p>
        )}
      {view.selectedSection.id === 'working-principle' &&
        view.foundation?.workingPrinciple && (
          <>
            <WorkingPrinciple
              content={view.foundation.workingPrinciple}
              components={view.components}
            />
            {view.sections
              .filter((s) => s.id === 'working-cycle')
              .map((s) => (
                <p key={s.id}>
                  <Link to={machineSectionPath(view.machine.id, s.id, origin)}>
                    К демонстрации рабочего цикла
                  </Link>
                </p>
              ))}
          </>
        )}
      {(view.selectedSection.id === 'construction' ||
        view.selectedSection.id === 'working-cycle') &&
        view.asset.status === 'available' && (
          <MachineViewerSection
            key={view.selectedSection.id + view.asset.asset.id}
            asset={view.asset.asset}
            components={view.components}
            cycle={view.selectedSection.id === 'working-cycle'}
          />
        )}
      {(view.asset.status === 'invalid' ||
        view.asset.status === 'ambiguous') && (
        <p role="alert">
          3D-контент недоступен: требуется исправить конфигурацию asset.
          Текстовые материалы доступны.
        </p>
      )}
      {view.selectedSection.id === 'overview' && (
        <>
          {view.foundation ? (
            <>
              <p>{view.foundation.overview.purpose}</p>
              <p>{view.foundation.overview.systemContext}</p>
              <p>{view.foundation.overview.scopeNote}</p>
            </>
          ) : (
            <p>Учебное описание машины недоступно.</p>
          )}
          {view.foundation?.transportCycle && (
            <TransportLearning content={view.foundation.transportCycle} />
          )}
          <h2>Операции</h2>
          <ul>
            {view.operations.map((operation) => (
              <li key={operation.id}>{operation.name}</li>
            ))}
          </ul>
          <h2>Компоненты</h2>
          {view.components.length === 0 ? (
            <p>Компоненты пока не описаны в контенте.</p>
          ) : (
            <ul className="card-list">
              {view.components.map((component) => (
                <li className="card" key={component.id}>
                  <h3>{component.name}</h3>
                  {component.explanation ? (
                    <p>{component.explanation}</p>
                  ) : (
                    <p>Учебное описание компонента недоступно.</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      <section aria-labelledby="where-used-heading">
        <h2 id="where-used-heading">Где применяется</h2>
        {view.selectedSection.id === 'applications' &&
          view.foundation?.applicationsIntro && (
            <p>{view.foundation.applicationsIntro}</p>
          )}
        {view.usage.length === 0 ? (
          <p>Связанные процессы пока не описаны.</p>
        ) : (
          <ul className="card-list">
            {view.usage.map((use) => (
              <li className="card" key={use.process.id}>
                <h3>
                  <Link
                    to={processPath(use.process.id, undefined, view.machine.id)}
                  >
                    {use.process.name}
                  </Link>
                </h3>
                <ul>
                  {use.stages.map((entry) => (
                    <li key={entry.stage.id}>
                      <Link
                        to={processPath(
                          use.process.id,
                          entry.stage.id,
                          view.machine.id,
                        )}
                      >
                        {entry.stage.name}
                      </Link>
                      <ul>
                        {entry.roles.map((role) => (
                          <li key={role.id}>{role.name}</li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
