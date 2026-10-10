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

- [x] Test overlapping active and reference hits, duplicate IDs across layers, hidden and locked states, and readonly candidate selection. Resolve actual Draw `.cold`/`.hot` render layers and prefer business feature IDs over MapLibre internal numeric IDs.
- [x] Show layer/feature names and permissions; highlight focused candidates. Editable candidates switch active layers through the page contract, readonly candidates only inspect.
- [x] Clear stale candidates/highlights when layers or modes change; retain keyboard navigation and Escape cancellation. Preserve prior selection while inspecting locked candidates.
- [x] Verify all GIS tests and production compilation, review diff, and commit only this step. Independent CR completed with no blocking findings. Latest focused run: 260 tests in 8 files passed. Production Vite build and real Chrome desktop/mobile smoke passed, including native click deduplication, invalid midpoint insertion rollback followed by vertex dragging, and 16-candidate menus with long names.

### Step 3 Review Corrections

- Deduplicate native Draw mouseup/tap handling and the following distinct MapLibre click; one physical gesture must emit one map-click event.
- Reset pending deduplication on new physical mouse/touch gestures without resetting it for touch-generated synthetic mousedown events. Regression tests first reproduced the swallowed-click failure, then passed with the fix.
- Assign stable per-feature fallback IDs to ID-less preview data, including multiple points with the same partition key.
- Bound candidate menus by available map space; use border-box sizing and non-shrinking candidates so long names, feature identity, and permission rows remain readable on desktop and portrait screens.
- Exclude candidate highlights from image export and recognize actual Draw render-layer suffixes for export, box selection, and hover.

## Verification Limits

Use existing dependencies only. Mocked map tests verify state contracts, while a real-browser smoke check verifies render and pointer behavior where the local environment allows it. Report any browser limitation explicitly.

The browser fixture uses real MapLibre and Mapbox Draw with the project shared styles, but intercepts the external basemap style with a blank background. It does not certify production basemap/glyph network availability or large-dataset performance.
