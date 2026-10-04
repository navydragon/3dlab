import { createAssetRepository } from '../../asset-repository';
import { validateDomainContent } from '../../validation';
import { localDomainContent } from './repository';

const records = import.meta.glob('../../../../content/3d/**/*.json', {
  eager: true,
  import: 'default',
});
const graph = validateDomainContent(localDomainContent);
export const localAssetRepository =
  graph.status === 'valid'
    ? createAssetRepository(Object.values(records), graph.graph)
    : { resolve: () => ({ status: 'invalid' as const }) };
