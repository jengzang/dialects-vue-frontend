# Vocabulary partition filters implementation plan

**Goal:** Add four mutually exclusive vocabulary filters: location, administrative area, yindian, map.

**Architecture:** Keep existing components and page boundaries. The vocabulary page owns the vocabulary-specific tree request; RegionSelector accepts optional external nodes without affecting default consumers. Only the active filter mode contributes query parameters. Preserve character-notes behavior and unrelated working changes.

**Tech Stack:** Vue 3, existing API client, SCSS, Vitest.

### Step 1: Vocabulary API
- [x] Add failing runtime API tests for all five search endpoints, repeated unmodified region paths, limits, and both partition tree modes.
- [x] Extend `project/src/api/main/vocabulary.js`: serialize regions separately from existing comma-separated lists; add vocabulary partition options loader; document new entry and location option fields.
- [x] Run `npm test -- tests/vocabularyApi.test.js`, inspect staged/unstaged diffs, CR, commit exact scope.

### Step 2: RegionSelector
- [x] Add failing component tests for externally supplied nodes (including empty/loading/error states), no default API request, disabled custom-region UI, and selection limits.
- [x] Add optional `nodes`, `loading`, `error`, `allowCustomRegions`, `maxSelected`, `maxPathLength` props. Defaults preserve current consumers. Guard stale default requests when switching data sources.
- [x] Run selector tests, inspect diffs for behavior/styles/text safety, CR, commit exact scope.

### Step 3: Vocabulary integration
- [x] Add runtime tests covering four radio choices, exclusive visible controls and outgoing filters, tree switching/stale responses, pagination/cache isolation, and retained region metadata.
- [x] Update VocabularyTopControls and VocabularyViewPage in place; add translated mode/validation labels. Migrate old saved preference. Clear inactive selections on mode change and selected paths on tree mode change. Refresh location options without feeding hidden filters into results. Keep all administrative candidates available for administrative selectors.
- [x] Verify existing card/map/table entry points and map-point detail scoping; keyword and standard-word constraints remain as before.
- [x] Run focused vocabulary/selector regression tests and Vite production build (directly, without regenerating user sitemap). Inspect complete diffs, CR, commit exact scope.

No dependency installation. No backend edits. Selecting a region queries entries directly; it does not introduce a second location filtering step.

## Verification

- API step: 28 tests passed; independent CR passed; commit 486322ed.
- Selector step: 12 tests passed after fixing stale nodes during source changes; independent CR passed; commit 9712665d.
- Integration: 84 tests passed across seven suites; production Vite build passed. Independent CR findings for stale pagination and location-options blocking results were reproduced in tests and fixed.
- Browser check: four radio options render correctly; partition mode shows only RegionSelector and a retry control on request failure. Live backend data could not be verified from the local preview (fetch failed).
- Baseline comparison: 22 existing failures in vocabularyNotesTopControls, vocabularyPageShell, vocabularyTableReadOnly reproduce before this integration. Two existing RegionSelector no-undef errors for `route` also reproduce unchanged. These unrelated issues remain outside scope.
