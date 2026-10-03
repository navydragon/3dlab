# XE215C — stage 02 proportion correction

Stage 01 is immutable. This workflow reads its `.blend`, changes only massing
and reconstructed transport pose, and saves the separate stage 02 checkpoint.
Blender 5.2.2 LTS; meter units; +X front, +Y machine left, Z up.

## Reproduce

Run from repository root, adapting your Blender/Python executable paths:

```powershell
blender --background --factory-startup --python-exit-code 1 --python scripts/blender/stage_02_proportions.py
blender --background models/xe215c/stage_02/xe215c_stage_02.blend --python-exit-code 1 --python scripts/blender/check_stage_02.py
python scripts/blender/stage_02_contact_sheet.py
```

The contact sheet utility requires Pillow. Blender generation uses only `bpy`
and the unchanged stage 01 helper module. The generator explicitly opens the
stage 01 source; run it as a batch process, not inside unsaved unrelated work.
`--inspect-only` validates an already opened stage 02 without rebuilding.
All writes go to stage 02; source SHA256 hashes are recorded in `inspection.json`.

## Proportion changes and source roles

- Bucket: upper rear pivot at reconstructed Z = 1.700 m, curved heel/floor
  hanging below it, low forward cutting lip at Z ≈ 0.33–0.45 m. Open scoop,
  separate cheeks and lip; no linkage or teeth. Ref 05/06 inform folded relation
  and box sections; ref 10 checks bucket attachment logic. The folded pose is
  a conservative reconstruction, not a literal match to one photograph.
- Boom: variable section rising from root through a broad knee, tapering in
  both height and width toward the main stick pin. Stick: narrower distal box
  and separate tapered member; fixed main pin distances retained. Refs 01/05/10.
- Cab: shorter fore-aft mass (about 1.88 m versus 2.18 m), sloped front,
  narrowed roof, on +Y. Hood top 2.28 m remains below cab roof 3.10 m and
  clears the forward left cab envelope. Refs 01/02/03/04; no windows or interior.
- Rear: rounded faceted tail belt and inset shoulder, with deck inset below
  counterweight to remove coincident exterior faces. Refs 04 and fixed tail arc.
- Tracks: coarse continuous band with rounded end regions and shallow top
  sag; a separate recessed crawler beam is visible. Refs 07–09. No links/rollers.

No photos supply absolute lengths. User override remains 600 mm shoe width;
the reference package's optional 800 mm value is not modeled. Master 21900 kg /
128.5 kW is unchanged; no other machine variant specifications were consulted.
Pin coordinates, shell sections, cab slopes, track height, bucket dimensions
and pose angles are **proportional reconstruction**, not certified factory data.

## Validation and review artifacts

`inspection.json` retains all stage 01 dimensional/object checks and adds
bucket hanging direction, low forward cutting lip, ground clearance, cab/hood
composition, separate major meshes, no parenting/modifiers, overall width,
camera matching and source hashes. `check_stage_02.py` reopens the checkpoint
and compares two reconstructions by actual mesh vertices/faces/origins/scales.

Verified dimensions: 9.625 × 2.990 × 3.100 m transport envelope;
tracks 2.990 / 2.390 / 0.600 m, crawler/contact 4.255 / 3.462 m;
platform 2.830 m, tail 2.890 m; ground/counterweight clearance 0.485 / 1.050 m;
main pin distances boom 5.680 m, stick 2.910 m. Tolerance 5 mm.

Seven `checkpoints/*.png` reuse stage 01's orthographic camera positions,
rotations, target, 11.7 m scale, 1400 × 900 resolution and neutral Workbench
settings. `comparison_stage_01_vs_02.png` puts each pair side by side without
recropping. Gray object display colors only; no material slots. Guides are
hidden in renders and can be disabled via `00_GUIDES`.

Remaining uncertainties: exact engineering shell/pin coordinates, pose angles,
section thicknesses, track profile height and bucket volume are not established
by the master sheet. Full range/collision/kinematic verification belongs to a
later authorized stage. No hierarchy, rig, animation, cylinders, material detail,
logos, hydraulic lines or GLB were added.
