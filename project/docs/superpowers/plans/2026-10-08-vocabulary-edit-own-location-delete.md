# Vocabulary `edit` Self-Location Delete UI Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the vocabulary management UI show and invoke location deletion for an authorized `edit` user's own locations, while keeping transfer unavailable to that role and precisely targeting same-name rows.

**Architecture:** The UI receives `can_delete_locations` from the backend-owned `/api/vocabulary/me` contract. It handles that capability independently from `can_manage_entries`, which continues to gate transfer. The selected row's `user_id` is passed to the existing delete API wrapper so a `manage` user selects the intended owner when duplicate names exist.

**Tech Stack:** Vue 3 Composition API, Vite, Vitest, vue-i18n.

---

## Dependency and Scope Lock

- Implement only after the backend plan has added and deployed `can_delete_locations` plus owner-scoped server authorization.
- The frontend must never infer authorization from `permission_level`, `can_view_logs`, or a row's `user_id`; it consumes the backend capability for affordance only. The backend still decides whether a DELETE succeeds.
- The change does not alter entry editing, imports, exports, filters, routes, styles, modal layout, translation strings, or transfer behavior.
- Existing cached `/me` objects lack the new field. Treat them as stale and refetch instead of defaulting to `false`, otherwise already-signed-in `edit` users could be silently denied the new UI until manually refreshing permissions.
- Existing `tests/vocabularyLocationTransfer.test.js` has three baseline failures because it expects the previous transfer payload/input shape. Do not repair it in this deletion-focused change; report it separately during final verification.

## File Map

| File | Change |
| --- | --- |
| `project/src/api/main/vocabulary.js` | Extend `/me` response JSDoc. |
| `project/src/main/views/menu/VocabularyPage.vue` | Safely migrate cached capability objects and provide the empty-state field. |
| `project/src/main/views/explore/word/vocabulary/VocabularyManagePage.vue` | Derive dedicated delete/transfer capabilities and pass distinct props. |
| `project/src/main/views/explore/word/vocabulary/ManageLocationsSection.vue` | Split button gates and send `user_id` on delete. |
| `project/tests/vocabularyApi.test.js` | Assert the DELETE wrapper serializes `user_id`. |
| `project/tests/vocabularyMeCache.test.js` | Test cache migration and update current response fixtures. |
| `project/tests/vocabularyLocationDeletePermissions.test.js` | Lock permission separation and row identity forwarding at component-source level. |

### Task 1: Add focused frontend regression tests

**Files:**
- Modify: `project/tests/vocabularyApi.test.js`
- Modify: `project/tests/vocabularyMeCache.test.js`
- Create: `project/tests/vocabularyLocationDeletePermissions.test.js`

- [ ] **Step 1: Add the delete-wrapper request contract test**

  Import `deleteVocabularyLocation`, mock a successful response, then assert a selected owner's id is preserved in the query string:

  ```js
  apiMock.mockResolvedValueOnce({
    status: 'deleted',
    location_name: '息烽',
    deleted_entries: 2,
  })

  await deleteVocabularyLocation('息烽', { user_id: 7 })

  expect(apiMock).toHaveBeenLastCalledWith(
    '/api/vocabulary/locations/%E6%81%AF%E7%83%BD?user_id=7',
    { method: 'DELETE' },
  )
  ```

- [ ] **Step 2: Write the cache-migration test before changing cache logic**

  Seed `localStorage.vocabulary_me` with the current owner key but no `can_delete_locations`, mock a new backend object containing `can_delete_locations: true`, mount `VocabularyPage`, then assert `/me` is called and the cache is replaced by the new object. This fails against the current cache reader because it returns the incomplete object without a request.

  ```js
  localStorage.setItem('vocabulary_me', JSON.stringify({
    owner_key: 'id:42',
    data: {
      user_id: 42,
      permission_level: 'edit',
      can_upload: true,
      can_manage_entries: false,
      can_view_logs: false,
    },
  }))
  apiMocks.getVocabularyMe.mockResolvedValueOnce(refreshedPermission)

  const wrapper = mountVocabularyPage()
  await flushPromises()

  expect(apiMocks.getVocabularyMe).toHaveBeenCalledTimes(1)
  expect(JSON.parse(localStorage.getItem('vocabulary_me')).data).toEqual(refreshedPermission)
  ```

- [ ] **Step 3: Create the component contract test for independent actions**

  Follow the repository's source-inspection test pattern. Read `VocabularyManagePage.vue` and `ManageLocationsSection.vue`, then assert all of the following separately:

  ```js
  expect(managePage).toContain(
    ':can-delete-location="canDeleteVocabularyLocations"',
  )
  expect(managePage).toContain(
    ':can-transfer-location="canManageVocabularyEntries"',
  )
  expect(locationsSection).toContain(
    'canDeleteLocation: { type: Boolean, default: false }',
  )
  expect(locationsSection).toContain(
    'canTransferLocation: { type: Boolean, default: false }',
  )
  expect(locationsSection).toContain('v-if="canTransferLocation"')
  expect(locationsSection).toContain(
    'const params = location.user_id ? { user_id: location.user_id } : {}',
  )
  ```

  Also isolate the `location-item-head` text and assert its delete button uses `canDeleteLocation`, while its transfer button uses `canTransferLocation`; this prevents a future refactor from exposing transfer to `edit` users.

- [ ] **Step 4: Run the new tests and confirm expected pre-change failures**

  ```bash
  npm test -- tests/vocabularyApi.test.js tests/vocabularyMeCache.test.js tests/vocabularyLocationDeletePermissions.test.js
  ```

  Expected before implementation: the API wrapper test passes; the stale-cache and independent-action source checks fail.

### Task 2: Consume the backend capability safely

**Files:**
- Modify: `project/src/api/main/vocabulary.js:323`
- Modify: `project/src/main/views/menu/VocabularyPage.vue:131-230`
- Test: `project/tests/vocabularyApi.test.js`
- Test: `project/tests/vocabularyMeCache.test.js`

- [ ] **Step 1: Document the expanded API response in the wrapper**

  Amend only the existing `getVocabularyMe` JSDoc return shape:

  ```js
  /**
   * @returns {Promise<{
   *   user_id: number,
   *   permission_level: 'edit' | 'manage' | null,
   *   can_upload: boolean,
   *   can_manage_entries: boolean,
   *   can_view_logs: boolean,
   *   can_delete_locations: boolean,
   * }>}
   */
  ```

- [ ] **Step 2: Add the empty-state capability**

  Keep the existing shape and add only the safe default:

  ```js
  function createEmptyVocabularyMe() {
    return {
      user_id: null,
      permission_level: null,
      can_upload: false,
      can_manage_entries: false,
      can_view_logs: false,
      can_delete_locations: false,
    }
  }
  ```

- [ ] **Step 3: Invalidate the old cache shape, not valid current cache entries**

  Add a small local predicate before `readCachedVocabularyMe` returns `cached.data`:

  ```js
  function hasVocabularyDeleteCapability(value) {
    return typeof value?.can_delete_locations === 'boolean'
  }

  function readCachedVocabularyMe() {
    // existing owner-key and JSON parsing logic
    if (cached?.owner_key === ownerKey && cached?.data && typeof cached.data === 'object') {
      if (!hasVocabularyDeleteCapability(cached.data)) {
        localStorage.removeItem(VOCABULARY_ME_CACHE_KEY)
        return null
      }
      return cached.data
    }
  }
  ```

  Do not add a timer or change cache ownership. New complete cached responses retain the current cache behavior; only the response-shape migration triggers one refresh.

- [ ] **Step 4: Update existing cache-test fixtures**

  Add `can_delete_locations` to every `cachedPermission`, `refreshedPermission`, and `laterPermission` fixture that represents a current API response, preserving their prior role-specific booleans. Keep the deliberately old fixture in the new migration test without the field.

- [ ] **Step 5: Run capability and cache tests**

  ```bash
  npm test -- tests/vocabularyApi.test.js tests/vocabularyMeCache.test.js
  ```

  Expected: all tests pass.

### Task 3: Separate deletion from transfer in the management UI

**Files:**
- Modify: `project/src/main/views/explore/word/vocabulary/VocabularyManagePage.vue:38-43,77-80,169-179`
- Modify: `project/src/main/views/explore/word/vocabulary/ManageLocationsSection.vue:66-78,204-209,470-483`
- Test: `project/tests/vocabularyLocationDeletePermissions.test.js`

- [ ] **Step 1: Derive two action capabilities from the existing context**

  Add these computed values beside `canViewVocabularyLogs`; `can_manage_entries` is already true only for `manage`/admin in the backend contract and therefore preserves transfer behavior:

  ```js
  const canDeleteVocabularyLocations = computed(() => (
    effectiveVocabularyMe.value?.can_delete_locations === true
  ))
  const canManageVocabularyEntries = computed(() => (
    effectiveVocabularyMe.value?.can_manage_entries === true
  ))
  ```

- [ ] **Step 2: Pass distinct props to the locations section**

  ```vue
  <ManageLocationsSection
    v-else-if="manageSection === 'locations'"
    :has-vocabulary-permission="hasVocabularyPermission"
    :manage-permission-level="effectiveVocabularyMe?.permission_level"
    :can-delete-location="canDeleteVocabularyLocations"
    :can-transfer-location="canManageVocabularyEntries"
  />
  ```

  Leave log gating on `canViewVocabularyLogs`; it must not become a deletion proxy again.

- [ ] **Step 3: Split the child props and template conditions**

  Keep the existing delete prop and add one transfer-only prop:

  ```js
  const props = defineProps({
    hasVocabularyPermission: { type: Boolean, default: false },
    canViewVocabularyLogs: { type: Boolean, default: false },
    canDeleteLocation: { type: Boolean, default: false },
    canTransferLocation: { type: Boolean, default: false },
    managePermissionLevel: { type: String, default: null },
  })
  ```

  Keep the delete button as `v-if="canDeleteLocation"`; change only the transfer button to `v-if="canTransferLocation"`. Do not alter button classes, labels, order, confirmation copy, or modal markup.

- [ ] **Step 4: Forward row identity in the delete handler**

  Replace the empty parameter object with the same pattern already used by update/export:

  ```js
  const params = location.user_id ? { user_id: location.user_id } : {}
  const result = await deleteVocabularyLocation(location.location_name, params)
  ```

  This has no visible effect for `edit` because the backend verifies ownership, but fixes manage deletion of two users' identically named locations.

- [ ] **Step 5: Extend the parent watch dependencies**

  Include `props.vocabularyMe?.can_delete_locations` and `props.vocabularyMe?.can_manage_entries` in the existing permission-context watch array. This maintains consistency if the parent replaces a `/me` object after a manual permission refresh; it does not fetch additional data when the prop is already populated.

- [ ] **Step 6: Run the dedicated UI tests**

  ```bash
  npm test -- tests/vocabularyLocationDeletePermissions.test.js tests/vocabularyManageLocationFilters.test.js tests/vocabularyApi.test.js tests/vocabularyMeCache.test.js
  ```

  Expected: all listed tests pass.

### Task 4: Review, validate, and commit only the frontend scope

**Files:**
- Review: `project/src/api/main/vocabulary.js`
- Review: `project/src/main/views/menu/VocabularyPage.vue`
- Review: `project/src/main/views/explore/word/vocabulary/VocabularyManagePage.vue`
- Review: `project/src/main/views/explore/word/vocabulary/ManageLocationsSection.vue`
- Review: `project/tests/vocabularyApi.test.js`
- Review: `project/tests/vocabularyMeCache.test.js`
- Review: `project/tests/vocabularyLocationDeletePermissions.test.js`

- [ ] **Step 1: Run lint without invoking sitemap generation**

  ```bash
  npm run lint
  ```

  Do not use `npm run build` in this worktree while `project/public/sitemap.xml` has unrelated user changes, because this project's build runs `seo:sitemap` first and may overwrite that file.

- [ ] **Step 2: Inspect the exact staged scope**

  ```bash
  git diff --check
  git diff -- project/src/api/main/vocabulary.js \
    project/src/main/views/menu/VocabularyPage.vue \
    project/src/main/views/explore/word/vocabulary/VocabularyManagePage.vue \
    project/src/main/views/explore/word/vocabulary/ManageLocationsSection.vue \
    project/tests/vocabularyApi.test.js \
    project/tests/vocabularyMeCache.test.js \
    project/tests/vocabularyLocationDeletePermissions.test.js
  ```

  Confirm no Chinese copy or emoji has changed unintentionally, the transfer gate still resolves from `can_manage_entries`, and unrelated local changes remain unstaged.

- [ ] **Step 3: Record the pre-existing transfer-test blocker separately**

  Run the existing transfer suite once and report, without changing it in this commit:

  ```bash
  npm test -- tests/vocabularyLocationTransfer.test.js
  ```

  Current baseline: three failures caused by stale expectations for the old target parameter/input shape. This is not a failure introduced by the deletion capability change.

- [ ] **Step 4: Commit the isolated frontend change**

  ```bash
  git add src/api/main/vocabulary.js \
    src/main/views/menu/VocabularyPage.vue \
    src/main/views/explore/word/vocabulary/VocabularyManagePage.vue \
    src/main/views/explore/word/vocabulary/ManageLocationsSection.vue \
    tests/vocabularyApi.test.js \
    tests/vocabularyMeCache.test.js \
    tests/vocabularyLocationDeletePermissions.test.js
  git commit -m "feat: allow vocabulary editors to delete own locations"
  ```

## Acceptance Checklist

- [ ] A fresh `edit` capability response shows delete but not transfer in Locations.
- [ ] A fresh `manage` capability response still shows both actions.
- [ ] Old cached `/me` responses automatically refresh once; complete current cache entries do not.
- [ ] DELETE contains the selected row's `user_id`, so duplicate names target the intended owner.
- [ ] A client-side button can never bypass backend owner validation.
- [ ] No unrelated dirty files are included, and no Chinese/emoji content is corrupted.
