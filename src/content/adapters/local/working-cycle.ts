import pack from '../../../../content/learning/working-cycle.json';
import { createWorkingCycleRepository } from '../../working-cycle-repository';
import type { DomainRepository } from '../../repository';
import type { AssetRepository } from '../../asset-repository';
export function loadLocalWorkingCycle(
  domain: DomainRepository,
  assets: AssetRepository,
) {
  return createWorkingCycleRepository(pack, domain, assets);
}
