# Interactive Digital Laboratory

## Интерактивная цифровая лаборатория машин и механизированных процессов транспортного строительства

Экспериментальная цифровая образовательная платформа для изучения:

- строительных машин и механизмов;
- их конструкции и принципов работы;
- технологических процессов;
- взаимодействия машин в составе механизированных комплексов;
- производительности;
- сроков;
- эксплуатационных затрат;
- инженерно-экономических решений.

Ключевой принцип платформы:

> Два входа — машины и процессы.  
> Одна связанная предметная модель.  
> Один уровень выше — принятие инженерно-экономических решений.

## Current stage

Two product slices: domain-backed machine/process/3D navigation and production-system fleet experiments with explicit calculation and A/B comparison.

Machine pages show canonical operations, components and grouped process usage. Machines with validated assets also offer Construction and Working Cycle sections with the production 3D viewer. Process pages select stages via `stageId` and open machine pages with graph-validated contextual return, preserved across all supported machine sections. Unknown entities/sections, invalid stage/context URLs and invalid content have explicit states. Full learning modules remain deferred.

The pure `earthworks-deterministic-v1` core is implemented in `src/simulation/`
and is invoked by the pure application experiment service. Its authoritative formulas, units and assumptions
are in `docs/domain/simulation-model.md`. The checked-in baseline under
`content/simulation/` is illustrative, not XE215C engineering data.

`content/simulation/` is reserved for one `earthworks-deterministic-v1` scenario
record per JSON file, including nested folders; unrelated content types belong
outside this directory. Validation discovers every scenario deterministically,
checks stable IDs, source text, explicit illustrative status, numerical inputs and
duplicate IDs. The read-only scenario repository and local Vite adapter expose
`list/get`, explicit absence and invalid-content results, without a default scenario
or calculations. Application queries select explicit supported sources for UI;
the baseline stays illustrative.

`content/domain/production-systems.json` defines `excavator-haul-system`, linking
the `excavation-haul` process, canonical machine/role participants, the supported
`earthworks-deterministic-v1` model and existing scenario IDs. System definitions
own count constraints; scenarios alone own the experimental truck count. Strict
shape/reference/model/count validation precedes the dedicated read-only repository
and application overview query. Systems UI resolves these records through a separate
provider; numerical execution belongs to the application service, with no default
scenario. Content validation runs domain → scenarios → systems → assets.

## Documentation

Strategic product vision:

`docs/vision/strategic-vision.md`

Current MVP scope:

`docs/product/mvp-scope.md`

Current product, domain, and design documentation:

```text
docs/product/learning-goals.md
docs/product/user-flows.md
docs/domain/domain-model.md
docs/domain/simulation-model.md
docs/design/ui-ux-spec.md
```

Accepted system architecture:

`docs/architecture/system-architecture.md`

Accepted architecture decisions are recorded under `docs/adr/`; see `docs/adr/README.md`.

## First MVP

The initial vertical slice focuses on:

```text
Hydraulic excavator
+
Dump trucks
+
Excavation and soil transportation
```

The MVP will demonstrate:

```text
machine
→ working principle
→ working cycle
→ productivity
→ technological process
→ machine system
→ duration and cost
```

as well as navigation in the opposite direction:

```text
process
→ operation
→ machine
→ machine learning module
→ return to process
```

## Development approach

The project follows a documentation-first and domain-driven approach.

Product semantics, educational logic and mathematical models should be defined before they are encoded into application components.

See `AGENTS.md` for repository-wide development instructions.

## Local development

Use Node.js 24.18.0 or later in the 24.x line and npm 11.16.0 or later in the 11.x line. The foundation was validated with Node 24.18.0 and npm 11.16.0. Dependencies are pinned in `package.json` and `package-lock.json`.

```sh
npm ci
npm run dev
```

The development server defaults to http://localhost:5173. Use `npm install` when intentionally updating dependencies; commit the updated lockfile.

```sh
npm run format:check
npm run lint
npm run typecheck
npm run content:validate
npm run test
npm run build
```

`npm run validate` runs all six gates above plus production asset validation. Typechecking is independent of the Vite build. `npm run format` formats application/tooling/content files and this README; existing authoritative documents retain their formatting. `npm run test:watch` starts Vitest watch mode.

For browser smoke tests, install Chromium once, then run:

```sh
npx playwright install chromium
npm run test:e2e
```

E2E builds the application and starts Vite preview on `127.0.0.1:4173`; that port must be free. `npm run preview` serves an existing `dist/` build for manual review. Preview is a local verification server. Static deployment will require history fallback for application deep links; no deployment provider or CI is configured.

## Foundation boundaries

- `src/domain`: framework-independent IDs and minimal machine/component/operation/process/stage/role contracts.
- `src/simulation`: explicit numerical input, structured validation/calculation failures, 18 canonical metrics and intermediate values. Loose volumes, unit-bearing inputs and a single metric-unit manifest; no presentation rounding.
- `src/content`: Zod schemas, structured graph validation, read-only repository, and explicit local JSON adapter.
- `src/application`: pure repository queries and page view models; grouping, supported sections, stage selection and semantic return-context validation. Experiment orchestration handles supported-model dispatch, immutable source/working copy separation and frozen calculated comparison snapshots.
- `src/navigation`: centralized routes, builders, and structural query parsing. Selected stages and return context live in the URL.
- `src/ui` and `src/app`: graph-backed pages, accessible layout, repository context and injectable loaded/invalid application composition.
- `src/visualization`: lazy React Three Fiber viewer, renderer-owned scene mapping/materials/visibility/mixer, camera controls and plain interaction contracts. Production metadata and binaries use the content/public pipeline described below.
- `src/test`, colocated tests, and `tests/`: component/unit, executable lint-boundary, and production-preview browser checks.

ESLint protects domain/application/content/visualization/simulation dependencies. Domain and simulation production layers reject Node imports, dynamic loading, and direct browser/runtime/clock APIs; colocated tests may use test tooling. Application/content rules restrict framework and layer imports, but do not enforce the same complete purity bans. Simulation also rejects Zod: scenario shape validation belongs to content. Official React Hooks 7.1.1 enables Rules of Hooks and dependency checks, without React Compiler tooling. Its published peer range supports ESLint 10; its mature Babel implementation has a transitive prerelease-style version, which does not make the stable plugin itself incompatible. There is no global state library, persistence, or backend.

## Domain content

The core knowledge graph uses six JSON collections under `content/domain/`: machines, machine components, operations, machine roles, processes, and process stages. They contain only canonical MVP identities, source-limited Russian names/descriptions, and relationship references; no engineering values. Production systems use a dedicated repository linked to this graph and scenario content. Component descriptions reuse learning-goals §4 and names follow domain-model §§5–10 / UI/UX §10. Approved S1 educational explanations for all nine components, including the power unit, now live in the separately validated learning pack.

`npm run content:validate` reads all production files and runs the same strict schemas and graph checks used by the local adapter; failures exit nonzero with structured issue paths. The command uses Node 24's native TypeScript support, with no additional runner. `npm run validate` includes this check and requires no browser.

Processes own ordered stage IDs; stages own their operation and participant role references; roles own eligible machine IDs. Where-used queries derive these relationships. Roles have no singular operation constraint, and related machines are not persisted as duplicated process data. The repository returns shared frozen records, `undefined` for missing IDs, and explicit invalid-content results. UI pages consume application queries without importing production JSON or schemas; composition loads the local adapter. Contextual return checks process/stage existence, ownership and machine eligibility without stored history.

React 19.3.0 is compatible with Fiber 9.8.1's registry peer range (`>=19 <19.4`), rechecked for the production viewer. Three 0.186.1 satisfies Fiber's Three peer range (`>=0.156`); @types/three 0.186.0 supports strict typechecking. OrbitControls comes from Three, without Drei or another application state library. TypeScript 6.0.3 is within TypeScript ESLint's supported range (`>=4.8.4 <6.1.0`).

## 3D asset pipeline

Production binaries live under `public/assets/3d/`; one JSON Asset3D metadata record per asset lives under `content/3d/` (nested folders supported). XE215C Stage 09 connects the immutable Stage 08 GLB through `content/3d/xe215c.json` and `public/assets/3d/xe215c/v1_0_0/`. The local asset repository validates this content and resolves by subject Machine ID; missing, invalid or ambiguous configurations are explicit.

See [3D asset specification](docs/3d/3d-asset-spec.md) and [Blender export guide](docs/3d/blender-export-guide.md). Renderer-neutral contracts belong to `src/domain/asset3d.ts`; content schemas validate shapes and machine/component ownership. `npm run content:validate` automatically validates all 3D metadata JSON alongside domain content; zero metadata files is valid. Metadata validation does not inspect binary topology.

Asset URIs use `assets/3d/...glb` or `.gltf`, resolved by the viewer against Vite BASE_URL. Re-export/version changes preserve Machine/component IDs. `npm run assets:generate` reproducibly creates the Stage 09 manifest, inspection and exact public copy from actual GLB bytes; `npm run assets:validate` checks integrity, complete mapping, hierarchy, clips and immutable Stage 01–08 hashes. It is included in `npm run validate`. Production HTTP delivery and real WebGL interaction are covered by E2E. See [Stage 09 delivery notes](models/xe215c/stage_09/README.md) for the unchanged authoring snapshot; its viewer-deferred notes describe the state at that delivery.

## Production viewer

Open `/machines/excavator/construction` or `/machines/excavator/working-cycle`.
Sections are derived from available metadata, not a machine-specific branch.
Canvas and accessible component buttons share canonical IDs. Complete mapped mesh
sets highlight reversibly and support hide/isolate/show-all; canonical transform
parents remain visible. Direct hits honor edu_selectable=false for six auxiliary
linkage meshes. Orbit/zoom and fit are camera operations, never model rescaling.

Playback resolves the declared activity/clip. Pause freezes its current visual
pose. Reset stops mixer influence and restores captured static local TRS, because
clip time zero is a digging pose rather than neutral. Selection and visibility
remain independent. Renderer-owned geometry/materials/controls/mixer are disposed
on unmount; downloaded bytes are reused while each viewer owns its parsed scene.
HTTP/decode/mapping/WebGL/context-loss states preserve textual learning content and
navigation; retry starts neutral. No simulation or engineering timing is derived.

Viewer code is lazy-loaded; the Three/Fiber chunk is about 983 kB minified / 261 kB
gzip and currently triggers Vite's default chunk-size warning. No performance
budget is inferred from that warning. DPR is limited to 1.5; no postprocessing or
shadows are added. Chromium E2E uses software WebGL sequentially for stable
diagnostics. Measured observations and device limitations are recorded in the
[completed viewer plan](docs/exec-plans/completed/0005-production-3d-viewer.md).

## Production-system experiment

Open `/systems`, choose a validated system, then explicitly select its supported
scenario. `/systems/:systemId?scenario=:scenarioId` identifies the immutable source;
no query shows an overview, malformed/duplicate query is invalid, and unavailable
sources have recovery links without defaulting to another scenario. Home's production
task and process-derived system links provide both entry paths.

Only truck count is editable. Participant limits come from content; null maximum
remains unbounded. Calculate explicitly runs the accepted model. Edits/reset mark
the previous result stale; calculation failures clear current success. A/B saves
freeze the input and exact result independently, fill two slots without replacement,
and survive reset until cleared. Source change, navigation or reload clears page
state; prediction and written justification have no grading or persistence.

Primary productivity/duration/total cost KPIs, textual work/idle/wait bars, exact
model relationships and a semantic A/B delta table explain results. Fractions become
percentages only for display; ratio differences use percentage points. Display values
are rounded, stored results are not. CU and loose-material volumes are explicitly
illustrative scenario inputs, not XE215C specifications. No fleet scene, optimization
criterion or recommended variant is implemented. Invalid system configuration is
isolated from existing machine/process/viewer routes.

## Educational MVP readiness

Both technical product slices and S1 foundational learning content are implemented; full educational readiness remains partial until S3/S4. See the [documentation index](docs/README.md) for the six current source-of-truth documents and the [MVP readiness audit](docs/quality/mvp-readiness-audit.md) for requirement evidence, learning-goal coverage and delivered S1/S2 and remaining S3/S4 slices. This audit adds no product functionality.

## S1 foundational learning content

`content/learning/foundation.json` stores owner-approved prose and four scoped provenance records; no external URLs are fetched at runtime. Strict schema/reference/completeness validation and a frozen read-only repository feed application queries. See the [approved pack](docs/product/s1-foundation-content-pack.md) and [content contract](docs/domain/content-schema.md).

Excavator overview/nine functions/«Как работает», shallow truck transport teaching and four process learning cards are available. Native compact disclosures preserve the selected stage; semantic breadcrumbs use canonical names. Machine → process `fromMachine` is graph-validated and survives stage selection/reload; explicit return targets applications. Existing process → machine `fromProcess/fromStage` is separate. No new numerical inputs/formulas/scenarios, phase controls or production 3D changes.

## S2 pedagogical working cycle

The working-cycle section now teaches six reviewed phases with canonical components, phase seeking/navigation, live visual progress and 0.5×/1×/2× playback. Learning overlay/provenance live in content/learning/working-cycle.json; approved prose and anchors are in docs/product/s2-working-cycle-content-pack.md. Excavation/filling intentionally share clip zero; Reset restores static neutral outside the clip. No engineering cycle time is inferred. S3/S4 remain deferred.
