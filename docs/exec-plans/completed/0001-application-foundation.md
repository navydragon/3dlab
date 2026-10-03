# 0001 — Application foundation

Status: Completed

## Goal

Bootstrap a tested client-side application against accepted baseline `3dc618a0830f19c52ee2f346091a2df70bb1af72`, preserving the product and architectural semantics.

## Scope and non-goals

Use npm, React, Vite, strict TypeScript, React Router, Zod, Vitest, React Testing Library, Playwright, ESLint, and Prettier. Implement accessible shell pages, centralized route builders/parsers, opaque IDs, a small content validation boundary, and renderer-neutral interaction contracts.

No educational datasets, full domain entities, formulas, simulation implementation, viewer, 3D assets, animation, persistence, backend, authentication, localization, CMS, analytics, AI, or CI. No Three.js/Fiber installation until the viewer slice.

## Affected layers

Domain: stable ID primitives only. Content: validated ingestion only. Application: explicit unresolved-content state. Navigation: routes and structural URL validation. UI: accessible shell. Visualization: plain interaction contracts only. Simulation remains documentation-only; lint rules protect its future location.

## Implementation steps

1. Inspect authoritative documents and verify the baseline and repository state.
2. Check stable package versions, engines, and peer compatibility; record exact dependencies in the npm lockfile.
3. Configure independent strict typechecking, formatting, lint boundaries, unit/component tests, and production-preview E2E tests.
4. Implement ID primitives, ingestion validation, centralized navigation helpers, and shell states.
5. Implement home, machine catalog/entity/section, process entity, invalid-route, and not-found pages. Add `/processes` as an empty entry shell so the home Process link needs no fabricated entity.
6. Add renderer-neutral visualization contracts without installing rendering dependencies.
7. Add tests, developer instructions, and run all required gates. Inspect the final diff for scope violations.
8. Record results, move this plan to completed, commit, and push to the current origin branch.

## Expected files/directories

Root npm manifest/lockfile, HTML entry, TypeScript/Vite/ESLint/Prettier/Playwright configuration, ignore rules; meaningful modules under `src/app`, `src/domain`, `src/content`, `src/application`, `src/navigation`, `src/ui`, `src/visualization`, `src/test`; browser tests under `tests/e2e`; updated README and this completed plan. No speculative production content files or empty simulation package.

## Validation

Run `npm install`, `npm run format:check`, `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:e2e`, and `npm run validate` if supplied. Test home/navigation, parameters, stage query, URL builders, invalid and unknown routes, invalid ingestion data, and forbidden imports. Test browser deep links/reload and Home → Machines against Vite preview. Inspect `git diff`, `git status`, and staged files before committing.

## Risks and mitigation

- Version/engine drift: use registry metadata and compatible stable peers; pin and lock dependencies.
- Shell mistaken for resolved entities: display explicit unresolved-content notices; no entity lookup shortcuts.
- URL IDs mistaken for domain truth: validate structure at navigation boundary; defer existence/reference checks to real repositories.
- Architectural drift: restricted imports and executable lint-rule tests.
- Browser setup failures: install only the Chromium test runtime required for local smoke tests.
- Scope expansion: keep all product documents unchanged and review the final tracked file list.

## Completion criteria

All requested local checks pass; no excluded features/content are introduced; README explains the local toolchain; this plan records actual results and resides under completed; the intended changes are committed and pushed with a clean working tree.

## Results

Implemented the root application and lockfile, strict application/tooling typechecks, accessible Russian shell pages, stable ID guards, centralized route builders/parsers, content validation interface, and renderer-neutral viewer interaction contract. Added `/processes` as the explicitly empty home entry destination; no process record was fabricated. Context parsing checks structure only; ownership, existence, and role eligibility await the content repository. No contextual-return action is enabled before those checks exist.

Pure tests use Node; only component tests import DOM setup and use jsdom. ESLint restrictions cover domain, content, application, visualization, and the future simulation location. In-memory lint tests demonstrate forbidden imports without creating a simulation directory.

Runtime: Node 24.18.0, npm 11.16.0. Pinned core versions: React/React DOM 19.3.0, Vite 8.3.2, TypeScript 6.0.3, React Router 8.4.0, Zod 4.6.5, Vitest 5.0.3, React Testing Library 16.3.3, Playwright 1.63.0, ESLint 10.12.0, Prettier 3.9.9. Registry peer/engine metadata was checked. TypeScript 7.0.2 was not selected because typescript-eslint 8.71.0 supports TypeScript below 6.1. Fiber 9.8.1 accepts React `>=19 <19.4`; Fiber/Three.js remain uninstalled and compatibility must be rechecked for the viewer slice.

The optional React Hooks lint plugin was removed after lockfile inspection exposed its Babel dependency's `gensync` beta version. Required linting and boundary rules remain enabled. Every final locked dependency version is stable; npm install audited 208 packages with zero vulnerabilities.

Validation completed successfully:

- `npm install`: succeeded; npm lockfile recorded.
- `npm run format:check`: passed.
- `npm run lint`: passed with zero warnings.
- `npm run typecheck`: passed for application and tooling/browser tests independently of bundling.
- `npm run test`: 44 tests in four files passed (shell, URL parsing/building, ingestion rejection, import restrictions).
- `npm run build`: passed; static output in ignored `dist/`.
- `npm run validate`: all five non-E2E gates passed after final changes.
- `npm run test:e2e`: three Chromium tests passed against a fresh production build and Vite preview; command exited successfully. Covered keyboard Home → Machines, direct process URL/reload with test-only IDs, narrow-screen overflow, and not-found recovery. Inspected the narrow-screen screenshot.
- Root TypeScript configuration invocation also completed without errors.
- Checked authoritative document paths, final dependency versions, source files, `git diff`, `git diff --check`, and `git status`. Product/domain/design/architecture documents and ADRs remain unchanged. No formulas, production content, rendering implementation, persistence, backend, or CI were added.

Local sandbox adaptations: npm and Chromium caches were placed under the system temporary directory, outside tracked files. Playwright's first sandboxed run passed assertions but could not clean up the Windows preview process tree. Stopped only the identified test-owned preview process and reran the unchanged E2E suite with process permissions; all tests and automatic cleanup then completed normally. These are execution-environment adaptations, not application infrastructure or script workarounds.

README now documents installation, commands, boundaries, deferred content resolution, browser prerequisites, compatibility, and static-host deep-link requirements. Deployment and the actual content/viewer/simulation slices remain deferred. Delivery uses commit message `Bootstrap application foundation` on the current `main` branch; the final task report records the resulting SHA and push status.
