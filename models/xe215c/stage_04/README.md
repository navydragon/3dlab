# XE215C-based educational excavator — stage 04 primary detailing

Immutable stage 03 is the input. Stages 01–03 are not modified. Stage 04 adds
low-poly construction detail while retaining all 17 accepted base meshes,
world-space neutral geometry, pivots and five-node hierarchy. Blender 5.2.2 LTS,
metric, 1 BU = 1 m, +X front, +Y machine left, Z up. Neutral rotations zero.

## Reproduce and inspect

From repository root, adapting your Blender executable path:

```powershell
blender --background --factory-startup --python-exit-code 1 --python scripts/blender/stage_04_detailing.py
blender --background models/xe215c/stage_04/xe215c_stage_04.blend --python-exit-code 1 --python scripts/blender/check_stage_04.py
```

The builder opens stage 03 read-only and writes only stage 04. Run as a batch
process, not inside unsaved unrelated work. It reuses the unchanged stage 01
mesh helpers and stage 03 keep-world parenting helper; earlier generators are
never executed. The independent checker reads stage 03, captures its actual
mesh/node data, reopens stage 04 and validates without saving either blend.

## Added construction detail

- Undercarriage: simplified idler/sprocket envelopes and hubs, seven road rollers
  and two carrier rollers per track, crawler beam caps, central gussets and slew
  bearing ring. Repeated top/end tread wedges are combined into one mesh per
  track, clipped to the accepted contour envelope. Bottom contact stays the
  accepted continuous band. No teeth on drive wheels or high-poly individual links.
- Upperstructure: dark neutral window display panels with broad frame gaps,
  front windshield/upper glazing, roof cap and sill, large service panels/top
  access cover and transverse mounting support eyes. Original cab/body shells
  remain intact; no interior, transparency shader, seals, grilles or logos.
- Boom/stick: broad side reinforcement plates following accepted taper, and
  major root/pin eyes. Box shells and fixed pin distances remain unchanged.
- Bucket: five simple wedge teeth, two wear ribs, mounting ears and transverse
  pivot boss. Shell, cheeks and lip remain separate under `NODE_BUCKET`.
- Linkage: separate rocker, connecting link and four pin bosses; four explicit
  `ANCHOR_LINKAGE_*` markers identify reconstructed attachment locations.
- Three cylinder assemblies: `boom_cylinder_*`, `stick_cylinder_*`,
  `bucket_cylinder_*`; separate barrel, rod, gland and base/rod end eyes each.
  Each has `ANCHOR_<BOOM|STICK|BUCKET>_CYL_BASE/ROD` empties.

Refs 03–06 and 08–10 inform visible construction. Added widths, plate thicknesses,
roller count/representation, tooth shape, linkage proportions and hydraulic anchor
coordinates are **visual reconstruction, not certified factory dimensions**.
One illustrative boom cylinder represents the educational assembly; twin-cylinder
configuration/mechanical sizing is not certified by this checkpoint. Cylinder
travel and bucket capacity are not inferred. No other variant dimensions used.

## Ownership and deferred coupling

Canonical chain remains `NODE_UNDERCARRIAGE → NODE_UPPERSTRUCTURE → NODE_BOOM
→ NODE_STICK → NODE_BUCKET`. New primary meshes follow their matching branches.
Static cylinder barrel/gland/base eye belong to the supporting member, rod/rod eye
to the receiving member. Bucket cylinder and rocker belong to stick; connecting
link and bucket attachment boss belong to bucket. Anchor empties follow these
same members. Detailed ownership and neutral endpoint coordinates are recorded
in `inspection.json`; each part remains independently selectable.

There are no automatic aim/extension/linkage constraints or drivers. Under
independent articulation, static parts would not maintain hydraulic/linkage closure.
Stage 6 will establish that coupling. The extra `articulated_primary_geometry.png`
temporarily hides only objects flagged `uncoupled_auxiliary` to inspect canonical
primary detail inheritance. All proxy meshes are restored visible in the saved
neutral blend. This view is not evidence of full hydraulic kinematics.

## Validation and checkpoint presentation

Checks cover unchanged source hashes and accepted base vertices/topology/parents,
canonical hierarchy/pivots/axes, zero neutral rotations, identity scales, dimensions,
detail existence, independent bucket, cylinder parts/anchors/neutral alignment,
independent name-based branch ownership, linkage markers, articulation/reset and
absence of actions, armature, constraints, modifiers, textures or logos.

Checkpoint results: 65 checks pass after reopening the blend; accepted base
world-vertex error is 0 m and all eight stage 03 input hashes match. Rebuilding
produces the identical inspection SHA256. Model: 101 meshes (84 added), 3818
vertices, 7004 triangles. Repository format/lint/types/content, 184 tests and
production build pass. All eight renders were visually reviewed.

Master: 9.625 × 2.990 × 3.100 m; tracks 2.990 / 2.390 / 0.600 m, crawler/contact
4.255 / 3.462 m, platform 2.830 m, tail 2.890 m, clearances 0.485 / 1.050 m,
boom/stick pin distances 5.680 / 2.910 m. No global scaling; 5 mm tolerance.

Seven neutral PNGs use inherited stage 02/03 orthographic cameras, 11.7 m scale,
1400 × 900 resolution and Workbench studio presentation. Display colors are
neutral gray; window panels are dark and rods light for shape readability.
No material slots or authored textures. An eighth image uses the stage 03 test
angles: boom −35°, stick −40°, bucket +75°, all relative to neutral.

Remaining simplifications: opaque windows/empty cab, faceted accepted shells,
approximate repeated roller/tread representation, pin bosses without tiny hardware,
static hydraulic/linkage proxies. No microscopic bevels, bolts, welds, hoses,
production shading, animation, GLB, application mapping or stage 05 segmentation.
