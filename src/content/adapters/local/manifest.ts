// Explicit manifest shared by bundler imports and the Node validation command.
export const domainFiles = {
  machines: 'machines.json',
  machineComponents: 'machine-components.json',
  operations: 'operations.json',
  machineRoles: 'machine-roles.json',
  processes: 'processes.json',
  processStages: 'process-stages.json',
} as const;
