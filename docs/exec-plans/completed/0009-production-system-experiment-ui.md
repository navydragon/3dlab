# 0009 — Production system experiment UI

Status: Completed. Baseline: e2c28013e7b7be717a844df900c47f5fd332fcca.

## Goal and flows

Implement approved second slice: Home → production task → systems catalog →
system overview → explicit source scenario → edit N → calculate/explain → save A/B
→ compare and justify. Also Process → related system, canonical machine/process
links and direct-load/reload. Sources: accepted product/user flows F/G/Acceptance 5,
UI spec §§28–36/55, domain/simulation specs, architecture/ADRs 0004/0005,
completed plans 0006–0008. Preserve core, numeric content and 3D.

## Routing/composition

Add /systems and /systems/:systemId?scenario=:scenarioId through centralized
builders/parsers. Missing query means overview, malformed/duplicate query invalid,
unavailable scenario recoverable; never pick a default. URL identifies source only.
Isolated valid/invalid SystemsContext joins App composition; errors cannot disable
machine/process/viewer content. Process links derive repository relationships.

## Experiment and presentation

Pure application service resolves source and model, copies input, edits truck count,
checks model/participant constraints and dispatches calculate. Pure reducer owns
working input, explicit latest calculation/staleness/errors, prediction/direction
and exactly two frozen saved slots. React holds reducer session; keyed source
changes/remount clear session. Reset restores source, stales last result, preserves
A/B; failed calculation clears latest success; save disabled for stale/error/full.
No persistence, timestamps or engineering time from animation.

Primary canonical KPIs: system productivity/duration/total cost. Secondary:
utilization/idle/wait time/share/MF/hour cost. Details: unit cost/balance/standalone.
Central Russian formatting outside core; ratios percent, deltas percentage points.
Explanation only MF < 1 / >= 1 and waiting > 0, no near-balance/optimum/grade.
Prediction optional nonpersistent choice, actual exact direction after recalc.
Comparison subtracts real result values; immutable same-source A/B with neutral
facts, proper table and nonpersistent decision textarea. No duplicated formulas.

## Accessibility/responsiveness/tests

Labeled number input and buttons; content-derived min/nullable max, no invented cap.
Text plus semantic utilization/idle/wait bars; concise status/alerts, visible focus,
real links and table headings/caption. Desktop context/results columns, narrow stack
and scrollable comparison with focusable labeled region. Input values readonly
except N; illustrative/provenance context visible.
Unit tests cover routing/no fallback, source copying/bounds/model errors, snapshots,
reset/stale/failure and exact N3/N4 deltas. RTL covers catalog/overview/control/result/
comparison/reset/errors/process links and isolated configuration failure. Playwright
adds Acceptance 5, process entry, direct URL/reload, malformed recovery and narrow
layout. Review limited desktop/narrow screenshots. Existing product tests pass.

## Completion/non-goals

All mandatory npm ci/format/lint/types/content/assets/test/build/validate/E2E gates,
scope/byte checks, plan completed and requested commit/push/clean status.
No full learning content/Scenario/Material, new engineering values, recommendation,
backend/storage, fleet 3D, simulation/asset changes, libraries or performance work.

## Delivered and verified

Central system routes/parsing, repository-backed catalog/overview and explicit source
selection are implemented. Home has three equal semantic entries; process pages
derive systems from the application query. App injects a separate valid/invalid
systems provider, whose configuration errors do not disable machine/process content.
The existing model adapter gained only editable participant identification; its
calculation implementation, canonical identities and participant interpretation stay
unchanged. No new architectural decision or product requirement was needed.

Application service/reducer separates canonical immutable sources, copied working
inputs, exact calculated results and deeply frozen snapshots. Explicit calculate,
stale marking, structured failure, source reset, ephemeral prediction and exact
direction, two save slots and explicit clear are covered. UI presents read-only
context, canonical composition, illustrative/provenance/CU labels, three primary
KPIs, explanatory metrics, textual semantic bars and model-backed interpretation.
A/B table uses real result differences and percentage points, with neutral facts and
an ungraded, nonpersistent justification. Stepper limits come from content; numeric
input permits large counts and reports core failures without an invented maximum.

Final gates passed: npm ci (259 installed packages, zero audit findings), format:check,
lint, typecheck, content:validate, assets:validate, test, build and aggregate validate.
475 unit/component tests in 28 files pass (37 added). All 13 production-build Chromium
E2E tests pass (three added); all ten existing machine/process/3D flows remain intact.
Acceptance Flow 5 passed through Home → task → catalog → overview → explicit source
→ N3 calculate/save A → N4 calculate/save B → semantic comparison. Process entry,
direct URL/reload, invalid query/unavailable source recovery and input correction
also passed. Reload preserves the selected source URL and resets unsaved state.
Keyboard controls and invalid systems isolation are verified in RTL.

Observed exact core outputs (UI display alone is rounded):

- N3: Q = 123.2164948453608 m³-loose/h; duration = 8.11579651941098 h;
  total = 3165.160642570282 CU; hourly = 390 CU/h;
  idle = 0.01030927835051565; wait = 0 min.
- N4: Q = 124.5 m³-loose/h; duration = 8.032128514056225 h;
  total = 3694.779116465864 CU; hourly = 460 CU/h; idle = 0;
  wait = 4.649999999999999 min; wait share = 0.24218749999999994.

Limited Playwright screenshots reviewed at desktop and 390px:
test-results/system-experiment-desktop.png and system-experiment-narrow.png.
These diagnostics are ignored by Git and regenerated by E2E. Desktop uses two
columns; narrow stacks context/results, with comparison overflow contained in a
focusable region and no page-wide overflow. The long narrow context is intentional;
no complete mobile-first layout is claimed.

Git diff/check/status inspected. Core, all domain/numerical content, dependencies/
lockfile, 3D metadata/public assets and Stage 01–09 authoring files are unchanged.
Both tracked GLB files are byte-identical to baseline Git blobs. Asset validation
confirms 600324-byte production GLB, 101 mapped meshes, nine components, unchanged
authoring hashes and clip. Production build retains the known large lazy 3D chunk
warning (983.97 kB); no performance scope was added.

Limitations: scenarios display canonical IDs because current records have no
display-name field. Only N is editable. Sessions/justifications/predictions do not
persist, comparison has exactly two same-source slots, and no optimum is selected.
Full Scenario/Material models, other parameter editing, storage, grading, fleet 3D
and optimization criteria remain deferred. Illustrative values are not machine
specifications. No next feature was started.
