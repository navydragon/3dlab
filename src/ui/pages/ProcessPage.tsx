import { Link, useLocation, useParams } from 'react-router';
import { getProcessPage } from '../../application/page-queries';
import {
  machinePath,
  parseProcessRoute,
  processPath,
  routes,
} from '../../navigation/routes';
import { useDomainRepository } from '../providers/domain-context';
import { EntityNotFound } from '../components/EntityNotFound';
import { RouteErrorPage } from './RouteErrorPage';
export function ProcessPage() {
  const repository = useDomainRepository();
  const { processId } = useParams();
  const { search } = useLocation();
  const identity = parseProcessRoute(processId, '');
  const parsed = parseProcessRoute(processId, search);
  if (!identity.ok) return <RouteErrorPage invalid />;
  const view = getProcessPage(
    repository,
    identity.value.processId,
    parsed.ok ? parsed.value.stageId : null,
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
  return (
    <>
      <p>
        <Link to={routes.processes}>К процессам</Link>
      </p>
      <h1>{view.process.name}</h1>
      {view.process.description && <p>{view.process.description}</p>}
      <h2>Этапы процесса</h2>
      <ol className="stage-list">
        {view.stages.map((entry) => (
          <li key={entry.stage.id}>
            <Link
              to={processPath(view.process.id, entry.stage.id)}
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
          <Link to={processPath(view.process.id)}>К обзору процесса</Link>
        </p>
      )}
      <section id="stage-details" aria-labelledby="stage-details-heading">
        {detail ? (
          <>
            <h2 id="stage-details-heading">Этап: {detail.stage.name}</h2>
            {detail.stage.description && <p>{detail.stage.description}</p>}
            <ul className="card-list">
              {detail.participants.map((participant) =>
                participant.machines.map((machine) => (
                  <li
                    className="card"
                    key={participant.role.id + ':' + machine.id}
                  >
                    <h3>{machine.name}</h3>
                    <p>Роль: {participant.role.name}</p>
                    {machine.description && <p>{machine.description}</p>}
                    <Link
                      to={machinePath(machine.id, {
                        processId: view.process.id,
                        stageId: detail.stage.id,
                      })}
                    >
                      Изучить машину
                      <span className="sr-only">: {machine.name}</span>
                    </Link>
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
