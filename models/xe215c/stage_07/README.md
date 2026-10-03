# XE215C — stage 07 compact PBR materials and real-time audit

Immutable input: `models/xe215c/stage_06/xe215c_stage_06.blend`. Stages 01–06 and
their scripts remain unchanged. Stage 07 assigns reusable generic industrial
materials and audits the accepted asset; it does not export GLB, create application
mapping, change the mechanism or expand its tested visual envelope.

Saved checkpoint: frame 0, neutral/rest and full mesh visibility. Geometry remains
**101 meshes, 3818 vertices, 7004 triangles**, with unchanged local vertices,
edges/faces, mesh datablock references, parents, canonical hierarchy/pivots,
anchors, component metadata, rig constants, constraints, drivers and animation.

## Reproduce and inspect

From repository root, adapting your Blender executable path:

```powershell
blender --background --factory-startup --python-exit-code 1 --python scripts/blender/stage_07_materials_optimization.py
blender --background models/xe215c/stage_07/xe215c_stage_07.blend --python-exit-code 1 --python scripts/blender/check_stage_07.py
```

Run the builder as a batch process, not inside unrelated unsaved work. It opens
stage 06, assigns materials and smooth/flat face flags, creates preview lighting,
renders the checkpoint set and saves only stage 07. The independent checker
opens stage 06 read-only, captures geometry/rig/action and sampled world transforms,
then reopens stage 07 and compares without saving either blend.

## Seven production materials

Every active machine mesh has exactly one material slot and all polygons use
slot zero. Seven shared materials are used across 101 meshes; no unused production
materials or duplicated slots remain. Each graph is exactly Principled BSDF →
Material Output, with unlinked volume/displacement, alpha 1 and transmission 0.
No texture, noise or procedural shader nodes. External textures/image dependencies:
**0**. Output checkpoint PNGs are not material inputs or packed dependencies.

The authored palette is sRGB, converted to linear material values in the builder:

- `industrial_body_yellow`: generic yellow `(0.94, 0.67, 0.08)`, metallic 0.10,
  roughness 0.43; 22 meshes. Body/platform/cab frame, boom/stick shells/plates,
  painted bucket shell/cheeks/ears, counterweight and power-unit service panels.
- `dark_chassis`: `(0.16, 0.18, 0.19)`, metallic 0.35, roughness 0.62;
  35 meshes. Structural undercarriage, wheels/rollers, frames and slew support.
- `track_dark`: `(0.105, 0.12, 0.13)`, metallic 0.40, roughness 0.78;
  four track band/tread meshes.
- `cab_glass_dark`: `(0.065, 0.105, 0.13)`, metallic 0.05, roughness 0.22;
  six window display meshes. Opaque dark glass-like treatment avoids alpha sorting
  and hiding the absent cab interior; it does not simulate transparent glass.
- `hydraulic_dark`: `(0.22, 0.24, 0.25)`, metallic 0.55, roughness 0.42;
  23 meshes. Cylinder barrels/glands/end fittings, linkage and major pin supports.
- `hydraulic_rod_metal`: `(0.72, 0.75, 0.78)`, metallic 1.00, roughness 0.23;
  three rigid cylinder rods, visually distinct from barrels and structure.
- `cutting_edge_steel`: `(0.32, 0.35, 0.37)`, metallic 0.75, roughness 0.55;
  eight cutting-edge/tooth/wear-rib meshes. No weathering textures.

Colors are generic industrial choices, not XCMG color specifications. No branding,
logos, decals or interior detailing. Material identity is independent of educational
component identity: a bucket or cylinder can use several physical materials while
selection/isolation continues to query the unchanged object metadata.

Matching solid-view object colors use `color_type = OBJECT` so the existing stage 05
temporary object-color highlighter remains usable. Eevee renders use PBR materials;
object display highlighting does not override the Eevee shader. Future application
highlight rendering belongs to the application layer, not this checkpoint.

## Shading and optimization audit

No decimation, merging, remeshing, modifiers or polygon-count changes. Round sides
of rollers, wheels, hubs, pin eyes, bearing ring and cylinder segments use smooth
face flags; caps remain flat. Structural shells, teeth, track bands and panel planes
retain their accepted faceted geometry. `inspection.json` lists changed smooth-face
counts by object. Silhouette, local vertex positions and face topology are unchanged.

The audit finds finite coordinates, no zero-area triangles at the 1e-12 m² threshold,
identity scales, 101 unique mesh datablocks and no exact duplicate vertex/face
datablock groups. Similar translated repeated parts are deliberately not reauthored
or merged. There are 101 mesh/material primitives before export, seven production
materials, zero alpha-blended surfaces and no external texture load.

This is a structural real-time suitability audit, not a browser performance benchmark:
actual exported size, vertex splits, draw calls, shadow passes and WebGL fps remain
unmeasured until the later export/integration stage. Independent educational objects
and animation ownership take priority over speculative draw-call reduction.

## Frozen mechanism regression

`excavator_work_cycle_demo` remains exactly the accepted four-slot action, with
all authored channel paths, indices, key coordinates, interpolation/handle types
and handle coordinates unchanged. Clip **1–281 @ 24 fps**, explicit rest frame 0.
Canonical chain, accepted pivots, anchors, cylinder/linkage parents, constraint
configuration, driver expressions/targets and linkage/cylinder constants match
stage 06. No new rig or armature; only three technical preview AREA lights added.

Independent regression evaluates frames 0, 1, 13, 27, 41, 59, 81, 103, 131, 148,
166, 191, 209, 236, 253, 281. It compares all original object world transforms and
mesh world vertices with stage 06, and runs the stage 06 independent cylinder/
linkage tests at each sample. Endpoint continuity, axis collinearity, rigid lengths,
rod overlap, planar branch and primary mesh inheritance pass. Maximum world-vertex
motion difference from stage 06: **0 m**. First/last transforms match, drivers and
constraints remain valid, and reset returns to neutral. Tolerance 0.01 mm.

All nine component IDs and auxiliary linkage classification are preserved;
unclassified major meshes **0**. Stage 05 select/highlight/hide/isolate tests pass.
The stage 06 bake procedure remains available unchanged for the later export stage.
No bake is substituted for the procedural rig in this saved asset.

**133 checks pass after reopening**: source hashes for all stages 01–06, exact
geometry/topology/inventory, parents/metadata, complete rig/action freeze, sampled
motion, rest/loop, materials/slots/usage/graphs, finite/nondegenerate geometry,
images, scales, helper classification and educational controls.
Repository format/lint/types/content validation, 184 tests in eight files and
the production build all pass. Earlier-stage Git diff is empty.

## Preview and limitations

Nine Eevee PNGs in `checkpoints/`: left, right, front, rear, top,
three_quarter_front, three_quarter_rear at frame 0; lifted at 81 and slewed_dump
at 166. Existing orthographic cameras are reused; the moving views use the same
three-quarter camera as the neutral overview. 1400 × 900, 64 Eevee samples,
AgX Medium High Contrast, constant neutral world and three broad neutral area
lights. No floor/environment geometry, HDR image, scenery or advertising composition.
Cylinder rods, linkage and bucket stay visible. `material_contact_sheet.png` is
a labeled 3 × 3 review sheet assembled from those actual PNGs with Blender buffers.
All nine images and the sheet were visually reviewed.

Inherited limitations: faceted reconstructed shells, no detailed interior, opaque
window surfaces, one illustrative boom cylinder and estimated mechanical dimensions.
Negative bucket angles remain outside the guaranteed reconstructed linkage reach;
stage 06 safe ranges and demonstration timing are unchanged and not factory limits
or productivity values. Materials are simple opaque metallic/roughness approximations,
not glass optical simulation, texture weathering or photorealism. Optional Blender
thumbnail/user-preference warnings do not affect the saved outputs or reopened checks.
