import { createContext, useContext } from 'react';
import type { FoundationLoad } from '../../content/foundation-repository';
export const FoundationContext = createContext<FoundationLoad | null>(null);
export function useFoundationContent() {
  const content = useContext(FoundationContext);
  if (!content) throw new Error('Foundation provider is missing');
  return content;
}
