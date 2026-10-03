# 3D asset pipeline preparation

Status: Completed

## Goal and scope

Define the real Blender → glTF/GLB → application delivery contract, plain metadata
types, content schemas/domain reference checks and automatic production validation.
Sources: AGENTS, README, accepted architecture/ADRs 0002–0003, MVP, learning goals,
user flows, domain model, UI/UX specification and completed plans 0001–0003.

## Non-goals

No geometry, production mappings, viewer, renderer dependencies, UI changes,
simulation/engineering values, asset downloads, persistence, backend or CI.

## Authoritative IDs and metadata

Machine: excavator. Components: undercarriage, upperstructure, power-unit, boom,
stick, bucket, boom-cylinder, stick-cylinder, bucket-cylinder. Existing records
remain canonical; no Blender naming convention becomes domain truth.
Define Asset3DId and a plain Asset3D contract with subject machine, URI, format,
version, component-to-node lists, semantic animation mappings and optional camera
position/target presets. Keep metadata separate from renderer interaction contracts.

## Export and integration

Document GLB-first delivery, stable inspected external names, independently
selectable bucket, articulated hierarchy/pivots, meter scale and glTF export axes,
PBR/textures, action/NLA export checks and paired binary/metadata version updates.
Store future metadata under content/3d and approved binaries under public/assets/3d.
Use gitkeep only; no production asset exists. Viewer integration later joins
validated metadata with inspected topology and emits only canonical component IDs.

## Steps and validation strategy

1. Write asset specification/export guide and implement plain metadata contracts.
2. Add strict Zod shape checks and domain ownership/reference validation.
3. Automatically discover JSON metadata in content:validate (zero files allowed).
4. Refine unsupported/error viewer state contracts as needed; add test-only fixtures.
5. Run npm ci and every required formatting/lint/type/content/unit/build/combined/E2E
   gate; inspect git diff/check/status, move this plan, commit and push.

Shape checks cover IDs, safe web asset URIs, format/version, unique mappings/names,
animation and camera structures. Domain checks cover machine/component existence
and ownership. Topology/node/clip existence is deliberately a separate future step.
Test fixtures contain obvious test-only names and never become production metadata.

## Risks and completion criteria

Prevent external node names from becoming domain truth, ambiguous mapping ownership,
local filesystem URIs, animation time leaking into calculations and unsupported
features pretending to work. Do not invent numeric asset budgets. Completion means
all gates pass, current UI/content/flows unchanged, no production metadata/binary or
renderer introduced, delivery requirements documented, completed plan retained and
changes committed/pushed.

## Results

Created docs/3d/3d-asset-spec.md and blender-export-guide.md. The specification
keeps domain identity separate from exact external node/clip names, requires an
independently selectable bucket for the real viewer, defines export scale/axes,
hierarchy/pivots, material/texture expectations, visual timing separation, delivery
review and paired versioning. Technical conventions reference Khronos and Blender
documentation; no dimensions or numerical performance budgets were invented.

Added src/domain/asset3d.ts with Asset3D, SceneNodeMapping, AnimationMapping and
CameraPreset; added Asset3DId. The minimal contract follows domain-model field
names subjectType/subjectId/nodeMappings, supports only machine subjects now and
contains no framework/runtime types. Component mappings support several explicit
mesh node names. Asset version is independent from domain and simulation identity.

Added strict content schema and structured shape/domain validation. Checks cover
stable IDs, base-relative web URIs/format agreement, version, nonempty exact node
names, unique component/node/activity/preset identities, finite camera triples,
subject existence, component existence/ownership and duplicate asset IDs across
files. Metadata validation deliberately does not claim topology or binary validity.

Added developer-side recursive JSON discovery and integrated it with the existing
content validation CLI. content/3d and public/assets/3d contain only gitkeep; zero
metadata records passes. Future files are discovered without maintaining a manifest.
The chosen URI is assets/3d/...glb or .gltf; the future loader resolves it against
Vite's base. Binary topology inspection tooling is deferred until a real asset is
available; the manual inspection/delivery workflow is documented.

Refined plain viewer loading states for unconfigured/unsupported/error cases and
added explicit animation availability/missing-clip states. No viewer code or UI
behavior changed. README documents storage, validation and missing production asset.

Validation: npm ci succeeded using Node 24.18.0 / npm 11.16.0 (zero audit findings).
The first attempt encountered a native-module lock; the exact project Vite process
was verified through its loaded Rolldown binding and stopped before retrying.
format:check, lint, typecheck, content:validate, test, build and validate passed.
184 tests in eight files pass, including 46 new shape/reference/discovery/boundary
cases. Tests use only synthetic metadata/nodes/clips/camera vectors; temporary
discovery fixtures are safely cleaned. All four unchanged production-preview
Chromium E2E tests passed. The application build asset hashes remained unchanged.

Inspected git diff/status and diff --check. No production JSON metadata, GLB/GLTF,
rendering dependencies, educational/engineering values or formulas were added.
Existing UI, application queries/routes, production domain records, package/lockfile,
product documents and architecture/ADRs remain unchanged.

Required next: approved licensed GLB or complete justified glTF package; actual
exported node/clip inventory and hierarchy; verified scale/pivots/origin/pose;
bucket/component mapping and approved working-cycle clip (or explicit absence);
paired metadata/version and optional asset-derived camera presets. Do not implement
the viewer until that delivery can be inspected.
