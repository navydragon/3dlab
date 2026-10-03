# 0003 — React Three Fiber visualization boundary

**Status: Accepted**

**Date:** 2026-10-03

## Context

The [UI/UX specification](../design/ui-ux-spec.md) requires interactive machine inspection, shared text/3D selection, controllable working-cycle playback, and recovery when 3D fails. The [domain model](../domain/domain-model.md) separates educational semantics from asset topology.

## Decision

Use React Three Fiber over Three.js inside an isolated visualization boundary. Load GLTF/GLB assets and resolve scene nodes/clips through explicit versioned metadata mappings. The viewer accepts plain IDs/interaction data and emits mapped component IDs and playback/loading events.

Domain code must not depend on Three.js objects. GLB is not domain truth: names, descriptions, machine/process relationships, numerical parameters, and formulas belong to structured content or the calculation core. Visual animation timing must not determine engineering time.

## Consequences

React scene composition fits the accepted UI stack, while a renderer-neutral viewer interface permits later replacement without rewriting domain logic. Three.js/Fiber version compatibility and GPU resource lifecycles need verification during implementation.

Lazy loading, mapping/clip checks, textual alternatives, and viewer-level failure handling are required. Exact assets, licenses, performance budgets, and optional isolation/transparency remain to be reviewed; no placeholders or new assets are created by this decision.
