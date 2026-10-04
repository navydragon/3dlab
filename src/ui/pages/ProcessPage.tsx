import { Link, useLocation, useParams } from 'react-router';
import { getProcessPage } from '../../application/page-queries';
import {
  machinePath,
  parseProcessRoute,
  parseMachineOrigin,
  machineSectionPath,
  processPath,
  routes,
  systemPath,
} from '../../navigation/routes';
import { useDomainRepository } from '../providers/domain-context';
import { EntityNotFound } from '../components/EntityNotFound';
import { RouteErrorPage } from './RouteErrorPage';
import { useSystemsContent } from '../providers/systems-context';
import { getRelatedSystems } from '../../application/system-experiment';
import { isLearningSectionId } from '../../domain/ids';
import { useFoundationContent } from '../providers/foundation-context';
import { Breadcrumbs } from '../components/Breadcrumbs';
const applications = (() => {
  const id = 'applications';
  if (!isLearningSectionId(id)) throw new Error('Invalid section ID');
  return id;
})();
export function ProcessPage() {
  const repository = useDomainRepository();
  const systems = useSystemsContent();
  const learning = useFoundationContent();
  const { processId } = useParams();
  const { search } = useLocation();
  const identity = parseProcessRoute(processId, '');
  const parsed = parseProcessRoute(processId, search);
  const parsedOrigin = parseMachineOrigin(search);
  if (!identity.ok) return <RouteErrorPage invalid />;
  const view = getProcessPage(
    repository,
    identity.value.processId,
    parsed.ok ? parsed.value.stageId : null,
    parsedOrigin.ok ? parsedOrigin.value : null,
    learning.status === 'loaded' ? learning.repository : undefined,
  );
  if (view.status === 'missing-process')
    return (
      <EntityNotFound
        title="Процесс не найден"
        recoveryPath={routes.processes}
        recoveryLabel="К процессам"
      />
    );
  const detail =
    view.selection.status === 'selected' ? view.selection.detail : undefined;
  const relatedSystems =
    systems.status === 'valid'
      ? getRelatedSystems(systems.repository, view.process.id)
      : [];
  const origin =
    view.origin.status === 'valid' ? view.origin.machine : undefined;
  return (
    <>
      <Breadcrumbs
        items={[
          { label: 'Главная', href: routes.home },
          { label: 'Процессы', href: routes.processes },
          {
            label: view.process.name,
            ...(detail
              ? { href: processPath(view.process.id, undefined, origin?.id) }
              : {}),
          },
          ...(detail ? [{ label: detail.stage.name }] : []),
        ]}
      />
      <p>
        <Link to={routes.processes}>К процессам</Link>
      </p>
      <h1>{view.process.name}</h1>
      {view.origin.status === 'invalid' && (
        <p role="alert">
          Контекст машины некорректен. Процесс доступен без возврата к машине.
        </p>
      )}
      {origin && (
        <p>
          Вы пришли из модуля «{origin.name}».{' '}
          <Link to={machineSectionPath(origin.id, applications)}>
            Вернуться к машине
          </Link>
        </p>
      )}
      {learning.status === 'invalid' && (
        <p role="alert">
          Учебные материалы не прошли проверку. Предметная навигация доступна.
        </p>
      )}
      {view.foundation ? (
        <>
          <p>{view.foundation.introduction}</p>
          <section aria-label="Связанные учебные последовательности">
            <h2>Технологический процесс</h2>
            <p>{view.stages.map((s) => s.stage.name).join(' → ')}</p>
            <h2>Цикл автомобиля</h2>
            <p>{view.foundation.truckCycle.join(' → ')} ↺</p>
            <h2>Цикл экскаватора</h2>
            <p>{view.foundation.excavatorCycle.join(' → ')} ↺</p>
            <p>{view.foundation.synthesis}</p>
            <p>
              {view.foundation.causalChain.slice(0, 3).join(' + ')} →{' '}
              {view.foundation.causalChain.slice(3).join(' → ')}
            </p>
          </section>
        </>
      ) : (
        <p>Учебное описание процесса недоступно.</p>
      )}
      {view.process.description && <p>{view.process.description}</p>}
      {relatedSystems.length > 0 && (
        <section aria-label="Производственные системы">
          <h2>Производственные системы</h2>
          {view.foundation && <p>{view.foundation.systemsIntro}</p>}
          <ul>
            {relatedSystems.map((system) => (
              <li key={system.id}>
                <Link to={systemPath(system.id)}>{system.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <h2>Этапы процесса</h2>
      <ol className="stage-list">
        {view.stages.map((entry) => (
          <li key={entry.stage.id}>
            <Link
              to={processPath(view.process.id, entry.stage.id, origin?.id)}
              aria-current={
                detail?.stage.id === entry.stage.id ? 'step' : undefined
              }
              aria-controls="stage-details"
            >
              {entry.stage.name}
            </Link>
            <p>Операция: {entry.operation.name}</p>
            <ul>
              {entry.participants.map((participant) => (
                <li key={participant.role.id}>
                  {participant.role.name}:{' '}
                  {participant.machines
                    .map((machine) => machine.name)
                    .join(', ')}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
      {view.selection.status === 'invalid' && (
        <p role="alert">
          Этап не найден в этом процессе или адрес этапа некорректен.{' '}
          <Link to={processPath(view.process.id, undefined, origin?.id)}>
            К обзору процесса
          </Link>
        </p>
      )}
      <section id="stage-details" aria-labelledby="stage-details-heading">
        {detail ? (
          <>
            <h2 id="stage-details-heading">Этап: {detail.stage.name}</h2>
            <p>
              <Link to={processPath(view.process.id, undefined, origin?.id)}>
                К обзору процесса
              </Link>
            </p>
            {view.stageFoundation ? (
              <>
                <dl className="stage-learning">
                  {(
                    [
                      ['Цель', view.stageFoundation.goal],
                      ['Исходное состояние', view.stageFoundation.input],
                      ['Что происходит', view.stageFoundation.activity],
                      ['Результат', view.stageFoundation.result],
                      ['Что дальше', view.stageFoundation.handoff],
                    ] as const
                  ).map(([label, text]) => (
                    <div key={label}>
                      <dt>{label}</dt>
                      <dd>{text}</dd>
                    </div>
                  ))}
                </dl>
                {view.stageFoundation.modelNotes.length > 0 && (
                  <details>
                    <summary>Пояснения принятой модели</summary>
                    {view.stageFoundation.modelNotes.map((text) => (
                      <p key={text}>{text}</p>
                    ))}
                  </details>
                )}
              </>
            ) : (
              <p>Учебное описание этапа недоступно.</p>
            )}
            {detail.stage.description && <p>{detail.stage.description}</p>}
            <ul className="card-list">
              {detail.participants.map((participant) =>
                participant.machines.map((machine) => (
                  <li
                    className="card"
                    key={
                      detail.stage.id +
                      ':' +
                      participant.role.id +
                      ':' +
                      machine.id
                    }
                  >
                    <p>Роль: {participant.role.name}</p>
                    <details>
                      <summary>
                        <h3>{machine.name}</h3>
                      </summary>
                      {view.stageFoundation?.participantNotes
                        .filter(
                          (n) =>
                            n.machineId === machine.id &&
                            n.roleId === participant.role.id,
                        )
                        .map((n) => (
                          <div key={n.roleId + ':' + n.machineId}>
                            <p>{n.note}</p>
                            <h4>Факторы</h4>
                            <ul>
                              {n.factors.map((f) => (
                                <li key={f}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      <Link
                        to={machinePath(machine.id, {
                          processId: view.process.id,
                          stageId: detail.stage.id,
                        })}
                      >
                        Изучить машину
                        <span className="sr-only">: {machine.name}</span>
                      </Link>
                    </details>
                  </li>
                )),
              )}
            </ul>
          </>
        ) : (
          <>
            <h2 id="stage-details-heading">Выбор этапа</h2>
            <p>Выберите этап, чтобы перейти к участвующим машинам.</p>
          </>
        )}
      </section>
    </>
  );
}
