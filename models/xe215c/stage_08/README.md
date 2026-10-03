# Stage 08 — production GLB

Immutable input: `../stage_07/xe215c_stage_07.blend`. Stages 01–07 and their
generators are unchanged. No application mapping is introduced.

## Reproduction and independent verification

Run from the repository root with Blender 5.2.2 LTS:

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/blender/stage_08_export.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/blender/check_stage_08.py
```

The exporter creates a temporary scene in memory, exports `excavator.glb`, imports
the actual GLB into a clean scene, writes `inspection.json`, and renders the
imported neutral and lifted checkpoints. It never saves the source Blender file.
The second command independently verifies the saved GLB and source hashes.
Two complete exports produced an identical GLB SHA256:
`36b1d77283b435c3d7c24079431c55de88ee8f6e3ecb52375c75352495c8a5c5`.

## Export contract

- 106 nodes: 101 machine meshes and five canonical transform nodes, with exact
  original names and the chain `NODE_UNDERCARRIAGE` → `NODE_UPPERSTRUCTURE` →
  `NODE_BOOM` → `NODE_STICK` → `NODE_BUCKET`.
- All source `edu_*` extras survive, including the nine component IDs:
  `undercarriage`, `upperstructure`, `power-unit`, `boom`, `stick`, `bucket`,
  `boom-cylinder`, `stick-cylinder`, `bucket-cylinder`. Auxiliary linkage metadata
  also survives. These are asset metadata for subsequent Stage 09 mapping.
- Procedural supports are removed. Secondary meshes are parented to their nearest
  retained canonical ancestor and their rigid local transforms are baked.
  Canonical pivots, rest transforms, geometry and materials are preserved.
- No cameras, lights, guides, anchors, rig helpers, skins, drivers or constraints
  are exported. Checkpoint lighting and camera exist only in the verification scene.
- Units remain meters. glTF uses Y up; Blender's source Y rotation axis becomes
  glTF negative Z and source Z becomes glTF Y. Extras explicitly distinguish
  `source_rotation_axis_local` from `gltf_rotation_axis_local`.
- Seven opaque PBR materials; no images, textures or external resources. Materials
  retain base color, metallic and roughness, plus flat/smooth corner normals.

## Animation and rest pose

The sole clip is `excavator_work_cycle_demo`, with 48 channels on 24 animated
objects. Evaluated procedural motion is sampled at 96 Hz (1121 samples), using
linear translation and quaternion tracks. Only the temporary scene uses that
sampling frame rate.

Source frames 1–281 at 24 fps map to GLB time 0–11.666667 seconds. Reimport at
24 fps produces action frames 0–280. Static node TRS preserves the separate source
neutral rest pose at frame 0; playing the clip at time zero selects its digging
pose. Loop endpoints match. No original action or procedural rig is modified.

## Statistics and checks

Actual GLB size: **600324 bytes (586.254 KiB)**. It contains 101 meshes/primitives,
7004 triangles and 9280 exported vertices. Source geometry has 3818 vertices;
vertex splitting preserves normal discontinuities without increasing triangles.

All **275 checks** pass after real GLB import: exact names/parents/extras, clip and
range, binary accessors, geometry/material counts and factors, corner normals,
rest matrices/pivots/surface/bounds, animated matrices/surface/bounds at 19 control
times, loop closure, absence of technical helpers and immutable source hashes.
Integer source frames use a 0.02 mm tolerance. Four additional times between bake
samples use a 0.2 mm tolerance; observed maximum surface error is 0.1484 mm.
Detailed measurements and bounds are in `inspection.json`.

`checkpoints/roundtrip_neutral.png` and `checkpoints/roundtrip_lifted.png` show the
imported geometry with the Stage 07 technical lighting and camera. Visual review
confirmed the retained silhouette and material appearance.

## Limits

The clip is a sampled demonstration, not an interactive hydraulic solver.
Interpolation between samples approximates the procedural source within the
measured tolerances. Browser performance and application mapping are not tested;
the final appearance also depends on application lighting and tone mapping.
