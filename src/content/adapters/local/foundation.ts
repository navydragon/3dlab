import foundation from '../../../../content/learning/foundation.json';
import { createFoundationRepository } from '../../foundation-repository';
import type { DomainRepository } from '../../repository';
export function loadLocalFoundation(domain: DomainRepository) {
  return createFoundationRepository(foundation, domain);
}
