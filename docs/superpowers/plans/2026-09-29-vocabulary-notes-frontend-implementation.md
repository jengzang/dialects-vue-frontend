# Vocabulary Notes Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the default-on vocabulary/source switch and the card-only, manually refreshed character-note search mode powered by `GET /api/notes`.

**Architecture:** The existing vocabulary state stays intact behind the default `source` route state. A separate notes state owns only its keyword, field selection, draft/applied geographic scope, result pagination and request tokens. `LocationAndRegionInput` resolves a draft selection for display, while `VocabularyViewPage` sends its frozen raw scope only after the user clicks Refresh.

**Tech Stack:** Vue 3 `<script setup>`, Vue Router, VueUse debounced watches, Vitest, existing `api()` client, project i18n, scoped SCSS and project mixins.

---

### Task 1: Add the isolated `/api/notes` client contract

**Files:**

- Create: `project/src/api/main/notes.js`
- Modify: `project/src/api/index.js`
- Create: `project/tests/notesApi.test.js`

- [ ] **Step 1: Write the failing API-client tests.**

  Test a path builder and request helper with repeated scope parameters:

  ```js
  const path = buildNotesSearchPath({
    q: '文白',
    search_fields: ['detail', 'pronunciation'],
    locations: ['1883廈門'],
    regions: ['閩'],
    region_mode: 'yindian',
    page: 2,
    page_size: 50,
  })

  expect(new URL(`http://localhost${path}`).pathname).toBe('/api/notes')
  expect(searchParams.getAll('locations')).toEqual(['1883廈門'])
  expect(searchParams.getAll('regions')).toEqual(['閩'])
  ```

  Cover omitted scope (no `locations`/`regions` parameters), `search_fields=[]` becoming `all`, page-size clamping to 200, and `searchNotes()` delegating to `api(path)`.

- [ ] **Step 2: Run the focused test and verify RED.**

  Run: `npm test -- notesApi.test.js`

  Expected: module `src/api/main/notes.js` is absent.

- [ ] **Step 3: Implement the minimal client.**

  Export exactly:

  ```js
  export function buildNotesSearchPath(params = {}) { /* URLSearchParams only */ }
  export async function searchNotes(params = {}) { return api(buildNotesSearchPath(params)) }
  ```

  Append each nonempty `locations` and `regions` element separately. Never convert a supplied empty resolved scope into an omitted scope; the caller controls whether it supplies scope parameters. Re-export both functions from `src/api/index.js`.

- [ ] **Step 4: Run focused tests and existing vocabulary API tests.**

  Run: `npm test -- notesApi.test.js vocabularyApi.test.js`

  Expected: both pass without changing any `/api/vocabulary/*` path.

- [ ] **Step 5: CR and commit.**

  Run `git diff --check` and inspect the three planned files. Confirm no existing vocabulary API URL changed, then commit:

  ```bash
  git add project/src/api/main/notes.js project/src/api/index.js project/tests/notesApi.test.js
  git commit -m "feat: add notes search API client"
  ```

### Task 2: Make the shared geographic input usable as an unlimited, manually applied notes scope

**Files:**

- Modify: `project/src/main/components/geo/LocationAndRegionInput.vue`
- Create: `project/tests/locationAndRegionInputNotesScope.test.js`

- [ ] **Step 1: Write failing source-contract tests for the opt-in behavior.**

  Assert the component declares `allowEmptyScope` and `disableLocationLimit` with false defaults, emits `locationsResolved`, uses an incrementing resolution token, and has an empty-scope branch that clears preview and emits `{ hasScope: false }` without invoking `getLocations`.

  Also assert the limit bypass guards all three existing mechanisms: `isExplicitLocationsLimitExceeded`, `checkLocationLimit`, and `maxSelectionForModal`.

- [ ] **Step 2: Run the focused test and verify RED.**

  Run: `npm test -- locationAndRegionInputNotesScope.test.js`

  Expected: assertions fail because the props/event/token do not exist.

- [ ] **Step 3: Implement the smallest backward-compatible component extension.**

  Add optional props and event:

  ```js
  allowEmptyScope: { type: Boolean, default: false },
  disableLocationLimit: { type: Boolean, default: false },
  // emits: 'locationsResolved'
  ```

  Each successful current resolution emits:

  ```js
  {
    locations: explicitLocations,
    regions: [...selectedValue],
    regionMode: regionUsing.value,
    resolvedLocations: uniqueLocations,
    locationsPartitions: data.locations_partitions || {},
    hasScope: explicitLocations.length > 0 || regions.length > 0,
  }
  ```

  Guard only notes-mode callers with `disableLocationLimit`; defaults must retain the existing explicit-input limit, resolved-location limit, selection rollback, and modal maximum for all old pages. When `allowEmptyScope` is true, reset stale preview state and emit a successful empty resolution instead of the existing “require input” disabled state.

- [ ] **Step 4: Run focused and existing geo-input checks.**

  Run: `npm test -- locationAndRegionInputNotesScope.test.js`

  Then run any existing location-input test files found by `rg --files project/tests | rg 'location|region'`.

- [ ] **Step 5: CR and commit.**

  Inspect `git diff --check` and the two-file diff, with particular attention to literal Chinese/emoji preservation and unchanged defaults. Commit only the extension and its test:

  ```bash
  git add project/src/main/components/geo/LocationAndRegionInput.vue project/tests/locationAndRegionInputNotesScope.test.js
  git commit -m "feat: support manual notes location scope"
  ```

### Task 3: Give top controls a source switch and notes-only geographic controls

**Files:**

- Modify: `project/src/main/views/explore/word/vocabulary/VocabularyTopControls.vue`
- Create: `project/tests/vocabularyNotesTopControls.test.js`

- [ ] **Step 1: Write failing top-control tests.**

  Assert a `source` prop defaults to `vocabulary`, the source switch emits `update:source`, notes mode renders `LocationAndRegionInput` with `allow-empty-scope` and `disable-location-limit`, and the legacy location detail, standard-word, province/city and filter-mode controls are absent from notes mode. Assert its settings modal receives only IPA/annotation options passed from the parent.

- [ ] **Step 2: Run the focused test and verify RED.**

  Run: `npm test -- vocabularyNotesTopControls.test.js`

  Expected: the source prop and notes-only template branches are absent.

- [ ] **Step 3: Implement source-aware controls without changing vocabulary-mode markup.**

  Add `source`, notes scope props and emits for `update:source`, `update:notesScope`, `locationsResolved`, and `refreshNotes`. Put the default-on `SwitchToggle` beside the existing search controls. In notes mode render the geographic input and a disabled-while-resolving Refresh button; retain all current controls in a `source === 'vocabulary'` branch.

- [ ] **Step 4: Run focused tests and component-shell regression tests.**

  Run: `npm test -- vocabularyNotesTopControls.test.js vocabularyPageShell.test.js`

  Expected: notes-only controls are isolated and current vocabulary controls remain present for the default source.

- [ ] **Step 5: CR and commit.**

  Verify scoped SCSS uses the project mixin import and contains no width breakpoint. Inspect `git diff`, then commit:

  ```bash
  git add project/src/main/views/explore/word/vocabulary/VocabularyTopControls.vue project/tests/vocabularyNotesTopControls.test.js
  git commit -m "feat: add notes source controls"
  ```

### Task 4: Implement route-normalized notes cards, applied scope and pagination

**Files:**

- Modify: `project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue`
- Modify: `project/src/main/views/explore/word/VocabularyPage.vue`
- Modify: `project/src/main/views/explore/word/vocabulary/vocabulary.scss`
- Create: `project/tests/vocabularyCharacterNotesMode.test.js`

- [ ] **Step 1: Write failing page-mode tests.**

  Assert `source=character-notes` forces `tab=card`, calls `router.replace` for table/map deep links, uses `searchNotes`, owns distinct `draftScope`/`appliedScope`, and does not call notes search for blank keywords. Assert notes search fields persist only under `vocabulary_notes_search_fields`; unknown saved values fall back to both valid fields without altering the vocabulary field preference. Test that refresh resets page 1; keyword changes with a dirty draft keep using `appliedScope`; a notes card displays location, character, IPA and note but no definition; and distinct source ids remain distinct Vue keys.

  Add a shell assertion that `VocabularyPage.vue` hides `page-tab-navigation` only when the current view route carries `source=character-notes`.

- [ ] **Step 2: Run the focused test and verify RED.**

  Run: `npm test -- vocabularyCharacterNotesMode.test.js`

  Expected: source normalization, notes request state, and notes-card branch are absent.

- [ ] **Step 3: Implement the minimum independent notes state.**

  Keep current vocabulary refs and loaders unchanged. Add notes-specific refs for fields, entries, total/page, request key, `draftScope`, `appliedScope`, and location-resolution pending/error state. Load `vocabulary_notes_search_fields` independently; accept only `pronunciation` and `detail`, and use both when the saved data is absent or invalid. Use a separate `loadNotes({ append })` that ignores stale responses and maps exactly:

  ```js
  {
    id: item.id,
    locationName: item.location_name,
    character: item.character,
    pronunciation: item.ipa,
    notes: item.notes,
  }
  ```

  The notes source must never load map/table APIs or vocabulary location/standard-word options. Normal source remains card/table/map with its old requests and local storage keys. Add only the local card-layout modifier needed for a non-clickable location plus character, IPA and notes; use tokens/shared classes and existing aspect-ratio media conventions.

- [ ] **Step 4: Run page-mode and vocabulary regression tests.**

  Run:

  ```bash
  npm test -- vocabularyCharacterNotesMode.test.js vocabularyPageShell.test.js vocabularyTableReadOnly.test.js
  ```

  Expected: notes routing, refresh and cards pass; existing table and map behavior stays covered.

- [ ] **Step 5: CR and commit.**

  Inspect the full diff to confirm only source-specific branches changed; check Chinese/emoji bytes with `file -I`; then commit:

  ```bash
  git add project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue project/src/main/views/explore/word/VocabularyPage.vue project/src/main/views/explore/word/vocabulary/vocabulary.scss project/tests/vocabularyCharacterNotesMode.test.js
  git commit -m "feat: add vocabulary notes card mode"
  ```

### Task 5: Add source, refresh and state copy in all supported locales

**Files:**

- Modify: `project/src/i18n/locales/zh-CN/words.json`
- Modify: `project/src/i18n/locales/zh-Hant/words.json`
- Modify: `project/src/i18n/locales/en/words.json`
- Modify: `project/tests/vocabularyCharacterNotesMode.test.js`

- [ ] **Step 1: Extend the failing mode test with required i18n keys.**

  Require keys for `词表`/`字表注释`, `刷新结果`, `地点选择已变更，刷新后生效`, `请输入搜索词`, `无匹配结果`, and notes search-field labels in every locale file.

- [ ] **Step 2: Run the focused test and verify RED.**

  Run: `npm test -- vocabularyCharacterNotesMode.test.js`

  Expected: missing locale-key assertions fail.

- [ ] **Step 3: Add only the required translations.**

  Preserve existing copy and literal emoji. Do not reformat the JSON files or change unrelated localization keys.

- [ ] **Step 4: Run the complete frontend verification set.**

  Run:

  ```bash
  npm test -- notesApi.test.js locationAndRegionInputNotesScope.test.js vocabularyNotesTopControls.test.js vocabularyCharacterNotesMode.test.js vocabularyApi.test.js vocabularyPageShell.test.js vocabularyTableReadOnly.test.js
  npm run build
  ```

  Expected: all focused tests and the production build pass.

- [ ] **Step 5: CR and commit.**

  Run `git diff --check`, inspect only the four planned files for encoding and unrelated-copy changes, then commit:

  ```bash
  git add project/src/i18n/locales/zh-CN/words.json project/src/i18n/locales/zh-Hant/words.json project/src/i18n/locales/en/words.json project/tests/vocabularyCharacterNotesMode.test.js
  git commit -m "feat: localize vocabulary notes mode"
  ```
