import { Route, Routes } from 'react-router';
import { routes } from '../navigation/routes';
import { Layout } from '../ui/components/Layout';
import { HomePage } from '../ui/pages/HomePage';
import { CatalogPage } from '../ui/pages/CatalogPage';
import { MachinePage } from '../ui/pages/MachinePage';
import { ProcessPage } from '../ui/pages/ProcessPage';
import { RouteErrorPage } from '../ui/pages/RouteErrorPage';
import { loadLocalDomainRepository } from '../content/adapters/local/repository';
import type { RepositoryLoad } from '../content/repository';
import { DomainContext } from '../ui/providers/domain-context';

export function App({
  content = loadLocalDomainRepository(),
}: {
  readonly content?: RepositoryLoad;
}) {
  if (content.status === 'invalid')
    return (
      <Routes>
        <Route element={<Layout />}>
          <Route
            path="*"
            element={
              <>
                <h1>Ошибка загрузки контента</h1>
                <p role="alert">
                  Предметные данные не прошли проверку. Каталоги и страницы
                  недоступны. Необходимо исправить исходный контент.
                </p>
              </>
            }
          />
        </Route>
      </Routes>
    );
  return (
    <DomainContext value={content.repository}>
      <Routes>
        <Route element={<Layout />}>
          <Route path={routes.home} element={<HomePage />} />
          <Route
            path={routes.machines}
            element={<CatalogPage kind="machines" />}
          />
          <Route path={routes.machine} element={<MachinePage />} />
          <Route path={routes.machineSection} element={<MachinePage />} />
          <Route
            path={routes.processes}
            element={<CatalogPage kind="processes" />}
          />
          <Route path={routes.process} element={<ProcessPage />} />
          <Route path="*" element={<RouteErrorPage />} />
        </Route>
      </Routes>
    </DomainContext>
  );
}
