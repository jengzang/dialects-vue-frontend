# Vocabulary Character-Notes Search Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Add a default-on source switch to the vocabulary card page. It switches between the unchanged vocabulary experience and character-note cards backed by dialects_user.db, without changing map, table, or contribution behavior.

**Architecture:** Route state owns the source: the absence of `source` means vocabulary; `source=character-notes` means character-note cards. `VocabularyPage` derives that state to hide its page-tab navigation. `VocabularyTopControls` is presentational and retains only the keyword input and source switch in character-note mode. `VocabularyViewPage` gives both sources isolated request state, and every vocabulary-only request predicate explicitly excludes character-note mode, so a late card/map/table response cannot affect the active source.

**Tech Stack:** Vue 3 script setup, Vue Router, SwitchToggle.vue, Vue I18n, existing api() client, Vitest, scoped SCSS, project mixins/tokens.

---

## Confirmed Product Rules

- The switch is on by default. On is 词表; off is 字表注释.
- Vocabulary source preserves the current card, map, table, filters, location details, and contribution navigation exactly.
- Character-note source is card-only and exposes one card for every returned source row. It never deduplicates different location or IPA rows.
- The character-note mapping is location_name to the non-clickable left-top location label, character to the word, ipa to the pronunciation, and notes to the existing expandable note area. There is no definition row.
- Character-note source hides the search-field gear/modal, location-details action, standard-word selector, location selector, province/city selector, and the parent page-tab-navigation.
- Only dialects_user.db is searched. The frontend never selects or merges dialects_admin.db.
- Character-note deep links use source=character-notes. No source query means the current vocabulary source.

## Required Backend Contract

This plan makes no backend changes. The frontend implementation needs this contract before the API step is integrated:

~~~http
GET /api/vocabulary/search/character-notes?q=<trimmed-query>&page=<1-based>&page_size=<1..200>
~~~

~~~json
{
  "items": [
    {
      "id": 12345,
      "location_name": "广州",
      "character": "字",
      "ipa": "tsiː33",
      "notes": "文读"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 50
}
~~~

The frontend relies on these rules:

- id is an opaque stable row identifier for Vue keys.
- The endpoint searches notes only in dialects_user.db and excludes blank, _, and - notes.
- total is the raw source-row count, not a deduplicated count.
- The frontend sends only q, page, and page_size; it never sends vocabulary search_fields, locations, province, city, or standard_words.
- A blank or whitespace-only q makes no request. The UI shows a dedicated enter-query state, preventing a request for roughly 1.49 million annotated rows.
- The frontend accepts every non-empty trimmed query, including one and two CJK characters. It must not add a client-side minimum-length rule; the backend's character-token FTS index is responsible for those searches.
- The frontend passes q unchanged after trim. Backend whitespace-normalization semantics remain a separately confirmed backend choice; the displayed annotation is always the literal response value.

## Backend Decision Still Required

The frontend deliberately does no character splitting or whitespace rewriting. Before implementing the backend endpoint, confirm whether a query such as `文白` should match an annotation stored as `文 白`. The proposed frontend works with either policy, but the API contract and its backend test must make that choice explicit; this plan currently assumes only trim-at-the-ends on the request value.

## Boundary Conditions

- source=character-notes always wins over tab. A direct source=character-notes with tab=map/table is normalized with router.replace to tab=card.
- `resolveViewModeFromRoute` returns card immediately when source=character-notes, before the router normalization completes. This prevents a map/table flash for a malformed deep link.
- Switching off forces tab=card, closes the vocabulary search-field dropdown/modal and location/map-detail modals, invalidates any in-flight character-note request, and clears the character-note card region before the new request resolves.
- Switching on removes source and retains tab=card. It does not erase stored vocabulary search fields or filters.
- Vocabulary and character-note requests have separate entries, total, page, loading, error, active-request-key, and pending-request-map state.
- A source response is ignored unless both its own request key is active and its source is still displayed.
- Query changes reset character-note pagination to page 1. Character-note "load more" stays visible but disabled while its request is pending, and is visible only while loaded source rows are below that source's total.
- In character-note mode, missing location_name, character, ipa, or notes must safely render as empty text. Location is not clickable because vocabulary_locations is a different dataset.
- `id` is required by the backend contract. If a malformed response omits it, the UI uses a page-and-index fallback key solely to keep raw duplicate rows renderable; it never deduplicates data.
- Long-note expansion, current glass-card primitives, Chinese/emoji text, and the aspect-ratio-only responsive convention remain unchanged.

## File Map

- project/src/api/main/vocabulary.js — endpoint constant, JSDoc, path builder, client function.
- project/src/api/index.js — re-export public API helpers.
- project/src/main/router/menuRoutes.js — allow source on the vocabulary view.
- project/src/main/views/menu/VocabularyPage.vue — hide parent navigation from route state.
- project/src/main/views/explore/word/vocabulary/VocabularyTopControls.vue — switch and conditional vocabulary-only controls.
- project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue — source state, cards, request isolation, pagination.
- project/src/main/views/explore/word/vocabulary/vocabulary.scss — location-only card layout modifier only.
- project/src/i18n/locales/zh-CN/words.json, project/src/i18n/locales/zh-Hant/words.json, project/src/i18n/locales/en/words.json — source labels and blank-query copy.
- project/tests/vocabularyApi.test.js — URL/client helper contract.
- project/tests/vocabularyCharacterNotesMode.test.js — route, UI wiring, raw-row mapping, and catalog source contracts.

---

### Task 1: Add the Character-Notes API Client

**Files:**
- Modify: project/src/api/main/vocabulary.js
- Modify: project/src/api/index.js
- Modify: project/tests/vocabularyApi.test.js

- [ ] **Step 1: Write the failing API test**

Import buildVocabularyCharacterNotesPath and getVocabularyCharacterNotes in project/tests/vocabularyApi.test.js, then add:

~~~js
it('serializes one- and two-character character-note queries without vocabulary filters', async () => {
  const path = buildVocabularyCharacterNotesPath({
    q: '白',
    page: 2,
    page_size: 50,
    locations: ['广州'],
    search_fields: ['detail'],
  })
  const params = paramsFromPath(path)

  expect(path).toContain('/api/vocabulary/search/character-notes?')
  expect(params.get('q')).toBe('白')
  expect(params.get('page')).toBe('2')
  expect(params.get('page_size')).toBe('50')
  expect(params.has('locations')).toBe(false)
  expect(params.has('search_fields')).toBe(false)

  apiMock.mockResolvedValueOnce({ items: [], total: 0, page: 1, page_size: 50 })
  await getVocabularyCharacterNotes({ q: '文白' })
  expect(apiMock).toHaveBeenLastCalledWith(
    '/api/vocabulary/search/character-notes?q=%E6%96%87%E7%99%BD',
  )
})
~~~

- [ ] **Step 2: Confirm it fails**

Run:

~~~bash
cd project
npm test -- vocabularyApi.test.js
~~~

Expected: FAIL because the builder and client helper do not exist.

- [ ] **Step 3: Implement only the API surface**

Add VOCABULARY_CHARACTER_NOTES_ENDPOINT next to the current vocabulary search endpoints. Define JSDoc types CharacterNotesQuery, CharacterNoteItem, and CharacterNotesResponse using the required backend contract. Add:

~~~js
export function buildVocabularyCharacterNotesPath(params = {}) {
  return VOCABULARY_CHARACTER_NOTES_ENDPOINT + appendQueryParams({
    q: params.q,
    page: params.page,
    page_size: params.page_size,
  })
}

export async function getVocabularyCharacterNotes(params = {}) {
  try {
    return await api(buildVocabularyCharacterNotesPath(params))
  } catch (error) {
    showError(error.message || '獲取字表註釋失敗')
    throw error
  }
}
~~~

Re-export both names from the vocabulary section of project/src/api/index.js. Do not alter existing API path builders.

- [ ] **Step 4: Verify and review**

Run:

~~~bash
cd project
npm test -- vocabularyApi.test.js
git diff --check
git diff -- src/api/main/vocabulary.js src/api/index.js tests/vocabularyApi.test.js
~~~

Expected: test passes and the diff contains only the new helper/export/test.

- [ ] **Step 5: Commit this reviewable API step**

~~~bash
git add project/src/api/main/vocabulary.js project/src/api/index.js project/tests/vocabularyApi.test.js
git commit -m "feat: add character notes vocabulary API client"
~~~

### Task 2: Make Source State Routable and Hide Parent Navigation

**Files:**
- Modify: project/src/main/router/menuRoutes.js
- Modify: project/src/main/views/menu/VocabularyPage.vue
- Create: project/tests/vocabularyCharacterNotesMode.test.js

- [ ] **Step 1: Write failing source-contract tests**

Use the readFileSync test pattern from project/tests/vocabularyPageShell.test.js. Read the current files and assert:

~~~js
expect(menuRoutes).toContain("meta: { queryAllowlist: ['tab', 'source'] }")
expect(vocabularyShell).toContain("route.query.source === 'character-notes'")
expect(vocabularyShell).toContain('v-if="!isCharacterNotesMode"')
expect(vocabularyShell).toContain('class="page-tab-navigation"')
~~~

- [ ] **Step 2: Confirm failure**

~~~bash
cd project
npm test -- vocabularyCharacterNotesMode.test.js
~~~

Expected: FAIL because source is not allowlisted and the parent shell has no source state.

- [ ] **Step 3: Implement the strict route state**

Change the vocabulary view child route to:

~~~js
meta: { queryAllowlist: ['tab', 'source'] }
~~~

In VocabularyPage.vue define:

~~~js
const isCharacterNotesMode = computed(() => route.query.source === 'character-notes')
~~~

Wrap only the existing page-tab-navigation element with v-if="!isCharacterNotesMode". Do not move the page title, router view, permission loading, tab definitions, or existing viewModeQuery behavior. Unknown source values must keep the normal vocabulary shell.

- [ ] **Step 4: Verify, review, and commit**

~~~bash
cd project
npm test -- vocabularyCharacterNotesMode.test.js
git diff --check
git diff -- src/main/router/menuRoutes.js src/main/views/menu/VocabularyPage.vue tests/vocabularyCharacterNotesMode.test.js
git add project/src/main/router/menuRoutes.js project/src/main/views/menu/VocabularyPage.vue project/tests/vocabularyCharacterNotesMode.test.js
git commit -m "feat: hide vocabulary navigation for character notes"
~~~

Before committing, inspect git status and stage only the listed files.

### Task 3: Add the Source Switch and Scope Top Controls

**Files:**
- Modify: project/src/main/views/explore/word/vocabulary/VocabularyTopControls.vue
- Modify: project/tests/vocabularyCharacterNotesMode.test.js

- [ ] **Step 1: Add failing top-control contracts**

Add these assertions:

~~~js
expect(topControls).toContain('showVocabularySource: { type: Boolean, default: true }')
expect(topControls).toContain("'update:showVocabularySource'")
expect(topControls).toContain('v-model="showVocabularySourceModel"')
expect(topControls).toContain('v-if="showVocabularySource"')
expect(topControls).toContain(':placeholder="searchPlaceholder"')
expect(topControls).toContain("active-text=\"t('words.wordList.sourceMode.vocabulary')\"")
expect(topControls).toContain("inactive-text=\"t('words.wordList.sourceMode.characterNotes')\"")
~~~

- [ ] **Step 2: Confirm failure**

~~~bash
cd project
npm test -- vocabularyCharacterNotesMode.test.js
~~~

Expected: FAIL because the source-switch prop, emit, and conditional rendering do not exist.

- [ ] **Step 3: Implement the presentational control**

Add this prop and computed bridge:

~~~js
showVocabularySource: { type: Boolean, default: true },
~~~

~~~js
const showVocabularySourceModel = computed({
  get: () => props.showVocabularySource,
  set: (value) => emit('update:showVocabularySource', value),
})
~~~

Add a source-aware input placeholder so the new catalog copy is used:

~~~js
const searchPlaceholder = computed(() => props.showVocabularySource
  ? t('words.wordList.search.placeholder')
  : t('words.wordList.characterNotes.placeholder'))
~~~

Add update:showVocabularySource to defineEmits. Put this existing shared component next to the textarea:

~~~vue
<SwitchToggle
  v-model="showVocabularySourceModel"
  :show-label="true"
  :active-text="t('words.wordList.sourceMode.vocabulary')"
  :inactive-text="t('words.wordList.sourceMode.characterNotes')"
  :aria-label="t('words.wordList.sourceMode.ariaLabel')"
  label-position="inside"
  auto-width
/>
~~~

Replace the textarea's existing placeholder binding with `:placeholder="searchPlaceholder"`. Use `v-if="showVocabularySource"` around the existing gear/location-details/modal group and the entire filter-strip. Keep the textarea and new switch outside those branches. Preserve composition handlers and the current delayed query emit. Add a watcher which closes `searchFieldModalOpen`, `locationDropdownOpen`, and `standardWordDropdownOpen` when the source becomes character-notes; it must not clear any vocabulary filter value, because those values resume when the switch is turned back on.

If placement needs CSS, add only local layout glue such as a source-switch class. Retain scoped SCSS, the existing mixins import, shared SwitchToggle visuals, and the existing max-aspect-ratio portrait block; do not add a width breakpoint.

- [ ] **Step 4: Verify, inspect text safety, and commit**

~~~bash
cd project
npm test -- vocabularyCharacterNotesMode.test.js
git diff --check
git diff -- src/main/views/explore/word/vocabulary/VocabularyTopControls.vue tests/vocabularyCharacterNotesMode.test.js
git add project/src/main/views/explore/word/vocabulary/VocabularyTopControls.vue project/tests/vocabularyCharacterNotesMode.test.js
git commit -m "feat: add vocabulary source switch"
~~~

Confirm existing Chinese/emoji literal characters are byte-for-byte unaffected outside the intentional new i18n references.

### Task 4: Implement Isolated Character-Note Cards and Pagination

**Files:**
- Modify: project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue
- Modify: project/src/main/views/explore/word/vocabulary/vocabulary.scss
- Modify: project/tests/vocabularyCharacterNotesMode.test.js

- [ ] **Step 1: Add failing page contracts**

Add source-level assertions:

~~~js
expect(viewPage).toContain('getVocabularyCharacterNotes')
expect(viewPage).toContain("route.query.source === 'character-notes'")
expect(viewPage).toContain("nextQuery.source = 'character-notes'")
expect(viewPage).toContain("if (route.query.source === 'character-notes') return 'card'")
expect(viewPage).toContain('function normalizeCharacterNoteEntry(item, index)')
expect(viewPage).toContain("locationName: item.location_name ?? ''")
expect(viewPage).toContain("headword: item.character ?? ''")
expect(viewPage).toContain("pronunciation: item.ipa ?? ''")
expect(viewPage).toContain("detail: item.notes ?? ''")
expect(viewPage).toContain('activeCharacterNotesRequestKey')
expect(viewPage).toContain('pendingCharacterNoteRequests')
expect(viewPage).toContain('const activeCardEntries = computed')
expect(viewPage).toContain('function loadMoreActiveCards()')
expect(viewPage).toContain("t('words.wordList.characterNotes.enterQuery')")
expect(vocabularyScss).toContain('.card-location-definition-pair--location-only')
~~~

- [ ] **Step 2: Confirm failure**

~~~bash
cd project
npm test -- vocabularyCharacterNotesMode.test.js
~~~

Expected: FAIL because no character-note data path exists.

- [ ] **Step 3: Add route-backed source state**

Import getVocabularyCharacterNotes. In VocabularyViewPage.vue add:

~~~js
const isCharacterNotesMode = computed(() => route.query.source === 'character-notes')
const showVocabularySource = computed({
  get: () => !isCharacterNotesMode.value,
  set: (showVocabulary) => {
    const nextQuery = { ...route.query, tab: 'card' }
    if (showVocabulary) {
      delete nextQuery.source
    } else {
      nextQuery.source = 'character-notes'
    }
    router.replace({ query: nextQuery })
  },
})
~~~

Pass v-model:show-vocabulary-source="showVocabularySource" to VocabularyTopControls. Watch character-note route state. A direct character-note URL with a non-card tab must be replaced with card. On entry to character-note mode, close both location-detail and map-detail modals using their existing cleanup functions.

Make the existing route resolver source-aware before it reads `tab` or session storage:

~~~js
function resolveViewModeFromRoute() {
  if (route.query.source === 'character-notes') return 'card'
  const tab = route.query.tab
  // retain the current map/table/session-storage logic below this line
}
~~~

When the switch setter writes the route, mutate the copied query exactly as follows so the test and implementation agree:

~~~js
const nextQuery = { ...route.query, tab: 'card' }
if (showVocabulary) {
  delete nextQuery.source
} else {
  nextQuery.source = 'character-notes'
}
router.replace({ query: nextQuery })
~~~

- [ ] **Step 4: Add completely separate request state**

Leave existing vocabulary entries, map points, request keys, and pagination untouched. Add:

~~~js
const characterNoteEntries = ref([])
const characterNotesTotal = ref(0)
const characterNotesPage = ref(1)
const characterNotesPageSize = ref(50)
const isLoadingCharacterNotes = ref(false)
const characterNotesError = ref('')
const activeCharacterNotesRequestKey = ref('')
const pendingCharacterNoteRequests = new Map()
~~~

Map response rows without changing their literal values:

~~~js
function normalizeCharacterNoteEntry(item, index) {
  const responseId = item?.id ?? `${characterNotesPage.value}:${index}`
  return {
    id: `character-note:${responseId}`,
    definition: '',
    headword: item.character ?? '',
    pronunciation: item.ipa ?? '',
    detail: item.notes ?? '',
    information: '',
    locationName: item.location_name ?? '',
    location: item.location_name ?? '',
  }
}
~~~

Create requestCharacterNotes and loadCharacterNotes with source-specific request keys based only on trimmed q, page, and pageSize. Use this shape; do not reuse the vocabulary query builder because it could later leak filters into the note endpoint:

~~~js
function buildCharacterNotesParams(pageNumber) {
  return {
    q: query.value.trim(),
    page: pageNumber,
    page_size: characterNotesPageSize.value,
  }
}

function buildCharacterNotesRequestKey(params) {
  return `character-notes:${JSON.stringify([params.q, params.page, params.page_size])}`
}

async function requestCharacterNotes(params) {
  const requestKey = buildCharacterNotesRequestKey(params)
  if (pendingCharacterNoteRequests.has(requestKey)) {
    return pendingCharacterNoteRequests.get(requestKey)
  }
  const requestPromise = getVocabularyCharacterNotes(params)
    .finally(() => pendingCharacterNoteRequests.delete(requestKey))
  pendingCharacterNoteRequests.set(requestKey, requestPromise)
  return requestPromise
}
~~~

`loadCharacterNotes({ append = false } = {})` must:

1. Make no API request for blank q; clear only character-note cards/total/loading/error and select the enter-query state.
2. Reset page to 1 and clear only character-note cards for a new non-append query.
3. Call getVocabularyCharacterNotes with q, page, and page_size only.
4. Clear `activeCharacterNotesRequestKey` before returning for a blank query and before leaving the source, so an old response cannot repopulate the cleared panel.
5. Ignore a result/error unless its request key is still active and isCharacterNotesMode is true.
6. Normalize raw rows, append only for load-more, and update only character-notes total/page/pageSize/error/loading. Use `Math.max(Number(response.total) || 0, characterNoteEntries.value.length)` as the displayed total so a malformed smaller total cannot offer a duplicate page.

Create the following source-aware computed values and leave the existing `entries`, `total`, `page`, and `loadError` vocabulary refs intact:

~~~js
const isCharacterNotesQueryEmpty = computed(() => !query.value.trim())
const activeCardEntries = computed(() => isCharacterNotesMode.value ? characterNoteEntries.value : entries.value)
const activeCardError = computed(() => isCharacterNotesMode.value ? characterNotesError.value : loadError.value)
const isActiveCardInitialLoading = computed(() => isCharacterNotesMode.value
  ? isLoadingCharacterNotes.value && !characterNoteEntries.value.length && !characterNotesError.value
  : isInitialLoading.value)
const canLoadMoreActiveCards = computed(() => isCharacterNotesMode.value
  ? characterNoteEntries.value.length < characterNotesTotal.value
  : canLoadMore.value)
const isLoadingMoreActiveCards = computed(() => isCharacterNotesMode.value
  ? isLoadingCharacterNotes.value && characterNoteEntries.value.length > 0
  : isLoadingMore.value)

function loadMoreActiveCards() {
  return isCharacterNotesMode.value
    ? loadCharacterNotes({ append: true })
    : loadVocabularyItems({ append: true })
}
~~~

All `shouldUseVocabulary*Api` predicates must start with `!isCharacterNotesMode.value && ...`; map/table templates and their state calculations must continue to use vocabulary state only.

- [ ] **Step 5: Render the card data without a second visual system**

Replace only the card-state and card-loop bindings as follows: use `isActiveCardInitialLoading`, `activeCardError`, and `activeCardEntries`; put the `isCharacterNotesMode && isCharacterNotesQueryEmpty` enter-query branch before the generic no-data branch; bind the load-more button to `canLoadMoreActiveCards`, `isLoadingMoreActiveCards`, and `loadMoreActiveCards`.

In the existing card loop, preserve the vocabulary location button and add this mutually exclusive static label for character-note rows. The `pill-btn` class gives the unchanged shared pill treatment but a `span` cannot invoke `openLocationDetails`:

~~~vue
<div
  class="card-location-definition-pair"
  :class="{ 'card-location-definition-pair--location-only': !entry.definition }"
>
  <template v-if="isCharacterNotesMode">
    <span class="card-location pill-btn card-location-pill" :title="entry.locationName">
      <span class="card-location-pill-text">{{ entry.locationName }}</span>
    </span>
  </template>
  <button
    v-else
    class="card-location pill-btn card-location-pill"
    type="button"
    :title="entry.locationName"
    @click="openLocationDetails(entry.locationName)"
  >
    <span class="card-location-pill-text">{{ entry.locationName }}</span>
  </button>
  <span v-if="entry.definition" class="card-definition">{{ entry.definition }}</span>
</div>
~~~

Render definition only when entry.definition is non-empty, and apply a modifier class when it is absent. Preserve current IPA/word markup, note-preview length, note-toggle SVG, empty/error/loading cards, and glass-card primitives.

Add only this local layout rule:

~~~scss
.card-location-definition-pair--location-only {
  grid-template-rows: auto;
}
~~~

Do not hardcode colors, create a separate card component, alter shared glass-card styling, or alter map/table templates.

- [ ] **Step 6: Wire lifecycle and watchers exactly once per source**

Add `hasLoadedVocabularyLocationOptions` so a valid empty location list is also cached, but a failed request is retried when the user returns to vocabulary mode. On mount, call `loadVocabularyLocationOptions` only when the source is vocabulary. When returning to vocabulary source, await that helper only if it has not loaded, then execute the existing vocabulary branch.

Keep the following watcher ownership so a source change and a forced card tab do not invoke duplicate request paths:

1. `watch(viewMode, ...)` loads only when `!isCharacterNotesMode.value`.
2. `watch(isCharacterNotesMode, ...)` closes the two detail modals, clears/invalidate character-note state, normalizes `tab` to card, and invokes `loadCharacterNotes()` when entering. When leaving, it invalidates the character-note request key, lazily loads vocabulary locations if required, then calls `loadActiveViewMode()`.
3. The existing `watch(() => route.query.tab, ...)` resolves to card while the character-note source is active.
4. The debounced query/filter watcher calls `loadCharacterNotes()` only in character-note mode; otherwise it retains the existing vocabulary/map branches. Do not involve character-note source in standard-word or map watchers.

Implement that ownership with the existing modal-clear helpers and the following functions. `resetCharacterNoteResults` intentionally does not touch vocabulary state:

~~~js
const hasLoadedVocabularyLocationOptions = ref(false)

async function ensureVocabularyLocationOptions() {
  if (hasLoadedVocabularyLocationOptions.value) return
  hasLoadedVocabularyLocationOptions.value = await loadVocabularyLocationOptions()
}

function resetCharacterNoteResults() {
  activeCharacterNotesRequestKey.value = ''
  characterNoteEntries.value = []
  characterNotesTotal.value = 0
  characterNotesPage.value = 1
  characterNotesError.value = ''
  isLoadingCharacterNotes.value = false
}

function normalizeCharacterNotesRoute() {
  if (!isCharacterNotesMode.value || route.query.tab === 'card') return
  router.replace({ query: { ...route.query, tab: 'card' } })
}

onMounted(async () => {
  normalizeCharacterNotesRoute()
  if (!isCharacterNotesMode.value) {
    await ensureVocabularyLocationOptions()
  }
  loadActiveViewMode()
})

watch(isCharacterNotesMode, async (isCharacterNotes) => {
  if (isCharacterNotes) {
    viewMode.value = 'card'
    normalizeCharacterNotesRoute()
    isLocationDetailsModalOpen.value = false
    clearLocationDetailsModal()
    isMapDetailModalOpen.value = false
    clearMapDetailModal()
    resetCharacterNoteResults()
    loadCharacterNotes()
    return
  }

  activeCharacterNotesRequestKey.value = ''
  await ensureVocabularyLocationOptions()
  loadActiveViewMode()
})
~~~

Make the existing `loadVocabularyLocationOptions` return `true` after assigning a successful response (including `[]`) and `false` after its existing catch assigns `[]`. Update the relevant existing watchers to these branch conditions:

~~~js
watch(viewMode, () => {
  if (!isCharacterNotesMode.value) loadActiveViewMode()
})

watch(() => route.query.tab, (tab) => {
  const nextMode = isCharacterNotesMode.value
    ? 'card'
    : (tab ? normalizeViewMode(tab) : resolveViewModeFromRoute())
  if (viewMode.value !== nextMode) viewMode.value = nextMode
})

watchDebounced([query, selectedSearchFields, selectedLocations, filterByRegion, selectedProvince, selectedCity], async () => {
  if (isCharacterNotesMode.value) return loadCharacterNotes()
  if (shouldUseVocabularyItemsApi()) return loadVocabularyItems()
  if (shouldUseVocabularyMapPointsApi() || shouldUseVocabularyMapItemsApi()) {
    return refreshVocabularyMapData()
  }
}, { debounce: 250, maxWait: 800 })
~~~

With those guards, use this exclusive active loader:

~~~js
function loadActiveViewMode() {
  if (isCharacterNotesMode.value) {
    return loadCharacterNotes()
  }
  if (shouldUseVocabularyItemsApi()) {
    return loadVocabularyItems()
  }
  if (shouldUseVocabularyMapPointsApi() || shouldUseVocabularyMapItemsApi()) {
    return refreshVocabularyMapData()
  }
}
~~~

- [ ] **Step 7: Verify and commit the page step**

~~~bash
cd project
npm test -- vocabularyCharacterNotesMode.test.js vocabularyApi.test.js
git diff --check
git diff -- src/main/views/explore/word/vocabulary/VocabularyViewPage.vue src/main/views/explore/word/vocabulary/vocabulary.scss tests/vocabularyCharacterNotesMode.test.js
git add project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue project/src/main/views/explore/word/vocabulary/vocabulary.scss project/tests/vocabularyCharacterNotesMode.test.js
git commit -m "feat: show character note cards in vocabulary view"
~~~

Review that map/table behavior has not changed, response races are source-safe, styles remain scoped SCSS, no width media query exists, and no Chinese/emoji corruption appears.

### Task 5: Add Copy and Run Final Frontend Verification

**Files:**
- Modify: project/src/i18n/locales/zh-CN/words.json
- Modify: project/src/i18n/locales/zh-Hant/words.json
- Modify: project/src/i18n/locales/en/words.json
- Modify: project/tests/vocabularyCharacterNotesMode.test.js

- [ ] **Step 1: Add failing catalog checks**

Parse each locale JSON in vocabularyCharacterNotesMode.test.js and assert these keys exist at that file's root object (the locale loader supplies the `words` namespace):

~~~js
for (const locale of ['zh-CN', 'zh-Hant', 'en']) {
  const words = JSON.parse(readSource('src/i18n/locales/' + locale + '/words.json'))
  expect(words.wordList.sourceMode.vocabulary).toBeTruthy()
  expect(words.wordList.sourceMode.characterNotes).toBeTruthy()
  expect(words.wordList.sourceMode.ariaLabel).toBeTruthy()
  expect(words.wordList.characterNotes.placeholder).toBeTruthy()
  expect(words.wordList.characterNotes.enterQuery).toBeTruthy()
}
~~~

- [ ] **Step 2: Confirm failure**

~~~bash
cd project
npm test -- vocabularyCharacterNotesMode.test.js
~~~

Expected: FAIL because the catalog entries are absent.

- [ ] **Step 3: Add exactly the required copy**

Within each existing `wordList` object, add `sourceMode` and `characterNotes` keys. Use these values:

~~~json
{
  "sourceMode": {
    "vocabulary": "词表",
    "characterNotes": "字表注释",
    "ariaLabel": "数据来源"
  },
  "characterNotes": {
    "placeholder": "搜索字表注释",
    "enterQuery": "请输入字表注释进行搜索"
  }
}
~~~

Use established Traditional Chinese equivalents: 詞表, 字表註釋, 資料來源, 搜尋字表註釋, 請輸入字表註釋進行搜尋. Use English: Vocabulary, Character Notes, Data source, Search character notes, Enter character notes to search. Do not rewrite adjacent translations.

- [ ] **Step 4: Run all final checks**

~~~bash
cd project
npm test -- vocabularyCharacterNotesMode.test.js vocabularyApi.test.js
npm run lint
npx vite build
~~~

Expected: all commands exit 0. Use npx vite build rather than npm run build so verification does not regenerate the user-owned sitemap.

- [ ] **Step 5: Final code review and commit**

~~~bash
git diff --check
git diff -- project/src/i18n/locales/zh-CN/words.json project/src/i18n/locales/zh-Hant/words.json project/src/i18n/locales/en/words.json project/tests/vocabularyCharacterNotesMode.test.js
git status --short
git add project/src/i18n/locales/zh-CN/words.json project/src/i18n/locales/zh-Hant/words.json project/src/i18n/locales/en/words.json project/tests/vocabularyCharacterNotesMode.test.js
git commit -m "feat: localize character notes vocabulary search"
~~~

Before staging, explicitly confirm that pre-existing user changes in project/public/sitemap.xml, project/src/api/main/toponyms.js, project/src/main/router.js, project/src/main/router/exploreRoutes.js, and the unrelated existing plan are not staged.

## Final Acceptance Checklist

- /menu/vocabulary/view?tab=card starts in the unchanged vocabulary card experience with the switch on.
- Turning the switch off produces source=character-notes with tab=card, hides page-tab-navigation and all vocabulary-only controls, and leaves only input plus switch.
- Blank input shows the dedicated prompt and makes no character-note request.
- One- and two-character queries use the existing IME-safe/debounced flow and render every returned row as location, character, IPA, and note.
- Long-note expansion works in both sources. Source switching cannot leave stale cards, a late response, a location modal, a map, or a table visible in character-note mode.
- Returning to vocabulary removes source, restores navigation/controls, and preserves current vocabulary API/map/table behavior.
- Deep links with character-notes plus map/table normalize to card.
- Focused tests, lint, Vite build, diff review, and Chinese/emoji encoding checks pass.
