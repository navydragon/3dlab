import { Link } from 'react-router';
import {
  getMachineCatalog,
  getProcessCatalog,
} from '../../application/domain-queries';
import { machinePath, processPath } from '../../navigation/routes';
import { useDomainRepository } from '../providers/domain-context';
export function CatalogPage({
  kind,
}: {
  readonly kind: 'machines' | 'processes';
}) {
  const repository = useDomainRepository();
  const entries =
    kind === 'machines'
      ? getMachineCatalog(repository).map((machine) => ({
          entity: machine,
          path: machinePath(machine.id),
        }))
      : getProcessCatalog(repository).map((process) => ({
          entity: process,
          path: processPath(process.id),
        }));
  return (
    <>
      <h1>{kind === 'machines' ? 'Машины' : 'Процессы'}</h1>
      {entries.length === 0 ? (
        <p>В каталоге пока нет записей.</p>
      ) : (
        <ul className="card-list">
          {entries.map(({ entity, path }) => (
            <li className="card" key={entity.id}>
              <h2>
                <Link to={path}>{entity.name}</Link>
              </h2>
              {entity.description && <p>{entity.description}</p>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
