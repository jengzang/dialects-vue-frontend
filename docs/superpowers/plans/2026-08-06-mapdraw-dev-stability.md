# MapDraw Dev Stability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stabilize the current `dev` MapDraw implementation before adding larger GIS features, with priority on testability, selection rules, geometry editing reliability, and import/data-quality diagnostics.

**Architecture:** Keep the current MapLibre GL + `@mapbox/mapbox-gl-draw` drawing core. Preserve the new `dev` composable split: `GisPage.vue` owns wiring, `useGisMapCore` owns selection state, `useGisFeatures` owns feature mutations, `useGisLayers` owns layer/import mutations, and `EditableMapLibre.vue` owns Draw/map event synchronization.

**Tech Stack:** Vue 3, Vite, Vitest, MapLibre GL, `@mapbox/mapbox-gl-draw`, Turf helpers already present in the project.

---

## File Map

- `project/tests/mapDrawEditorContracts.test.js`
  - Update structural contract checks so they match the `dev` composable split instead of the old monolithic `MapDrawTab.vue` implementation.
- `project/tests/mapDrawTabDraftSafety.test.js`
  - Add the missing test environment setup for `__WEB_BASE__` and add page-level selection/mutation regression tests.
- `project/tests/editableMapLibreStateFlow.test.js`
  - Add Draw event regressions for direct-select geometry updates, vertex deletion semantics, and selection synchronization.
- `project/tests/utils/drawMap/export.test.js`
  - Add data-quality detail tests for duplicated IDs, invalid coordinates, skipped geometries, and CSV row reporting.
- `project/src/main/components/map/EditableMapLibre.vue`
  - Only change Draw event synchronization if tests expose a real gap.
- `project/src/composables/gis/useGisMapCore.js`
  - Tighten selection rules while preserving explicit hidden/locked recovery actions.
- `project/src/composables/gis/useGisFeatures.js`
  - Ensure destructive and property-changing batch actions only mutate editable selected features.
- `project/src/composables/gis/useGisLayers.js`
  - Upgrade import diagnostics without changing import behavior.
- `project/src/main/utils/drawMap/export.js`
  - Add structured diagnostics details returned through the existing `onDiagnostics` path.
- `project/src/i18n/locales/en/map.json`
- `project/src/i18n/locales/zh-CN/map.json`
- `project/src/i18n/locales/zh-Hant/map.json`
  - Add only the minimal diagnostic copy needed if user-visible messages are expanded.

## Task 1: Restore MapDraw Test Baseline

**Files:**
- Modify: `project/tests/mapDrawEditorContracts.test.js`
- Modify: `project/tests/mapDrawTabDraftSafety.test.js`

- [ ] **Step 1: Write failing/confirming tests**
  - Run the current MapDraw tests and preserve the observed failures:
    - `mapDrawEditorContracts.test.js` fails because it expects implementation details to live inside `GisPage.vue`.
    - `mapDrawTabDraftSafety.test.js` fails because `__WEB_BASE__` is not defined after `useGisLayers` imports `api`.

- [ ] **Step 2: Update contract sources**
  - Add source readers for:
    - `src/composables/gis/useGisMapCore.js`
    - `src/composables/gis/useGisFeatures.js`
    - `src/composables/gis/useGisLayers.js`
    - `src/composables/gis/useGisHistory.js`
    - `src/composables/gis/useGisVoronoi.js`
  - Move assertions to the file that now owns the behavior.

- [ ] **Step 3: Add test env define**
  - In `mapDrawTabDraftSafety.test.js`, set `globalThis.__WEB_BASE__ = ''` before importing `GisPage.vue`.

- [ ] **Step 4: Verify**
  - Run:
    - `npm test -- mapDrawEditorContracts.test.js mapDrawTabDraftSafety.test.js editableMapLibreStateFlow.test.js tests/utils/drawMap/history.test.js`
  - Expected: tests pass or fail only on newly added RED tests from later tasks.

- [ ] **Step 5: CR and commit**
  - Inspect `git diff`.
  - Confirm only test files changed.
  - Commit: `test: restore map draw dev test baseline`.

## Task 2: Make Hidden/Locked Selection Semantics Explicit

**Files:**
- Modify: `project/tests/mapDrawTabDraftSafety.test.js`
- Modify: `project/src/composables/gis/useGisFeatures.js`
- Modify: `project/src/composables/gis/useGisMapCore.js` only if selection helper reuse is needed.

- [ ] **Step 1: Write failing tests**
  - Add tests proving:
    - Hidden or locked checked features are not deleted by batch delete.
    - Hidden or locked checked features are not moved to another layer.
    - Hidden checked features can still be shown.
    - Locked checked features can still be unlocked.
    - Visible unlocked checked features still support delete, move, hide, lock, and property edits.

- [ ] **Step 2: Run RED**
  - Run:
    - `npm test -- mapDrawTabDraftSafety.test.js -t "hidden or locked checked"`
  - Expected: at least one new test fails because existing batch mutation uses all checked IDs.

- [ ] **Step 3: Implement editable selection filtering**
  - Add a small local helper in `useGisFeatures.js`:
    - `isFeatureEditableForMutation(feature)`
    - `getEditableSelectedFeatures()`
  - Use it for destructive, move, and arbitrary property mutations.
  - Keep visibility/lock recovery special-cased:
    - `visible: true` may apply to hidden selected features.
    - `locked: false` may apply to locked selected features.

- [ ] **Step 4: Verify**
  - Run:
    - `npm test -- mapDrawTabDraftSafety.test.js`
    - `npm test -- mapDrawEditorContracts.test.js editableMapLibreStateFlow.test.js tests/utils/drawMap/history.test.js`

- [ ] **Step 5: CR and commit**
  - Inspect `git diff`.
  - Confirm no unrelated route/i18n/sitemap/toponyms files are included.
  - Commit: `fix: guard map draw batch mutations`.

## Task 3: Cover Direct-Select Geometry Editing And Undo

**Files:**
- Modify: `project/tests/editableMapLibreStateFlow.test.js`
- Modify: `project/tests/mapDrawTabDraftSafety.test.js`
- Modify: `project/src/main/components/map/EditableMapLibre.vue` only if tests expose a real bug.
- Modify: `project/src/main/views/explore/GisPage.vue` only if keyboard handling needs mode-aware changes.

- [ ] **Step 1: Write failing tests**
  - Add `EditableMapLibre` tests proving:
    - `draw.update` emits `before-features-change` before `features-change`.
    - direct-select updates preserve the selected feature ID.
    - `deleteSelected()` delegates to Draw `trash()` and does not emit a second history commit.
  - Add page-level tests proving:
    - `Cmd/Ctrl+Z` restores a geometry change created by a Draw update event.
    - Delete/Backspace in `direct_select` keeps Draw semantics instead of bypassing the active layer state.

- [ ] **Step 2: Run RED**
  - Run:
    - `npm test -- editableMapLibreStateFlow.test.js mapDrawTabDraftSafety.test.js -t "direct_select|draw update|geometry change"`
  - Expected: new tests fail only where current behavior is missing.

- [ ] **Step 3: Implement minimal synchronization fix**
  - If needed, update `EditableMapLibre.vue` event handling so Draw update/delete events commit exactly once and keep selection stable.
  - If needed, update keyboard handling in `GisPage.vue` so Delete/Backspace in direct select lets Draw delete vertices while still entering history.

- [ ] **Step 4: Verify**
  - Run:
    - `npm test -- editableMapLibreStateFlow.test.js mapDrawTabDraftSafety.test.js tests/utils/drawMap/history.test.js`
    - `npm test -- mapDrawEditorContracts.test.js`

- [ ] **Step 5: CR and commit**
  - Inspect `git diff`.
  - Commit: `test: cover map draw direct select history`.

## Task 4: Add Structured Import/Data-Quality Details

**Files:**
- Modify: `project/tests/utils/drawMap/export.test.js`
- Modify: `project/src/main/utils/drawMap/export.js`
- Modify: `project/src/composables/gis/useGisLayers.js`
- Modify: locale files only if message text needs new labels.

- [ ] **Step 1: Write failing tests**
  - Add diagnostics tests proving:
    - Duplicate IDs include the duplicate ID list.
    - CSV invalid coordinates include row indexes.
    - Unsupported geometries include geometry type and feature index when available.
    - Empty geometries include feature index.

- [ ] **Step 2: Run RED**
  - Run:
    - `npm test -- tests/utils/drawMap/export.test.js -t "diagnostics"`
  - Expected: tests fail because details are not yet exposed.

- [ ] **Step 3: Implement structured diagnostics**
  - Extend `analyzeFeatureCollectionQuality()` with detail arrays:
    - `duplicateFeatureIds`
    - `emptyGeometryFeatures`
    - `unsupportedGeometryFeatures`
    - `invalidCoordinateFeatures`
  - Preserve existing count fields for compatibility.
  - Extend CSV import diagnostics with invalid row indexes.

- [ ] **Step 4: Surface concise details**
  - Keep current warning summary.
  - Add short detail suffixes only when diagnostic details exist, without replacing existing translations.

- [ ] **Step 5: Verify**
  - Run:
    - `npm test -- tests/utils/drawMap/export.test.js mapDrawTabDraftSafety.test.js`
    - JSON parse checks for the three `map.json` locale files if touched.

- [ ] **Step 6: CR and commit**
  - Inspect `git diff`.
  - Commit: `feat: add map draw import diagnostics details`.

## Task 5: Final Verification

**Files:**
- No planned file edits.

- [ ] **Step 1: Run focused suite**
  - `npm test -- mapDrawTabDraftSafety.test.js mapDrawEditorContracts.test.js editableMapLibreStateFlow.test.js tests/utils/drawMap/history.test.js tests/utils/drawMap/draftStorage.test.js tests/utils/drawMap/export.test.js`

- [ ] **Step 2: Run lint on touched source/tests**
  - `npx eslint src/main/views/explore/GisPage.vue src/composables/gis/useGisMapCore.js src/composables/gis/useGisFeatures.js src/composables/gis/useGisLayers.js src/main/components/map/EditableMapLibre.vue src/main/utils/drawMap/export.js tests/mapDrawTabDraftSafety.test.js tests/mapDrawEditorContracts.test.js tests/editableMapLibreStateFlow.test.js tests/utils/drawMap/export.test.js --quiet`

- [ ] **Step 3: Run diff checks**
  - `git diff --check`
  - `git status --short --branch`

- [ ] **Step 4: Report residual risks**
  - Call out any skipped full build or unrelated dirty files that remain outside the MapDraw changes.

## Self-Review

- Spec coverage: covers the agreed priority order: selection, geometry, data quality, import diagnostics. Test baseline is included first because the current `dev` suite is not actionable without it.
- Placeholder scan: no open-ended implementation placeholders remain.
- Type consistency: all named files and functions exist on current `dev`; implementation keeps the composable split and avoids structural refactors.
