import { Link } from 'react-router';
export function EntityNotFound({
  title,
  recoveryPath,
  recoveryLabel,
}: {
  readonly title: string;
  readonly recoveryPath: string;
  readonly recoveryLabel: string;
}) {
  return (
    <>
      <h1>{title}</h1>
      <p>Проверьте адрес или выберите доступную запись.</p>
      <Link to={recoveryPath}>{recoveryLabel}</Link>
    </>
  );
}
