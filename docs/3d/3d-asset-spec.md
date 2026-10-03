# Application-facing 3D asset specification

Status: Current pipeline contract. XE215C Stage 09 metadata and static production asset are connected; viewer implementation remains deferred.

## Scope and ownership

This specification implements accepted ADRs [0002](../adr/0002-content-driven-local-repository.md)
and [0003](../adr/0003-react-three-fiber-visualization-boundary.md), domain-model
§§25–27 and the first technical slice in UI/UX §54. It defines delivery and
metadata, not geometry or the future viewer implementation.

A 3D asset visualizes an existing domain entity. Machine identity, component names
and explanations, relationships, engineering parameters, simulation values and
formulas remain in domain/learning/simulation content. Re-exporting a model never
creates a second Machine.

## Format, storage and URI

Use glTF 2.0, preferably a self-contained GLB for MVP. Separate glTF is supported
only with a documented delivery reason and all referenced buffers/textures packaged
and checked. Approve required extensions/decoders with the viewer implementation;
do not assume unsupported Blender features will render.

Approved binaries belong in `public/assets/3d/`; metadata belongs in
`content/3d/`, one Asset3D JSON record per file (subdirectories permitted).
The XE215C delivery uses `content/3d/xe215c.json` and the versioned public directory
`public/assets/3d/xe215c/v1_0_0/`. Its adjacent manifest is a generated copy of the
same Asset3D record, not a second mapping contract.

`uri` is a base-relative web path starting with `assets/3d/` and ending in
`.glb` or `.gltf`, matching `format`. The future asset adapter resolves it
against Vite's application base URL. Do not use a developer filesystem path,
absolute URL, leading slash, backslash, traversal segment, query or fragment.
Use ASCII letters, digits, hyphens and underscores for asset path segments and
filenames; external scene names do not share this filename restriction.
This keeps static delivery portable without a filesystem/runtime dependency in
domain contracts. Binary existence is checked during asset connection, not by
metadata-only validation.

## Plain metadata contract

See `src/domain/asset3d.ts` and the content schema. Fields:

- `id`: stable branded Asset3DId; identifies the visualization asset.
- `subjectType`: currently only `machine`; other subject types are deferred.
- `subjectId`: canonical MachineId, validated against the domain graph.
- `uri`, `format`, `version`: web asset location, glb/gltf and nonblank asset version.
- `nodeMappings`: componentId → nonempty sceneNodes list.
- `animationMappings`: stable learning activity key → exact external clip name.
- `cameraPresets` (optional): stable preset ID, finite position/target triples in
  the exported model coordinate frame; position and target must differ.
- `production` (optional): SHA256/byte size, meters/Y-up convention, canonical
  transform names, statistics, actual clip duration in seconds and animated node
  names, loop/rest semantics, mapping notes and limitations. These are asset
  evidence, not educational identity or simulation parameters.

Names, Three.js objects, React types and animation mixers are not domain data.
External names are preserved exactly, including case/spaces; blank names fail.
Each component appears once per asset, each mapped node belongs to one component,
and activities/preset IDs are unique. One clip may support several activities if
approved metadata explicitly maps them. Empty mapping collections are allowed for
assets with no declared interactions; that does not meet first-slice acceptance.

## Canonical IDs and selection

The existing machine is `excavator`. Its canonical component IDs are:

`undercarriage`, `upperstructure`, `power-unit`, `boom`, `stick`, `bucket`,
`boom-cylinder`, `stick-cylinder`, `bucket-cylinder`.

Blender names are external identifiers. They need not equal domain IDs.
The following is an abstract illustration, never production metadata:

```text
componentId: bucket
sceneNodes: [<bucket-node-name>, <another-bucket-node-name>]
```

Map mesh-bearing nodes that can be independently selected. Prefer separate
selectable geometry for every major canonical component. Bucket geometry and its
explicit mapping are mandatory for the first viewer slice. Several mapped meshes
can represent one educational component; a mesh cannot ambiguously select two.
Unmapped geometry must not acquire inferred educational meaning.
For XE215C, six explicitly classified nonselectable `bucket-linkage` auxiliary
meshes join the `bucket-cylinder` mapping for complete highlight/visibility sets.
Direct hit selection must still respect their `edu_selectable=false`; this is an
explicit asset assembly policy, not identity inferred from hierarchy or names.
Mappings to groups/descendant resolution would require an explicit later contract;
the initial selection mapping addresses inspected mesh nodes.

## Hierarchy, pivots and pose

Deliver one identifiable machine root with a coherent local transform frame.
Parent moving assemblies so their child meshes follow the correct local motion.
Keep pivots at the actual articulation locations for platform, boom, stick and
bucket; verify child transforms throughout the exported motion. Preserve the
ability to select bucket geometry independently of the moving parent group.
No hierarchy name establishes component identity or educational function.

Use an agreed initial inspection pose, without hiding required components or
starting an animation automatically. Document that pose in delivery notes.
Remove unintended offsets and duplicate hidden geometry. Apply transforms only
when appropriate for the rig; applying them blindly after animation can break
local pivots and motion.

## Scale and coordinates

Export real-world scale with linear coordinates in meters. glTF is right-handed,
with +Y up; authoring in Blender's Z-up scene requires the exporter conversion.
Let the glTF exporter handle axis conversion and verify the result; do not apply
a second compensating rotation in the application. These are format conventions,
not invented excavator dimensions. [Khronos coordinate/unit specification](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#coordinate-system-and-units).

Project delivery convention: root origin at ground level near the machine's
support footprint center, without moving articulation pivots. State the chosen
front orientation and verify it after export. Camera position/target triples use
the same exported meter frame. Do not bake arbitrary viewer zoom into model scale.

## Materials and textures

Use exporter-supported PBR materials and inspect the exported appearance. Pack
textures into the GLB; for separate glTF, deliver the complete relative resource
package. No missing workstation-local texture paths are acceptable. Check UVs,
normals, transparency and texture color handling visually after export. Reuse
materials where appropriate, avoid unintended duplicates and choose texture
resolution according to visible detail and measured transfer/GPU cost.
glTF's material model is specified in the
[Khronos material section](https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html#materials).

Selection highlighting must remain possible on independently mapped geometry.
A future viewer must isolate its material changes or restore shared materials
safely; sharing an original material must not highlight unrelated components.
No highlight implementation or arbitrary numerical polygon/texture budget is
introduced here. Measure size, load time, memory and frame behavior on agreed
devices before approving budgets or compression.

## Animation and cameras

The target is an approved working-cycle visualization. Deliver named clips and
record their exact inspected names through animationMappings; never guess the
first clip or derive a name from a domain ID. The conceptual
`excavator-working-cycle` activity from domain-model §27 can map to
`<actual-working-cycle-clip-name>` only after inspection. XE215C maps that activity
to `excavator_work_cycle_demo` (11.666666984558105 seconds). No instructional
phase timeline is inferred.

Clip duration is visual playback time, independent of engineering `t_cycle`.
UI speed changes do not change calculations. Verify assembly coordination and
loop/restart behavior; do not infer instructional phases or simulation values from
keyframes. No mapping means animation is explicitly unsupported; a mapped clip
that cannot be found is a separate unsupported/missing-clip state.
Camera presets are application metadata; embedded Blender cameras are optional
and never override approved presets by accident.

## Validation levels and future integration

1. Shape validation checks IDs, fields, URI, mappings and camera data.
2. Domain validation checks subject existence and component existence/ownership,
   including duplicate asset IDs across the metadata collection.
3. Topology validation checks the actual exported scene, unique/exact node
   resolution, mesh selectability, hierarchy, declared clips and resources.
4. Delivery review checks asset provenance/license, appearance, pivots/scale,
   initial pose, working cycle and measured performance.

`npm run content:validate` discovers every JSON record under content/3d and runs
levels 1–2 after domain validation. Zero files is valid. Missing/malformed files
or invalid metadata fail explicitly; no invalid asset is discarded as success.
Passing this command does not certify topology or binary delivery.
`npm run assets:validate` additionally checks the real XE215C GLB against its
manifest, complete name mappings, canonical hierarchy, clips, public copy and
immutable authoring stages. Production static HTTP delivery has an E2E check.

Later composition will supply validated metadata to the isolated viewer adapter.
The viewer loads topology, resolves node mappings and emits MachineComponentId
selection events; UI resolves descriptions from the canonical domain repository.
Playback and loading/error events are plain data. Rendering objects stay private.

## Failure and version workflow

No asset configured, loading, unsupported WebGL, network/decode failure,
missing/ambiguous nodes and context loss must be explicit. Keep textual component
content and navigation usable. A failed mapping is not a successful selectable
viewer; missing animation disables animation actions with an explanation.
No fallback cube or unrelated model is permitted.

`version` is a simple delivery label for the asset/metadata pair, not MachineId,
glTF format version or simulation-model version. On re-export, bump it, inspect
nodes/clips again and update mappings/presets if necessary. Use a versioned binary
filename when practical to avoid stale cached geometry; keep domain IDs stable.
Review the binary and matching metadata together without migration infrastructure.

## Required before viewer implementation

Deliver the approved GLB (or justified complete glTF package), asset provenance and
permission/license, actual exported node/hierarchy and animation inventory, explicit
bucket/component mappings, working-cycle clip mapping or documented absence,
verified scale/origin/initial pose, and matching metadata version. Optional camera
presets must be measured from that asset. See the
[Blender delivery checklist](blender-export-guide.md).
