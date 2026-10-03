# XE215C — stage 03 hierarchy and kinematic structure

Accepted stage 02 geometry/pivots are frozen. Stage 03 adds only five stable
control empties and transform parenting. Blender 5.2.2 LTS, meters, +X front,
+Y machine left, +Z up. No rig, constraints, mesh edits or animation data.

## Reproduce and independently check

From repository root, using your Blender executable:

```powershell
blender --background --factory-startup --python-exit-code 1 --python scripts/blender/stage_03_hierarchy_kinematics.py
blender --background models/xe215c/stage_03/xe215c_stage_03.blend --python-exit-code 1 --python scripts/blender/check_stage_03.py
```

The builder explicitly reads the immutable stage 02 `.blend` and saves only
stage 03 files. Run it as a batch process, not inside unsaved unrelated work.
The independent checker reads stage 02, captures its geometry, reopens stage 03
and checks actual matrices/vertices without saving either file. Stage 02 source
artifacts and three workflow scripts are SHA256-inventoried in `inspection.json`.
Stage 01 and stage 02 are never rebuilt or overwritten.

## Neutral scheme and ownership

The strict chain is:

```text
NODE_UNDERCARRIAGE → NODE_UPPERSTRUCTURE → NODE_BOOM → NODE_STICK → NODE_BUCKET
```

All node rotations are zero in the accepted stage 02 folded/transport pose;
all scales and parent inverse matrices are identity. Local axes align with world
axes in neutral; rotations are deltas from this pose. This bakes the existing
shape/pose into unchanged mesh coordinates and node translations, giving future
animation a clear zero baseline. Euler rotation mode is XYZ. Positive local Y
rotation sends a forward +X vector toward -Z; negative Y raises the forward boom.

- `NODE_UNDERCARRIAGE`: ground origin (0, 0, 0); both continuous tracks,
  crawler beams, central X-frame and slew support. Generic root transforms
  move the complete machine; it is not a declared operational joint.
- `NODE_UPPERSTRUCTURE`: accepted slew pivot (0, 0, 1.05) m; local Z rotation;
  platform, cab, engine/body, counterweight and boom mounting base.
- `NODE_BOOM`: accepted boom root ≈ (0.7702, 0, 1.6400) m; local Y rotation;
  only boom mesh directly owned.
- `NODE_STICK`: accepted boom/stick pin ≈ (6.4290, 0, 1.1500) m; local Y;
  stick mesh, with bucket node beneath it.
- `NODE_BUCKET`: accepted stick/bucket pin ≈ (3.5715, 0, 1.7000) m; local Y;
  bucket shell, two cheeks and cutting edge remain separate named meshes.

Coordinates are preserved proportional reconstruction from stage 02, not factory
pin data. Existing `PIVOT_*` markers follow corresponding nodes. Boom/stick
pin-center guides follow their members; master dimension guides remain static
neutral reference helpers. `40_KINEMATICS` holds controls; model collections and
all existing major mesh names are retained. Guides/controls do not render.

## Tests and visual checkpoints

Each control is individually rotated +12° (root Z, slew Z, working joints Y)
to verify that only its complete descendant branch moves. The checker compares
actual matrices with independent axis-angle transforms about source pivots,
then resets. It also compares each vertex under the full accumulated chain.

Three explicit test poses, in degrees relative to neutral:

- Neutral: all zero, matching stage 02.
- Slew: upperstructure Z +30°; undercarriage stays fixed.
- Articulated workgroup: boom Y −35°, stick Y −40°, bucket Y +75°; slew zero.
  The bucket delta cancels the accumulated −75° parent pitch in this test.

Refs 05/10 inform folded-to-raised mechanical plausibility. These angles are
illustrative checks, not factory operating limits. No keyframes/clips are made.
`checkpoints/` contains three 3/4 renders with the exact inherited stage 02
Workbench settings/camera. After tests the blend is saved in neutral.

Validation covers identical local vertices/topology/names, neutral world vertices,
node/mesh hierarchy, ownership, pivots/axes, identity scales/inverses, branch
isolation/descendant transforms, marker continuity, exact reset within 0.01 mm
float tolerance and absence of animation/constraints/materials/modifiers.

Checkpoint verification: 72 checks passed after reopening the saved blend;
neutral world-vertex and reset errors both 0 m. Neutral 3/4 pixels match stage 02
exactly. All 14 stage 02 input hashes remain unchanged. Repository format/lint,
types/content validation, 184 tests and production build pass.

Limits: collision review is visual for the selected poses, not a certified full
working-range test. Pin coordinates remain reconstructed. No operating limits,
hydraulic/linkage coupling, detail, materials, animation or GLB export are added.
