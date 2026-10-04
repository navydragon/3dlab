import { createContext, useContext } from 'react';
import type { AssetRepository } from '../../content/asset-repository';
export const AssetContext = createContext<AssetRepository>({
  resolve: () => ({ status: 'unavailable' }),
});
export const useAssetRepository = () => useContext(AssetContext);
