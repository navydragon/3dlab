# MVP System Architecture

Implementation baseline (2026-10-04): both technical product slices are implemented at 793722754797737729bb7db1a9960c0f603477cd. Historical slice definitions below describe milestone scope, not current availability. Actual routes/contracts and unmet full-MVP learning obligations are recorded in [documentation index](../README.md) and [readiness audit](../quality/mvp-readiness-audit.md). Existing document status and accepted decisions are retained.

**Status: Accepted**

**Date:** 2026-10-02

**Acceptance note (2026-10-03):** The architecture was reviewed after commit `2db6ae2858b814874bf7c0610b227802941ed031` and accepted with the contract and milestone corrections recorded below. React + Vite, strict TypeScript, React Router, React Three Fiber/Three.js, JSON + Markdown, Zod, React local state/reducer/context, Vitest, React Testing Library, Playwright, and static/local MVP content are accepted. No backend, database, authentication, or CMS is required for the MVP. Acceptance does not authorize application implementation in this documentation task.

Accepted decisions are recorded in [ADR 0001](../adr/0001-client-side-react-vite-application.md), [ADR 0002](../adr/0002-content-driven-local-repository.md), [ADR 0003](../adr/0003-react-three-fiber-visualization-boundary.md), [ADR 0004](../adr/0004-pure-deterministic-simulation-core.md), and [ADR 0005](../adr/0005-url-addressable-contextual-navigation.md). `sessionStorage` UI restoration is optional/deferred; slice one restores `processId` + `stageId` through the URL and must work without storage.

## 1. Architecture goals

Support a multidisciplinary educational laboratory in which one machine can be studied independently and in several processes. Both machine-to-process and process-to-machine routes must resolve the same domain entities. Preserve the causal chain from machine structure and working cycle to system productivity, duration, operating cost, and reasoned comparison.

Optimize for correctness, simplicity, modularity, extensibility, fast iteration, and automated checks. Prefer one statically deployable application with explicit module boundaries over infrastructure or a generic platform engine. Adding a machine or process should mainly add validated definitions, learning content, and asset mappings. A new mathematical behavior can require a new calculation model; it must not require rewriting navigation or catalog architecture.

## 2. Constraints derived from product documentation

### 2.1. Sources and traceability

The following existing documents govern this proposal; architecture does not redefine their educational or engineering semantics:

- [Project instructions](../../AGENTS.md): content-driven relationships, layer separation, tested calculations, controlled scope, and decision review.
- [Project overview](../../README.md): multidisciplinary purpose, two learning directions, and implemented machine/process/production-system technical slices.
- [Strategic vision](../vision/strategic-vision.md), especially §§4–6, 9–11, 19, 22: reusable entities, progressive learning depth, connected knowledge, educational 3D, and staged delivery.
- [MVP scope](../product/mvp-scope.md), §§2–13: excavator, dump truck, one excavation/loading/haul/unloading process, contextual return, deterministic calculations, and explicit exclusions.
- [Learning goals](../product/learning-goals.md), §§4–10, 13: recognition, explanation, causal experiments, comparison, and justification rather than a predetermined optimal answer.
- [User flows](../product/user-flows.md), §§2, 4–7, 10, 13–19: shared entities, compact cards, real navigation history, direct links, and recoverable loading/error states.
- [Domain model](../domain/domain-model.md), §§4–29, 33–43: existing entities and IDs, references instead of copies, provenance, separate learning and 3D metadata, model versioning, and runtime navigation context.
- [Simulation model](../domain/simulation-model.md), §§3–5, 16–30, 35–37: exact deterministic model, loose-volume basis, explicit units, validation, reproducibility, independent calculation, and mandatory test cases.
- [UI/UX specification](../design/ui-ux-spec.md), §§10–17, 24–27, 40–55: shared selection state, controllable animation, process scheme, textual alternatives, resilient 3D, contextual return, and explicit first/second slice boundaries.
- [Architecture directory guide](README.md), [ADR guide](../adr/README.md), and [execution-plan guide](../exec-plans/README.md): proposal review precedes ADRs; significant implementation work gets an active plan moved to completed after delivery.

### 2.2. Derived requirements before technology choice

1. **Content-driven domain:** keep `Machine`, `MachineComponent`, `Operation`, `Process`, `ProcessStage`, and `MachineRole` as ID-addressed records. Derive page relationships through repositories; no entity-specific route-component conditionals.
2. **Entity reuse:** full machine modules and compact cards read the same machine definition. `ProductionSystem` defines participation; `Scenario` supplies experiment counts and values. Neither creates a second excavator.
3. **Navigation:** entity deep links must work without prior history. A process detour must restore `processId` and `stageId`. Machine learning sections must not discard return context. Browser history and explicit contextual return have different responsibilities.
4. **Educational 3D:** support GLTF/GLB, mapped selection, highlight, orbit/zoom/reset/fit, and play/pause. Selection from a text list and from geometry must update the same component ID. Isolation is optional, not a first-slice requirement.
5. **Pure calculations:** the contract is `SimulationInput → calculate() → SimulationResult`, with structured failures. No React, routing, browser DOM, renderer, randomness, hidden defaults, or visual timing in the core.
6. **Explainable comparison:** retain input/result snapshots with model version; display units, assumptions, provenance, and causal explanations. Changing an experiment must not overwrite a saved comparison. No automatic optimality label without an approved criterion.
7. **Validated schemas:** compile-time types alone cannot verify external content. Validate shapes, references, ordering, units, and graph consistency before serving content to views or calculations.
8. **Separable content:** domain facts, learning explanations, simulation scenarios/configuration, and 3D metadata are distinct datasets. Static/local content must work without a backend.
9. **Localization readiness:** IDs and relation queries must not depend on translated titles. Initial content is Russian; a multilingual UI is outside MVP. Leave a locale-specific learning-content boundary, not a translation platform.
10. **Future integration:** replace a local repository adapter with a backend adapter if later requirements justify it. Stable IDs, serializable content, and versioned results permit future LMS/export/authoring integration without implementing those systems now.
11. **Engineering checks:** TypeScript strict checks or equivalent, independent unit/integration tests, component/navigation tests, E2E tests, formatting/lint checks, and production-build verification. Small modules and explicit contracts must be easy to inspect and change during Codex-driven implementation.
12. **Delivery and resilience:** emit static build artifacts. Deep-link reloads need host support. Content and text navigation must remain usable when an asset or WebGL fails. Desktop is primary; tablet adapts, and mobile remains readable with functional navigation and later calculations.

### 2.3. Scope boundaries and reviewed contract corrections

- The vision §§13–14 proposes a broader earthworks pilot with bulldozers, rollers, cases, and teacher reports. The current MVP scope defines the narrower excavator/dump-truck process. This proposal preserves the long-term vision but adds none of the broader pilot features to current scope.
- User flows §19 Acceptance Flow 5 and the production-system context are assigned to the second slice / full MVP. The first technical slice follows UI/UX §54; fleet simulation UI follows §55. The full-MVP requirement is preserved.
- Learning goals §3's four depths belong to the complete MVP learning experience. Slice one proves architecture, 3D interaction, and navigation, not all productivity/economic goals or educational readiness of the complete MVP.
- Navigation/context examples use `stageId: excavation-stage`, matching domain-model §§4, 9. `Operation.id: excavation` remains separate from `ProcessStage.id: excavation-stage`; human-readable labels are unchanged.
- Simulation-model §17 is the canonical output metric vocabulary, and domain-model §18 uses the same IDs. Application adapters map calculated fields to these IDs without changing formulas, dropping outputs, or introducing alternate metric IDs.

## 3. Evaluated alternatives

### 3.1. Application framework

**React + Vite:** fits a browser-based laboratory with local content, interactive state, and static deployment. Keeps rendering, routing, content loading, and domain modules explicit. Requires separately configuring routing, checks, and deep-link hosting. Vite produces a static build; its preview server is for local verification, not a production backend. [Vite static deployment documentation](https://vite.dev/guide/static-deploy.html).

**Next.js:** provides a more integrated application framework and a path to server features. Static exports are possible, so Next.js does not inherently require a deployed server. However, export constraints and client/server boundaries add concepts while the viewer and experiments still require browser execution. Server rendering could improve indexed public learning pages or initial HTML delivery, but there is no concrete MVP SEO, personalization, server data, or authentication requirement. Static export also requires planning dynamic entity routes at build time. For this MVP, those benefits do not justify the added framework surface. [Next.js static exports](https://nextjs.org/docs/app/guides/static-exports).

**Other frameworks:** no established team constraint or product requirement makes another framework a stronger candidate. Avoid an exhaustive framework survey. A future requirement may reopen the decision, while pure domain and simulation modules remain portable.

**Recommendation:** React + Vite. SSR is not required for the MVP. Reconsider it only against a measured initial-delivery or search-discovery requirement, not anticipated LMS integration alone.

### 3.2. 3D layer

**Three.js directly:** provides explicit control of loading, scene construction, raycasting, render loops, and resource disposal without requiring React. It suits a renderer shared across different UI frameworks. Within this React application, it would require hand-maintained synchronization and lifecycle code for selection, resizing, mounting, and cleanup. Three.js supports GLTF loading and animation mixing. [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html), [AnimationMixer](https://threejs.org/docs/pages/AnimationMixer.html).

**React Three Fiber:** is a React renderer for Three.js, not a different domain or simulation engine. It fits declarative scene composition and React-owned selection/playback controls. It adds React dependency inside the viewer and requires compatible React/Fiber versions. It still requires knowledge of Three.js and GPU resource lifecycles. This is acceptable only within the visualization adapter; domain types must never import scene objects. [React Three Fiber introduction](https://r3f.docs.pmnd.rs/getting-started/introduction).

**Recommendation:** React Three Fiber over Three.js, with a small viewer interface that can later be implemented with direct Three.js. Evaluate a few Drei helpers for controls/loading only when implementation needs them; no physics, postprocessing, or large helper ecosystem by default.

### 3.3. Routing

**Handwritten History API routing:** avoids a dependency but requires reconstructing route matching, navigation, browser history, nested sections, and error handling. The contextual-return flows make this unattractive.

**Hash routing:** makes reloads simpler on hosts without rewrite support but changes public deep-link shape. It is a deployment fallback, not the preferred default.

**React Router declarative mode:** supports route matching, links, navigation, and location state while leaving bundling and repositories under application control. Data mode adds route loaders and error/pending facilities; useful if content loading later warrants them. Framework mode introduces more build/rendering conventions than this MVP needs. [React Router modes](https://reactrouter.com/start/modes).

**Recommendation:** React Router declarative mode with browser-history URLs, thin page controllers, and explicit content-loading states. Choose a host supporting SPA fallback, or separately review hash routing if that is unavailable. Do not rely on deployment rewrites that have not been tested.

### 3.4. State management

**React local state and reducer/context:** enough for page selections, a small navigation/session store, and later scenario drafts/comparison snapshots. Reducers can be pure and tested separately from React. Limit context scope so frequent viewer updates do not rerender the whole application. [React reducer/context guidance](https://react.dev/learn/scaling-up-with-reducer-and-context).

**Zustand or Redux Toolkit:** useful when shared state, independent subscriptions, persistence, or debugging requirements become materially larger. For this bounded MVP they introduce a second state abstraction without proving a need. Neither substitutes for domain repositories or pure calculation contracts.

**Recommendation:** no external global state library initially. Do not put every state value into context, mirror route state in several stores, or publish animation frames to a global reducer.

### 3.5. Content format and validation

**TypeScript data definitions:** convenient inference and typed authoring, but tie educational records to executable source and make future nondeveloper authoring harder. Use TypeScript for contracts and code, not as the primary content format.

**JSON:** portable, nonexecutable, straightforward to validate and serialize, and compatible with future import/export or authoring. It lacks comments and is verbose for prose; pair it with Markdown learning text.

**YAML:** readable and supports comments, but adds parsing rules and a parser dependency. Existing documents use YAML examples; those are semantic examples, not a requirement to store content as YAML. Choose YAML later only if an authoring need outweighs keeping one structured format.

**Markdown:** suitable for long explanations; relationships, units, and activities remain structured records. Render a constrained safe subset with raw HTML disabled. **MDX** permits executable component content, weakening the boundary between learning text and UI and increasing authoring/security complexity. Defer MDX.

**Handwritten validators:** avoid a library but repeat parsing/type/error logic across several datasets. **Zod** provides runtime validation and type inference for TypeScript-oriented schemas. **JSON Schema + Ajv** is a credible alternative when external tooling and language-neutral schema interchange become primary requirements; it needs a deliberate type-generation/alignment approach. Recommend Zod for the small MVP ingestion boundary, keeping content itself library-neutral. [Zod documentation](https://zod.dev/).

Schema validation does not establish engineering authority. References, provenance, and expert review remain required even when records pass every check.

## 4. Recommended architecture

One client-side modular application with local, version-controlled content and static GLB assets. A validated local repository exposes read-only domain records. Application services resolve references and assemble view models. Routing resolves IDs and navigation context; UI presents those view models. A separately bounded viewer consumes metadata and plain interaction state. The deterministic simulation module accepts only explicit validated inputs and returns structured results.

Use one repository and one build rather than a monorepo or separately published packages. Logical modules can later become packages if there is an actual reuse or tooling need. The MVP needs no backend service, database, authentication, container, queue, cloud infrastructure, CMS, or microservice. Static hosting is delivery infrastructure, not a new application backend; its provider is deferred.

The stack and boundaries are accepted and recorded in ADRs 0001–0005. Both technical slices are implemented; explicitly deferred concerns and incomplete educational content still require their own review.

## 5. Technology recommendations

- React for UI; Vite for development/build; TypeScript with strict checks for contracts and implementation. Strict TypeScript enables a family of type-safety checks; use a separate typecheck gate rather than assuming bundling verifies types. [TypeScript strict option](https://www.typescriptlang.org/tsconfig/strict.html).
- React Router declarative mode for entity routes and history.
- Three.js plus React Three Fiber for the isolated visualization implementation.
- JSON for structured content; Markdown for learning prose; Zod at ingestion/input boundaries. Select a minimal safe Markdown renderer during implementation review.
- Local state and narrow reducer/context stores for runtime application state.
- Vitest for domain, validation, simulation, reducers, and integration tests; React Testing Library with a DOM test environment for accessible component behavior. Vitest integrates with the Vite ecosystem; Testing Library emphasizes tests through user-observable behavior. [Vitest guide](https://vitest.dev/guide/), [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).
- Playwright for browser navigation, actual viewer interaction, loading failures, and production-build E2E. Its web-server facility can run a local verification server. [Playwright web-server documentation](https://playwright.dev/docs/test-webserver).
- ESLint for dependency/import rules and code quality; Prettier for consistent formatting, including Markdown, when tooling is introduced.

These are package-family recommendations, not an installation manifest. Pin mutually compatible stable versions and the development runtime after acceptance; verify React/Fiber compatibility at that time. Do not install anything in this task.

## 6. Logical layers and dependency rules

### Domain definitions

Own existing entity contracts, IDs, parameter/metric meanings, reference invariants, and quantity/unit vocabulary. May depend on plain TypeScript types and domain-owned pure helpers. Must not depend on React, router, Three.js, browser APIs, file loading, or GLB topology. Domain references to `asset3dId` or scene metadata references stay opaque IDs, not renderer objects or authoritative node names.

### Learning content

Own `LearningModule`, `LearningSection`, `ContentBlock`, and activity/learning-goal references plus locale-specific text. May reference domain IDs and approved simulation explanations. Must not import route components, execute JSX, encode formulas as competing executable truth, or duplicate machine records.

### Content schemas and repository adapters

Own parsing, shape/schema validation, cross-reference checks, content indexes, and local loading. May depend on domain/learning contracts, Zod, and a local content manifest. Must not depend on UI, router, scene runtime, or derive educational semantics from assets. Plain metadata schemas are independent of Three.js. Runtime asset checks occur in the viewer/build checks, not in domain validation.

### Simulation core

Own input/output contracts, units, input invariants, model-version identity, documented arithmetic, and structured calculation errors. May depend on domain quantity types and pure numerical helpers. Must not depend on React, routing, Three.js, DOM, repository I/O, wall-clock time, random values, session state, or translated text. It receives resolved values, never fetches content.

### Application services

Own queries such as machine learning view, process stage view, where-used lookup, scenario-to-input mapping, calculation orchestration, and result interpretation. May depend on domain contracts, repository interfaces, and simulation core. Must not import React, router implementations, Three.js, or components. Dependency injection can be ordinary function arguments; no dependency-injection framework.

### Application state

Own runtime selections, narrow page/session state, drafts, and comparison snapshots. Pure reducers may depend on domain IDs and application DTOs; React providers bind them to UI. Must not become the source of domain relationships, formulas, or scene topology. Browser persistence is a separate adapter around serializable state; storage never enters the calculation core.

### Routing/navigation

Own URL parsing/building, entity resolution requests, breadcrumbs, browser history, and validation/restoration of `NavigationContext`. May depend on React Router, application queries, plain IDs, and session-state adapters. Must not hard-code machine-to-process relationships, calculate productivity, or put URL paths into domain definitions.

### UI

Own pages, accessible controls, cards, panels, loading/empty/error states, units/rounding, and presentation. May depend on React, route bindings, application view models, runtime state, and the viewer's public interface. Must not implement engineering formulas, resolve relationships from hard-coded names, or know GLB internals. Page composition selects a presentation; it does not define a machine's meaning.

### 3D visualization

Own loading, camera, scene lifecycle, mapped hit selection, highlight/isolate, animation playback, and asset failure handling. May depend on Three.js/Fiber and plain viewer DTOs, metadata, IDs, and binary assets. Must not import simulation core, routing, educational repositories, or domain-cost logic. Emits component IDs and playback/loading events, never Three.js objects into application state.

### Assets

Own geometry, textures, clips, thumbnails, and license/source evidence. Binary assets have no application-code dependencies. They must not contain the sole copy of names, teaching text, parameter values, process relations, or formulas. Asset metadata references stable domain IDs; domain semantics remain valid if an asset is replaced.

Enforce these boundaries later with restricted-import rules and independent test environments. Specifically forbid `simulation → React`, `domain → Three.js`, `domain truth → GLB`, and `content relationship → route component`. Runtime data may flow outward from domain records to the viewer; that does not permit inward code dependencies.

## 7. Repository structure proposal

The following preserves the proposed layout from architecture acceptance. The application now exists; [repository structure](repository-structure.md) describes actual paths and responsibilities. Proposed unused modules are not implemented merely because they appear below; do not scaffold empty future modules.

```text
src/
  domain/                    entity types, IDs, units, pure invariants
  learning/                  learning contracts, no component imports
  content/
    schemas/                 domain, learning, scenario, asset metadata schemas
    repositories/            query interfaces, immutable indexes
    adapters/local/          explicit manifests and local JSON/Markdown loading
  simulation/
    contracts/               SimulationInput, outputs, structured errors
    models/earthworks-v1/    documented arithmetic and model version
    validation/              pure input/unit validation
  application/
    queries/                 machine/process/where-used view-model queries
    simulation/              scenario mapping, orchestration, interpretation
    state/                   pure reducers, drafts, comparison snapshots
  navigation/                route builders, return context, restoration rules
  infrastructure/session/    optional/deferred browser session storage adapter
  ui/
    pages/                   home, catalog, machine, process; later system view
    components/              compact/component cards and needed primitives
    providers/               narrow React bindings to application state
    presentation/            units, locale formatting, output rounding
  visualization/
    contracts/               renderer-neutral viewer DTOs and events
    three/                   Fiber scenes, loader, controls, selection, playback
content/
  domain/
    machines/                excavator and dump-truck JSON definitions
    components/              MachineComponent definitions
    operations/              excavation, loading, haul, unloading definitions
    processes/               excavation-haul definition
    stages/                  ordered stage records
    roles/                   MachineRole records and eligible-machine references
    parameters/              definitions and approved unit/provenance metadata
    metrics/                 approved output metric definitions
    systems/                 ProductionSystem definitions (slice two)
    materials/               only material definitions actually required
  learning/ru/
    modules/                 structured modules, sections, blocks, goal references
    text/                    Markdown explanations referenced by block IDs
  simulation/
    models/                  metadata, assumptions, versions; no executable formulas
    scenarios/               approved baseline inputs, later comparison presets
  assets3d/                  Asset3D, SceneNodeMapping, AnimationMapping, cameras
public/
  assets/3d/                 versioned GLB/GLTF and required textures/decoder files
  assets/images/             approved thumbnails and text fallback imagery
tests/
  unit/domain/               invariants and schema/graph validation
  unit/simulation/           every documented baseline and edge case
  unit/application/          reducers, mappings, interpretation
  integration/               repositories, query joins, navigation restoration
  components/                accessible DOM behavior with viewer test doubles
  assets/                    actual GLB mapping/clip checks when assets exist
  e2e/                       Playwright browser acceptance flows
docs/                        existing product/domain/design/architecture documentation
```

An explicit content manifest belongs in the local adapter. A new record is added there along with its data; the UI does not gain a machine-specific branch. Avoid runtime directory discovery, remote content pipelines, separate workspaces, or a generic plugin loader for two machines and one process.

## 8. Domain/content strategy and page data flow

### 8.1. Authority, identity, and validation

Preserve the entities and IDs defined by the domain model, including `excavator`, `dump-truck`, `bucket`, `excavation-haul`, and `excavation-stage`. Store references rather than nested duplicated records. An operation remains a reusable definition; a stage is its ordered use within a process, not another name for the operation.

Validate every dataset at build/check time and at the runtime ingestion boundary before creating a read-only repository. Check unique IDs per entity type; component ownership and parent cycles; valid stage order/ownership; operation and role references; learning subject/goal links; compatible parameter units; model/scenario links; and metadata references to existing components. Reject broken required content rather than rendering a plausible invented relationship.

`Process.relatedMachineIds` and `Machine.operationIds` are existing contract fields. Keep them and validate their consistency with the stage/role graph. Propose that stage-role eligibility is the primary where-used query source and explicit related-machine lists are checked summaries, not independently editable truth. Review this relationship-authority rule before implementation; do not delete fields to simplify it.

Keep plain domain contracts independent from Zod. Align schema output types to those contracts and test the alignment; do not maintain two unchecked models. Start with schemas only for used records and a simple content schema-version marker for supported bundles. Future migration machinery is deferred. Unknown schema versions fail explicitly.

### 8.2. Provenance and language

Preserve `ParameterDefinition.sourceType`, per-value source/notes, and `Scenario.isIllustrative`. The domain document also lists manufacturer/reference/user-input provenance categories: preserve the finer source classification rather than squeezing every value into the coarser parameter-definition category. Review the exact source record schema; require usable references for authoritative claims. Derived values carry model/version/input provenance. UI shows illustrative labels and units next to values, including compact cards.

Do not duplicate a scenario's capacity or time as an unexplained machine characteristic. Compact numeric examples, if shown, resolve an approved scenario/parameter value with its source. Learning goal IDs reference the approved goals rather than copying their full text into every block.

Initial Russian display names retain the current contracts. Locale-specific learning text is separate and IDs are language-neutral. A localization adapter can resolve other locales later without changing relationships. Do not add multilingual UI, invented translations, or a generalized translation-key engine now.

### 8.3. Machine page flow

```text
route → validated machine id → domain repository
      → application machine query → learning module/sections
      → asset reference → validated 3D metadata → viewer DTO
      → UI (text, component card, cycle controls, where-used links)
```

The query resolves `Machine.componentIds`, learning subject references, and where-used relations from the graph. The route controller passes the selected learning section and navigation context independently. Missing machine IDs produce a not-found view. Missing/failed optional 3D does not hide text or where-used navigation.

### 8.4. Process page flow

```text
route → validated process id → Process.stageIds → ordered ProcessStage records
      → Operation + MachineRole → eligible Machine references
      → application stage view model → UI + compact machine card
```

The process page starts from content-defined ordering, inputs/outputs, and roles. Selecting `excavation-stage` changes runtime selection and the URL, not domain records. Opening an excavator card reads the existing machine plus role context; closing it leaves the stage selected.

## 9. Simulation architecture

### 9.1. Contract and model ownership

```text
Scenario + ProductionSystem + ParameterDefinitions/Values
  → application mapper (resolve values, units, provenance)
  → validated SimulationInput
  → pure calculate() for earthworks-deterministic-v1
  → SimulationResult or structured calculation failure
  → application interpretation → presentation/optional later visualization
```

The core implements exactly the sequence and formulas of simulation-model §§7–16. No formula DSL or runtime evaluation of strings. JSON model metadata describes assumptions and identity; it does not execute mathematics. A small explicit model dispatcher can select a compatible calculation by model ID/version when another model exists.

Preserve the v1 assumptions: one excavator, identical trucks, one route/loading front, steady deterministic cycles, and no separate unloading bottleneck or stochastic events. Volumes are loose cubic metres, not mass, bank volume, or compacted volume. Use the documented seconds/minutes/hours, kilometres, speeds, and conditional currency units; perform only explicit conversions. Do not normalize everything to an undocumented unit system.

Inputs have unit-bearing contracts, such as the source document's `cycleTimeSeconds` and `capacityM3Loose`, and validated parameter mappings. Reject incompatible units and nonfinite numbers. Preserve positive/nonnegative constraints, integer truck count, and the zero-distance case. Do not invent slider maxima, fill-factor norms, material corrections, or near-balance thresholds.

Preserve discrete bucket passes and saturation count with `ceil`; apply `k_time` at the documented steps, avoiding double application to loading time. Keep standalone excavator productivity separate from system productivity. Internal calculations retain precision; rounding and percentages are presentation concerns.

### 9.2. Results, errors, and reproducibility

The deterministic payload includes model ID/version, input snapshot and all documented output fields. Failure carries a machine-readable code and parameter references; UI supplies localized explanations without hidden fallback values or exposing stack traces. Core checks guard against zero division, nonfinite outputs, and nonpositive system productivity.

Domain-model §19 requires `calculatedAt`. Attach that timestamp in the application orchestration envelope after calculation. The pure core never reads the clock; identical inputs/model version yield identical numerical results. Determinism tests compare the core payload, not wall-clock metadata. Keep scenario ID and input provenance in the result envelope for comparison and reproducibility.

Save immutable snapshots in `ComparisonSet` when the user explicitly requests comparison; scenario drafts remain separate. Compare results under the same model version, unit basis, and assumptions, or explain incompatibility. Calculation does not depend on asset availability or whether the viewer is playing. Animated queues can later illustrate aggregate results, but v1 must not imply event-level fidelity it does not calculate.

Interpretation maps metrics to approved learning explanations. `near-balanced` requires an approved bound; do not choose one in code. Until approved, show exact indicators and neutral explanations without that classification. Optimality, assessment, and student justification remain distinct from numerical calculation.

## 10. 3D architecture and selection data flow

Load each asset by `Asset3D.uri` and version. Resolve `SceneNodeMapping` and `AnimationMapping` separately from geometry. Technical node names may identify meshes within an asset, but card text, component identity, and process membership come from content. Mapping needs an asset-version-scoped unique node reference; duplicate node names must be disambiguated explicitly in metadata rather than selecting an arbitrary mesh.

```text
scene hit/node → asset-scoped mapping → MachineComponent id
              → application selected-component state
              → domain/learning view model → component card
              → selectedComponentId back to viewer → highlight
```

The reverse path is text-list selection → same component ID/state → same highlight. Support mappings from several mesh nodes to one educational component. Ignore unmapped background nodes. Reject mappings to a component belonging to another machine. The viewer emits IDs and plain events, never text scraped from mesh names.

A small public viewer boundary accepts asset metadata, selected component ID, and playback commands; emits component selection, loading/error, and playback status. Plain camera snapshots may be emitted for optional restoration. `Object3D`, materials, mixers, and raycasters remain private to the implementation.

Use orbit/zoom, reset and fit controls with bounded camera behavior. Apply one clear selected accent; renderer-local material changes must not mutate a cached shared asset for another viewer. Isolation, when added, changes visibility groups based on mapping and can be reset; it never removes domain records. Transparency/exploded views remain optional and postponed.

Map working-cycle clips to approved learning actions/phases. Play/pause/resume operate on visual playback only. Render-loop updates and animation clocks stay local; publish coarse status/phase changes only as needed. Do not derive `t_cycle` or loading productivity from clip duration. Do not fabricate clip phase timings from engineering formulas; approved asset metadata supplies visual phase boundaries where required.

Lazy-load the viewer and large assets after text content. Separate loading state, unsupported WebGL, missing mapping/clip, network/decode error, and context loss. Provide retry, component-list/text alternatives, and keep process links available. Missing animation disables its controls with an explanation; an error must not masquerade as a successful working cycle. Failure recovery is necessary but does not fulfill the successful-asset slice acceptance criterion.

Measure GLB download size, texture memory, initialization time, and frame behavior on agreed devices. Optimize geometry/textures and reuse assets; introduce compression/decoders or LOD only with compatible exports and measured need. Dispose renderer-owned resources and cancel loading on unmount. Numeric asset budgets and exact model/clip acceptance rules require review; do not present invented budgets as product requirements.

## 11. Navigation and state architecture

### 11.1. Public addresses

```text
/                                      home
/machines                              catalog
/machines/:machineId                   machine module
/machines/:machineId/:sectionId        implemented learning section
/processes/:processId                  process overview
/processes/:processId?stageId=:stageId  selected process stage
```

Current addresses also include `/processes`, `/systems` and `/systems/:systemId?scenario=:scenarioId`. Home has three entries. These paths are navigation identity, not domain IDs. Validate sections/stages/sources against resolved content; unknown entities get not-found views and invalid optional selections get visible recovery. See [information architecture](../product/information-architecture.md) for actual query semantics.

Browser-history routing requires static-host HTML fallback for valid app routes, a configured base path if hosted below the root, and correct asset paths. The host must serve missing asset files as errors, not as successful HTML fallback responses. Test direct load, reload, and a subpath before deployment; no provider is chosen here.

### 11.2. Contextual detours and restoration

When opening the machine module from a process card, construct the existing `NavigationContext` from validated IDs: `sourceType: process`, `processId: excavation-haul`, `stageId: excavation-stage`, and the opened machine ID/type. Retain it through machine learning-section changes. Origin from a machine-to-process link is also kept as navigation context, independently of domain relationships.

Use explicit internal URL query fields for a shareable/reload-safe return target, for example:

```text
/machines/excavator/construction?fromProcess=excavation-haul&fromStage=excavation-stage
```

This serializes navigation context, not a new domain entity. Validate process/stage existence and the machine's eligible role before showing the return action. Construct an internal destination with route builders; never redirect to an arbitrary URL from query text. Carry those fields through the machine's internal links. Explicit return navigates to `/processes/excavation-haul?stageId=excavation-stage`, not an unconditional history decrement.

Required restoration of `processId` + `stageId` uses the URL and works without `sessionStorage`. Route history state and a narrow in-memory session-state map may retain compact-card/panel state, selected machine, scroll position, and optional camera state. `sessionStorage` restoration is optional/deferred and is not a slice-one dependency. If later implemented, snapshots need versioning, parsing, reference validation, bounded retention, and graceful failure when storage is unavailable. URL IDs remain authoritative; storage restores only compatible optional detail. No persistence promise across browser sessions is made.

Ordinary browser Back follows actual visited sections (user-flow §13); explicit “Back to stage” skips the learning detour and returns to its semantic origin. Entering a machine by plain deep link without valid origin shows hierarchy/catalog navigation. Stale context cannot send a user to a nonexistent stage or another website. Do not introduce an unbounded custom global navigation stack.

### 11.3. State ownership

- URL: current machine/process, implemented section, selected process stage, and explicit return IDs.
- Domain repository: read-only entities and relationships, shared by all views.
- Page reducer: selected component, compact-card state, and local controls.
- Narrow session store: optional presentation restoration and later scenario draft/comparison snapshots.
- Viewer internals: GPU objects, camera controls, loading operations, animation frames, and mixer time.
- Calculation result: immutable resolved inputs and outputs, never live references to a mutable form.

Avoid mirrored ownership: read URL-backed state from the route, derive related machines from content, and pass selected component state into the viewer. Reset camera, selection, animation, or scenario independently; none should erase contextual return.

## 12. Testing strategy

These gates originated in the architecture task. Current installed checks and executed evidence are recorded in the readiness audit; educational requirements beyond tested technical slices remain obligations.

1. **Content/domain:** validate all content and schemas, duplicate IDs, missing references, stage order, role eligibility, component ownership, provenance, learning links, and incompatible units. Use deliberately broken fixtures to prove rejection; validate every real content bundle. Assert compact and full views resolve the same machine ID/data.
2. **Simulation unit tests:** execute under a non-DOM environment. Cover every simulation-model §35 requirement, baseline trucks 1–5, distance 4 km with 3 and 5 trucks, zero distance, invalid inputs, nonfinite values, output constraints, discrete bucket rounding, and coefficient application. Compare against §21–22 expected values with the documented relative tolerance `1e-6`; use suitable absolute tolerance for zero. Expected fixtures are test oracles, never production cached answers.
3. **Application unit/integration:** check content joins and where-used queries, scenario-to-input mappings, result envelopes/versioning, immutable comparisons, errors, and neutral interpretation. Test navigation context parsing/restoration, missing/stale IDs, direct entry, and restoration without storage. Test storage failure only if optional storage restoration is later introduced. Pure reducers run without React.
4. **Components:** React Testing Library tests cards, labels, selected state, keyboard actions, pause/resume controls, loading/error/empty states, unit formatting, and contextual breadcrumbs. A viewer test double isolates UI behavior; it cannot prove raycasting or actual playback.
5. **Assets/viewer:** inspect actual asset nodes/clips against mapping, including duplicate-name ambiguity and missing clips. Browser tests verify real mapped bucket selection, highlight, camera fit/reset, and play/pause/resume with the approved GLB. Selection also works from the accessible component list. Avoid relying on unstable pixel-perfect GPU snapshots.
6. **Navigation/E2E:** cover first-slice flows listed below using a served production build, including direct URL load/reload, browser Back/Forward, return after machine-section changes, no-origin entry, stale context, and compact-card close. Inject asset HTTP/decode failures and unsupported 3D conditions; text/navigation must still work. Verify keyboard focus and visible textual alternatives; manual QA covers real device/GPU usability.
7. **Slice-two E2E:** change truck count, calculate real outputs, keep two saved comparisons while editing a draft, and show provenance/units/explanations. Verify illustrative values and separate simulation/animation speeds. Add these tests with that slice, not now.
8. **Build/check gate:** formatting, lint (including import boundaries), strict typecheck, content validation, unit/component/integration tests, production build, then production-build E2E. Verify static deep-link behavior and asset paths. Plan CI only after architecture acceptance; no CI workflow is created here.

## 13. First vertical slice architecture

Source of truth for this task: UI/UX §54 and the explicit fourteen-item slice definition. This slice demonstrates connectivity and interaction, not complete simulation or educational readiness of the full MVP.

### 13.1. Necessary pieces and acceptance path

1. **Home:** small UI shell with equal Machine and Process entries, using content catalog queries. The production-task entry is deferred, as permitted by UI/UX §3.
2. **Machines catalog:** shared machine records and available-content status; excavator link. Dump-truck identity remains in domain/process references, without inventing a full dump-truck module or clickable unimplemented page.
3. **Excavator page:** repository query, learning-module resolution, implemented section presentation, and stable entity address.
4. **Interactive viewer:** approved excavator GLB/GLTF, mapped nodes/clips, orbit/zoom/reset/fit, lazy loading, failure states, and textual alternatives.
5. **Selectable bucket:** the existing `bucket` component, asset-scoped mapping, and one selected-component state from either mesh or list.
6. **Information card:** approved component/learning content and relationship references, not strings inside a scene handler.
7. **Working-cycle play/pause:** mapped approved clip, pause/resume controls, visible playback status, and visual/engineering-time separation. Detailed phase seeking/speed controls are later work, not required for this slice.
8. **Where used:** query stage/role relationships for the excavator, show approved process title and contextual role.
9. **Machine-to-process navigation:** route builder resolves the existing `excavation-haul` process from query output and retains origin context.
10. **Process page:** content-defined ordered excavation/loading/haul/unloading scheme; process 3D scene is deferred as permitted by UI/UX §25.
11. **Excavation-stage selection:** select canonical `excavation-stage`, expose its approved meaning and linked machine role, and reflect selection in the URL.
12. **Compact excavator card:** same machine definition plus process-role context; closing the card preserves stage selection. No unexplained numeric characteristics.
13. **Full module detour:** explicit Study Machine action opens the existing module with validated return IDs.
14. **Contextual return:** return action restores the same process/stage after inspecting the machine, including after reload or learning-section navigation. Optional panel/camera restoration cannot replace required stage restoration.

Required tests prove: home → catalog → excavator → bucket → card; play → pause → resume; where-used → process; process → excavation-stage → compact card → full module → same stage. Direct links, failed assets, and no-origin return fallback are part of robustness checks.

### 13.2. Deliberately postponed pieces

Do not build fleet simulation UI, system pages, editable truck-count controls, result KPI panels, scenario saving/comparison UI, or productivity forms in slice one. Simulation contracts/boundaries are designed here; implementation and numerical unit tests belong to slice two before exposing its UI. A calculation-compatible architecture does not require an empty simulation package in slice one.

Also postpone process 3D scenes, detailed dump-truck learning, complete excavator component interactions beyond the accepted minimum, detailed cycle phase controls, isolation/transparency/exploded views, question/assessment workflows, and unused UI primitives. Keep the existing full-MVP learning goals and machine-component records as future obligations; do not claim one bucket satisfies all machine learning outcomes.

Approved content and a usable licensed/animated excavator asset are prerequisites to successful first-slice implementation. Do not manufacture educational text, surrogate clips, GLB placeholders, or engineering values to make an acceptance flow appear complete.

## 14. Deferred concerns

No backend, database, authentication, containers, queues, CMS, microservices, or cloud-service design is needed for current MVP. Backend/LMS integration and authoring may later be added via repository or result-export adapters after concrete requirements and scope review. Do not build speculative adapters now.

Package-manager/runtime versions are pinned in package.json and lockfile. Defer hosting provider, CI implementation, public SEO/SSR, offline support, cross-session/user persistence, export formats, analytics, instructor reports, machine variants, mass/density/material extensions, and discrete-event simulation. Simulation extensions require their own versioned contract and approved model changes; replacing a calculator must preserve domain entity identity.

AI, LMS dashboards, authorization systems, AR/VR, normative costing, auto-optimization, and additional machines/processes remain excluded by current MVP boundaries. Localization readiness is retained while multilingual UI is deferred. A richer content renderer can evolve when actual content blocks require it; no plugin registry or generic content engine is proposed for slice one.

## 15. Architecture risks and mitigations

- **Overengineering:** keep one application and actual slice-sized modules. Review every abstraction against an existing requirement; no monorepo, generic plugin framework, or unused adapter hierarchy.
- **Domain/content duplication:** one ID-indexed repository, reference-based processes/modules, and graph-integrity checks. Declare and review which relation fields are primary versus checked summaries.
- **Route/domain coupling:** build URLs from IDs at the navigation boundary. Domain records never store route paths; changing route shape cannot change entity IDs.
- **Simulation/UI coupling:** non-DOM calculation tests and restricted imports. Pass resolved inputs, not controls, React state, or scene objects; keep rounding outside the core.
- **Node names becoming educational content:** explicit asset-version mapping and domain-owned cards. Test mappings and distinguish operation, phase, component, and stage IDs.
- **Very large GLB assets:** lazy load, measure on target hardware, optimize exports/textures, and choose compression/LOD only from measured needs. Review real download/GPU budgets before acceptance.
- **3D loading failure:** viewer-level failure handling, retry, textual alternatives, and independent route/content rendering. Validate required nodes/clips and include failure E2E tests.
- **Context state loss:** validated return IDs in URLs plus optional versioned session snapshots. Test section changes, reload, browser navigation, and stale content; preserve the selected stage without relying on storage.
- **Premature backend:** local repositories and static hosting satisfy the stated requirements. Require a concrete persistence/integration need and scope review before backend design.
- **Premature generic content engine:** render only approved block types used by the slice. Add a block type because content needs it; do not implement hypothetical authoring/UI languages.
- **Schema complexity exceeding MVP value:** small schemas at ingestion, pure domain contracts, and simple explicit reference checks. Avoid speculative migrations or constraints not approved by experts.
- **Unverified numbers/provenance:** use the documented illustrative baselines; show source labels and units. Runtime validation cannot promote illustrative data to engineering authority.
- **Version drift:** review and lock compatible React/Fiber/tooling versions before implementation; version assets/content/calculation models independently. Test saved results against their model identity.
- **False determinism:** clocks and browser storage stay outside numerical payloads; test repeatability without animation or wall-clock data.
- **Acceptance mistaken for scope expansion:** preserve Accepted status and ADR traceability while keeping implementation authorization and deferred concerns separate. Acceptance does not add features to the MVP.

## 16. Open questions for human review

1. The stack, local-content strategy, viewer boundary, and URL-based contextual return are accepted in ADRs 0001–0005. Exact package versions are pinned; hosting and optional storage restoration remain deferred.
2. Slice milestones and complete-MVP learning-depth wording are reconciled with UI/UX §§54–55. How the broader vision pilot stages map to later scope remains a product-planning question.
3. The XE215C Stage 08/09 production asset is available with mapped components and working-cycle clip; delivery review still owns provenance/redistribution permission. What device/browser, asset-size, memory, and frame-quality budgets will reviewers accept?
4. Approve the exact domain/content schemas, source/provenance record format, primary relationship ownership, and schema-version policy. Metric IDs are now canonical under simulation-model §17. Are additional instance-level operation objects actually needed? No such new entity is assumed here.
5. Approve the educational content and visual phase mappings. How should overlapping digging/filling terminology be presented consistently across the existing cycle descriptions without changing the aggregate calculation model?
6. Slice two implements the documented illustrative v1 model. Still review expert validation of the existing numerical model, input control ranges, optional near-balance bounds, and result interpretation. No new engineering constants are proposed.
7. Optional panel/camera storage restoration and persistence mechanisms remain deferred; slice one must work without them. Is cross-session scenario persistence an actual requirement for a later slice? Backend storage is not inferred from the desire to compare two scenarios.
8. Which static hosting environment will support history fallback and any deployment base path? Are SEO or initial HTML requirements strong enough to revisit the SPA choice?
9. Confirm the future localization representation before adding languages; current entity IDs and Russian names remain stable. Future LMS/authoring interfaces need concrete requirements before design.

This document records accepted technical boundaries, leaves remaining product questions visible, and preserves the existing requirements without beginning application implementation.
