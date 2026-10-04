# Repository structure — current implementation

Baseline: `793722754797737729bb7db1a9960c0f603477cd`, 2026-10-04.
В рамках [accepted architecture](system-architecture.md) и ADRs 0001–0005 существует
одно client-side React/Vite application, без backend/database/CMS. Это реальная
структура, а не ранний proposed layout. Технические срезы не доказывают полноту
учебного содержания; см. [audit](../quality/mvp-readiness-audit.md).

## Responsibilities

- `src/domain`: plain IDs, six graph entities, ProductionSystem/participant,
  Asset3D metadata и canonical working-cycle activity constant. Не все conceptual
  сущности domain-model реализованы; LearningModule/ParameterDefinition/Material
  здесь отсутствуют.
- `src/content`: Zod schemas, ingestion/reference validation, read-only repositories,
  model adapter и bundler-local adapters. Domain graph manifest явный; scenario и
  asset JSON discovery поддерживает nested files. Не educational page components.
- `src/application`: canonical joins, catalogs/page read models, supported sections,
  stage/origin semantic validation; experiment resolve/copy/calculate/reducer,
  immutable snapshots, neutral interpretation и exact comparison deltas.
- `src/navigation`: centralized patterns/builders, structural URL/query parsing.
  Не владеет domain relationships; existence/ownership проверяет application/content.
- `src/ui`: страницы, доступные controls/cards, provider hooks, стили, localized
  formatting. `src/app`: repository composition и Routes; `src/app/main.tsx`: mount и
  BrowserRouter. Эксперимент владеет local reducer state, не global machine data.
- `src/visualization`: plain contracts и private Three/R3F/GLTFLoader renderer,
  SceneRuntime, explicit mapping logic, camera fit. Viewer-owned material clones,
  mixer, visibility, resources; lazy-loaded production viewer.
- `src/simulation`: explicit input/result contracts, pure validation/calculation
  и colocated numerical tests. Единственная executable формула v1; нет UI/prose.
- `content/domain`: six canonical graph collections плюс separate systems file.
- `content/simulation`: numerical scenario records с model/provenance/input;
  current один baseline. Ни пользовательская persistence, ни manufacturer specs.
- `content/3d`: canonical application-facing Asset3D metadata; renderer-neutral.
- `public/assets/3d`: approved versioned binary delivery и generated manifest;
  текущий XE215C GLB 600324 bytes. Не editable authoring source или domain truth.
- `models/`: reference pack и reproducible XE215C authoring checkpoints Stage 01–09,
  renders/inspections/notes; asset pipeline сохраняет принятые stages immutable.
- `scripts/`: Node-native TypeScript content/asset discovery/validation/Stage 09
  generation и GLB inspection; `scripts/blender`: bpy authoring/export/checks.
  Node I/O разрешён в tooling, не browser domain/application production layers.
- `tests/`: E2E, real-asset/runtime, tooling-boundary tests и fixtures; unit/RTL tests
  также colocated в src. `src/test` — DOM test setup. Fixtures не production content.
- `docs/`: intended vision/scope/goals/flows/design, descriptive current contracts,
  architecture/ADRs, historical ExecPlans и evidence-based readiness audit.
  Нет runtime Markdown learning renderer/learning-content tree в текущем product.

## Dependency direction

```text
domain (plain identity/contracts)
  ↑ content (validation/repositories/adapters) ← simulation (pure core)
  ↑ application (joins, orchestration, reducers) ← simulation
  ↑ app/ui + navigation (composition, presentation, route helpers)
  ↑ visualization public plain contracts
     visualization implementation → Three/R3F/browser resources

tooling → shared content/simulation validators + filesystem
JSON + GLB → content ingestion / viewer loading respectively
```

Diagram ↑ означает consumer depends on lower abstraction, не обратный импорт.
Content model adapter знает supported core; general repositories не выбирают
формулу по machine/systemId. UI получает IDs/metadata/events, не SceneRuntime.
App может подключать local adapters; domain/application не загружают files.

## Enforced prohibitions

[ESLint rules](../../eslint.config.mjs) и executable
[boundary tests](../../tests/tooling/boundaries.test.ts) защищают production layers:

- Domain не импортирует React/router/Three/Zod/content/app или I/O.
- Pure simulation не импортирует UI/renderer/content/Zod/Node; работает
  только с explicit numbers и собственными contracts/helpers.
- Content/application не импортируют UI/router/renderer implementation. Node, clocks, randomness, browser I/O и dynamic loading явно запрещены lint для domain/simulation. Для application/content такой полный запрет не настроен: текущие application queries чистые по инспекции, local content adapters намеренно выполняют загрузку.
- UI не импортирует scene-runtime/viewer-logic/camera-fit; plain contracts разрешены,
  lazy production-viewer boundary намеренно разрешён. Renderer objects остаются там.
- Formulas не дублируются в React, GLB или JSON outputs. UI presentation может
  форматировать fractions в %, но не менять stored result precision.

Не вводить routes в domain records, duplicate Machines для процессов, inferred
node-name relationships, unapproved numerical ranges, generic content/plugin engine,
state manager или speculative backend. Test-only modules могут использовать tooling;
production exceptions не следуют из test fixtures.
