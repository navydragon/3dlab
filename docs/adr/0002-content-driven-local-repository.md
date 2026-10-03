# 0002 — Content-driven local repository

**Status: Accepted**

**Date:** 2026-10-03

## Context

The [domain model](../domain/domain-model.md) requires one reusable machine entity, explicit operation/process relationships, separate learning content, and numerical-data provenance. The MVP can use version-controlled local content without a server or authoring service.

## Decision

Use JSON for structured domain definitions, simulation configuration/scenarios, and 3D metadata; use Markdown for learning prose. Keep these datasets conceptually separate and join them by stable IDs. Use Zod runtime validation at ingestion boundaries plus explicit graph/reference checks.

A read-only local repository serves validated definitions. Application queries resolve relationships; route components and educational prose do not define those relationships. Domain contracts remain independent from UI, Zod schemas, and loading implementations. Content uses the canonical metric vocabulary in [simulation-model §17](../domain/simulation-model.md).

## Consequences

New machines/processes mainly add definitions, references, learning modules, and mappings. Validation catches structural/reference errors but does not establish engineering authority; source metadata and illustrative labels remain necessary. Type/schema alignment must be checked.

A future backend or authoring tool can replace the loading adapter when concrete requirements justify it. CMS, persistence, localization implementation, and migration machinery remain deferred; executable MDX and a generic content engine are not required now.
