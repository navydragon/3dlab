import { createContext, useContext } from 'react';
import type { ProductionSystemLoad } from '../../content/production-system-repository';
export const SystemsContext = createContext<ProductionSystemLoad | null>(null);
export function useSystemsContent() {
  const content = useContext(SystemsContext);
  if (!content) throw new Error('Production system provider is missing');
  return content;
}
