# Stage 06 — controlled visual kinematics and work cycle

Immutable input stage 05; stages 01–05 remain unchanged. Asset animation only:
no domain simulation formulas, engineering timing or application mapping changes.

1. Measure neutral attachment geometry and select a reachable continuous planar
   linkage branch. Preserve canonical nodes/pivots and educational membership.
2. Add technical helpers: rigid rocker/link motion and rigid cylinder barrel/rod
   orientation/translation. Reparent only affected auxiliary geometry/anchors.
3. Gate A: independently validate neutral and five representative poses, lengths,
   endpoint continuity, stroke overlap, transforms and deterministic reset.
4. Gate B: create one smooth, looping canonical-control action; validate intermediate
   frames and an isolated bake copy without changing the procedural rig.
5. Render seven phases and a contact sheet; visually review gross intersections.
6. Save neutral/rest checkpoint; run repo validation, commit/push and verify clean Git.

All angle ranges, hydraulic travel and timing are illustrative visual choices.
## Completed — 2026-10-03

- Built persistent native math drivers for one planar linkage branch and rigid
  Copy Location / Locked Track cylinder helpers; nine technical empties added.
- Preserved all meshes/triangles, local geometry/topology, canonical nodes/pivots,
  primary parents and educational membership; changed only auxiliary parents.
  No technical-anchor coordinate adjustments were needed.
- Gate A: seven representative poses, constant linkage/cylinder geometry,
  pin/axis continuity, finite transforms, positive overlap and neutral reset pass.
- Created one four-slot action `excavator_work_cycle_demo`, frames 1–281 / 24 fps;
  matching first/last pose, flat loop tangents, explicit rest at frame 0.
- Reopened independent checker passes 123 checks, including all 281 cycle frames
  and stage 05 selection/highlight/hide/isolation behavior.
- Isolated bake: 282 integer samples, 49 geometry comparison frames; maximum
  error about 0.0033 mm under 0.01 mm tolerance; procedural rig retained.
- Seven phase renders and labeled sheet reviewed for gross collisions; saved
  blend neutral/full-visible. No geometry edits, materials, GLB or app mapping.
- Repository format/lint/types/content validation, 184 tests in eight files and
  production build pass. Earlier-stage Git diff is empty; no LFS attributes apply.
  Final commit/push/clean status reported with artifacts.
