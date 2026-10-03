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

Application foundation: accessible routing shells and local validation/test tooling.

Validated domain content, learning modules, 3D visualization, and simulation are not connected yet. Entity URLs display routing IDs without claiming the records exist.

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
npm run test
npm run build
```

`npm run validate` runs all five gates above. Typechecking is independent of the Vite build. `npm run format` formats application/tooling files and this README; existing authoritative documents retain their formatting. `npm run test:watch` starts Vitest watch mode.

For browser smoke tests, install Chromium once, then run:

```sh
npx playwright install chromium
npm run test:e2e
```

E2E builds the application and starts Vite preview on `127.0.0.1:4173`; that port must be free. `npm run preview` serves an existing `dist/` build for manual review. Preview is a local verification server. Static deployment will require history fallback for application deep links; no deployment provider or CI is configured.

## Foundation boundaries

- `src/domain`: framework-independent opaque IDs and structural guards, not full entities.
- `src/content`: validated ingestion interface; no production dataset or full schemas.
- `src/application`: explicit content-not-connected state.
- `src/navigation`: centralized routes, builders, and structural query parsing. Content existence, stage ownership, and role eligibility checks await the content repository.
- `src/ui` and `src/app`: shell pages, accessible layout, and application composition.
- `src/visualization`: plain interaction contracts only; no renderer or assets.
- `src/test`, colocated tests, and `tests/`: component/unit, executable lint-boundary, and production-preview browser checks.

ESLint protects domain/application/content/visualization dependencies and the future `src/simulation` location. Simulation remains documentation-only. There is no global state library, persistence, or backend.

React 19.3.0 is compatible with the published Fiber 9.8.1 React peer range (`>=19 <19.4`), checked during bootstrap against the registry and [Fiber guidance](https://r3f.docs.pmnd.rs/getting-started/introduction). Neither Fiber nor Three.js is installed; recheck peer compatibility when implementing the viewer. TypeScript 6.0.3 is selected within the current TypeScript ESLint parser's supported range (`>=4.8.4 <6.1.0`), rather than the incompatible latest TypeScript major.
