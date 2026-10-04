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
import { AssetContext } from '../ui/providers/asset-context';
import { localAssetRepository } from '../content/adapters/local/assets';
import type { AssetRepository } from '../content/asset-repository';
import { SystemsContext } from '../ui/providers/systems-context';
import { localProductionSystems } from '../content/adapters/local/production-systems';
import type { ProductionSystemLoad } from '../content/production-system-repository';
import { SystemsCatalogPage, SystemPage } from '../ui/pages/SystemsPage';
import { loadLocalFoundation } from '../content/adapters/local/foundation';
import type { FoundationLoad } from '../content/foundation-repository';
import { FoundationContext } from '../ui/providers/foundation-context';

export function App({
  content = loadLocalDomainRepository(),
  assets = localAssetRepository,
  systems = localProductionSystems,
  learning,
}: {
  readonly content?: RepositoryLoad;
  readonly assets?: AssetRepository;
  readonly systems?: ProductionSystemLoad;
  readonly learning?: FoundationLoad;
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
      <FoundationContext
        value={learning ?? loadLocalFoundation(content.repository)}
      >
        <AssetContext value={assets}>
          <SystemsContext value={systems}>
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
                <Route path={routes.systems} element={<SystemsCatalogPage />} />
                <Route path={routes.system} element={<SystemPage />} />
                <Route path="*" element={<RouteErrorPage />} />
              </Route>
            </Routes>
          </SystemsContext>
        </AssetContext>
      </FoundationContext>
    </DomainContext>
  );
}
