import type {
  MachineId,
  MachineRoleId,
  SimulationModelId,
} from '../domain/ids';
import type { SystemParticipantDefinition } from '../domain/production-system';
import type { SimulationScenario } from './simulation-scenario';
import { MODEL_ID } from '../simulation/contracts.ts';
import { calculate } from '../simulation/calculate.ts';

// Model-specific interpretation, not general relationship/query logic.
const excavator = {
  roleId: 'excavation-lead-machine' as MachineRoleId,
  machineId: 'excavator' as MachineId,
};
const truck = {
  roleId: 'soil-haul-vehicle' as MachineRoleId,
  machineId: 'dump-truck' as MachineId,
};
function samePair(a: SystemParticipantDefinition, b: typeof excavator) {
  return a.roleId === b.roleId && a.machineId === b.machineId;
}
const earthworksV1 = Object.freeze({
  id: MODEL_ID as SimulationModelId,
  calculate,
  acceptsStructure(definitions: readonly SystemParticipantDefinition[]) {
    return (
      definitions.length === 2 &&
      definitions.some(
        (p) => samePair(p, excavator) && p.minCount === 1 && p.maxCount === 1,
      ) &&
      definitions.some((p) => samePair(p, truck))
    );
  },
  participantCount(
    participant: SystemParticipantDefinition,
    scenario: SimulationScenario,
  ): number | undefined {
    if (samePair(participant, excavator)) return 1;
    if (samePair(participant, truck)) return scenario.input.truck.truckCount;
    return undefined;
  },
});

export function getSupportedSimulationModel(id: SimulationModelId) {
  return id === earthworksV1.id ? earthworksV1 : undefined;
}
