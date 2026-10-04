# 0006 — Deterministic earthworks simulation core

Status: Completed. Accepted baseline: fc90d90854285f05792210faedf599d7b19e7946.

## Goal, scope and sources

Implement only earthworks-deterministic-v1 from simulation-model §§4–27,
35–37 and accepted ADR 0004. Existing Machine/Process identities remain unchanged;
the illustrative scenario is numerical content, not a new machine definition.
No UI, viewer, assets, animation timing, recommendation, persistence or stochasticity.

## Contracts, units and boundaries

SimulationInput contains explicit excavator/truck/task numbers with unit-bearing
names; truckCount belongs to truck. calculate returns a discriminated success/error
SimulationResult with model ID, all 18 canonical metric IDs and useful intermediates.
Volumes are loose m³, cycle seconds, other cycles minutes, duration hours, distance
km, speeds km/h, costs CU/CU per hour. Ratios remain fractions (presentation may
convert to percent). No generic unit framework or implicit conversions/defaults.
The core imports only its own pure modules, no Zod, framework, I/O, clocks or random.
Strict content schema wraps explicit numerical inputs with scenario/provenance;
content validation reuses core constraints, never duplicates formulas.

## Validation and formulas

Validate finite numbers and §23 positivity/nonnegativity, integer count and
0 < k_time <= 1; k_fill has no invented upper bound. Missing parameters fail.
Validate finite derived values, positive divisors/productivity/duration and
representable discrete counts; overflow/underflow gives structured calculation errors.
Execute §16 order: q_eff → Q_exc_60 → Q_exc → ceil passes → t_load → loading
ceiling → travel/away/free cycle → MF/ceil balance → utilization/idle → Q_system_60
→ Q_system → wait/realized/share → duration → hourly/total/unit cost.
Use exactly §§7–15 formulas: k_time never changes loading time, last pass costs a
full cycle but delivered volume is truck capacity, waiting is steady-state.
Only ceil(pass count) and ceil(balance count) round. No display rounding.

## Steps and tests

1. Read sources/boundaries; verify formulas against documented oracles.
2. Implement contracts, validation, calculation, canonical units and scenario content.
3. Add separate validation/formula/baseline/sensitivity/edge/determinism/boundary tests.
4. Update README; run npm ci and all requested gates including unchanged E2E.
5. Inspect diff, assets and imports; record results, move plan, commit/push main.

Use relative tolerance 1e-6 for nonzero oracles and absolute 1e-12 for zero.
Test all N=1…5 outputs/intermediates, D=4/N=3,5, zero distance, discrete ratios,
near-zero valid inputs, invalid/nonfinite/missing values and numeric extremes.
Check equivalent min productivity, invariants, deep-equal repeated calls and no
input mutation. Expected baseline results belong exclusively to tests.

## Risks and completion

IEEE-754 overflow/underflow must not masquerade as successful output. Content
provenance is illustrative; scenario ID stays outside pure results. Formula/source
contradictions stop implementation rather than being silently corrected.
Completion: mandatory gates pass, assets/viewer unchanged, completed plan retained,
requested commit message, successful push and clean status. No contradiction found
in initial arithmetic review; rounded sensitivity duration differs within 1e-6.

## Actual implementation and results — 2026-10-04

Added contracts.ts, validation.ts and calculate.ts under src/simulation.
Results contain model identity, the exact 18 canonical metric IDs with one unit
manifest, and six named intermediates. No alternate competing metric aliases.
Input validation accepts unknown data without coercion/defaults and returns issue
phase/code/path. The typed calculator also validates at entry, returning either a
success payload or structured errors. Derived nonfinite/negative values, underflow
to zero in required positive results and unsafe derived integer counts fail.
Discrete-count rejection is a floating-point representation limitation, not a
practical engineering bound. Successful outputs are finite and unrounded.

Added the explicit baseline JSON, marked isIllustrative with source reference and
separate scenario/model identities. N=1 is its explicit starting count; tests
override it for N=2…5 without changing source values. Zod in the content boundary
checks strict shape/version/provenance and reuses pure numerical validation.
content:validate checks this file alongside existing domain and asset datasets.
No application adapter is needed: validated scenario.input already satisfies the
explicit contract. No UI invokes the model. Added Zod simulation import protection
and five boundary regression cases. README now describes the implemented core.

163 new tests: 95 input validation, nine formula/intermediate, five baseline,
two distance sensitivity, 14 edges/numeric failures, 25 determinism/invariants,
eight content-ingestion and five architectural boundary cases. The full suite
passes 365 tests in 19 files. Relative tolerance remains 1e-6 and absolute zero
tolerance 1e-12. No expected baseline output occurs in production calculation code.

Baseline system productivity for N=1…5 is 41.072164948, 82.144329897,
123.216494845, 124.5 and 124.5 m³ loose/h. D=4/N=3 gives 76.944206009 m³/h
and 12.996430165 h; the document's approximate duration 12.99643241 h differs by
~1.73e-7 relatively, inside its tolerance, so no formula/document correction is
needed. D=4/N=5 gives 124.5 m³/h and 0.7 min waiting. No actual contradiction found.

Validation passed: npm ci (zero audit vulnerabilities), format:check, lint,
typecheck, content:validate, assets:validate, test, build, validate and test:e2e.
All ten unchanged Chromium navigation/viewer E2E cases pass. npm ci initially met
a Windows binding lock: verified two project Vite instances through exact module
ownership/port, stopped them temporarily, then restored localhost and 127.0.0.1
5173 configurations hidden. No other process changed.

Diff review confirms no viewer/UI/navigation, domain records, Blender stages,
production GLB/mappings, dependencies/lockfile or authoritative mathematical
document changes. Asset validator preserves immutable hashes and 600324-byte GLB.
Application build hashes are unchanged; existing large viewer chunk warning remains.
git diff --check passes. Formula order, k_time placement, discrete last pass,
canonical IDs, pure imports, absence of formatting/defaults/thresholds/visual timing
were inspected. Fleet UI, recommendations, orchestration, comparison, persistence
and process/3D synchronization remain deferred.
