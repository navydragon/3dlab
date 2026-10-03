import { Link } from 'react-router';
import { routes } from '../../navigation/routes';

export function HomePage() {
  return (
    <>
      <p className="eyebrow">Интерактивная цифровая лаборатория</p>
      <h1>Машины и механизированные процессы транспортного строительства</h1>
      <p className="intro">
        Лаборатория для изучения машин, их конструкции и работы в
        технологических процессах.
      </p>
      <p>
        Первый MVP посвящён гидравлическому экскаватору, автосамосвалам и
        процессу разработки и транспортирования грунта.
      </p>
      <p className="muted">
        Сейчас доступна оболочка приложения. Учебные материалы, 3D и расчёты ещё
        не подключены.
      </p>
      <div className="entry-grid">
        <Link className="entry" to={routes.machines}>
          <span className="entry-title">Машины</span>
          <span>Вход через машину</span>
          <span aria-hidden="true">→</span>
        </Link>
        <Link className="entry" to={routes.processes}>
          <span className="entry-title">Процессы</span>
          <span>Вход через технологический процесс</span>
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </>
  );
}
