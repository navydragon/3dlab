# 0004 — Pure deterministic simulation core

**Status: Accepted**

**Date:** 2026-10-03

## Context

The [simulation model](../domain/simulation-model.md) specifies `earthworks-deterministic-v1`, explicit units and loose-volume basis, formulas, validation rules, baseline results, and sensitivity/edge tests. Calculations must be reproducible and independent from visual playback.

## Decision

Use the pure contract:

```text
SimulationInput
→ calculate()
→ SimulationResult
```

The core has no React, DOM, router, Three.js, I/O, random-number, or wall-clock dependencies. Application services resolve scenario values into explicit validated inputs, invoke the core, and attach scenario/provenance/timestamp metadata outside the deterministic numerical payload.

Implement only the documented formulas and calculation order, returning structured failures for invalid inputs or calculations. Use simulation-model §17's canonical output IDs. Keep rounding, localized explanations, and comparison presentation outside the core.

## Consequences

The same model can be tested in a non-DOM environment and used independently of pages or assets. All documented baselines, distance sensitivity, zero-distance behavior, discrete rounding, and invalid-input cases require automated tests. Formula/assumption changes require a model-version change and documentation review.

The first technical slice includes no fleet simulation UI; calculation implementation and result/comparison UI belong to the second slice. This ADR changes no formulas or expected values and introduces no simulation code.
