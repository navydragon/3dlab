import { createContext, useContext } from 'react';
import type { DomainRepository } from '../../content/repository';
export const DomainContext = createContext<DomainRepository | null>(null);
export function useDomainRepository() {
  const repository = useContext(DomainContext);
  if (!repository) throw new Error('Domain repository provider is missing');
  return repository;
}
