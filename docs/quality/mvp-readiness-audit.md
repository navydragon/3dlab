# MVP readiness audit

Original readiness audit baseline: `793722754797737729bb7db1a9960c0f603477cd`. S1 accepted at `05ff7261d4527ffa3d66f2a693864dcb86a61df9`; S2 accepted at 7ca1051dc28dfbee9e11cb205c34f262b5ba069a; current S3 implementation, 2026-10-04.

**Образовательный MVP пока PARTIAL.** Два технических product slices приняты:
canonical navigation/production 3D и deterministic system experiment/A/B.
S1 foundational learning/content/navigation теперь реализован, но полнота учебного MVP требует S4. Numerical core/scenario и production 3D/Stage 01–09 не изменены.

Intended requirements: [scope](../product/mvp-scope.md),
[learning goals](../product/learning-goals.md), [flows](../product/user-flows.md),
[UX](../design/ui-ux-spec.md), [simulation model](../domain/simulation-model.md).
Уточнённые минимальные content obligations: [content spec](../product/mvp-content-spec.md).
Actual contracts: [schema](../domain/content-schema.md),
[data boundaries](../architecture/data-contracts.md),
[routes](../product/information-architecture.md),
[repository](../architecture/repository-structure.md).

## Method and status

IMPLEMENTED — наблюдаемое требуемое поведение/содержание присутствует.
PARTIAL — механизм/часть содержания есть, конкретная обязанность не закрыта.
MISSING — обязательный элемент отсутствует. DEFERRED — источник допускает позже
или optional. OUT OF SCOPE — прямо исключено из текущего MVP.
В LG matrix Satisfied означает поддержанную учебную возможность, а не доказанный
результат обучения студента. Types, formulas, clip и тестовый mock не заменяют
видимое объяснение. Baseline сверялся по коду, JSON и реальным asset/runtime tests,
а не только по README/планам. Существующие Draft/Accepted статусы сохранены;
S1 не меняет scope, новые технические утверждения не изобретены: [reviewed pack](../product/s1-foundation-content-pack.md) утверждён владельцем проекта.

## Implementation evidence registry

- **F**: [S3 reviewed pack](../product/s3-productivity-content-pack.md), [learning records](../../content/learning/productivity.json), [pure real-core orchestration/tests](../../src/application/machine-productivity.test.ts), [parameters/productivity UI](../../src/ui/components/MachineProductivity.tsx), [UI tests](../../src/app/productivity-ui.test.tsx), [production Flow E/context tests](../../tests/e2e/productivity.spec.ts).

- **W**: [S2 reviewed pack](../product/s2-working-cycle-content-pack.md), [learning overlay](../../content/learning/working-cycle.json), [strict content tests](../../tests/tooling/working-cycle.test.ts), [UI tests](../../src/app/working-cycle-ui.test.tsx), [production E2E](../../tests/e2e/working-cycle.spec.ts); real GLTF seek/rates/reset tests in V.

- **D**: [machines](../../content/domain/machines.json),
  [components](../../content/domain/machine-components.json),
  [stages](../../content/domain/process-stages.json),
  [operations](../../content/domain/operations.json),
  [roles](../../content/domain/machine-roles.json): 2 машины, 9 компонентов
  экскаватора, 4 operations, 4 ordered stages, 2 roles, 1 process.
- **M**: [MachinePage](../../src/ui/pages/MachinePage.tsx),
  [page queries](../../src/application/page-queries.ts),
  [viewer UI tests](../../src/app/viewer-ui.test.tsx): excavator sections overview,
  construction, working-principle, working-cycle, applications; dump-truck overview/applications.
- **P**: [ProcessPage](../../src/ui/pages/ProcessPage.tsx),
  [route helpers](../../src/navigation/routes.ts),
  [query tests](../../src/application/page-queries.test.ts): stages/roles,
  canonical inline machine card, validated contextual return.
- **V**: [runtime](../../src/visualization/scene-runtime.ts),
  [real runtime tests](../../tests/assets/viewer-runtime.test.ts),
  [viewer E2E](../../tests/e2e/viewer.spec.ts),
  [asset E2E](../../tests/e2e/production-asset.spec.ts): real production GLB,
  mapped selection/highlight/hide/isolate, playback/neutral reset, loading failures.
- **S**: [experiment orchestration](../../src/application/system-experiment.ts),
  [experiment UI tests](../../src/app/SystemExperiment.test.tsx),
  [system E2E](../../tests/e2e/system-experiment.spec.ts): explicit source,
  N-only editing, fresh/stale/error state, frozen A/B, prediction/justification.
- **C**: [calculator](../../src/simulation/calculate.ts),
  [contracts](../../src/simulation/contracts.ts),
  [baseline tests](../../src/simulation/baseline.test.ts),
  [presentation](../../src/ui/presentation/experiment-format.ts): 13 explicit inputs,
  18 canonical metrics, 6 intermediates; pure model v1, illustrative provenance.
- **B**: [shell E2E](../../tests/e2e/shell.spec.ts),
  [boundary tests](../../tests/tooling/boundaries.test.ts),
  [ESLint](../../eslint.config.mjs): route/error/history behavior and boundaries.

Evidence keys below resolve to actual files above. S1 references now mean delivered foundational content; S2/S3 are delivered; S4 is the remaining slice.

- **L**: [foundation pack](../../content/learning/foundation.json), [schema/repository](../../src/content/foundation-repository.ts), [approval/content tests](../../tests/tooling/foundation.test.ts), [S1 UI tests](../../src/app/foundation-ui.test.tsx), [S1 E2E](../../tests/e2e/foundation.spec.ts): 4 source records, 2 machine records, 9 component explanations, 1 process, 4 stage records / 5 participant notes.

## Scope §3 — levels A/B/C

| Source requirement | Status | Actual evidence | Gap / minimum closure |
| --- | --- | --- | --- |
| A: 3D observation/parts | IMPLEMENTED | V: all 9 IDs selectable, orbit/zoom/fit, independent visibility | No required interaction gap; prose evaluated separately. |
| A: purpose/construction/principle | IMPLEMENTED | L/M: reviewed overview, nine functions, capability-derived principle/chain | S1 foundational content complete; no detailed hydraulics required. |
| A: understand working cycle | IMPLEMENTED | W/V: approved phases/purpose/selection/live progress | Supports learning; student outcomes require evaluation. |
| A: parameters/productivity | IMPLEMENTED | F/C: reviewed four factors, one-factor actual calculation and causes | No manufacturer values or practical recommendations. |
| A: applications/process connection | IMPLEMENTED | M/P: graph-derived where-used, reusable IDs | Educational stage explanation remains B gap; no duplicate machine. |
| B: stages, roles, ordered graph | IMPLEMENTED | D/P: ordered scheme and eligible machines | Structural result only. |
| B: understand stages/input/output/participation | IMPLEMENTED | L/P: four five-field learning cards, role notes and handoff | No remaining S1 content gap. |
| B: detour and return | IMPLEMENTED | P/B: stage survives section changes/reload/Back | Full module educational depth tracked under A. |
| C: composition/source/N/KPI | IMPLEMENTED | S/C: supported source explicit, content participant bounds | No numerical or fleet-control gap for accepted bounded experiment. |
| C: compare/interpret/justify | PARTIAL | S: MF/wait interpretation, bars, A/B and free-text reason | Guided task and causal economic explanation shallow; S4. |

## Scope §14 — every readiness criterion

| No. / source requirement | Status | Evidence | Gap / minimum closure |
| --- | --- | --- | --- |
| 1. Open machines | IMPLEMENTED | B: Home → catalog | None. |
| 2. Select excavator | IMPLEMENTED | B/M: canonical detail | None. |
| 3. Study main elements in 3D | IMPLEMENTED | V/L: nine mappings with distinct approved functions | Power-unit and cylinder prose now present. |
| 4. Run working cycle | IMPLEMENTED | V: actual clip playback | Reviewed phase understanding UI is delivered in S2. |
| 5. See productivity parameters | IMPLEMENTED | F/C: Parameters meanings/units/scenario values | Values remain illustrative. |
| 6. Enter related process | IMPLEMENTED | M/B: applications links | None for transition; graph-validated fromMachine origin is delivered in S1. |
| 7. See excavator/trucks as one complex | IMPLEMENTED | S: composition/participants shared domain references | Fleet 3D optional, not required to satisfy this. |
| 8. Change truck count | IMPLEMENTED | S: validated N, explicit Calculate | None. |
| 9. Get new productivity/idleness | IMPLEMENTED | S/C: real exact recalculation | None. |
| 10. See duration/cost effects | IMPLEMENTED | S: duration/cost KPI and A/B deltas | Economic causal explanation separately PARTIAL; S4. |
| 11. Start from processes | IMPLEMENTED | B/P: Home/catalog | None. |
| 12. Open excavator from process | IMPLEMENTED | P/B: eligible card → module | None. |
| 13. Study it | IMPLEMENTED | M/L/W/F: seven capability sections, S1/S2/S3 teaching | S4 production task remains separate. |
| 14. Return to initial process | IMPLEMENTED | P/B: validated process/stage query | None for required stage restoration; optional camera/panel persistence deferred. |

## Machine and process learning depth

| Source / learning obligation | Status | Actual behavior | Minimum closure |
| --- | --- | --- | --- |
| UX §§8–10: purpose/application | IMPLEMENTED | L/M: approved purpose/context/scope and process links | No S1 purpose gap. |
| UX construction / LG-M01–02 | IMPLEMENTED | V/L: all nine approved functions visible in selected card | No missing power-unit/cylinder explanation. |
| UX principle of operation | IMPLEMENTED | L/M: «Как работает», hydraulic drive prose, conceptual chain/grouping | Detailed schematic outside S1/MVP depth. |
| UX §§15–17 / LG-M03–04: cycle | IMPLEMENTED | W/V: reviewed six phases, purpose, canonical movement/components, seek/navigation/rates/live progress | Visual anchors only; no engineering timings. |
| UX parameters / LG-Q01 | IMPLEMENTED | F: four factors/definitions/units/provenance/causes | Model validation only, no practical ranges. |
| UX productivity / flow E | IMPLEMENTED | F/C: actual core, prediction/one-factor/explicit calculation/stale/reset/causes | No saved variants or multi-factor editing. |
| UX where-used / LG-P03–04 | IMPLEMENTED | M/P: two-way canonical content graph | No mandatory graph mechanism gap. |
| System-level consequences | IMPLEMENTED | S: truck-count experiment with idle/wait/productivity/cost | Learning explanation refinements under S4. |
| Shallow dump truck / LG-T01–03 | IMPLEMENTED | L/M: purpose/system role, transport cycle, six factors, distance consequence | Minimum sufficient shallow MVP depth; no truck 3D needed. |
| Process stage purpose | IMPLEMENTED | L/P: reviewed goal/activity for each existing stage | No S1 explanation gap. |
| Process stage input/output | IMPLEMENTED | L/P: input/result/handoff cards | Learning prose, no new Material entities. |
| Why each machine participates | IMPLEMENTED | L/P: participant-specific approved notes and factor names | No duplicated domain participation truth. |
| Process order/system connection | IMPLEMENTED | P/D/S: order and process-derived system link | None for structural mechanism. |
| UX catalog/breadcrumb/card presentation | PARTIAL | L/P/M: native disclosures, canonical breadcrumbs and overview prose implemented | Catalog thumbnails/depth preview remain absent; no new unapproved images/specs in S1. Review minimum presentation before full UX acceptance. |

Canonical legacy description fields remain unchanged (8/9 components; machine/stage prose absent there). The actual UI now consumes approved L records: both overviews, all nine functions, four stage cards/participants and working principle. This closes S1 gaps without turning optional description schemas into proof of learning.

### Working cycle: visual versus educational

Production animation, Play/Pause/resume and neutral Reset are IMPLEMENTED (V).
Repeated real-GLTF runtime tests verify freeze/resume/static local TRS restoration;
neutral Reset does not seek time zero, which is the digging pose. S2 now provides six active/selected phases, equal-weight timeline, reviewed explanations/navigation and approved visual speeds (W). Actual GLTF seeking/rates/endpoint/reset and production E2E prove behavior; this supports pedagogy without measuring student learning.

Approved teaching phases: excavation, filling, lifting, swing to dump, unloading, return. Excavation is only an anchor at 0; filling starts there too, with explicit overlap. Anchors use authored frames and actual clip endpoint, not engineering durations. Visual time remains independent from scenario cycle input. All immutable authoring stages are preserved.

### Productivity and economics

System experiment (S) changes **only N**, not bucket capacity, fill factor, cycle
time or time utilization. S3 (F) now provides the separate four-factor standalone experiment, approved causal explanations and exact core outputs, closing machine factor learning. LG-Q02 now supports both fleet N and excavator one-factor transfer. LG-Q03 is supported by the approved standalone/system notice and canonical system bridge plus existing S fleet-limit/idle/wait explanations and L loading-ceiling/discrete-bucket note. This does not claim Q_exc equals system loading ceiling or system Q.

Economic values are present: hourly cost, duration, total cost, unit cost, A/B,
free written justification. E03/E04 are supported without grading or a recommended
optimum. E01/E02 remain PARTIAL: the interface does not explain the causal chains
volume/productivity → duration and count/hourly cost/duration → total/unit cost.
S4 needs short explanations using accepted v1 formulas/units and a bounded guided
task, not advanced estimating, normative costs or fabricated target deadline.

## User flows A–J

| Flow / source | Status | Evidence | Gap / minimal closure |
| --- | --- | --- | --- |
| A: machine → process | IMPLEMENTED | L/M/P/E2E: validated fromMachine, stage/overview/reload preservation and applications return | A7 closed; S1–S3 machine module implemented. |
| B: process → full machine → return | IMPLEMENTED | P/L/E2E: disclosure → principle/module → same stage | Context/content S1 closed; S1–S3 machine module implemented. |
| C: stage → compact machine card | IMPLEMENTED | L/P/E2E: name/role closed; notes/factors/action expanded; close preserves stage | No S1 disclosure gap. |
| D: working-cycle study | IMPLEMENTED | W/V/M: phase meaning/selection/live progress/previous-next/speed, real seek/reset | No hydraulic/soil physics or engineering times are implied. |
| E: machine productivity experiment | IMPLEMENTED | F/C: parameter → prediction → explicit result → causes/reset | Production E2E uses real accepted core. |
| F: truck-count experiment | IMPLEMENTED | S/C/E2E: source/N/edit/calculate/KPI | None for bounded mechanics. |
| G: compare two variants | IMPLEMENTED | S/E2E: frozen A/B, multi-criterion deltas and reason | None for comparison mechanics. |
| H: choose and explain fleet | PARTIAL | S: A/B and reason field | Explicit guided task/purpose absent; S4. |
| I: inefficient combination | IMPLEMENTED | S/C: low N → idle, high N → wait/cost | No automatic grading/optimum needed. |
| J: navigation restoration | IMPLEMENTED | P/B: URL/history/semantic fallback | Optional panel/camera persistence deferred under ADR 0005. |

Flows K/L (direct link / first launch) are supported by direct-route/reload and Home/catalog browser tests. Error-state obligations are separately covered by structured calculation failures and asset-failure E2E. Neither proves every assistive-technology/device combination is usable.

## Acceptance flows 1–5

These technical acceptance paths do not override full learning obligations.

| Flow | Status | Actual test evidence | Limit / minimum closure |
| --- | --- | --- | --- |
| 1 machine → real 3D → bucket → description | IMPLEMENTED | viewer.spec.ts real projected mesh hit + canonical card; production-asset.spec.ts HTTP/GLB | All nine approved S1 functions now implemented; no additional construction gap. |
| 2 cycle Play/Pause/Continue | IMPLEMENTED | real scene-runtime tests assert frozen pause/resumed advance repeatedly; viewer E2E Play/Pause/Reset and UI controls | Browser E2E does not directly assert pose continuity for Pause→Continue; real runtime does. S2 phase pedagogy/seek/rates also tested in W. |
| 3 machine → where-used → process | IMPLEMENTED | shell.spec.ts contextual navigation | No graph transition gap. |
| 4 process → stage → machine → module → return | IMPLEMENTED | shell.spec.ts proves available sections/reload/return same stage | S1 technical/content path implemented; S3 productivity/parameters/context detour now implemented. |
| 5 system → truck count → recalculated result | IMPLEMENTED | system-experiment.spec.ts real N=3/4 result, A/B, stale/reset | Educational explanation/task refinement separately S4. |

## Learning-goal matrix — all 25 IDs

Source: [learning-goals §§4–9](../product/learning-goals.md). Coverage is deliberately
conservative: 23 Satisfied, 2 Partially satisfied, 0 Not yet satisfied.
None of the 25 accepted IDs is waived as Not required for MVP.

| ID | Status | Reason / evidence / minimal closure |
| --- | --- | --- |
| LG-M01 | Satisfied | V/D: 9 named canonical parts selectable in real 3D. |
| LG-M02 | Satisfied | L/M: nine approved functions, power-unit and distinct cylinder actions. |
| LG-M03 | Satisfied | W/V: reviewed six phases, explanation/order/navigation, overlap and return to cycle start. |
| LG-M04 | Satisfied | W/V: phase-specific moving canonical components and approved movement explanations with real pose selection. |
| LG-M05 | Satisfied | F/C: cycle-time prediction and real cycles/theoretical/operational causal comparison. |
| LG-M06 | Satisfied | F/C: capacity and fill separately affect real q_eff/Q, preserving other source factors. |
| LG-T01 | Satisfied | L/M/P: approved truck purpose, transport role and canonical context. |
| LG-T02 | Satisfied | L: loading/loaded travel/unloading/return cycle and factor/queue explanations. |
| LG-T03 | Satisfied | L: approved distance → longer absence → fleet need/idle explanation; no distance control required for this explanation goal. |
| LG-P01 | Satisfied | L/P: canonical ordered stages with goal/input/activity/result/handoff. |
| LG-P02 | Satisfied | L/P: participant-specific explanations and role/factor notes. |
| LG-P03 | Satisfied | P/B: reusable canonical machine detour and stage return. |
| LG-P04 | Satisfied | M/P: machine operations/where-used derived from graph. |
| LG-Q01 | Satisfied | F: all four reviewed definitions, units, source values and causal explanations. |
| LG-Q02 | Satisfied | S: change only N, preserve other factors, calculate, predict direction and explain via A/B. F now extends one-factor prediction/calculation/causes to all four excavator factors. |
| LG-Q03 | Satisfied | F: approved standalone/system distinction + canonical bridge; S explains transport shortage/idle/wait, L explains discrete loading ceiling. S4 economics are separate goals, not a condition for distinguishing these Q values. |
| LG-Q04 | Satisfied | S: textual bars, MF/wait interpretation, duration/cost comparison. |
| LG-S01 | Satisfied | S/C: insufficient transport raises excavator idle, explains constraint. |
| LG-S02 | Satisfied | S/C: surplus transport produces waiting/cost, no false gain. |
| LG-S03 | Satisfied | S: A/B supports choosing balance, no prescribed optimum. |
| LG-S04 | Satisfied | S: exact comparison and learner-written reason. |
| LG-E01 | Partially satisfied | S duration/productivity values, causal relation unexplained; S4. |
| LG-E02 | Partially satisfied | S hourly/total/unit values, time/cost mechanism unexplained; S4. |
| LG-E03 | Satisfied | S: multi-criterion A/B and exact differences. |
| LG-E04 | Satisfied | S: learner decision/justification; no auto-selected variant. |

### Assessment decision

Standalone **Контроль знаний: DEFERRED / OPTIONAL**, not MISSING REQUIRED.
Scope §§3/14 has no required quiz route; LG §§12–13 permits 3D recognition,
prediction, parameter experiments, comparison and short justification; user flows
use those activities, UX task/decision controls do not mandate a grading engine.
Broader [vision](../vision/strategic-vision.md) teacher analytics/LMS/assessment does
not expand current scope. Required learning opportunities above remain required:
optional standalone assessment is not permission to skip phases or experiments.

## Technical and source-of-truth limits

Runtime results are narrower than conceptual domain-model §19: SavedVariant has
source IDs/input/exact result, no calculatedAt. Full result envelope/version/export
policy needs agreement before persistence/export, not a clock in pure core.
Content bundles have no general schema-version marker; current strict schemas and
model/asset versions exist. Neither missing envelope nor schema marker counts as
implemented merely because architecture describes them. Documented contract
normalization is separate from the four immediate educational slices.

Domain/simulation enforce pure I/O/clock/import bans. Application/content lint
blocks frameworks/layer imports but does not enforce the same complete purity
rules; actual application code is pure by inspection, content adapters load data.
README's earlier purity statement remains narrowed. No change to lint policy; S1 content/application obeys current boundaries.

Immutable Stage 09 payload notes and content metadata include historical viewer-
deferred limitations. They remain untouched in S1; current viewer
availability is documented in README/current 3D docs. Tests validate bytes/mapping,
not external rights, instructional accuracy or usability on physical devices.

## Минимальные оставшиеся срезы

Original ordered plan had four slices. **S1 delivered in this implementation** with reviewed content/disclosure/breadcrumbs/trusted fromMachine. S2 delivered below; S3 delivered below; S4 remains for later authorization, not implemented functionality.

1. **S1 — delivered foundational content and contextual presentation.** Teach machine
   purpose, all 9 functions and operating principle; shallow truck purpose/cycle/
   distance explanation; four process stages with input/result/roles. Overview, breadcrumbs/card close and machine-origin context implemented using canonical data/route boundary. Catalog thumbnail/depth preview is not introduced by the approved S1 payload. Closes M02, T01–T03,
   P01/P02; supports M04. Reviewed reusable prose/content, no truck 3D, manufacturer
   specs, full Material or CMS. Resolve content contract changes explicitly, do not
   embed graph rules in UI.
2. **S2 — delivered pedagogical working cycle.** Six phase names/purpose, active explanation,
   visual timeline and phase navigation/previous-next/speed per UX §§15–17/flow D.
   Reviewed authored visual anchors and explicit digging/filling overlap connect movements/components.
   Closes M03/M04. No engineering phase durations, hydraulic simulation or rig rework;
   preserve accepted immutable authoring stages.
3. **S3 — delivered machine factors and standalone productivity.** Explain four factors/units/
   accepted Q relationship and add small one-factor-at-a-time experiment using
   existing v1 core and illustrative source, plus baseline/current comparison.
   Closes M05/M06/Q01; together with the existing system/L bridge supports Q03; extends Q02 to machine factors. No fabricated numerical ranges,
   new formula, persistence, variants or generic scenario engine.
4. **S4 — bounded production task and economic explanation.** Add explicit reviewed
   task objective/prediction and causal V/Q, count/hourly cost, duration/total/unit
   explanation; clarify standalone Q versus discrete loading ceiling. Retain existing
   N-only inputs/A/B/neutral justification. Closes E01/E02; Q03 distinction is already supported by S3 and existing system evidence,
   reinforces Q04/S*/E03/E04. No grading, normative deadline, “optimal” fleet or advanced
   estimating. Tests for these later slices must verify visible learning behaviors.

### Required before MVP demo

Remaining S4 and full learning-path
acceptance checks. Current preview tests support a technical demo; they do not make
it an educational MVP. Before a public deployment, verify selected host history
fallback/base paths; hosting is not selected. Physical desktop/tablet/GPU and
assistive-technology usability need manual review, with agreed expectations rather
than invented performance thresholds. Only approved S1 gaps are implemented; remaining gaps are not silently fixed.

### Post-MVP / deferred

- DEFERRED: fleet 3D (UX process scheme permits non-3D), deep dump-truck module,
  optional session/camera/panel restoration (ADR 0005), cross-session persistence,
  standalone assessment screen, optional advanced transparency/exploded views.
  Hide/isolate already exists and is not misclassified as future work.
- OUT OF SCOPE: auth, LMS/grading platform, teacher analytics, many machines/processes,
  auto-optimization, full engine/hydraulic dynamics, normative costing; scope §12.
- DEFERRED model extensions: full Material/mass/density and discrete-event simulation
  require versioned model changes (simulation-model/architecture), not silent v1 additions.
- Hosting/provider/CI choices remain deferred delivery decisions; they do not justify
  describing current local routes/calculation UI as missing.

## Validation — historical S1 task

- `npm ci`: passed, 259 packages installed, 0 reported vulnerabilities; only verified Vite processes were restarted/restored for Windows native binding.
- `npm run validate`: passed, running format/lint/type/content/assets/test/build; **522 tests passed in 31 files**. Final format/lint/type checks also passed after accessible E2E selector changes.
- `npm run test:e2e`: final production build and **16 Chromium tests passed** (18.3 s): three S1 learning paths plus all 13 previous acceptance/failure checks. Desktop/principle and narrow/process checkpoints inspected; text wraps without horizontal overflow.
- Strict malformed/duplicate/reference/completeness and nested immutability tests pass. Every approved runtime statement is checked against reviewed pack verbatim after whitespace normalization. No external provenance URL is fetched at runtime.
- Protected-path diff empty: src/simulation, numerical scenario, production-system data, Asset3D metadata, public GLB/manifest, models/Stage 01–09 and dependency manifests unchanged. Asset validation confirms 600324 bytes, 101 meshes/nine mappings and immutable-stage integrity.
- Existing lazy-viewer warning remains 983.97 kB minified / 261.67 kB gzip; build passes. Software Chromium cadence about 60 fps is local evidence, not a device guarantee.
- 121 local Markdown targets and 25 unique LG rows checked; git diff --check passed. S1 delivery has no timeline/phase controls, parameters section, standalone experiment, new scenarios or S4 assignment/economic calculation explanations.

## Validation — historical S2 task

- npm ci passed: 259 packages, zero reported vulnerabilities; only three confirmed workspace Vite processes restarted/restored.
- npm run validate passed: formatting/lint/type/content/asset/unit/integration/build; 560 tests in 33 files. Production E2E: 18 Chromium tests passed (26.9 s), including two new S2 flows and every previous acceptance/failure path.
- Real GLTF seek tests check expected authored rotation angles at all eight anchors, exact frozen pause, repeat/no drift (signed zero is numerically equivalent), arbitrary seek neutral restoration and neutral remount. Rates advance actual time at 0.5/1/2 while visibility/highlights remain independent.
- Content tests reject malformed/duplicate/missing/references/asset/activity/timing mutations; phase resolver tests exact and adjacent boundaries, including point-only excavation and final endpoint. UI tests cover every phase explanation, canonical components, bounded navigation, rates and neutral distinction. Narrow production E2E checks 390 px and semantic return/reload.
- Protected-path diff empty: numerical code/scenario/system records, S1 approved pack, Asset3D metadata, public GLB/manifest, Stage 01–09, Blender scripts and dependency manifests unchanged. Asset integrity: 600324 bytes, 101 meshes/nine mapped components, unchanged clip and stage hashes.
- Lazy Three/Fiber chunk warning remains (985.15 kB minified / 262.04 kB gzip). Local software Chromium observations are not a device guarantee. LG-M03/M04 now Satisfied as supported educational opportunities; S3/S4 remain open.

## Validation — S3 task

- `npm ci` passed: 259 packages, zero reported vulnerabilities. `npm run validate` passed formatting, lint, type, content, assets, unit/integration and production build: 594 tests in 36 files.
- Production E2E passed all 20 Chromium tests, including source/baseline, explicit one-factor calculation, stale/reset behavior, utilization-only effects, narrow layout, reload and process/stage return for S3, plus every prior acceptance/failure path.
- Real-core tests cover all four factor oracles, source invariance, unrounded direction, model-only constraints including fill above one, empty/invalid/numerical errors and ungraded prediction. Content mutations and accessible UI behavior are tested.
- Protected numerical core/contracts/validation, baseline scenario/system data, approved S1/S2 content, Asset3D/production GLB/metadata, Stage 01–09, Blender scripts and dependency manifests remain unchanged. Asset integrity: 600324 bytes, 101 meshes, nine mapped components and immutable stage hashes.
- LG-M05/M06/Q01 and the standalone/system distinction Q03 are now Satisfied; Q02 coverage is extended. The audit records 23 Satisfied, two Partial, zero Not yet. S4 economic learning remains deferred. These statuses describe supported educational opportunities, not measured learner outcomes or complete MVP readiness.
- Production build passes with the existing lazy-viewer chunk warning (985.15 kB minified / 262.04 kB gzip); device and assistive-technology review remain separate manual checks.
