# 0001 — Client-side React + Vite application

**Status: Accepted**

**Date:** 2026-10-03

## Context

The MVP is an interactive browser laboratory with local content, educational 3D, contextual navigation, and deterministic calculations. No current requirement needs server rendering or application backend services. The [system architecture](../architecture/system-architecture.md) was reviewed after commit `2db6ae2858b814874bf7c0610b227802941ed031`.

## Decision

Use React + Vite with strict TypeScript and a static client-side production build. Use React Router and initially React local state/reducer/context. Keep domain, application, simulation, and visualization modules separate within one application. Use Vitest, React Testing Library, and Playwright for the accepted testing strategy.

The MVP requires no backend, database, authentication, or CMS. Next.js/server-side features are not needed for its current requirements.

## Consequences

The application can be delivered as static files with minimal infrastructure. Strict typechecking is a separate gate from bundling; accessible component tests and production-build browser tests remain required. Entity deep-link reloads require static-host fallback and correct asset/base paths.

Hosting provider, package/runtime versions, and CI provider remain deferred. This decision does not start implementation or install dependencies.
