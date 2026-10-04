# 0005 — Production 3D viewer integration

Status: Completed. Baseline: 70c51166029d4691734ed100e878f32b92a0d5a1.

## Goal and scope

Connect the accepted production Asset3D to machine Construction/Working Cycle
sections, preserving context navigation and accessible canonical text. Implement
orbit/zoom/fit, mapped selection/highlight/hide/isolate, visual playback and explicit
neutral reset. This is application integration, not a Blender modeling stage.

Non-goals: asset/metadata remodeling, simulation/formulas, phases, economics,
physics, exploded/transparency modes, persistence/backend or mobile redesign.

## Dependencies and boundaries

Registry verified: Fiber 9.8.1 supports React >=19 <19.4 and Three >=0.156;
current React 19.3.0 qualifies. Pin Three 0.186.1, Fiber 9.8.1, types/three 0.186.0.
Use Three's OrbitControls, no Drei/state/physics/postprocessing dependencies.
Domain/content/application retain plain types; Three objects stay in visualization.

## Architecture and strategies

- Local asset adapter discovers content/3d records through Vite glob, validates
  against the domain graph, exposes subject-ID resolution with explicit missing,
  invalid and ambiguous states. Adjacent public manifest is delivery evidence only.
- Application page query derives sections from resolved asset/mapped activity.
  UI consumes repository through composition/context, never raw JSON.
- Lazy viewer resolves base-relative URI against Vite BASE_URL, fetches/caches
  binary bytes and independently parses a renderer-owned scene per mounted viewer.
  Disposal closes mixer/material/geometry/controls resources. No shared scene mutation.
- Exact nodeMappings resolve each mesh name once; no prefix/extras identity inference.
  edu_selectable=false disables direct hits while retaining full highlight sets.
- Highlight uses reversible renderer-owned material clones; hide/isolate targets
  mapped meshes only, never canonical parents. Text list and canvas share component ID.
- Named mapped activity resolves its clip explicitly. Mixer owns time in seconds;
  Play/Pause/Reset semantic commands stay separate from visibility and selection.
- Capture static animated local TRS before mixer influence; Reset stops actions and
  restores captured TRS, avoiding the digging pose at clip time zero. Test repeats.
- WebGL preflight, request/decode/mapping/context-loss errors preserve text/UI and
  expose retry. Canvas has a label and external keyboard controls.

## Tests, measurement and completion

Pure metadata/base/mapping tests, real GLTFLoader scene tests for mapping/materials/
visibility/animation-neutral restoration, React section/context/text fallback tests.
Real production-build Playwright Construction/Working Cycle/context/error tests;
accessible selection, hide/isolate and reset assertions. Avoid fixed canvas pixels.
Measure request bytes/init-ready, settled/animated cadence, console errors and
renderer statistics in headless Chromium; record environment without invented
FPS thresholds. Inspect desktop/narrow screenshots and direct selection if feasible.

Risks: resource leaks, shared material mutation, asynchronous stale loads, neutral
reset drift, failed WebGL, base-path drift, ambiguous asset selection and context
navigation loss. Tests and bounded renderer ownership address them.

Completion: npm ci and all requested format/lint/type/content/asset/unit/build/
validate/E2E gates pass; immutable asset hashes pass, no domain values modified;
record measured outcomes/limits, move plan to completed, commit using requested
message and push current branch, verify clean Git status.

## Actual implementation and validation

Local Vite-glob adapter + validated AssetRepository resolve by subject, with no
first-record fallback. Composition injects it through AssetContext; page queries
derive construction/working-cycle sections while retaining process/stage queries.
MachineViewerSection owns plain selection/visibility/commands; lazy ProductionViewer
owns fetch/GLTFLoader/R3F/OrbitControls. SceneRuntime resolves complete explicit
mesh mappings, reversible material copies and independent visibility/mixer state.
Camera fit uses real scene bounds and leaves model TRS/scale untouched.

SceneRuntime captures all static local TRS before activating a mixer action.
Reset stops actions and explicitly restores them; pause does not advance time.
Five repeated Play/Pause/Play/Reset sequences compare exact transforms with neutral,
and remount starts neutral. Context-loss E2E exposed stale Play on retry; load/error
transitions now reset commands, preserve component/visibility state and start the
new renderer neutral. Retry reuses downloaded GLB bytes (one request).

Validation: npm ci succeeds, zero audit vulnerabilities. Formatting/lint/typechecks,
content and asset validation, all 202 tests in 12 files, production build and
npm run validate pass. Ten production-build Chromium E2E tests pass, including
existing navigation and context return, actual projected-triangle canvas bucket
click, accessible complete selection/visibility controls, playback/reset, HTTP,
decode, missing mapping, WebGL absence and real context loss/retry. The canvas
click is derived from real triangles/framing, never fixed screen coordinates.
Desktop 1280x720 and narrow 390x844 full-page screenshots were visually inspected;
no horizontal overflow, readable selection and reachable controls.

## Browser measurements (2026-10-04)

Windows 10/11 reported by Chromium user agent, Chromium 153.0.8010.12 headless,
ANGLE SwiftShader software WebGL, one Playwright worker, DPR 1 (application cap 1.5).
Production build; no invented FPS acceptance threshold. GLB response: 600324 bytes.
Asset-load effect/request to scene-controls-ready: 108 ms in the final full run
(prior sequential observations 105.7–109.3 ms). This excludes lazy JS transfer and
does not claim completion of GPU shader warm-up.

120-frame windows after settling: neutral 16.558 ms/frame (~60.40 fps), playing
16.658 ms/frame (~60.03 fps). Zero page errors and console errors in that run.
Renderer info: 101 geometries, 101 draw calls, 7004 triangles, texture counter 1;
the GLB still has zero images/textures/external resources. Renderer counters are
allocation counts, not inferred memory bytes; exact internal texture allocation
was not investigated. The JSON measurement is attached to the Playwright report.

An earlier two-worker software-GPU run competed for CPU/GPU resources, producing
~36–56 fps and test orchestration timeouts. The browser suite now uses one worker,
so screenshots and cadence windows do not compete; no FPS pass/fail gate was added.

## Limits and deferred work

Headless software-renderer results are diagnostic, not universal target-device
benchmarks. Physical desktop/tablet GPU and assistive-technology testing remain
future acceptance work. Viewer starts neutral without auto-play; clip timing is
visual only. No asset/geometry/material/hierarchy/clip/domain engineering changes,
simulation, phase segmentation, economics, physics or extra viewer features.

Three/Fiber's lazy chunk is 983.37 kB minified / 261.40 kB gzip and produces Vite's
default >500 kB warning. It remains separate from text/navigation; compression/LOD
or speculative optimization was not introduced. Production assets and mappings
remain byte-identical to the accepted baseline.

Environment: npm ci initially found the repository's existing Vite 5173 server
holding the native Rolldown binding. Verified that exact process, temporarily
stopped it, completed npm ci, then restored its original host/port/strictPort hidden.
No unrelated processes or assets were changed.

BrowserRouter uses Vite BASE_URL as basename; URI/base tests and a based-router
section-link test cover non-root paths without filesystem URLs.
