import { useLocation, useParams, Link } from 'react-router';
import { parseProcessRoute, routes } from '../../navigation/routes';
import { ContentNotice } from '../components/ContentNotice';
import { RouteErrorPage } from './RouteErrorPage';

export function ProcessPage() {
  const { processId } = useParams();
  const { search } = useLocation();
  const route = parseProcessRoute(processId, search);
  if (!route.ok)
    return (
      <>
        <RouteErrorPage invalid />
        <p>
          <Link to={routes.processes}>К процессам</Link>
        </p>
      </>
    );
  return (
    <>
      <h1>Процесс</h1>
      <ContentNotice />
      <dl>
        <dt>Идентификатор процесса из адреса</dt>
        <dd>{route.value.processId}</dd>
        {route.value.stageId && (
          <>
            <dt>Идентификатор этапа из адреса</dt>
            <dd>{route.value.stageId}</dd>
          </>
        )}
      </dl>
    </>
  );
}
