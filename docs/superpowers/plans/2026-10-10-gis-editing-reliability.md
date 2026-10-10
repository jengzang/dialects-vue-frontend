# GIS Editing Reliability Implementation Plan

**Goal:** Complete geometry validity protection, live drawing snapping, and cross-layer hit identification on `dev`.

**Architecture:** Keep the existing map component, composables, and panels. Add reusable geometry diagnostics and conservative repairs to the existing drawMap/export helpers. Wrap the existing Mapbox Draw modes for live snapping; keep the page authoritative for active-layer changes and authentication.

**Tech Stack:** Vue, MapLibre, Mapbox Draw, Turf, Vitest.

## Step 1: Geometry Protection and Recovery

- [x] Test self-intersections, duplicate vertices, zero-length lines, zero-area rings, invalid holes, valid holes, and conservative repair.
- [x] Reject invalid vertex edits and native Draw changes before model/history publication; restore accepted geometry and editing context.
- [x] List issues by feature and ring/edge/vertex, provide map focus and undoable repair actions. Preserve holes; split repairable single-ring self-intersections into separate polygon features.
- [x] Verify component, page, helper, and geometry operation regressions; review diff and commit only this step. Independent CR findings fixed; 241 focused tests, real Draw repair/undo smoke, and production build passed.

## Step 2: Live Snapping

- [x] Test mouse, click, and touch events using custom wrappers around installed Draw modes.
- [x] Show snap targets before committing points and use the same coordinate on click. Include the sketch start point for closing rings; keep finalized vertices unchanged.
- [x] Use explicit vertex > midpoint > edge > grid priority, deterministic active/reference tie breaking, and a temporary Alt bypass.
- [x] Verify regressions, review diff, and commit only this step. Independent CR finish-handle finding fixed; real desktop mouse and mobile touch checks passed.

## Step 3: Cross-Layer Identification

- [ ] Test overlapping active and reference hits, duplicate IDs across layers, hidden and locked states, and readonly candidate selection.
- [ ] Show layer/feature names and permissions; highlight focused candidates. Editable candidates switch active layers through the page contract, readonly candidates only inspect.
- [ ] Clear stale candidates/highlights when layers or modes change; retain keyboard navigation and Escape cancellation.
- [ ] Verify all GIS tests and production compilation, review diff, and commit only this step.

## Verification Limits

Use existing dependencies only. Mocked map tests verify state contracts, while a real-browser smoke check verifies render and pointer behavior where the local environment allows it. Report any browser limitation explicitly.
