import { useLocation, useParams } from 'react-router';
import { parseMachineRoute, parseReturnContext } from '../../navigation/routes';
import { ContentNotice } from '../components/ContentNotice';
import { RouteErrorPage } from './RouteErrorPage';

export function MachinePage() {
  const { machineId, sectionId } = useParams();
  const { search } = useLocation();
  const route = parseMachineRoute(machineId, sectionId);
  const context = parseReturnContext(search);
  if (!route.ok) return <RouteErrorPage invalid />;
  return (
    <>
      <h1>{route.value.sectionId ? 'Раздел машины' : 'Машина'}</h1>
      <ContentNotice />
      <dl>
        <dt>Идентификатор машины из адреса</dt>
        <dd>{route.value.machineId}</dd>
        {route.value.sectionId && (
          <>
            <dt>Идентификатор раздела из адреса</dt>
            <dd>{route.value.sectionId}</dd>
          </>
        )}
      </dl>
      {!context.ok && (
        <p role="alert">
          Контекст возврата некорректен. Его нельзя использовать.
        </p>
      )}
      {context.ok && context.value && (
        <p>
          Контекст ссылки сохранён в URL. Проверка процесса и этапа будет
          доступна после подключения контента.
        </p>
      )}
    </>
  );
}
