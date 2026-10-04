import { createContext, useContext } from 'react';
import type { WorkingCycleLoad } from '../../content/working-cycle-repository';
export const WorkingCycleContext = createContext<WorkingCycleLoad>({
  status: 'invalid',
  issues: [],
});
export const useWorkingCycleContent = () => useContext(WorkingCycleContext);
