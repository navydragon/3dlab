# Domain UI integration

Status: Completed

## Goal and scope

Connect the validated local domain graph to the machine and process catalogs,
machine overview/applications sections, process stages and bidirectional navigation.
Use the accepted architecture and ADRs, MVP, learning goals, user flows, domain model
and UI/UX specification as sources of truth. Preserve production content.

## Non-goals

No 3D, simulation, numerical engineering data, learning Markdown, persistence,
backend, CI or substantial visual redesign.

## Routes and query usage

Keep `/`, `/machines`, `/processes`, `/machines/:machineId`,
`/machines/:machineId/:sectionId`, `/processes/:processId`.
Add process listing to the repository and application queries. Build grouped
machine usage, section support, stage selection and validated return context in
pure application view models. React pages only parse routes, query and render.

## UI states and contextual navigation

Compose the local adapter once into an injectable loaded/invalid content boundary.
Show explicit content errors, missing entity/section states and recoverable invalid
stage/context notices. Select stages through `stageId`; validate `fromProcess` and
`fromStage` against ownership and machine participation before offering a return.
Preserve valid context across overview/applications links and return explicitly
to the same stage. Keep browser Back independent and use no stored navigation state.

## Implementation steps

1. Add repository process listing and pure application view models.
2. Add composition/content-error handling; replace shell pages with graph-backed views.
3. Add minimal cards, selected-stage styling and accessible stage links/details.
4. Remove obsolete unconnected-content notices and update Home/README.
5. Add application, component and production-build E2E tests.
6. Run all gates, inspect scope/diff, complete and move this plan, commit and push.

## Accessibility and tests

Keep landmarks, visible focus, meaningful headings and real links. Give stage
links selected semantics and associate them with stage details. Test canonical
identity, grouping/order, ownership/eligibility, invalid data/URLs and both navigation
directions, including section context preservation, direct reload and exact return.
Run npm ci, format:check, lint, typecheck, content:validate, test, build, validate,
test:e2e and git diff --check. Inspect responsive screenshots and git status/diff.

## Risks and completion criteria

Avoid route-layer graph logic, duplicate domain records, unsafe return links and
selection state diverging from the URL. Verify with pure query tests and injected
invalid repositories. Completion requires all gates passing, unchanged domain
content/product semantics, accessible real navigation, this completed plan retained,
and a clean committed/pushed branch.

## Results

Added repository process listing and pure catalog/page queries. Page models preserve
canonical record identity, group machine usage by process/stage, resolve operations
and role participants, support overview/applications, and validate process/stage
ownership and machine eligibility before exposing return context.

Composition injects loaded/invalid repository state through a read-only React
context. Catalogs, machine/component/usage views and process/stage/compact cards
now consume application queries. Invalid content, missing entities/sections,
invalid stage URLs and untrusted origin context have explicit recoverable states.
Stage selection and section-preserved return context remain URL-based. Removed
obsolete unconnected-content state/notices; updated Home and README. Added a small
UI import restriction for JSON/schema/adapter access with executable lint tests.

Validation completed with Node 24.18.0 / npm 11.16.0: npm ci, format:check,
lint, typecheck, content:validate, test, build, validate and test:e2e all passed.
The initial clean install encountered a Windows native-module lock held by the
project Vite server; stopping that identified process allowed an unchanged-lockfile
install. Test API typing differences were corrected without suppressions.

138 unit/component/tooling tests and four production-preview Chromium E2E tests
pass. Tests cover canonical identity, grouping/order, changed role eligibility,
foreign-stage ownership, missing entities/sections, invalid content/context,
keyboard navigation, both product flows, section context preservation, exact return,
reload and ordinary browser Back. Desktop machine/process and 360px process
screenshots were inspected; responsive overflow checks passed.

Git diff and diff --check were inspected. Production JSON, domain contracts,
product requirements, architecture/ADRs, dependencies and lockfile remain unchanged.
No engineering values, formulas, sessionStorage, 3D, Markdown, backend or CI added.
No new domain ambiguity was discovered. Full learning content and visualization
remain deliberately deferred; the existing power-unit description remains absent.
