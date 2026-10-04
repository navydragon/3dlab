# 0010 — MVP readiness and source-of-truth normalization

Status: Completed. Evidence baseline: 793722754797737729bb7db1a9960c0f603477cd.

## Purpose and deliverables

Reconcile intended educational MVP with actual code/content/tests. Deliver six
source-of-truth documents: product/mvp-content-spec.md, product/information-architecture.md,
domain/content-schema.md, architecture/repository-structure.md,
architecture/data-contracts.md and quality/mvp-readiness-audit.md. Update current
documentation indexes and factually stale current statements only. Preserve
historical completed plans and accepted ADR decisions.

## Method

Read vision, MVP scope, learning goals, flows, domain/simulation/UX specifications,
accepted architecture/ADRs, completed implementation plans 0001–0009 and 3D delivery
contracts. Inspect actual definitions, validators, repositories, application queries,
routes, page controls, renderer behavior, calculation core, JSON content and tests.
Trace each requirement to its normative source and implementation evidence; a
type, formula or asset alone does not establish educational content or learner ability.

IMPLEMENTED = observable required behavior/content exists with evidence.
PARTIAL = some behavior/content exists but an explicit requirement remains unmet.
MISSING = required behavior/content absent. DEFERRED = optional/later work supported
by source scope. OUT OF SCOPE = expressly excluded from the current MVP.
Learning-goal coverage describes supported learning opportunity, not measured
student achievement. Record ambiguities rather than approving new engineering facts.

## Audit and reconciliation

Audit scope levels A/B/C and all readiness criteria, every LG-M/T/P/Q/S/E ID,
flows A–J and acceptance flows 1–5. Inspect machine/component explanations,
working-cycle phase learning, truck/process depth, machine versus fleet productivity,
economic reasoning and assessment scope. Separate actual routes/contracts from
target sections and full conceptual domain entities. Propose only 2–4 ordered
remaining slices, with requirements/learning goals/closure and exclusions.

## Consistency and completion gates

Normalize misleading current prose without changing MVP boundaries, formulas,
accepted architecture or historical records. Keep existing document statuses;
do not mechanically mark drafts Final. Check Markdown links and LG-ID coverage.
Run npm ci, format/lint/types/content/assets/unit/build/validate and production E2E.
Confirm no changes to src/content/public/tests/scripts/models/dependencies/routes.
Review diff/check/status. Record findings/evidence/remaining slices, move this plan
to completed, commit "Audit MVP readiness and normalize source of truth", push
current branch, verify clean status and report SHA.

## Non-goals

No product functionality, learning-content JSON, new routes, formulas/engineering
numbers, 3D assets, dependencies or tests. No implementation of discovered gaps.

## Actual findings and completion

Six requested documents created with an evidence-based audit and discoverable
README/docs/architecture indexes. Current architecture/3D/product/domain/UX prose
now distinguishes implemented technical slices from historical milestone definitions.
No accepted ADR or historical completed plan was rewritten. Existing statuses retained.

Readiness PARTIAL: 11 learning goals Satisfied, 11 Partially satisfied, 3 Not yet
satisfied; all 25 IDs accounted for. LG-Q02 is satisfied by the N-only one-parameter
experiment; this does not close separate machine-level flow E. Acceptance paths
1/2/3/5 implemented; path 4 technical detour/return works but full module depth partial.
Standalone assessment screen is optional/deferred, required learning opportunities
are not. Truck needs shallow prose rather than deep 3D. Graph structure does not
replace stage input/output/role explanation; clip does not replace phase learning.

Ordered remaining educational slices, not implemented:
1. Reviewed machine/component/principle, shallow truck and stage prose/context.
2. Named pedagogical cycle phases, active explanation and navigation.
3. Four machine factors and standalone productivity experiment using accepted core.
4. Guided production task and causal economic/productivity explanations.

npm ci succeeded (259 packages, 0 vulnerabilities). npm run validate executed and
passed formatting, lint, types, content, assets, 475 tests/28 files, production build.
npm run test:e2e passed all 13 production Chromium tests. Existing viewer chunk-size
warning retained; measurements do not guarantee physical device usability.
Local Markdown targets and 25 unique LG rows checked; git diff --check clean.
Only README and docs changed; no code/content/public assets/routes/formulas/scenarios/
dependencies/tests/tooling/immutable authoring-stage changes. No new functionality.

Plan moved to completed before the mandated documentation commit/push.
