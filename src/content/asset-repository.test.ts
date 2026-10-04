import { describe, expect, it } from 'vitest';
import metadata from '../../content/3d/xe215c.json';
import { createAssetRepository } from './asset-repository';
import { localDomainContent } from './adapters/local/repository';
import { validateDomainContent } from './validation';
import { isMachineId } from '../domain/ids';
const valid = validateDomainContent(localDomainContent);
if (valid.status !== 'valid') throw new Error('Invalid production graph');
const graph = valid.graph;
function id(value: string) {
  if (!isMachineId(value)) throw new Error('Invalid ID');
  return value;
}
describe('subject-driven asset repository', () => {
  it('resolves production metadata, missing and ambiguous assets explicitly', () => {
    const repository = createAssetRepository([metadata], graph);
    expect(repository.resolve(id('excavator')).status).toBe('available');
    expect(repository.resolve(id('dump-truck')).status).toBe('unavailable');
    expect(
      createAssetRepository(
        [metadata, { ...metadata, id: 'alternate' }],
        graph,
      ).resolve(id('excavator')).status,
    ).toBe('ambiguous');
    expect(
      createAssetRepository(
        [{ ...metadata, subjectId: 'missing' }],
        graph,
      ).resolve(id('excavator')).status,
    ).toBe('invalid');
  });
  it('continues to resolve when subject identity changes in a test graph', () => {
    const other = id('different-machine');
    const changed = {
      ...graph,
      machines: graph.machines.map((m) =>
        m.id === metadata.subjectId ? { ...m, id: other } : m,
      ),
      machineComponents: graph.machineComponents.map((c) => ({
        ...c,
        machineId: other,
      })),
    };
    expect(
      createAssetRepository(
        [{ ...metadata, subjectId: other }],
        changed,
      ).resolve(other).status,
    ).toBe('available');
  });
});
