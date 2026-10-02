# Project Instructions

## Project

This repository contains the Interactive Digital Laboratory of Machines and Mechanized Processes in Transport Construction.

The product is a multidisciplinary educational platform.

It is not tied to one specific academic discipline.

---

## Sources of truth

Read these documents before making significant product or architectural changes:

- Strategic vision:
  `docs/vision/strategic-vision.md`

- Current MVP boundaries:
  `docs/product/mvp-scope.md`

Future authoritative documents will include:

- `docs/product/learning-goals.md`
- `docs/product/user-flows.md`
- `docs/domain/domain-model.md`
- `docs/domain/simulation-model.md`
- `docs/design/ui-ux-spec.md`
- `docs/architecture/system-architecture.md`

Do not invent missing product requirements when they affect domain semantics or educational behavior.
Surface the ambiguity instead.

---

## Core product principles

The product must support both learning directions:

```text
machine -> process
process -> machine
```

Machines, operations, processes and their relationships must be explicit domain entities.

The same machine entity must be reusable across multiple educational contexts.

Do not create separate duplicated machine entities for different pages or learning modules.

---

## Content architecture

The application should be content-driven.

Do not hard-code educational relationships inside UI components.

For example, avoid logic such as:

```text
if machine == "excavator":
    open excavation process
```

The relationship between the excavator and excavation process must come from domain/content data.

---

## Separation of concerns

Keep the following layers separate:

1. domain data;
2. educational content;
3. simulation and mathematical logic;
4. application state;
5. UI;
6. 3D visualization.

Mathematical models must not depend on React or 3D rendering.

3D assets must not be the authoritative source of domain data.

GLTF/GLB node names may reference domain identifiers, but domain semantics belong to structured application data.

---

## Simulation

Simulation and calculation logic must:

- be deterministic where appropriate;
- use explicit units;
- have automated tests;
- remain independent from UI;
- avoid unexplained constants.

Do not fabricate engineering formulas or normative values.

If authoritative values have not yet been specified, use clearly marked illustrative data or request clarification.

---

## Scope control

Do not expand MVP scope without an explicit change to:

`docs/product/mvp-scope.md`

Features excluded from MVP must not be implemented merely because they are technically easy.

---

## Architecture decisions

Important architectural decisions must be recorded under:

`docs/adr/`

Use ADRs for decisions that would be difficult or expensive to reverse.

Do not create speculative ADRs for decisions that have not yet been made.

---

## Execution plans

Significant multi-step implementation work should have an execution plan under:

`docs/exec-plans/active/`

Completed plans should be moved to:

`docs/exec-plans/completed/`

---

## Development quality

Before declaring implementation work complete, run all relevant:

- formatting checks;
- linting;
- type checks;
- unit tests;
- integration tests;
- production build.

For user-visible flows, add E2E tests when practical.

---

## Working style

Before implementing a significant feature:

1. inspect the existing repository;
2. read relevant documentation;
3. identify affected domain entities;
4. identify architectural implications;
5. present or maintain an implementation plan;
6. implement;
7. test;
8. update documentation if behavior or architecture changed.

Prefer small, reviewable changes over large speculative implementations.
