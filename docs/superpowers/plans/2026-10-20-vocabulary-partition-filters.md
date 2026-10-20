# Vocabulary partition filters implementation plan

**Goal:** Add four mutually exclusive vocabulary filters: location, administrative area, yindian, map.

**Architecture:** Keep existing components and page boundaries. The vocabulary page owns the vocabulary-specific tree request; RegionSelector accepts optional external nodes without affecting default consumers. Only the active filter mode contributes query parameters. Preserve character-notes behavior and unrelated working changes.

**Tech Stack:** Vue 3, existing API client, SCSS, Vitest.

### Step 1: Vocabulary API
- [ ] Add failing runtime API tests for all five search endpoints, repeated unmodified region paths, limits, and both partition tree modes.
- [ ] Extend `project/src/api/main/vocabulary.js`: serialize regions separately from existing comma-separated lists; add vocabulary partition options loader; document new entry and location option fields.
- [ ] Run `npm test -- tests/vocabularyApi.test.js`, inspect staged/unstaged diffs, CR, commit exact scope.

### Step 2: RegionSelector
- [ ] Add failing component tests for externally supplied nodes (including empty/loading/error states), no default API request, disabled custom-region UI, and selection limits.
- [ ] Add optional `nodes`, `loading`, `error`, `allowCustomRegions`, `maxSelected`, `maxPathLength` props. Defaults preserve current consumers. Guard stale default requests when switching data sources.
- [ ] Run selector tests, inspect diffs for behavior/styles/text safety, CR, commit exact scope.

### Step 3: Vocabulary integration
- [ ] Add runtime tests covering four radio choices, exclusive visible controls and outgoing filters, tree switching/stale responses, pagination/cache isolation, and retained region metadata.
- [ ] Update VocabularyTopControls and VocabularyViewPage in place; add translated mode/validation labels. Migrate old saved preference. Clear inactive selections on mode change and selected paths on tree mode change. Refresh location options without feeding hidden filters into results. Keep all administrative candidates available for administrative selectors.
- [ ] Verify existing card/map/table entry points and map-point detail scoping; keyword and standard-word constraints remain as before.
- [ ] Run focused vocabulary/selector regression tests and Vite production build (directly, without regenerating user sitemap). Inspect complete diffs, CR, commit exact scope.

No dependency installation. No backend edits. Selecting a region queries entries directly; it does not introduce a second location filtering step.
