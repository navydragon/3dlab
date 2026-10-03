import { Link } from 'react-router';
import { routes } from '../../navigation/routes';

export function RouteErrorPage({
  invalid = false,
}: {
  readonly invalid?: boolean;
}) {
  return (
    <>
      <h1>{invalid ? 'Некорректный адрес' : 'Страница не найдена'}</h1>
      <p>
        {invalid
          ? 'Проверьте идентификаторы и параметры ссылки.'
          : 'Для этого адреса нет страницы приложения.'}
      </p>
      <Link to={routes.home}>На главную</Link>
    </>
  );
}
