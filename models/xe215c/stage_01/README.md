# XE215C — stage 01 geometric blockout

Blender 5.2.2 LTS; metric units, 1 BU = 1 m. +X front, +Y left, Z up;
world origin is ground below slew axis. Only massing and pivot preparation.

## Rebuild and inspect

From the repository root (replace the executable with your Blender path):

```powershell
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background --factory-startup --python-exit-code 1 --python scripts/blender/stage_01_blockout.py
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background models/xe215c/stage_01/xe215c_stage_01.blend --python-exit-code 1 --python scripts/blender/stage_01_blockout.py -- --inspect-only
& 'C:\Program Files\Blender Foundation\Blender 5.2\blender.exe' --background models/xe215c/stage_01/xe215c_stage_01.blend --python-exit-code 1 --python scripts/blender/check_stage_01.py
```

Rebuild uses the dedicated `XE215C_STAGE_01` scene and replaces only tagged
objects in its five owned collections. Unrelated scenes and objects are retained;
name collisions fail rather than overwrite unrelated content. No UI selection
dependency. `--skip-renders` rebuilds geometry without generating images.

Outputs: `xe215c_stage_01.blend`, `inspection.json`, and seven orthographic
PNGs in `checkpoints/`. All cameras use the same 11.7 m scale, 1400 × 900 output,
neutral Workbench studio lighting and gray object colors. There are no material
slots, textures or authored lighting objects. Guides are viewport curves/empties,
hidden from renders; switch off `00_GUIDES` in the Outliner to hide them.

## Sources and assumptions

Supplied inputs remain unchanged in `models/XCMG_XE215C_MODEL_SHEET/`:
`MODEL_SHEET.md`, `blockout_dimensions.csv`, `selected_refs.csv`,
`meta/master.json`, master PDF page 2, P1 images 01–03 and P2 images 04–06.
No alternative specifications were used. User request overrides the source's
optional 800 mm shoe: **600 mm shoe / 2390 mm gauge / 2990 mm total width**.

Absolute geometry uses the 21900 kg / 128.5 kW master. Boom and stick lengths
are interpreted as main pin-center distances, 5.680 m and 2.910 m. A reconstructed
folded transport pose obtains the 9.625 m envelope through pin placement, with
the folded stick head as its foremost point. Shells are never globally scaled.

Photographs constrain massing, not certified coordinates: track height/profile,
cab slopes, body envelope, boom knee/section widths, mounting tower, boom root
position, folded pose and bucket size/curvature remain conservative
reconstructions for the next stage's review. The counterweight rear arc uses the
2.890 m tail envelope; its other planes are reconstructed. Bucket shell, cheeks
and lip are separate meshes with the same bucket pivot origin. No linkage/teeth.
Pivot empties' local Z points along world Y for boom/stick/bucket, world Z for slew.
Main platform origin is on the slew pivot. No articulated parenting or rig.

Numerical inspection covers identity scales, track widths/gauge/length/contact,
platform width, clearances, tail radius, pin distances, transport envelope,
independent meshes/origins, four axes, and absence of 800 mm shoes, materials,
constraints or animation. This does not certify reconstructed shell shapes.
Stage 02 and subsequent work are intentionally deferred.

The small `.blend` is committed normally; this repository has no LFS/asset rules.
The supplied images are references, not production textures or web assets.
