# Stage 08 — production GLB and independent round-trip validation

Immutable source: stage 07. No application mapping or earlier-stage edits.

1. Capture source geometry/materials/extras, canonical parents/pivots, rest and
   animation samples; inspect installed Blender glTF exporter options.
2. Build a temporary export scene of 101 meshes and five canonical nodes only.
   Bake secondary rigid transforms relative to canonical parents; keep geometry,
   names/materials/component extras. Remove all procedural/debug/lighting helpers.
3. Export one self-contained GLB with one named work-cycle clip and rest transforms.
4. Parse actual GLB JSON/binary and import into a clean Blender scene. Independently
   compare hierarchy/names/extras, triangle/material counts, rest/animation
   transforms, surface geometry and bounds; account explicitly for seconds/frame
   origin and glTF normal-driven vertex splits.
5. Record real bytes/statistics and limitations, run repo validation, commit/push
   current branch and verify clean status.

Status: complete.

Result: self-contained 600324-byte GLB; 106 nodes, 101 meshes, 7004 triangles,
seven materials, zero textures, nine component IDs and one named demo clip.
Temporary 96 Hz bake preserves canonical pivots and evaluated secondary motion.
Real import passes 275 checks at 19 control times, including normals, transforms,
geometry, materials, bounds and source immutability. Maximum measured subframe
surface deviation is 0.1484 mm. Repeated export gives identical GLB SHA256.

Validation: independent checker passes all 275 checks; `npm run validate` passes
formatting, lint, type checks, content validation, all 184 tests and production
build. `git diff --check` passes. No earlier-stage assets/scripts were changed.
