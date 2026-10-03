# Stage 09 — inspect immutable GLB and connect existing Asset3D metadata

1. Inspect real GLB bytes: names, hierarchy, meshes/extras, materials, clips,
   animated nodes, duration, counts, size and SHA256. Keep Stage 01–08 immutable.
2. Generate the existing Asset3D nodeMappings contract from edu_component.
   Explicitly group six auxiliary bucket-linkage meshes under bucket-cylinder
   for component visibility/highlight sets, retaining nonselectable hit semantics.
3. Add optional production evidence to Asset3D metadata instead of a second
   mapping format. Publish byte-identical GLB and manifest through public/assets/3d.
4. Validate actual topology, mapping completeness, domain IDs, clip/loop endpoints,
   public bytes and reproducibility; test shuffled GLB indices and broken mappings.
5. Run repo validation and production static HTTP E2E, document limitations,
   commit/push current branch and verify clean status.

Scope: existing content metadata/static asset pipeline only. No renderer, UI,
geometry/material/animation changes or domain entity duplication.

Status: complete.

Result: existing Asset3D contract extended with optional production evidence;
authoritative content/3d/xe215c.json, generated adjacent public manifest and exact
600324-byte GLB copy. All 101 meshes map once to the nine existing components;
six nonselectable linkage auxiliaries explicitly join bucket-cylinder. Inspection
records actual hierarchy, materials, clip channels and immutable authoring hashes.

Validation: npm run validate passes all formatting/lint/type/content/asset checks,
190 tests and production build. All five production-build E2E tests pass, including
real HTTP GLB/manifest integrity and mapping validation. Repacked test GLB reverses
node indices without changing name-based resolution. No renderer or domain entity
changes; no Stage 01–08 edits. Browser performance remains unmeasured.
