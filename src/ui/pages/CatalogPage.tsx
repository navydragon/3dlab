import { ContentNotice } from '../components/ContentNotice';

export function CatalogPage({
  kind,
}: {
  readonly kind: 'machines' | 'processes';
}) {
  return (
    <>
      <h1>{kind === 'machines' ? 'Машины' : 'Процессы'}</h1>
      <ContentNotice />
      <p>Каталог появится после подключения проверенных предметных данных.</p>
    </>
  );
}
