import { useEffect, useRef } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router';
import { routes } from '../../navigation/routes';

export function Layout() {
  const location = useLocation();
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(location.pathname);
  useEffect(() => {
    if (previousPath.current !== location.pathname) {
      main.current?.focus();
      previousPath.current = location.pathname;
    }
  }, [location.pathname]);

  return (
    <>
      <a className="skip-link" href="#main-content">
        К содержимому
      </a>
      <header className="site-header">
        <Link className="brand" to={routes.home}>
          Цифровая лаборатория
        </Link>
        <nav aria-label="Основная навигация">
          <NavLink to={routes.home} end>
            Главная
          </NavLink>
          <NavLink to={routes.machines}>Машины</NavLink>
          <NavLink to={routes.processes}>Процессы</NavLink>
        </nav>
      </header>
      <main id="main-content" ref={main} tabIndex={-1}>
        <Outlet />
      </main>
      <footer>
        Машины и механизированные процессы транспортного строительства
      </footer>
    </>
  );
}
