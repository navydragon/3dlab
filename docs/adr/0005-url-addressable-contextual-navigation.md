# 0005 — URL-addressable contextual navigation

**Status: Accepted**

**Date:** 2026-10-03

## Context

The [user flows](../product/user-flows.md) require direct entity links and a machine-learning detour that returns to the same process stage. Browser history alone cannot reliably restore a semantic origin after deep links, reloads, or section navigation.

## Decision

Use stable entity routes with React Router. Serialize explicit contextual-return IDs in the URL and preserve them through machine-section links. Resolve IDs through content and validate that the stage belongs to the process and the machine has an eligible role.

For example, `/machines/excavator/construction?fromProcess=excavation-haul&fromStage=excavation-stage` carries `processId: excavation-haul` and `stageId: excavation-stage`; explicit return opens `/processes/excavation-haul?stageId=excavation-stage`. `Operation.id: excavation` remains distinct from the stage ID.

Build internal destinations from validated IDs. Browser Back follows visited history; explicit contextual return follows the semantic origin. Without valid origin, provide ordinary hierarchy/catalog navigation.

`sessionStorage` UI restoration is optional/deferred. Slice one must restore `processId` + `stageId` using only the URL and must not depend on storage.

## Consequences

Deep links and reloads preserve required domain context without persistence infrastructure. Test return after section changes/reload, direct entry, stale IDs, and browser Back/Forward. URL route structure remains outside domain entities; raw external return URLs are not accepted.

Optional panel, scroll, and camera storage restoration and cross-session scenario persistence remain undecided. No persistence or hosting-provider decision is made here.
