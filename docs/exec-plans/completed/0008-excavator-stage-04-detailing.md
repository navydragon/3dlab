# XE215C stage 04 — primary educational detailing

Accepted stages 01–03 remain immutable. Read stage 03; preserve canonical nodes,
neutral pose, pivots, existing shells/proportions and master dimensions.

1. Add low-poly wheels/rollers and combined repeated tread meshes, cab window
   display panels/roof, large service panels, structural plates and pin zones.
2. Add bucket teeth/mounting zone, separate rocker/link and three separate
   barrel/rod/end assemblies with named attachment anchors.
3. Keep new geometry parented to canonical branches; explicitly mark static
   uncoupled linkage/hydraulics. No drivers/animation/rig/materials/textures.
4. Independent checker verifies immutable source, original base geometry,
   hierarchy/pivots/dimensions, assemblies/anchors, ownership and articulation.
5. Render seven compatible views plus one articulated detail checkpoint, reopen
   and validate, document reconstructed features, run repository checks, commit/push.

All added section sizes, roller/tread representation, linkage and cylinder anchors
are conservative visual reconstruction from refs 03–06/08–10, not factory data.
Hydraulic/linkage coupling is deferred; articulation view will hide those uncoupled
auxiliaries to inspect only node-following primary geometry.

## Completed — 2026-10-03

- Added 84 independent detail meshes: wheels/hubs, simplified road/carrier
  rollers, combined exposed tread repetitions, beam caps/X-frame gussets/slew
  ring, window display panels/roof/service panels, boom/stick plates/pin bosses,
  bucket teeth/wear ribs/ears, rocker/link/pin bosses and three five-part cylinders.
- Added six named cylinder anchors plus four linkage anchor markers; recorded
  reconstructed coordinates and static branch ownership. Coupling deferred.
- Retained 17 base meshes without any local/world vertex or topology changes;
  accepted pivots, canonical five-node chain and zero neutral rotations preserved.
- Independent reopened-file checker: 65 checks pass, base error 0 m, all eight
  source hashes unchanged. Repeated generation yields identical inspection SHA256.
  Git confirms stages 01–03 and their scripts unchanged.
- Master dimensions, track override, contact length, clearances and pin distances
  remain within 5 mm; maximum measured dimension error under 0.001 mm.
- Model totals: 101 meshes, 3818 vertices, 7004 triangles. Ordinary small blend
  storage follows existing repository rules; no LFS attributes apply.
- Saved seven inherited-camera neutral views and one primary articulation view;
  visually reviewed all. Articulated view explicitly hides uncoupled hydraulic/
  linkage proxies only; saved neutral blend restores their visibility.
- npm run validate passes formatting, lint, types, content, 184 tests in 8 files,
  production build. No application/UI changes require new E2E tests.
- Geometry remains faceted; windows opaque with no interior. Roller counts,
  single illustrative boom-cylinder representation, added sections, linkage and
  anchor positions are reconstructed, not certified factory mechanical data.
  No details, materials, textures, drivers, animation, export or segmentation
  beyond the authorized primary-detail scope. Optional Blender thumbnail-cache
  warning does not affect saved outputs or reopened validation.
