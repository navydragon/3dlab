# XE215C stage 02 — proportion correction

Scope: targeted proportional reconstruction on immutable stage 01 checkpoint.
No domain/application change, hierarchy, rig, materials, animation or export.

1. Read request and P0/P1/P2/P3 reference roles; inspect stage 01 generator.
2. Load stage 01 read-only, modify owned major meshes and reconstructed pose
   through a separate stage 02 script. Preserve confirmed absolute dimensions.
3. Extend stage 01 checks with bucket orientation, cab/body separation, camera
   matching, no parenting, and input artifact hashes.
4. Save stage 02 blend, inventory, seven matching renders and comparison sheet.
5. Reopen, verify repeatability/input immutability, run relevant repository checks,
   record assumptions, move plan to completed, commit and push current branch.

Reconstructed coordinates and shell sections are proportional estimates;
photographs are not absolute dimensional sources. Track override remains
600 mm / 2390 mm gauge / 2990 mm total. Stage 01 files must never be rewritten.

## Completed — 2026-10-03

- Separate stage 02 generator loads the original blend and reuses unmodified
  stage 01 helpers; no stage 01 files or reference pack were rewritten.
- Corrected bucket pin/low forward lip, folded pose, variable boom/stick
  sections, shorter cab/roof slopes, lower separate hood, rear shoulder and
  rounded track band with visible independent crawler beam.
- Saved blend, inventory, README, seven matching orthographic views and a
  stage 01 vs 02 contact sheet. Inspected every view; no camera adjustment.
- 34 checks pass: all stage 01 dimensional constraints, independent meshes,
  axes/origins/scales, no forbidden features, bucket orientation, cab/hood,
  width, matching camera transforms and image resolution.
- Reopened checkpoint and verified two exact reconstructions by vertices,
  faces, origins/scales; 12 source files' SHA256 hashes remained unchanged.
  Git diff confirms stage 01 scripts/artifacts remain untouched.
- `npm run validate`: format, lint, types, content, 184 tests across 8 files
  and production build pass. No application changes/E2E additions required.
- Reconstructed boom root approximately (0.7702, 0, 1.6400) m, stick pin
  (6.4290, 0, 1.1500) m, bucket pin (3.5715, 0, 1.7000) m. These are estimates,
  not factory coordinates; fixed pin distances and transport envelope pass.
- Remaining uncertainty: exact shell/pin coordinates, bucket capacity, section
  sizes, track height, full kinematic/collision range. No later-stage work done.
- Blender optional OS thumbnail-cache warning does not affect saved blend,
  renders or successful reopened-file checks. Small blend stored in ordinary Git.
