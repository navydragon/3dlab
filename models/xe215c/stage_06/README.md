# XE215C — stage 06 visual kinematics and work-cycle demonstration

Immutable input: stage 05 blend. Stages 01–05 remain unchanged. Blender 5.2.2
LTS, metric, 1 BU = 1 m. The saved stage 06 scene is neutral/rest at frame 0;
all 101 meshes / 3818 vertices / 7004 triangles remain, with unchanged local
vertices/topology and all nine stage 05 educational component memberships.
There are no materials, textures, armatures, GLB or application mapping.

## Reproduce and check

From repository root, adapting the Blender executable path:

```powershell
blender --background --factory-startup --python-exit-code 1 --python scripts/blender/stage_06_kinematics_animation.py
blender --background models/xe215c/stage_06/xe215c_stage_06.blend --python-exit-code 1 --python scripts/blender/check_stage_06.py
```

Run the builder as a batch process, not inside unrelated unsaved work. It opens
only stage 05 as geometry input and writes only stage 06. The checker independently
captures stage 05, reopens stage 06, checks the rig and tests baking without saving
either input. Hashes cover every stage 01–05 checkpoint artifact and earlier script.

## Coupling architecture

The canonical hierarchy and four accepted pivots are unchanged. Primary controls
remain `NODE_UPPERSTRUCTURE.rotation_euler.z` and local Y rotation of
`NODE_BOOM`, `NODE_STICK`, `NODE_BUCKET`. No secondary independent joint-angle
controls exist. Existing component selection/highlight/hide/isolation functions
still query scalar educational metadata, independently of parents.

`50_KINEMATIC_RIG` contains nine technical EMPTY helpers: planar solver,
rocker/link transform helpers and two rigid orientation/translation helpers for
each cylinder. All have the required technical/non-selectable/non-renderable
educational metadata. Standard Blender math drivers and Copy Location / Locked
Track constraints persist in the blend; no handlers, custom driver namespace,
external Python playback callbacks or automatic script execution are needed.

The linkage solver intersects two circles in stick-local XZ. Rocker radius
0.425206 m and connecting-link length 0.634439 m come from the neutral stage 05
pin centers. It retains the negative-cross-product branch selected by that
neutral configuration. Bucket angle moves the bucket-side attachment; the circle
solution rotates a rigid rocker about its stick-fixed pivot and rotates/translates
the rigid link between its pins. The cylinder input point is another fixed point
on the rocker. Independent checks reconstruct the circle intersection without
reading the procedural solver's driven outputs.

Boom base follows upperstructure and rod pin follows boom. Stick base follows
boom and rod pin follows stick. Bucket base follows stick and rod pin follows the
solved rocker/input point. Barrel/gland/base eye follow one helper, rod/rod eye
another. Both helpers align local Z with the attachment line while locking local
Y to the transverse pin direction. Mesh geometry stays rigid; extension results
from translating the fixed-length rod. There is no procedural scale animation.
Every tested pose retains positive rod/barrel overlap and exposes the rod beyond
the gland; the checker rejects disconnection or excessive compression.

Only cylinder parts, the rocker/link, their pin bosses and affected technical
anchors were reparented, with neutral world transforms preserved. Exact before/
after parents are recorded in `inspection.json`. Main canonical meshes were not
reparented. **No anchor coordinates or canonical pivot coordinates were changed.**
The inherited `uncoupled_auxiliary` flag is cleared on coupled objects and
`stage06_coupled = true` records the new behavior; stage 05 educational metadata
is unchanged. Remaining stage 04 provenance denotes reconstructed geometry.

## Poses, controls and animation

Angles below are `(slew, boom, stick, bucket)` in degrees relative to neutral:

- Neutral/rest: `(0, 0, 0, 0)`.
- Digging/reach and returned: `(0, -10, -20, 5)`.
- Filled/bucket curled: `(0, -15, -25, 65)`.
- Lifted/raised: `(0, -30, -20, 75)`.
- Slewed with raised workgroup: `(60, -30, -20, 75)`.
- Dump: `(60, -25, -10, 5)`.

The builder module's `set_pose` accepts degrees within the illustrative envelope:
slew ±180°, boom −30..0°, stick −25..0°, bucket 0..75°. These are conservative
visual bounds for this reconstructed mechanism, **not factory motion limits**.
Use it with canonical action temporarily detached for manual pose evaluation,
or change the existing canonical action channels. Direct manipulation outside
the envelope can reach invalid linkage geometry, particularly negative bucket
angles; clamping the solver square root only protects arithmetic, not mechanics.
The checker explicitly rejects unreachable circles and singular/branch crossings.

One multi-slot action: **`excavator_work_cycle_demo`**, explicit clip range
**1–281 at 24 fps**, approximately 11.7 seconds of illustrative display time.
Only four canonical rotation channels are animated. Keys: digging 1, fill/curl 41,
lift 81, slew 131, dump 166, dump hold 191, slew back to lifted 236, return 281.
Auto-clamped Bezier curves provide smooth motion; first/last tangents are flat and
all geometry has matching first/last transforms for looping. Frame 0 has an explicit
rest key outside the declared clip range. Export/bake consumers should use 1–281
for the work clip and retain frame 0 only as an optional rest sample.

This timing does not define cycle time or productivity. There is no soil or actual
bucket-fill geometry. No domain or simulation formulas were changed.

## Bake readiness and validation

`check_stage_06.py:bake_test(keep_copy=False)` makes isolated object copies,
removes constraints/drivers on the copies and keys local location/quaternion
transforms at every integer frame 0–281. Scale is identity and is not animated.
It compares all mesh world vertices at 49 integer frames, including phases and
intermediate frames, then removes the validation copy and generated actions.
The original procedural scene/action remain intact. This is a sampled 24 fps
transform bake, not a claim of exact analytic interpolation between samples.

For a later export stage, run `bake_test(keep_copy=True)` to retain
`STAGE06_BAKE_VALIDATION_COPY` and its transform actions for inspection. It still
restores the original scene to rest and does not export anything. Export-time
clip consolidation and sampling choices belong to that later stage.

**123 checks pass after reopening.** Gate A covers all seven representative poses;
Gate B checks every integer animation frame 1–281. Checks include source hashes,
unchanged geometry/topology/counts, exact educational metadata, main parents,
canonical nodes/pivots, finite transforms/identity scales, undercarriage stationary
under slew, primary mesh inheritance, rigid cylinder lengths, endpoint coincidence,
axis collinearity, positive overlap, constant linkage lengths, independent branch
solution, linkage pin continuity, neutral reset, valid drivers, action channels,
loop equality, stage 05 controls and isolated bake.

Pin/axis/world-vertex tolerance is **0.00001 m (0.01 mm)**. Primary neutral geometry
error is zero; reparented auxiliary neutral world-vertex error is approximately
0.0012 mm from float transforms. Bake maximum error is approximately **0.0033 mm**,
below the same tolerance. No mesh geometry edits or technical-anchor corrections
were necessary. Repository format/lint/types/content validation, 184 tests in
eight files and the production build all pass.

## Checkpoints and limitations

Seven PNGs in `checkpoints/`: neutral, digging, filled, lifted, slewed, dump,
returned. One stable orthographic three-quarter camera, 12.7 m scale, 1400 × 900,
Workbench neutral studio shading. Cylinders/linkage remain visible in every pose.
`work_cycle_contact_sheet.png` arranges those phases left to right, top to bottom
with labels. The saved blend restores frame 0 and full mesh visibility.

All seven checkpoints and the sheet were visually reviewed for gross intersections;
no obvious penetration of cab/counterweight/undercarriage by the major workgroup
was observed in these phases. This is not engineering collision validation.
The model retains faceted estimated sections, opaque windows, one illustrative
boom cylinder and reconstructed linkage/attachment geometry. Hydraulic forces,
pressures, certified strokes/limits, mechanical hardware clearances, soil contact
and production shading are outside scope. Optional Blender thumbnail/user-preference
warnings do not affect saved images, rig evaluation or reopened-file validation.
