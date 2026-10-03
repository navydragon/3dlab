# Stage 01 — excavator geometric blockout

Scope: reproducible Blender massing only, for the existing excavator visualization.
No domain/content/application changes, rig, materials, animation or GLB export.

Sources: local XCMG_XE215C_MODEL_SHEET master PDF/CSV/JSON and selected P1/P2
photographs. User override is authoritative: track shoe 600 mm, gauge 2390 mm,
overall width 2990 mm. The source package's 800 mm shoe is not used.

Plan:
1. Inspect references, existing asset conventions and Blender availability.
2. Build separate low-poly assemblies in owned collections; meter units,
   world slew axis, transverse articulation origins and dimension guides.
3. Run compact inventory and numerical checks, including transport pose.
4. Render and visually inspect seven neutral checkpoint views.
5. Save source, blend, inventory and assumptions; verify repeatability and
   relevant repository checks, complete this plan, commit and push current branch.

Reconstructed, not certified: shell profiles, track profile height, boom root
location, bucket dimensions and canonical transport pose. Pivot-to-pivot boom
and stick lengths use 5.680 m / 2.910 m; the transport envelope must be obtained
through pose rather than shell scaling.

Initial state: main; reference pack and docs/3d/start_prompt.md untracked.
Retain these supplied inputs unchanged and include them in the delivery commit
so the final tree is clean and source provenance remains reproducible.

## Completion — 2026-10-03

- Built `scripts/blender/stage_01_blockout.py`, dedicated owned scene/collections,
  17 separate massing meshes, four pivots, dimension/reference guides.
- Saved `models/xe215c/stage_01/xe215c_stage_01.blend` with Blender 5.2.2 LTS,
  `inspection.json`, assumptions/rebuild README and seven orthographic PNGs.
- All numerical checks pass within 5 mm: tracks 2.990 / 2.390 / 0.600 m,
  crawler/contact 4.255 / 3.462 m, platform 2.830 m, pin lengths 5.680 / 2.910 m,
  tail 2.890 m, clearances 1.050 / 0.485 m, transport 9.625 × 2.990 × 3.100 m.
- Reopened checkpoint and ran `scripts/blender/check_stage_01.py`: two same-scene
  rebuilds match original vertices, faces, names, origins and scales; unrelated
  sentinel object survives. No materials, rig, constraints or animation.
- Visually inspected all seven checkpoint images for stage 01 obvious errors.
  Reconstructed shells/pose remain explicitly uncertain; no stage 02 undertaken.
- `npm run validate` passes formatting, lint, types, content, 184 tests (8 files),
  production build. No application flows changed; E2E additions are inapplicable.
- Preserved supplied reference pack formatting; excluded it and generated
  inventory from Prettier rather than rewriting source evidence.
- Blender's optional OS thumbnail-cache write failed in this environment; the
  actual blend and all renders saved and the reopened blend passed inspection.
- No repository LFS/asset attributes; small blend uses ordinary Git storage.
