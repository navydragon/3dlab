import { createContext, useContext } from 'react';
import type { ProductivityLoad } from '../../content/productivity-repository';
import type { SimulationScenarioRepository } from '../../content/simulation-scenario-repository';
export interface ProductivityEnvironment {
  readonly learning: ProductivityLoad;
  readonly scenarios: SimulationScenarioRepository | null;
}
export const ProductivityContext = createContext<ProductivityEnvironment>({
  learning: { status: 'invalid', issues: [] },
  scenarios: null,
});
export const useProductivityContent = () => useContext(ProductivityContext);
