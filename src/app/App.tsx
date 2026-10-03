import { Route, Routes } from 'react-router';
import { routes } from '../navigation/routes';
import { Layout } from '../ui/components/Layout';
import { HomePage } from '../ui/pages/HomePage';
import { CatalogPage } from '../ui/pages/CatalogPage';
import { MachinePage } from '../ui/pages/MachinePage';
import { ProcessPage } from '../ui/pages/ProcessPage';
import { RouteErrorPage } from '../ui/pages/RouteErrorPage';

export function App() {
  return (
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
  );
}
