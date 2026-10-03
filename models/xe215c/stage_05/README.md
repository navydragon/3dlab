# XE215C — stage 05 educational segmentation

Immutable input: `models/xe215c/stage_04/xe215c_stage_04.blend`. This checkpoint
adds an educational metadata layer; it preserves all accepted objects, mesh
datablocks, local/world vertices, edges/faces, origins, transforms, parents,
collection membership and display colors. Stages 01–04 and their scripts remain
unchanged. No GLB or application mapping is created.

## Reproduce and inspect

From repository root, adapting the Blender executable path:

```powershell
blender --background --factory-startup --python-exit-code 1 --python scripts/blender/stage_05_segmentation.py
blender --background models/xe215c/stage_05/xe215c_stage_05.blend --python-exit-code 1 --python scripts/blender/check_stage_05.py
```

The builder always opens the immutable source and regenerates only stage 05;
run it as a batch process, not in an unrelated unsaved Blender session. It
imports the checker, never executes an earlier generator, and does not depend on
UI selection. The checker independently opens stage 04, captures actual scene
data, reopens stage 05 and compares without saving either file.

## Membership contract

Schema version 1 uses scalar custom properties:

- All classified scene objects: `edu_machine = "excavator"`.
- Canonical geometry: `edu_component = "<canonical-id>"`,
  `edu_role = "geometry"`, `edu_selectable = true`, `edu_renderable = true`.
- Cylinder anchors retain the corresponding `edu_component` but have
  `edu_role = "technical"`, `edu_selectable = false`, `edu_renderable = false`.
- Six linkage meshes: `edu_role = "auxiliary"`,
  `edu_subsystem = "bucket-linkage"`, no `edu_component`,
  `edu_selectable = false`, `edu_renderable = true`. They remain ordinary
  individually selectable Blender objects, but are excluded from canonical
  educational component selection. Four linkage anchors are technical objects
  with the same subsystem.
- Guides, control/pivot empties, cameras and other service objects:
  `edu_role = "technical"`, selectable/renderable metadata false.

These flags describe educational membership, not persistent Blender visibility
or `hide_select`. Geometry queries require MESH type, machine ID, component ID
and selectable metadata. Technical cylinder anchors must not be highlighted or
shown as educational geometry. Existing `stage_owner` and stage 04 properties
are retained as provenance; the active scene is `XE215C_STAGE_05`.

Explicit authored membership produces these object counts:

- `undercarriage`: 39 meshes — bands/treads, wheels/hubs, rollers, crawler frames,
  caps, X-frame/gussets, slew support and bearing.
- `upperstructure`: 14 meshes — platform, cab/window display panels, roof/sill,
  counterweight, boom mounting base and tower supports.
- `power-unit`: 5 meshes — external engine/service body and four large panels.
  This is a compartment representation, not internal engine geometry.
- `boom`: 4 meshes — shell, two side plates and root boss.
- `stick`: 4 meshes — shell, two side plates and root boss.
- `bucket`: 14 meshes — shell, cheeks, cutting edge, five teeth, two wear ribs,
  mounting ears and root boss.
- `boom-cylinder`: 7 objects = 5 meshes + 2 technical anchors.
- `stick-cylinder`: 7 objects = 5 meshes + 2 technical anchors.
- `bucket-cylinder`: 7 objects = 5 meshes + 2 technical anchors.

All six linkage meshes, including its bucket-side attachment pin boss, belong
to the auxiliary subsystem: this keeps the linkage assembly independently
inspectable without mixing it into canonical bucket/stick membership.

`component_manifest.json` records exact object names, geometry/anchor lists,
object/mesh/vertex/triangle counts, selectable/renderable status and actual
controlling nodes per object. Logical components may span multiple parents:
boom cylinder uses upperstructure and boom; stick cylinder uses boom and stick;
bucket cylinder uses stick. No new hierarchy or reparenting is introduced.

## Programmatic controls

The builder module provides metadata-based `component_geometry`,
`select_component`, `highlight_component`, `hide_component` and
`isolate_component`. Importing it does not rebuild the scene. For example, in
the Blender Python console with the stage 05 blend open:

```python
import runpy, bpy
api = runpy.run_path(bpy.path.abspath("//../../../scripts/blender/stage_05_segmentation.py"))
api["select_component"]("bucket")
previous_colors = api["highlight_component"]("bucket")
for name, color in previous_colors.items():
    bpy.data.objects[name].color = color
api["hide_component"]("bucket", True)
api["hide_component"]("bucket", False)
```

Highlight changes only temporary Workbench object display colors and returns
the original colors for restoration. Isolation hides all other scene meshes in
viewport and render; callers should snapshot and restore visibility when using
it interactively, as `render()` does. Selection and hiding operate on geometry,
never by recursively selecting a controlling node with other components below it.

## Validation and checkpoints

61 checks pass both during generation and after reopening: source hashes across
stages 01–04, complete unchanged inventory/mesh datablocks, exact geometry and
topology, neutral transforms/origins/parents/pivots, five-node chain, metric units
and identity scales, disjoint explicit memberships, expected cylinder anchors,
auxiliary classification, helper exclusion, manifest equality, selection/isolation,
restored display/visibility, and absence of animation/actions/armatures,
constraints/drivers, materials/textures or modifiers. Builder also exercises
highlight and hide for every component and restores the original selection.

Unclassified major meshes: **0**. Geometry difference from stage 04: **0 m**.
Unchanged totals: **101 meshes, 3818 vertices, 7004 triangles**. Of these,
95 meshes belong to canonical components and six belong to auxiliary linkage.
Repeated generation produces identical manifest and inspection SHA256 hashes.
Repository format, lint, types, content validation, 184 tests and production
build pass.

`checkpoints/neutral_overview.png` and nine PNGs named by component ID use the
same inherited orthographic three-quarter camera, studio background, 1400 × 900
resolution and 11.7 m orthographic scale. Isolated parts keep their accepted
world positions; only visibility changes. All ten images were visually reviewed.
The saved blend restores the source neutral/full-visible state, camera, render
path, colors and selection. Optional Blender thumbnail-cache warnings do not
affect the saved blend or checkpoint images.

Inherited limitations: faceted reconstructed geometry, opaque windows without
interior, approximate details and attachment positions, one illustrative boom
cylinder, static uncoupled hydraulics/linkage. This stage adds no detail,
kinematic coupling, animation, materials, optimisation, export or application
mapping. No factory geometry claims are made.
