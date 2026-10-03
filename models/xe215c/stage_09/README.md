# Stage 09 — final GLB inspection and application mapping

Production source: `../stage_08/excavator.glb`, immutable together with Stage 01–08.
No re-export, geometry/material/hierarchy/animation edit or Blender assumption is
used to build mappings. Inspection reads the actual GLB JSON and binary accessors.

## Application delivery

Authoritative metadata: `content/3d/xe215c.json`, using the existing `Asset3D`,
`SceneNodeMapping` and `AnimationMapping` contracts. Optional `production` evidence
extends that record; there is no second mapping schema. Asset ID `excavator-main`,
version `1.0.0`, machine ID `excavator`; all nine components are existing domain IDs.

Static delivery: `public/assets/3d/xe215c/v1_0_0/excavator.glb`, an exact byte copy of
the source, and adjacent `manifest.json`, a generated copy of the same Asset3D
record. Vite includes these files in the production build. The base-relative URI
is `assets/3d/xe215c/v1_0_0/excavator.glb`; a future viewer resolves it against the
application base. Metadata discovery/content validation includes the new record.
The current application has no renderer or selection/highlight controls, so this
stage connects the existing content/static asset pipeline and supplies complete
mesh sets for those future interactions without introducing a new viewer/API.

## Reproduction and verification

```sh
npm run assets:generate
npm run assets:validate
npm run validate
npm run test:e2e
```

Generator/checker: `scripts/stage_09_assets.ts`; binary inspector and mapping
checks: `scripts/glb-inspection.ts`. `inspection.json` inventories every exact node
name, parent/child relation, mesh/material ownership, extras, static TRS and
animation channel, plus SHA256, size, statistics and Stage 01–08 source hashes.
Generation changes only Stage 09 and application delivery files. Validation never
writes them. Generated metadata is formatted reproducibly.

Real source/public GLB SHA256:
`36b1d77283b435c3d7c24079431c55de88ee8f6e3ecb52375c75352495c8a5c5`.
Size **600324 bytes**; **106 nodes**, **101 meshes**, **7004 triangles**, **7
materials**, **0 textures/external resources**. Units: meters, glTF Y up.

## Component mapping

Mesh counts: undercarriage **39**; upperstructure **14**; power-unit **5**; boom
**4**; stick **4**; bucket **14**; boom-cylinder **5**; stick-cylinder **5**;
bucket-cylinder **11**. All 101 mesh-bearing nodes are mapped once, without dangling
references or unclassified meshes. Canonical transform nodes are excluded from
component visibility sets so isolating a component does not accidentally hide
unrelated descendants.

`edu_component` supplies identity for 95 meshes. The other six explicitly carry
`edu_role=auxiliary`, `edu_subsystem=bucket-linkage`. Application assembly policy
groups those linkage meshes with the five bucket-cylinder meshes, covering the
full bucket actuation mechanism for highlight/hide/isolate. This changes no domain
ID or GLB extras. Their `edu_selectable=false` remains authoritative for direct
hit eligibility. A future renderer uses exact asset-scoped name lookup, never node
or mesh indices, and keeps highlight materials local to its own scene.

Canonical transform chain:
`NODE_UNDERCARRIAGE` → `NODE_UPPERSTRUCTURE` → `NODE_BOOM` → `NODE_STICK` →
`NODE_BUCKET`. Root and local pivot TRS come directly from the immutable GLB.

## Animation contract

Activity `excavator-working-cycle` maps by exact name to
`excavator_work_cycle_demo`. Duration **11.666666984558105 seconds**. One loopable
clip, 48 channels: four canonical nodes (`NODE_UPPERSTRUCTURE`, `NODE_BOOM`,
`NODE_STICK`, `NODE_BUCKET`) and 20 secondary cylinder/linkage nodes. Exact
secondary names and channel properties are in the manifest/inspection; none are
Blender rig helpers. Loopability is verified from matching channel endpoints
(quaternion sign equivalence included); Stage 08 separately verified imported
world transforms and coordinated motion.

Static node TRS describes the neutral rest pose. Clip time zero is the digging
pose, distinct from rest. Pausing/stopping animation alone does not guarantee
neutral: a future viewer explicitly restores cached static TRS when resetting.
Playback APIs use seconds; no Blender frame numbers are required in runtime.
Duration is visual demonstration time, never engineering cycle time or an input
to productivity calculations. No instructional phase boundaries are inferred.

## Validation and limits

Automated checks validate actual GLB SHA256/size, canonical hierarchy, name
uniqueness, all nine domain IDs, mesh completeness/ownership, materials/statistics,
clip existence/duration/animated names/endpoints and public copy equality.
Negative tests cover stale integrity, dangling/missing/wrong mappings and broken
hierarchy. A repacked test GLB with reversed node indices resolves the same
mapping. Production HTTP E2E downloads the GLB and manifest, validates their actual
bytes and resolves all mappings; it does not claim rendered GPU interaction.
Repository validation passes all formatting/lint/type/content/asset checks, 190
tests and the production build. All five E2E tests pass. Repeated generation gives
identical manifest/inspection hashes; Stage 01–08 files and scripts remain unchanged.

The sampled clip carries no procedural hydraulic solver; Stage 08 measured
subframe control-time surface error up to 0.1484 mm. Browser rendering performance,
target-device appearance and viewer interactions remain unmeasured/unimplemented.
Source model geometry is educational reconstruction, not a manufacturer CAD model.
