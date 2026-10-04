import type { WorkingCycle, WorkingPhaseId } from '../domain/working-cycle';

// Excavation is a point anchor, not an epsilon-length visual interval.
export function resolveWorkingPhase(
  cycle: WorkingCycle,
  timeSeconds: number,
): WorkingPhaseId | null {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) return null;
  if (timeSeconds === 0) return cycle.visual.segments[0]!.phaseId;
  const ranges = cycle.visual.segments.slice(1);
  return (
    ranges.find(
      (s, i) =>
        timeSeconds >= s.startSeconds &&
        (timeSeconds < s.endSeconds! ||
          (i === ranges.length - 1 && timeSeconds === s.endSeconds)),
    )?.phaseId ?? null
  );
}
