# GIS Continuous Editing and Tutorial Implementation Plan

**Goal:** Make unfinished line/polygon sketches explicitly finishable, cancelable, and locally undoable; preserve vertex editing context; document every currently exposed GIS function in Simplified Chinese.

**Architecture:** Extend existing Draw mode wrappers and component events without extracting components or composables. Keep page history for completed features and layer changes; use a transient sketch redo stack only while drawing. Extend existing history snapshots with map-owned edit context. Update the existing tutorial Markdown consumed by the tutorial manifest.

**Tech Stack:** Vue, MapLibre, Mapbox Draw, Vitest, existing Chrome smoke harness, Markdown.

## Step 1: Sketch Lifecycle

- [x] Add failing mode-wrapper/component and page tests for sketch undo/redo, explicit completion, cancellation, and keyboard precedence.
- [x] Track finalized sketch coordinates separately from the moving preview; clear redo when adding a new point. Reject invalid completion without ending the sketch.
- [x] Expose finish/cancel/undo/redo actions and state through existing map/page/tools panel boundaries. Enter finishes, Escape cancels, Backspace/Delete removes the last sketch point, and history shortcuts stay local during drawing.
- [x] Ensure mode changes, layer switches, hide/lock, imports, and split-sketch cancellation cannot accidentally publish unfinished geometry. CR also found new-layer drawing started before props synchronized; a failing page test confirmed this and both creation entry points now wait for nextTick and recheck active ownership.
- [x] Run focused tests and real desktop/mobile browser interaction checks; inspect diff, CR, and commit only Step 1 files. 265 tests and the real Chrome smoke passed; no unrelated style changes or translation rewrites.

## Step 2: Continuous Vertex Context

- [x] Add failing tests for neighboring vertex selection after deletion and edit-context restoration through undo/redo.
- [x] Capture feature ID and coordinate paths in existing history snapshots; restore after model synchronization, validating paths and permissions. Consecutive undo requests restore only the latest context; history never restarts a saved unfinished drawing mode.
- [x] Preserve selection of newly inserted vertices; explicitly distinguish vertex deletion from feature deletion. Deleted line endpoints choose the nearest survivor; polygon deletion wraps to the adjacent surviving ring vertex.
- [x] Run focused history/page/map tests and real Draw checks; inspect diff, CR, and commit only Step 2 files. 269 tests and real Chrome checks passed, including deletion followed by native dragging and undo/redo vertex selection. Browser CR exposed model回写 rebuilding Draw and clearing selection; the watcher now restores direct context only for the loaded layer, and cross-layer same-ID regression is covered.

## Step 3: Simplified Chinese User Tutorial

- [ ] Read current panels, modals, composables, locale labels, and peer tutorials; build a feature coverage inventory.
- [ ] Replace the short existing `project/src/main/components/tutorial/content/zh-CN/menu-map-draw.md` with a detailed task-oriented guide: prerequisites, feature/layer distinction, drawing, selection, editing, snapping/topology, geometry tools/quality, text, styling, attributes, all import/export and Voronoi workflows, drafts, view controls, keyboard shortcuts, and troubleshooting.
- [ ] Verify every documented control against the implementation and preserve existing tutorials/translations. Do not claim unsupported operations or fabricate screenshots.
- [ ] Validate Markdown rendering/tutorial tests, links and UTF-8. Record the existing single-file Traditional Chinese conversion command for later use; do not overwrite the current Traditional Chinese tutorial in this step.
- [ ] CR and commit the tutorial separately.

## Verification

Use existing dependencies only. Run `npm test -- tests/editableMapLibreStateFlow.test.js tests/mapDrawTabDraftSafety.test.js tests/mapDrawToolsPanelEditing.test.js tests/gisHistory.test.js tests/utils/drawMap --reporter=dot` with actual discovered test paths. Run the existing `node tests/browser/gis-editor.smoke.mjs` against the shared server on port 5173, then `./node_modules/.bin/vite build` (not `npm run build`, which can rewrite sitemap). Basemap style is intercepted in browser tests; production external basemap availability and large-dataset benchmarks remain outside scope.
