# MVP readiness audit

Original readiness audit baseline: `793722754797737729bb7db1a9960c0f603477cd`. Current S1 implementation based on accepted audit commit `3c2371a56293acb084f341eb9d0a1c3e44080743`, 2026-10-04.

**Образовательный MVP пока PARTIAL.** Два технических product slices приняты:
canonical navigation/production 3D и deterministic system experiment/A/B.
S1 foundational learning/content/navigation теперь реализован, но полнота учебного модуля требует S2/S3/S4. Numerical core/scenario и production 3D/Stage 01–09 не изменены.

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

Evidence keys below resolve to actual files above. S1 references now mean delivered foundational content; S2–S4 are proposed remaining slices.

- **L**: [foundation pack](../../content/learning/foundation.json), [schema/repository](../../src/content/foundation-repository.ts), [approval/content tests](../../tests/tooling/foundation.test.ts), [S1 UI tests](../../src/app/foundation-ui.test.tsx), [S1 E2E](../../tests/e2e/foundation.spec.ts): 4 source records, 2 machine records, 9 component explanations, 1 process, 4 stage records / 5 participant notes.

## Scope §3 — levels A/B/C

| Source requirement | Status | Actual evidence | Gap / minimum closure |
| --- | --- | --- | --- |
| A: 3D observation/parts | IMPLEMENTED | V: all 9 IDs selectable, orbit/zoom/fit, independent visibility | No required interaction gap; prose evaluated separately. |
| A: purpose/construction/principle | IMPLEMENTED | L/M: reviewed overview, nine functions, capability-derived principle/chain | S1 foundational content complete; no detailed hydraulics required. |
| A: understand working cycle | PARTIAL | V: real clip, Play/Pause/Reset | No named/active phases, purpose, navigation; S2. |
| A: parameters/productivity | PARTIAL | C/S: factors are read-only source fields | No machine parameters section/standalone experiment; S3. |
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
| 4. Run working cycle | IMPLEMENTED | V: actual clip playback | Phase understanding separately S2. |
| 5. See productivity parameters | PARTIAL | S/C: four factors visible in source | Machine-level meaning/section absent; S3. |
| 6. Enter related process | IMPLEMENTED | M/B: applications links | None for transition; origin-source gap in flow A below. |
| 7. See excavator/trucks as one complex | IMPLEMENTED | S: composition/participants shared domain references | Fleet 3D optional, not required to satisfy this. |
| 8. Change truck count | IMPLEMENTED | S: validated N, explicit Calculate | None. |
| 9. Get new productivity/idleness | IMPLEMENTED | S/C: real exact recalculation | None. |
| 10. See duration/cost effects | IMPLEMENTED | S: duration/cost KPI and A/B deltas | Economic causal explanation separately PARTIAL; S4. |
| 11. Start from processes | IMPLEMENTED | B/P: Home/catalog | None. |
| 12. Open excavator from process | IMPLEMENTED | P/B: eligible card → module | None. |
| 13. Study it | PARTIAL | M/L: five sections with approved S1 prose | Parameters/productivity and phase pedagogy remain S2/S3. |
| 14. Return to initial process | IMPLEMENTED | P/B: validated process/stage query | None for required stage restoration; optional camera/panel persistence deferred. |

## Machine and process learning depth

| Source / learning obligation | Status | Actual behavior | Minimum closure |
| --- | --- | --- | --- |
| UX §§8–10: purpose/application | IMPLEMENTED | L/M: approved purpose/context/scope and process links | No S1 purpose gap. |
| UX construction / LG-M01–02 | IMPLEMENTED | V/L: all nine approved functions visible in selected card | No missing power-unit/cylinder explanation. |
| UX principle of operation | IMPLEMENTED | L/M: «Как работает», hydraulic drive prose, conceptual chain/grouping | Detailed schematic outside S1/MVP depth. |
| UX §§15–17 / LG-M03–04: cycle | PARTIAL | V: 11.666666984558105 s illustrative clip | Six named phases/purpose/active phase/navigation; S2. |
| UX parameters / LG-Q01 | MISSING | M: no parameters section; S source fields readonly | Four factors, units, assumptions, causal meaning; S3. |
| UX productivity / flow E | MISSING | C formula exists; M has no experiment | Small standalone one-factor experiment using existing core; S3. |
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
neutral Reset does not seek time zero, which is the digging pose. The Working Cycle section has no active phase labels, timeline, phase explanation/navigation or speed controls. S1 approved principle/process prose includes static grouped cycle sequences, which do not supply interactive phase pedagogy.
These are PARTIAL/MISSING full-MVP UX obligations, although not first-slice gates.

Accepted teaching phases: excavation/digging, bucket filling, lifting, swing to dump,
unloading, return swing. LG-M03 groups digging/filling; reviewed S2 content must
present their overlap consistently with UX six-phase model. Visual anchor ranges
require content/asset review. **Animation timing != engineering cycle time**;
24 s illustrative calculation input does not come from the 11.667 s clip. Exact
engineering synchronization, phase-based hydraulic calculation or new asset rig
is not required by current scope. Do not edit immutable authoring stages in S2.

### Productivity and economics

System experiment (S) changes **only N**, not bucket capacity, fill factor, cycle
time or time utilization. Four readonly values and executable Q formula do not
satisfy LG-M05/M06 or the standalone machine experiment in flow E. S3 is required
for LG-Q01/Q03 and flow E. LG-Q02 itself accepts changing one parameter: the N-only experiment satisfies that general goal, while fleet consequences and result reading support LG-Q04/S*.
Current single-machine output and complex output are both visible but the effect
of whole-bucket loading ceiling on complex productivity is not explained.

Economic values are present: hourly cost, duration, total cost, unit cost, A/B,
free written justification. E03/E04 are supported without grading or a recommended
optimum. E01/E02 remain PARTIAL: the interface does not explain the causal chains
volume/productivity → duration and count/hourly cost/duration → total/unit cost.
S4 needs short explanations using accepted v1 formulas/units and a bounded guided
task, not advanced estimating, normative costs or fabricated target deadline.

## User flows A–J

| Flow / source | Status | Evidence | Gap / minimal closure |
| --- | --- | --- | --- |
| A: machine → process | PARTIAL | L/M/P/E2E: validated fromMachine, stage/overview/reload preservation and applications return | A7 closed; full module still needs S2/S3. |
| B: process → full machine → return | PARTIAL | P/L/E2E: disclosure → principle/module → same stage | Context/content S1 closed; full learning module still S2/S3. |
| C: stage → compact machine card | IMPLEMENTED | L/P/E2E: name/role closed; notes/factors/action expanded; close preserves stage | No S1 disclosure gap. |
| D: working-cycle study | PARTIAL | V/M: animation/play/pause/reset | Phase meaning/active label/navigation absent; S2. |
| E: machine productivity experiment | MISSING | M/C: calculator only | Four-factor standalone learning experiment; S3. |
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
| 2 cycle Play/Pause/Continue | IMPLEMENTED | real scene-runtime tests assert frozen pause/resumed advance repeatedly; viewer E2E Play/Pause/Reset and UI controls | Browser E2E does not directly assert pose continuity for Pause→Continue; real runtime does. Phase pedagogy separately S2. |
| 3 machine → where-used → process | IMPLEMENTED | shell.spec.ts contextual navigation | No graph transition gap. |
| 4 process → stage → machine → module → return | PARTIAL | shell.spec.ts proves available sections/reload/return same stage | S1 technical/content path implemented; full phase/productivity module remains S2/S3. |
| 5 system → truck count → recalculated result | IMPLEMENTED | system-experiment.spec.ts real N=3/4 result, A/B, stale/reset | Educational explanation/task refinement separately S4. |

## Learning-goal matrix — all 25 IDs

Source: [learning-goals §§4–9](../product/learning-goals.md). Coverage is deliberately
conservative: 17 Satisfied, 6 Partially satisfied, 2 Not yet satisfied.
None of the 25 accepted IDs is waived as Not required for MVP.

| ID | Status | Reason / evidence / minimal closure |
| --- | --- | --- |
| LG-M01 | Satisfied | V/D: 9 named canonical parts selectable in real 3D. |
| LG-M02 | Satisfied | L/M: nine approved functions, power-unit and distinct cylinder actions. |
| LG-M03 | Partially satisfied | V/L: clip and static grouped cycle sequence exist; six-phase explanation/navigation remains S2. |
| LG-M04 | Partially satisfied | L: functional movement relationships explained; phase-specific active/navigation evidence remains S2. |
| LG-M05 | Not yet satisfied | C values/formula only, no time-factor activity/explanation; S3. |
| LG-M06 | Not yet satisfied | Capacity/fill readonly, no causal activity/explanation; S3. |
| LG-T01 | Satisfied | L/M/P: approved truck purpose, transport role and canonical context. |
| LG-T02 | Satisfied | L: loading/loaded travel/unloading/return cycle and factor/queue explanations. |
| LG-T03 | Satisfied | L: approved distance → longer absence → fleet need/idle explanation; no distance control required for this explanation goal. |
| LG-P01 | Satisfied | L/P: canonical ordered stages with goal/input/activity/result/handoff. |
| LG-P02 | Satisfied | L/P: participant-specific explanations and role/factor notes. |
| LG-P03 | Satisfied | P/B: reusable canonical machine detour and stage return. |
| LG-P04 | Satisfied | M/P: machine operations/where-used derived from graph. |
| LG-Q01 | Partially satisfied | S lists four factors without causal meaning; S3. |
| LG-Q02 | Satisfied | S: change only N, preserve other factors, calculate, predict direction and explain via A/B. Machine-factor flow E remains separately missing; S3 extends transfer. |
| LG-Q03 | Partially satisfied | S shows standalone/system Q; L explains loading-ceiling assumption, but complete comparison/causal learning remains S3/S4. |
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

Original ordered plan had four slices. **S1 delivered in this implementation** with reviewed content/disclosure/breadcrumbs/trusted fromMachine. S2–S4 below remain recommendations for later authorization, not implemented functionality.

1. **S1 — delivered foundational content and contextual presentation.** Teach machine
   purpose, all 9 functions and operating principle; shallow truck purpose/cycle/
   distance explanation; four process stages with input/result/roles. Overview, breadcrumbs/card close and machine-origin context implemented using canonical data/route boundary. Catalog thumbnail/depth preview is not introduced by the approved S1 payload. Closes M02, T01–T03,
   P01/P02; supports M04. Reviewed reusable prose/content, no truck 3D, manufacturer
   specs, full Material or CMS. Resolve content contract changes explicitly, do not
   embed graph rules in UI.
2. **S2 — pedagogical working cycle.** Six phase names/purpose, active explanation,
   visual timeline and phase navigation/previous-next/speed per UX §§15–17/flow D.
   Review visual anchors and digging/filling overlap; connect movements/components.
   Closes M03/M04. No engineering phase durations, hydraulic simulation or rig rework;
   preserve accepted immutable authoring stages.
3. **S3 — machine factors and standalone productivity.** Explain four factors/units/
   accepted Q relationship and add small one-factor-at-a-time experiment using
   existing v1 core and illustrative source, plus baseline/current comparison.
   Closes M05/M06/Q01 and standalone part of Q03; extends Q02 to machine factors. No fabricated numerical ranges,
   new formula, persistence, variants or generic scenario engine.
4. **S4 — bounded production task and economic explanation.** Add explicit reviewed
   task objective/prediction and causal V/Q, count/hourly cost, duration/total/unit
   explanation; clarify standalone Q versus discrete loading ceiling. Retain existing
   N-only inputs/A/B/neutral justification. Closes E01/E02 and system part of Q03,
   reinforces Q04/S*/E03/E04. No grading, normative deadline, “optimal” fleet or advanced
   estimating. Tests for these later slices must verify visible learning behaviors.

### Required before MVP demo

Remaining S2–S4, reviewed phase anchors/provenance, and full learning-path
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

## Validation — current S1 task

- `npm ci`: passed, 259 packages installed, 0 reported vulnerabilities; only verified Vite processes were restarted/restored for Windows native binding.
- `npm run validate`: passed, running format/lint/type/content/assets/test/build; **522 tests passed in 31 files**. Final format/lint/type checks also passed after accessible E2E selector changes.
- `npm run test:e2e`: final production build and **16 Chromium tests passed** (18.3 s): three S1 learning paths plus all 13 previous acceptance/failure checks. Desktop/principle and narrow/process checkpoints inspected; text wraps without horizontal overflow.
- Strict malformed/duplicate/reference/completeness and nested immutability tests pass. Every approved runtime statement is checked against reviewed pack verbatim after whitespace normalization. No external provenance URL is fetched at runtime.
- Protected-path diff empty: src/simulation, numerical scenario, production-system data, Asset3D metadata, public GLB/manifest, models/Stage 01–09 and dependency manifests unchanged. Asset validation confirms 600324 bytes, 101 meshes/nine mappings and immutable-stage integrity.
- Existing lazy-viewer warning remains 983.97 kB minified / 261.67 kB gzip; build passes. Software Chromium cadence about 60 fps is local evidence, not a device guarantee.
- 121 local Markdown targets and 25 unique LG rows checked; git diff --check passed. S1 delivery has no timeline/phase controls, parameters section, standalone experiment, new scenarios or S4 assignment/economic calculation explanations.
