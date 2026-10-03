# 0002 — Domain and content foundation

Status: Completed

## Goal

Implement a validated, read-only MVP knowledge graph on accepted foundation `7e48abaae7511a7b2fa8da923d2d9b8ad6cecc05`, without connecting it to the UI yet.

## Scope and non-goals

Implement six plain domain contracts, six JSON collections, shape and graph validation, local loading, repository queries, thin application queries, and production validation tooling. Harden standard Hooks linting and pure-layer I/O restrictions first.

No engineering values, formulas, scenarios, full parameter system, renderer/assets, learning Markdown/MDX, UI integration/redesign, persistence, backend, authentication, deployment, or CI.

## Source documents

Read AGENTS.md and README.md; system-architecture.md and ADRs 0001–0005; product MVP scope, learning goals and user flows; domain-model.md and simulation-model.md; UI/UX spec. These authoritative sources retain their semantics. The explicit task clarification makes stage operation canonical and role participation independent of a singular role operation. Clarify only the relevant domain-model sections.

## Domain entities and content files

Machine, MachineComponent, Operation, Process, ProcessStage, MachineRole, using existing branded IDs plus OperationId and MachineRoleId. Minimal identity, names/descriptions, and required relationship fields only; omit future parameters/assets and speculative enums.

Create `content/domain/{machines,machine-components,operations,machine-roles,processes,process-stages}.json`: two machines, nine excavator components, four operations, two roles, one process and four ordered stages. Copy established Russian names and short statements from the source documents. Sequence is structural order, not an engineering value.

## Schema and validation strategy

Zod belongs to content, never domain. Strict records, nonblank strings, branded stable IDs, positive integer sequences and duplicate-free reference lists; typecheck schema outputs against domain contracts. Follow shape validation with explicit structured graph issues. Invalid content must not yield a successful empty repository.

## Graph integrity rules

Unique IDs per entity collection; existing machine-component links with correct ownership; component owner existence and inverse membership; existing machine operations; process-stage existence and ownership in both directions; positive unique deterministic sequences consistent with stageIds ordering; existing stage operations and roles; existing eligible machines. No persisted relatedMachineIds or role operation constraint. Derive where-used from process → stages → roles → eligible machines.

## Implementation steps

1. Add official stable Hooks plugin with only rules-of-hooks and exhaustive-deps; protect pure production layers from Node modules and direct browser/runtime/clock APIs, allowing test tooling in test files. Prove restrictions with lint snippets.
2. Add minimal plain contracts and documented role/relationship clarification.
3. Add canonical JSON collections, source-limited descriptions, and explicit local manifest.
4. Implement Zod schemas, graph checks, immutable validated repository and thin queries.
5. Add a bundler-local adapter returning loaded/invalid states and a Node validation command using the same validator without a new runner dependency.
6. Test actual content and deliberately broken graphs, immutable canonical records, missing IDs, and application query identity.
7. Update README; run every required gate and scope/diff checks; complete/move plan, commit and push.

## Test and validation strategy

Schema rejection and production-content success; all requested graph mutations; repository canonical identity and ordering; where-used for both machines and a renamed test graph to detect hardcoding; missing IDs; mutation resistance; adapter invalid state; Hooks and pure-layer lint checks. Keep all existing shell/E2E tests unchanged.

Run npm ci, format:check, lint, typecheck, content:validate, test, build, validate, test:e2e. Inspect git diff, diff --check and status; confirm no formulas/values/rendering/UI relationships introduced.

## Risks

- Role-operation ambiguity: explicitly document the user-approved clarification and do not infer stage operation from role.
- Duplicated relationship truth: stages own participation, roles own eligibility, processes own ordered stage IDs; inverse checks catch omissions.
- Unreviewed descriptions: reuse source statements; omit descriptions where detailed explanation is absent.
- Mutable indexes: retain frozen copies and keep maps private; test returned records/arrays.
- Toolchain compatibility: verify official stable Hooks peer range; a mature transitive prerelease-style name alone is not incompatibility.
- Validation command drift: share manifest/validators with adapter and test actual checked-in files.

## Completion criteria and results

All required gates pass; graph validates and both directions resolve shared machines; existing UI remains unchanged; no excluded features; this plan records actual results under completed. Delivery uses `Implement domain content foundation` on `main`; the final report records the commit SHA and push status.

## Actual implementation results

- Added Machine, MachineComponent, Operation, Process, ProcessStage and MachineRole contracts, DomainGraph, OperationId and MachineRoleId. Domain contains only plain TypeScript contracts/guards.
- Added the six planned JSON collections: two machines, nine components, four operations, two roles, one process, four stages. Descriptions reuse learning-goals §4; canonical component names/IDs follow domain-model §§5–10 and UI/UX §10. The power-unit description is omitted because approved explanatory prose is absent. No engineering values were added; stage sequence is structural ordering only.
- Clarified domain-model §§8 and 10: no persisted authoritative relatedMachineIds; no singular role operation or equality check. Excavator role participates in excavation/loading, transport role in loading/haul/unloading. Machine capability operations are separate from participation roles.
- Added strict Zod schemas with stable branded IDs, nonblank names/descriptions, required relationship lists, duplicate reference rejection and positive integer stage sequence. Schema output is statically checked against domain contracts; parsed graph/records/reference arrays are frozen.
- Added structured shape/graph issues for duplicate entity IDs, dangling references, component/stage ownership, inverse membership, duplicate positions and inconsistent stage order. Ambiguous duplicate IDs fail before reference resolution; invalid content never becomes an empty successful repository.
- Added all nine requested repository operations and four application queries. Where-used derives process/stage/role participation without canonical-ID branches. Record identity is shared across queries, unknown IDs return undefined, and broken adapter invariants fail explicitly. Private maps are not exposed.
- Added an explicit six-file manifest, static JSON adapter with cached loaded/invalid result, and `scripts/validate-content.ts`. The CLI reads actual files and shares the runtime validator; malformed JSON/I/O or validation errors exit nonzero. Node 24 native TypeScript avoids an additional runner. Enabled JSON imports and explicit `.ts` imports for shared CLI validation code.
- Restored official stable React Hooks plugin 7.1.1, compatible with ESLint 10. Enabled only rules-of-hooks and exhaustive-deps; no React Compiler transform/tooling was configured. Accepted its mature Babel/gensync transitive version as requested, based on peer compatibility and successful validation.
- Hardened pure production lint restrictions against Node builtins with and without node: prefixes, dynamic imports, browser/persistence/network globals, runtime APIs, clocks and randomness. Test-only files may use tooling; executable snippets prove static/dynamic imports, direct APIs and both Hooks rules.
- README describes content location, validation, ownership, read-only identity and deferred UI integration. Existing shell pages and E2E tests were not changed.

## Validation results

Node 24.18.0 and npm 11.16.0; all accepted application packages retained. `npm ci` succeeded (242 audited packages, zero vulnerabilities). The first clean-install attempt hit a native library lock held by this project's dev server; after stopping that specific Vite process the clean install passed. The project server was subsequently running again on port 5173 (HTTP 200); removed only the duplicate restoration process. No cache/log/browser artifacts are tracked.

Passed: `npm run format:check`, `npm run lint` (zero warnings), `npm run typecheck`, `npm run content:validate`, `npm run test` (117 tests in five files), `npm run build`, `npm run validate` (all six non-browser gates), `npm run test:e2e` (three unchanged Chromium tests against production build, successful exit and server cleanup). Browser execution used the existing temporary Chromium cache and Windows process-tree permissions.

Tests cover production schemas, malformed/invalid IDs and fields, every requested broken reference case, duplicates in all six collections, stage order independent from collection order, canonical record identity, both machine where-used paths, a renamed test graph, missing IDs, mutation resistance, broken query invariants, pure-layer Node/dynamic/API bans and standard Hooks rules. Original shell and ingestion tests continue to pass.

Inspected source/content and git diff/status; git diff --check passed. Confirmed unchanged UI/app/navigation/visualization/E2E, simulation-model, product documents, architecture and ADRs. No engineering values, formulas, rendering dependencies/assets, hard-coded UI relationships, Markdown renderer, simulation code, persistence/backend, CI or deployment were introduced.

## Remaining questions and deferred work

The role-operation ambiguity is resolved by the explicit task-approved clarification. No blocking graph ambiguity remains. Rich descriptions (including power-unit), categories/statuses, hierarchy, role multiplicity/requirements and the parameter system are deliberately omitted until their slices need approved contracts/content. UI integration, educational prose, 3D metadata/assets/viewer, simulation and infrastructure remain deferred.
