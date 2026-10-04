# 0008 — Production system domain foundation

Status: Completed. Baseline: 8de05826b6206134dc35a79d262dd47cf88d25f8.

## Goal and scope

Implement domain-model §§14–17/32 relationships for the canonical
excavator-haul-system. No UI/routes, experiment state, orchestration, formula changes,
full Scenario entity, new model, assets or dependencies. Sources: AGENTS, README,
MVP/user flows/learning goals/UI spec, accepted architecture/ADRs 0002/0004,
domain/simulation model and completed plans 0006/0007.

## Contracts, content and ownership

Add ProductionSystemId/SimulationModelId and pure ProductionSystem/participant
contracts. System owns process, participant definitions, model and scenario ID
references. Participant owns role/machine IDs and positive integer min/max (nullable
maximum); no optional-participant semantics are introduced. Scenario alone owns
variable truck count. Add one Russian-named production-systems.json record linking
the existing process, roles, machines, model and unchanged illustrative baseline.

## Validation and model bridge

Strict Zod shapes plus unique system IDs/participant pairs/scenario references.
Validate process, machines, roles, role eligibility, supported runtime model and
scenario existence/model. Content-side supported-model adapter references the
actual calculate implementation, but validation never calculates. Explicit v1
counts are one excavator and scenario truckCount. Require v1's fixed excavator
definition and mapped participant structure; validate scenario counts against each
definition, including null/finite truck maximum. No arbitrary maximum.

## Repository and application boundary

Use a dedicated ProductionSystemRepository: the six-collection domain graph keeps
its existing cohesion and has no new dependency on numerical scenarios/model code.
Validate against the DomainRepository and ScenarioRepository before construction;
return structured invalid state, never partial repository. Frozen list/get/
getByProcess/getSupportedScenarios preserve canonical record identity, explicit
absence and no default/calculation. Local adapter loads JSON and both validated
dependencies outside React. Thin pure query joins system/process/machines/roles/
scenarios without selecting a scenario or running calculations.

## Steps and tests

1. Read sources; add IDs/contracts/schema/content and narrowly clarify transitional
   numerical Scenario references in domain-model §14 without changing formulas.
2. Implement explicit model adapter, cross-reference validation and repository.
3. Add local adapter and read query; extend CLI dependency ordering.
4. Test malformed shapes/counts/IDs, duplicates, missing/invalid references,
   eligibility, model/scenario mismatch, bounds, fixed excavator and null maximum.
5. Test shared canonical identities, absence/frozen results and second test-only
   system to prove content-driven relationships; unchanged UI/E2E.
6. Run npm ci/all requested gates, inspect immutable source diff, complete plan,
   commit requested message and push current main, verify clean status.

Completion requires deterministic structured validation, one production system,
byte-identical baseline/core/assets, unchanged product flows, passed tests/gates,
completed plan and committed/pushed clean repository. Full Scenario/default UI
policy/calculation orchestration remain deliberately deferred.

## Actual implementation/results — 2026-10-04

Added pure production-system.ts contracts and branded ProductionSystemId /
SimulationModelId guards. One production record owns process/model/scenario
references and the two documented role/machine definitions: excavator 1..1,
dump truck 1..null. Its Russian name is a direct description, not marketing prose.
No machine/process/scenario objects or current experimental counts are duplicated.

Strict content schema freezes records/definitions/reference arrays, validates IDs,
positive integer constraints, max >= min, nonempty participant/scenario lists and
duplicate references/pairs. Cross-reference validation checks unique system IDs,
process/machine/role existence, role eligibility, supported model, scenario existence,
matching model and scenario counts. Invalid collections have structured shape/graph
issues with indexed paths and no successful partial repository.

The content-side v1 adapter references MODEL_ID and the actual calculate function
without invoking it. It accepts the explicit two-pair single-excavator structure,
returns excavator count 1 and truck count from scenario.input, and validates system
limits. Model-specific canonical pair matching is confined to this adapter; general
repository/query relationships have no special canonical system/machine branches.
Finite truck maximum is supported only when declared by content; production uses
null, with no arbitrary maximum. No generic fleet/reflection framework or fake
SimulationModel JSON was added.

Dedicated repository keeps the six-collection knowledge graph cohesive. Its frozen
list/get/getByProcess/getSupportedScenarios results preserve shared canonical
records. A missing system/process returns undefined; a known process with no
systems returns an empty list. Supported scenarios resolve through the existing
ScenarioRepository. Local adapter refuses invalid domain/scenario dependencies
before system validation; it is not imported by React composition.
Application getProductionSystemOverview only joins canonical system/process/
participants/scenarios, with explicit missing/invalid-dependency states.

CLI now validates domain → scenarios → systems → 3D metadata; invalid scenario
dependencies skip system acceptance with a nonzero result. Existing domain
repository runtime import now explicitly uses .ts so Node 24 native TypeScript
can load it in this validation pipeline; behavior is unchanged. README documents
the separate boundary. Domain-model §14 has only the authorized narrow clarification
that current supportedScenarioIds reference numerical SimulationScenario records,
whose truckCount is the sole experimental count. Full Scenario fields remain
conceptual; no competing participantCounts representation was created.

52 new tests: 30 shape/contract, 16 reference/model/count and six repository/query/
local-adapter cases. Fixtures test missing references, role ineligibility, model
mismatch, unsupported models, duplicates, below/above constraints, null maximum
with a large explicit truck count, and exact excavator structure. Wrong-model join
test injects a deliberately foreign-model test record to exercise the relation
check independently from the current schema's literal model validation.
Canonical machine/role/process/scenario identity and deep frozen results pass;
second test-only system/process proves content-driven joins. No second production
record and no existing UI/viewer/navigation/simulation test modifications.

Validation passed after npm ci (zero audit findings): format:check, lint, typecheck,
content:validate, assets:validate, test, build, validate and test:e2e. Total 438 tests
in 24 files and all ten unchanged Chromium E2E flows pass. Verified/stopped two
project Vite instances holding the exact native module during npm ci and restored
both original localhost/127.0.0.1 port 5173 configurations hidden afterward.

Git diff/check/status inspected. Byte comparison with baseline Git blobs confirms
unchanged baseline scenario JSON, production 3D metadata, public manifest and GLB.
Asset validator proves unchanged authoring hashes and 600324-byte GLB. src/simulation
including contracts/formulas/precision/expected results remains unchanged, as do
visible UI/routes/viewer, existing six domain datasets and dependencies/lockfile.
Application build hashes are unchanged. Known large lazy viewer warning remains.
No actual model contradiction found, no new ADR needed. UI, default policy,
calculation orchestration, full Scenario/Material, persistence and fleet 3D remain
deferred; the foundation ends at validated data and the pure read query.
