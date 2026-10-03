# XE215C stage 03 — hierarchy and kinematic structure

Accepted stage 02 at fe7d8e9c94bf36dbe482372db0369f9184f4d38e is immutable.
Freeze its meshes, names, world-space neutral geometry and pivot coordinates.
No shape/proportion edits, rig, constraints, animation, materials or export.

1. Load stage 02 checkpoint read-only; capture neutral world geometry/transforms
   and hashes of stage 02 artifacts/scripts.
2. Create NODE_UNDERCARRIAGE → NODE_UPPERSTRUCTURE → NODE_BOOM → NODE_STICK
   → NODE_BUCKET; zero neutral rotations, identity scales, accepted pivots.
3. Parent existing meshes while preserving world transforms; attach pivot markers
   and pin-center guides to corresponding nodes. Dimension guides remain neutral.
4. Independent checker compares source world vertices/topology, exact ownership,
   pivot axes/coordinates and expected transform matrices under each joint test.
5. Render neutral, slew and combined articulation checkpoints; inspect visual
   continuity/clearance, reset, validate, save, reopen and verify immutability.
6. Document neutral scheme/test angles/limitations, run relevant repository
   checks, move plan to completed, commit and push current branch.

Test angles are illustrative articulation checks informed by refs 05/10, not
factory operating limits. No collision solver or final motion envelope is inferred.

## Completed — 2026-10-03

- Added five stable NODE_* empties in 40_KINEMATICS with required strict chain,
  zero neutral rotations, identity scales/parent inverses and accepted pin origins.
- Existing 17 meshes retain local vertices, topology and names; parenting
  preserves neutral world geometry exactly. Upper mounting base stays on upper
  node; bucket shell/cheeks/lip stay independently addressed beneath bucket node.
- Independent checker reads stage 02 and reopens stage 03, then verifies 72
  checks including isolated +12° joint/root tests and combined matrix inheritance.
- Three visual poses: neutral, slew +30° Z, boom −35° / stick −40° / bucket +75°
  Y. No obvious branch separation or gross cab/platform collision in these views.
  Angles remain illustrative, not final operating limits.
- Saved stage 03 blend back in neutral, compact inspection, README and three
  inherited-camera Workbench renders. Neutral pixels exactly match stage 02.
- Reopened-file verification passes; neutral vertex/reset error 0 m. All 14
  immutable stage 02 source hashes match; Git confirms stages 01/02 unchanged.
- npm run validate passes formatting, lint, types, content, 184 tests across
  8 files and production build. No application/UI flow changes require E2E.
- No materials, constraints, animation data/actions or geometry modifications.
  Full collision range, mechanical operating limits and hydraulic/linkage coupling
  remain outside this stage. Optional Blender OS thumbnail-cache warning does not
  affect saved/reopened blend or checkpoint renders.
