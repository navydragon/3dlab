# 0007 — Technical debt cleanup

Status: Completed. Baseline: fda5f4bdc20d98c4ddfd5776f0eb6f71aa695450.

Refactoring only: remove viewer plain-state imports from renderer implementation,
centralize accepted LearningActivity identity, generalize scenario content ingestion.
Sources: accepted architecture/ADRs 0002–0004, domain/simulation/asset specifications,
completed plans 0005–0006. Baseline 365 tests pass before any changes.

## Boundaries and steps

1. Move command/visibility/default into visualization/contracts; remove unused
   ViewerInteraction. Keep Three behavior private. Protect UI imports with ESLint.
2. Add branded LearningActivityId/ScenarioId guards and canonical activity constant.
   Type animation mappings/schema/runtime and replace raw code references.
3. Generalize scenario ID, nonblank source, explicit illustrative boolean; preserve
   model/input constraints. Validate entire collections including duplicate IDs.
4. Add immutable read-only list/get repository and local Vite adapter; no default
   scenario or calculation. Node discovery sorts paths; content/simulation is
   explicitly reserved for one scenario per JSON file, other types go elsewhere.
5. Test contracts, typed activities, multiple test-only scenarios, collection errors,
   frozen repository, deterministic discovery and existing behavior.
6. Run npm ci/all requested gates/E2E, inspect diffs and immutable content; complete
   plan, commit requested message and push current branch.

## Compatibility, non-goals and acceptance

No product functionality, UI/URL/appearance, formulas, input/results, assets,
baseline JSON values/bytes, dependencies or performance changes. No full Scenario
entity, title/author/timestamp, default policy, React composition or new ADR.
Preserve activity serialization and exact Stage 09 generated outputs.
Structured collection errors must retain file/index paths; invalid records cannot
yield partial successful repository. Deep freeze accepted records and list.
Completion requires all gates, unchanged simulation baselines/assets and clean
committed/pushed main. Known viewer chunk warning and feature integration deferred.

## Actual changes and verification — 2026-10-04

Moved ViewerCommand/Visibility/showAll to contracts; the default and hidden list
are frozen plain data. Removed unused ViewerInteraction after repository search;
PlaybackState/ViewerLoadState/ViewerAnimationState remain used. UI only imports
plain contracts and lazily loads ProductionViewer. Three scene/mixer behavior
remains in implementation modules. UI import restrictions reject scene-runtime,
viewer-logic/camera-fit; contracts reject framework/Node imports while preserving
existing layer restrictions. No custom lint framework introduced.

Added branded LearningActivityId/ScenarioId with structural guards and one domain
EXCAVATOR_WORKING_CYCLE declaration. AnimationMapping, Zod ingestion and renderer
activity arguments use the branded identity. Application capability checks, UI,
runtime tests and Stage 09 generator use the constant. A focused source-literal
audit proves one production declaration, without full-file snapshots. Metadata
serialization and Stage 09 generated artifact checks are unchanged.

Generalized scenario schema to stable ID, explicit boolean, nonblank provenance,
literal model version and the same strict numerical input validation. It does not
introduce a full Scenario entity or new engineering fields. Nested readonly schemas
clone/freeze records. Collection validation collects indexed structured shape and
duplicate-ID errors; invalid collections expose no partial accepted data.

Repository creation validates inputs before building its private Map; only validated
records enter the read-only list/get repository. Missing IDs return undefined,
duplicates reject creation, zero records produce an empty repository. No default
scenario or calculations. Local Vite adapter sorts discovered JSON paths, validates
all records and remains outside React composition. Node discovery recursively sorts
entries, reads scenario JSON and fails on malformed JSON with source path; CLI maps
validation indices to filenames and reports count/IDs. This dedicated directory is
reserved for scenario records; README documents that other content types live elsewhere.
One unchanged illustrative production baseline validates; the second scenario exists
only in test data. Explicit false status is accepted without changing baseline truth.

21 added tests: 11 collection/repository/local adapter, three viewer contracts/activity
capability/literal audit, one discovery and six lint boundaries. Updated former
boolean-literal rejection to reject a nonboolean, and runtime fixtures to use typed
activity IDs. No simulation formula/baseline tests changed. Full suite: 386 tests in
22 files. Tests cover deep immutability, external input mutation isolation, no hidden
default, invalid/duplicate/malformed/wrong-version/numerical records, sorted recursive
discovery, malformed JSON failure and existing working-cycle section capability.

All gates pass: npm ci (zero audit findings), format:check, lint, typecheck,
content:validate, assets:validate, test, build, validate and all ten existing unchanged
Chromium E2E flows. Clean install temporarily stopped two verified repository Vite
processes holding the exact native binding; both original localhost/127.0.0.1 5173
configurations were restored hidden afterward.

Diff/check/status reviewed: src/simulation including all formula/expected-result
tests, baseline JSON, content/3d, public assets/manifest, Blender stages, dependencies
and lockfile remain byte-for-byte unchanged in Git. Asset checks retain 600324-byte
GLB and exact Stage 09 manifest. No UI markup, URLs or user flow changes; E2E verifies
selection, visibility, playback/reset, context navigation and failures. Existing large
lazy viewer chunk warning remains visible, with no artificial suppression.

Intentionally deferred: default scenario/application policy, production-system UI,
full Scenario domain entity, renderer performance/device optimization, compression,
LOD and chunk work. No new architectural decision or ADR was necessary.
