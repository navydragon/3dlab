# Stage 07 — compact PBR materials and real-time asset audit

Input: immutable stage 06. Stages 01–06 and their scripts remain unchanged.
Asset presentation only; no domain semantics, application mapping or export.

1. Snapshot geometry, metadata, canonical transforms, complete rig and authored
   action; audit triangles, slots, images and finite/nondegenerate geometry.
2. Assign seven reusable opaque Principled materials with no textures; retain
   topology and independent component meshes. Smooth only appropriate curved
   surfaces, keeping manufactured planes/caps flat and silhouette unchanged.
3. Set up a neutral reproducible Eevee preview with technical area lights.
   Render seven neutral views and lifted/dump; create a labeled contact sheet.
4. Independently check source hashes, unchanged rig/action/topology/membership,
   material graph/assignment/usage and sampled motion regression against source.
5. Reopen saved rest checkpoint; visually review; run repo validation; commit/push
   current branch and verify clean status.

No decimation or merging is justified by the accepted 101 meshes/7004 triangles.
## Completed — 2026-10-03

- Assigned seven reusable opaque two-node Principled PBR materials, one slot per
  machine mesh, with no images/textures or branding. Preserved metadata-based
  segmentation and object-color highlighting in Solid mode.
- Smooth round sides, keep caps/structural planes flat; no topology, local vertex,
  silhouette, datablock, parent, pivot/anchor or rig/action changes.
- Audit: 101 meshes / 3818 vertices / 7004 triangles, identity scales, zero-area
  triangles 0, exact duplicate datablock groups 0, unclassified major meshes 0.
- Reopened checker passes 133 checks; complete constraint/driver/action freeze
  and 16-frame source motion regression pass with zero world-vertex difference.
- Saved rest frame 0, full-visible rig. Nine orthographic Eevee views and labeled
  contact sheet visually reviewed, including lifted and slewed/dump.
- No GLB, application mapping, new rig, textures or browser performance claims.
  Repository format/lint/types/content validation, 184 tests in eight files and
  production build pass. Earlier-stage Git diff is empty; ordinary blend storage
  follows existing repo rules with no LFS attributes. Final Git status reported
  with artifacts.
