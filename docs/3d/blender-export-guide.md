# Blender → application export guide

Current delivery: XE215C Stage 08 supplies the immutable exported GLB and Stage 09
supplies actual binary inspection, application mapping and versioned public copy.
See `models/xe215c/stage_09/README.md`; use `npm run assets:generate` and
`npm run assets:validate` for that existing delivery. Preparation-task statements
below describe the earlier checklist, not the current asset availability.

Use this checklist when preparing the actual excavator asset. Follow the
[asset specification](3d-asset-spec.md); this guide does not authorize invented
geometry, machine dimensions, engineering parameters or educational content.

## Prepare the model

- Confirm provenance and permission to redistribute the asset. Retain the editable
  Blender source and record the Blender/exporter version in delivery notes.
- Organize a clean machine root, articulated assemblies and child meshes. Name
  objects meaningfully and keep export names stable between deliveries. Blender
  names do not need to equal application IDs; metadata bridges the two.
- Keep bucket geometry separate and independently selectable. Prefer independent
  meshes for all canonical major components. Avoid joining the bucket into a mesh
  that also contains unrelated parts.
- Check platform, boom, stick and bucket pivots/origins, parenting and local axes.
  Move assemblies through the intended motion and verify child meshes follow.
- Check meter-based real-world scale against approved source information. Do not
  invent dimensions or rescale merely to fill a viewer.
- Set the agreed ground-level machine root origin and inspection pose. Preserve
  articulation pivots. Apply object transforms where needed before final rigging;
  avoid blindly applying transforms to animated/parented objects afterward.
- Inspect normals, UVs and visible surfaces. Remove accidental duplicate and hidden
  geometry, helpers and unrelated scene objects from the delivery export.
- Consolidate unnecessarily duplicated materials. Use exporter-compatible PBR
  shading and image textures; procedural effects must be converted appropriately
  or explicitly reviewed. Pack all required textures and verify they can be opened
  without access to the author's local files. Choose practical detail/resolution
  based on the inspected result and measured size, without arbitrary budgets.

## Export

Use File → Export → glTF 2.0 and select GLB for the first delivery. Include the
intended root, its meshes and required rig/animation targets; review selection/
visibility settings rather than assuming the export includes the whole machine.
Let the exporter perform conversion from Blender Z-up to glTF Y-up and inspect
the result in the exported file. Preserve scale and check materials/normals.

Review the installed Blender version's export options, especially animation mode.
Actions and NLA organization determine which clips are exported; assign meaningful,
stable names and ensure coordinated assembly motion lands in the intended clip.
Bake constraints/drivers where required by that export workflow, then inspect
the resulting transforms rather than assuming all Blender animation features
transfer. Exclude unintended test actions/strips and verify first/last poses and
the intended repeat behavior. The [official Blender glTF export manual](https://docs.blender.org/manual/en/3.3/addons/import_export/scene_gltf2.html)
explains supported materials and Actions/NLA export; exact option labels vary
by Blender version. Consult the matching manual for the version used.

Do not add compression or required extensions without checking support with the
application team. If separate glTF is justified, package its buffers/textures using
relative paths and verify the complete delivery on another machine.

## Inspect the exported artifact

Re-import a copy or inspect with a suitable glTF inspection tool. Keep the source
file intact. Record actual exported node names, parent/child hierarchy, mesh-bearing
nodes and clip names; Blender editor names alone are not proof of exported names.
Check for duplicate/blank names that would make a metadata lookup ambiguous.
Select bucket meshes independently, inspect major components and play each intended
clip. Check pivots, coordinated motion, units/up-axis, initial pose and textures.

Renderer-free inspection now exists in `scripts/glb-inspection.ts`, with reproducible Stage 08 export/re-import checks and Stage 09 delivery validation. Run `npm run assets:validate` for actual topology/names/mapping/integrity; these tools never infer domain semantics.

## Map and validate

After inspection, create one JSON Asset3D record under content/3d. Reference the
existing `excavator` MachineId and canonical component IDs. Record the actual node
names in sceneNodes; multiple meshes can map to one component. Record the real
working-cycle clip name against its approved activity. Leave unsupported animation
unmapped rather than inventing a clip. Set the URI relative to the application base,
for the approved binary under public/assets/3d.

Run `npm run content:validate` for metadata/domain checks. These checks do not
verify actual mesh/clip existence, licenses or visual quality; topology inspection
and delivery review are still required. Review optional camera position/target
presets in the exported coordinate frame.

## Re-export and pre-delivery checklist

Keep MachineId and component IDs stable. Bump asset version for each changed
delivery, re-inspect nodes/clips and update metadata when names/hierarchy change.
Deliver the matching binary and metadata together; a versioned filename helps
avoid cached older geometry.

Before handing off, confirm:

- Approved binary/package and retained Blender source with provenance/license notes.
- Stable inventoried exported names/hierarchy and no missing local resources.
- Independently selectable bucket and reviewed major articulated assemblies.
- Verified pivots, parenting, scale, axes, origin, normals and initial pose.
- Reviewed exported materials/textures and documented size/performance observations.
- Exact working-cycle clip inventory and mapping, or explicit unsupported animation.
- Matching asset/metadata version and optional verified camera presets.
- Metadata shape/domain validation passes, and actual topology/delivery is reviewed.

The current Stage 08/09 production asset and mapping are supplied and validated. The checklist continues to apply to future deliveries; accepted authoring checkpoints remain immutable.
