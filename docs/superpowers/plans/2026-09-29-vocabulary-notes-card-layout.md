# Vocabulary Notes Card Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make only the character-notes cards follow the approved location / IPA-and-character / full-width annotation hierarchy, while keeping every existing vocabulary card unchanged.

**Architecture:** `VocabularyViewPage.vue` retains the existing vocabulary-card branch and adds all new markup, popup state and overflow state inside the existing `isCharacterNotesMode` branch. The notes card uses `LocationDetailPopup.vue` with its own request state and the existing `getLocationDetail(locationName)` client; it does not call or alter the vocabulary page's current `openLocationDetails()` modal flow. The annotation is one independent grid row. A hidden, one-line measurement span plus a `ResizeObserver` on the notes grid determines whether the visible annotation needs a one-line preview and expand button.

**Tech Stack:** Vue 3 `<script setup>`, Vitest, `ResizeObserver`, `LocationDetailPopup.vue`, existing `getLocationDetail()` client, scoped SCSS and project mixins.

---

### Task 1: Rebuild only the character-notes card layout and location popup flow

**Files:**

- Modify: `project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue`
- Modify: `project/src/main/views/explore/word/vocabulary/vocabulary.scss`
- Modify: `project/tests/vocabularyCharacterNotesMode.test.js`

- [ ] **Step 1: Write the failing notes-card source-contract test.**

  Extend `project/tests/vocabularyCharacterNotesMode.test.js` with a test that reads both the page SFC and `vocabulary.scss`. It must require the notes-only structural and interaction markers below, while retaining the existing vocabulary-card markers:

  ```js
  expect(page).toContain('class="glass-card notes-entry-card"')
  expect(page).toContain('class="card-location pill-btn card-location-pill"')
  expect(page).toContain('@click="openNotesLocationDetail(entry.locationName)"')
  expect(page).toContain('class="card-pronunciation-pair notes-card-pronunciation-pair"')
  expect(page).toContain('class="notes-card-note"')
  expect(page).toContain('class="notes-card-note-measure"')
  expect(page).toContain('new ResizeObserver')
  expect(page).toContain('LocationDetailPopup')
  expect(page).toContain('getLocationDetail')
  expect(page).toContain('function openNotesLocationDetail')
  expect(page).toContain('class="card-location-definition-pair"')
  expect(page).toContain('shouldShowVocabularyCardNoteToggle')
  expect(styles).toContain('.notes-card-note')
  expect(styles).toContain('.notes-entry-card')
  ```

  Keep the existing assertions for `locationName`, `character`, `pronunciation`, `notes` and the source row `id` key. The test is intentionally scoped to notes-specific classes/functions and must not require edits to the vocabulary-card template.

- [ ] **Step 2: Run the focused test and verify RED.**

  Run:

  ```bash
  cd project
  npm test -- vocabularyCharacterNotesMode.test.js
  ```

  Expected: the new notes-card layout, measurement, and popup assertions fail because the card is still a four-line flex column without a `LocationDetailPopup` state.

- [ ] **Step 3: Implement the independent notes location popup.**

  In `VocabularyViewPage.vue`, import `LocationDetailPopup` from `@/main/components/geo/popups/LocationDetailPopup.vue`, import `getLocationDetail` from the existing API barrel, and add notes-only state:

  ```js
  const notesLocationPopup = ref({
    visible: false,
    locationName: '',
    data: null,
    loading: false,
  })
  let notesLocationPopupRequestId = 0
  ```

  Add `openNotesLocationDetail(locationName)` and `closeNotesLocationPopup()`. Opening trims and rejects an empty location; then increments the request id, displays the popup/loading state, clears stale data, and awaits `getLocationDetail(locationName)`. Commit a response or an error-state reset only when its request id is still current. Closing increments the request id, hides the popup, and clears loading so a late request cannot reopen or overwrite it.

  Render one `LocationDetailPopup` next to the existing page modals:

  ```vue
  <LocationDetailPopup
    :visible="notesLocationPopup.visible"
    :location-name="notesLocationPopup.locationName"
    :data="notesLocationPopup.data"
    :loading="notesLocationPopup.loading"
    @close="closeNotesLocationPopup"
  />
  ```

  Do not call `openLocationDetails()`, change `isLocationDetailsModalOpen`, or alter the vocabulary-card location button.

- [ ] **Step 4: Implement notes-only overflow measurement and markup.**

  Add `nextTick` and `onBeforeUnmount` imports plus these notes-only values in `VocabularyViewPage.vue`:

  ```js
  const notesCardGridEl = ref(null)
  const notesCardNoteMeasureEls = new Map()
  const notesCardNoteOverflowIds = ref(new Set())
  const expandedNotesCardNoteIds = ref(new Set())
  let notesCardResizeObserver = null
  ```

  Register the hidden measure span by row id, compare `scrollWidth > clientWidth + 1` for each span after `nextTick`, and replace `notesCardNoteOverflowIds` with the current results. Observe `notesCardGridEl` with one `ResizeObserver`; schedule the same measurement after every grid width change. Disconnect it in `onBeforeUnmount`. Keep the measurement span rendered even when its note is expanded, so resize detection remains correct. Drop stale ids from both note sets when `notesEntries` changes.

  Replace only the inner `notes-entry-card` markup with this hierarchy:

  ```vue
  <article v-for="entry in notesEntries" :key="entry.id" class="glass-card notes-entry-card">
    <button
      class="card-location pill-btn card-location-pill"
      type="button"
      :title="entry.locationName"
      @click="openNotesLocationDetail(entry.locationName)"
    >
      <span class="card-location-pill-text">{{ entry.locationName }}</span>
    </button>
    <div class="card-pronunciation-pair notes-card-pronunciation-pair">
      <span class="pronunciation-text">{{ entry.pronunciation }}</span>
      <span class="word-text">{{ entry.character }}</span>
    </div>
    <div v-if="entry.notes" class="notes-card-note" :class="{ 'is-expanded': isNotesCardNoteExpanded(entry.id) }">
      <div class="notes-card-note-content">
        <span
          :ref="(el) => setNotesCardNoteMeasureEl(entry.id, el)"
          class="notes-card-note-measure"
          aria-hidden="true"
        >{{ entry.notes }}</span>
        <span class="notes-card-note-text">{{ entry.notes }}</span>
      </div>
      <button
        v-if="shouldShowNotesCardNoteToggle(entry.id)"
        class="notes-card-note-toggle"
        type="button"
        :aria-expanded="isNotesCardNoteExpanded(entry.id)"
        @click="toggleNotesCardNote(entry.id)"
      >
        <svg
          class="notes-card-note-toggle-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="m9 6 6 6-6 6"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2.5"
          />
        </svg>
      </button>
      <span v-else class="notes-card-note-toggle-spacer" aria-hidden="true"></span>
    </div>
  </article>
  ```

  `isNotesCardNoteExpanded`, `shouldShowNotesCardNoteToggle`, and `toggleNotesCardNote` must use only `expandedNotesCardNoteIds` and `notesCardNoteOverflowIds`. They must not share `expandedVocabularyCardNoteIds` or change the existing three-character vocabulary-note preview behavior.

- [ ] **Step 5: Add notes-only SCSS.**

  In `vocabulary.scss`, replace the present vertical `.notes-entry-card` rule with a two-column card grid whose annotation spans both columns:

  ```scss
  .notes-entry-card {
    display: grid;
    grid-template-columns: auto minmax(0, 120px);
    gap: 8px 16px;
    align-items: center;
    justify-content: center;
    padding: 15px 10px;
    text-align: center;
  }

  .notes-card-pronunciation-pair {
    grid-column: 2;
  }

  .notes-card-note {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: minmax(0, 1fr) 14px;
    width: 100%;
    min-width: 0;
    gap: 2px;
  }
  ```

  Define the measure span as visually hidden, absolutely positioned and permanently single-line within `.notes-card-note-content`; use `white-space: nowrap`, `overflow: hidden`, and `text-overflow: ellipsis` on the visible text by default. The `is-expanded` modifier changes only `.notes-card-note-text` to normal wrapping and removes the clipping. Keep a fixed 14px spacer when no toggle exists so the hidden measurement width matches the visible annotation width. Scope all new selectors under `.notes-entry-card` or use `notes-card-*` names. Do not alter `.vocabulary-entry-card`, `.card-note`, `.card-note-text`, or their portrait rules.

- [ ] **Step 6: Verify GREEN and run regressions.**

  Run:

  ```bash
  cd project
  npm test -- vocabularyCharacterNotesMode.test.js vocabularyNotesTopControls.test.js vocabularySourceRoute.test.js vocabularyPageShell.test.js notesApi.test.js
  npm run build
  ```

  Expected: notes layout/popup contract passes; source routing, top controls, normal vocabulary card/page shell behavior and notes client checks remain green; production build exits 0. Existing large-chunk warnings are acceptable only if there are no new errors.

- [ ] **Step 7: CR and commit the isolated card step.**

  From the repository root, run:

  ```bash
  git diff --check
  git diff -- project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue project/src/main/views/explore/word/vocabulary/vocabulary.scss project/tests/vocabularyCharacterNotesMode.test.js
  file -I project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue project/src/main/views/explore/word/vocabulary/vocabulary.scss project/tests/vocabularyCharacterNotesMode.test.js
  ```

  Review that no line in the existing vocabulary-card branch changed, the notes popup state is independent, only actual one-line overflow exposes the toggle, and Chinese/emoji content remains UTF-8. Stage only the three listed files and commit:

  ```bash
  git add project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue project/src/main/views/explore/word/vocabulary/vocabulary.scss project/tests/vocabularyCharacterNotesMode.test.js
  git commit -m "feat: align notes card layout with vocabulary"
  ```
