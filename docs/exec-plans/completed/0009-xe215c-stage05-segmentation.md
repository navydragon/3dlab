# Stage 05 — educational segmentation

Source: immutable stage 04 checkpoint. Scope: Blender metadata and inspection,
with no application mapping, export, geometry edits or new kinematic hierarchy.

1. Audit every stage 04 mesh; assign one of nine canonical component IDs or the
   auxiliary bucket-linkage subsystem using explicit membership.
2. Add reproducible metadata builder and independent checker. Preserve source
   transforms, parents, topology, geometry, display settings and source files.
3. Extract a manifest with geometry counts, technical anchors and actual controlling
   nodes. Exercise selection, display highlighting, hiding and isolation.
4. Render one neutral overview and nine isolated groups; restore full visibility
   and save stage 05. Reopen and independently verify; review images.
5. Run repository validation; commit and push current branch; verify clean status.

Affected entity: existing `excavator` educational components only. This is an asset
preparation layer, not a change to domain relationships or application architecture.

## Completed — 2026-10-03

- Added explicit scalar educational metadata for nine components; 95 canonical
  meshes, six auxiliary bucket-linkage meshes, six cylinder technical anchors.
- Retained every stage 04 object/datablock, parent, collection, origin, neutral
  transform, topology, local/world vertex and display setting without edits.
- Manifest contains exact membership, counts, anchors and controlling nodes per
  object, including cylinders distributed across existing parent branches.
- Builder exercises selection/highlight/hide/isolation with full restoration.
  Independent reopened checker passes 61 checks; unclassified major meshes 0,
  geometry error 0 m; unchanged 101 meshes / 3818 vertices / 7004 triangles.
- One overview and nine isolation images visually reviewed; saved neutral blend
  is full-visible with original camera, render path, colors and selection.
- No application/domain architecture or UI behavior changed. Hydraulics/linkage
  remain static; no exports, application mapping, rigging or geometry edits.
- Repeated generation gives identical manifest/inspection SHA256 hashes;
  reopened checker passes again. Repository format/lint/types/content validation,
  184 tests in 8 files and production build pass; no UI changes require new E2E.
- Earlier-stage Git diff is empty; ordinary blend storage follows existing repo
  rules (no LFS attributes). Final commit/push status reported in the task.
