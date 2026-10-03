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

Domain UI integration: accessible machine/process catalogs and pages backed by the validated local knowledge graph.

Machine pages show canonical operations, components and grouped process usage. Process pages select stages via `stageId` and open machine pages with graph-validated contextual return, preserved across the supported `overview` and `applications` sections. Unknown entities/sections, invalid stage/context URLs and invalid content have explicit states. Full learning modules, 3D visualization, and simulation remain deferred.

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

`npm run validate` runs all six gates above. Typechecking is independent of the Vite build. `npm run format` formats application/tooling/content files and this README; existing authoritative documents retain their formatting. `npm run test:watch` starts Vitest watch mode.

For browser smoke tests, install Chromium once, then run:

```sh
npx playwright install chromium
npm run test:e2e
```

E2E builds the application and starts Vite preview on `127.0.0.1:4173`; that port must be free. `npm run preview` serves an existing `dist/` build for manual review. Preview is a local verification server. Static deployment will require history fallback for application deep links; no deployment provider or CI is configured.

## Foundation boundaries

- `src/domain`: framework-independent IDs and minimal machine/component/operation/process/stage/role contracts.
- `src/content`: Zod schemas, structured graph validation, read-only repository, and explicit local JSON adapter.
- `src/application`: pure repository queries and page view models; grouping, supported sections, stage selection and semantic return-context validation.
- `src/navigation`: centralized routes, builders, and structural query parsing. Selected stages and return context live in the URL.
- `src/ui` and `src/app`: graph-backed pages, accessible layout, repository context and injectable loaded/invalid application composition.
- `src/visualization`: plain interaction contracts only; no renderer or assets.
- `src/test`, colocated tests, and `tests/`: component/unit, executable lint-boundary, and production-preview browser checks.

ESLint protects domain/application/content/visualization dependencies and the future `src/simulation` location. Pure production layers reject Node imports, dynamic loading, and direct browser/runtime/clock APIs; colocated tests may use test tooling. Official React Hooks 7.1.1 enables Rules of Hooks and dependency checks, without React Compiler tooling. Its published peer range supports ESLint 10; its mature Babel implementation has a transitive prerelease-style version, which does not make the stable plugin itself incompatible. Simulation remains documentation-only. There is no global state library, persistence, or backend.

## Domain content

Six JSON collections live under `content/domain/`: machines, machine components, operations, machine roles, processes, and process stages. They contain only canonical MVP identities, source-limited Russian names/descriptions, and relationship references; no engineering values. Component descriptions reuse learning-goals §4 and names follow domain-model §§5–10 / UI/UX §10. The power-unit explanation is intentionally omitted pending approved prose.

`npm run content:validate` reads all production files and runs the same strict schemas and graph checks used by the local adapter; failures exit nonzero with structured issue paths. The command uses Node 24's native TypeScript support, with no additional runner. `npm run validate` includes this check and requires no browser.

Processes own ordered stage IDs; stages own their operation and participant role references; roles own eligible machine IDs. Where-used queries derive these relationships. Roles have no singular operation constraint, and related machines are not persisted as duplicated process data. The repository returns shared frozen records, `undefined` for missing IDs, and explicit invalid-content results. UI pages consume application queries without importing production JSON or schemas; composition loads the local adapter. Contextual return checks process/stage existence, ownership and machine eligibility without stored history.

React 19.3.0 is compatible with the published Fiber 9.8.1 React peer range (`>=19 <19.4`), checked during bootstrap against the registry and [Fiber guidance](https://r3f.docs.pmnd.rs/getting-started/introduction). Neither Fiber nor Three.js is installed; recheck peer compatibility when implementing the viewer. TypeScript 6.0.3 is selected within the current TypeScript ESLint parser's supported range (`>=4.8.4 <6.1.0`), rather than the incompatible latest TypeScript major.
