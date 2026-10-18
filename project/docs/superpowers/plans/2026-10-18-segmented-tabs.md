# Segmented Tabs Implementation Plan

> **For agentic workers:** Execute inline, task by task, using executing-plans; inspect and review each diff before committing.

**Goal:** Preserve the original Auth segmented appearance while sharing TabsContainer with all three Auth switches and the location partition switch.

**Architecture:** Add `mode="segmented"`, `navigationOnly`, `size="compact"`, `variant="solid"`, and `ariaLabel` to the existing component. Navigation-only controlled switches use an accessible group of pressed buttons, avoiding references to nonexistent panels. Existing tab panels, route handling and adaptive/underline modes retain their defaults. Shared appearance lives in `src/styles/global/_tabs.scss`; component SCSS handles geometry only.

**Tech Stack:** Vue 3, SCSS tokens, Vitest, existing Playwright browser runtime. No dependency installation.

### Step 1: Shared segmented mode

Files: `src/components/common/TabsContainer.vue`, `src/styles/global/_tabs.scss`, `tests/tabsContainer.test.js`.

- [ ] Add tests mounting `{ mode: 'segmented', navigationOnly: true, ariaLabel: '分區' }`: no panel/header output, group label and pressed selection, button type, controlled updates, disabled items, arrow navigation without activation.
- [ ] Run `./node_modules/.bin/vitest run tests/tabsContainer.test.js`; confirm new assertions fail before implementation.
- [ ] Implement the listed props with defaults `navigationOnly=false`, `size='default'`, `variant='surface'`. Omit panel/header only for navigation-only use; retain route link semantics. Reuse existing keyboard behavior for grouped buttons.
- [ ] Add shared track/selected surface styling using existing tokens, preserve content-sized widths and portrait Auth spacing. Compact solid variant preserves the location switch emphasis; provide touch height on coarse pointers. Avoid text width shifts by reserving the selected font weight with a hidden label.
- [ ] Run targeted tests and lint, inspect staged/unstaged diffs, CR, commit only this scope.

### Step 2: Auth consumers

Files: `src/main/components/user/auth/{LoginForm,ModifyProfileForm,ProfileOverview,TabSwitcher}.vue`, `tests/authTabs.test.js`.

- [ ] Replace all three imports/usages with direct `TabsContainer` imports, `mode="segmented" :navigation-only="true" :use-router="false"`; change configuration keys from `value` to `name`. Keep emitted parent events, literal labels, inputs, watchers and route state unchanged.
- [ ] Remove the old TabSwitcher only after `rg -n TabSwitcher src` confirms there are no other callers.
- [ ] Verify Auth login preserves credentials and clears the password on mode change; profile and modification switches forward their original events. Add focused integration tests for those behaviors with existing i18n/router test setup.
- [ ] Run targeted tests and lint, inspect diffs for Chinese/emoji changes and unrelated behavior, CR, commit only this scope.

### Step 3: Location consumer and final verification

Files: `src/main/components/geo/LocationAndRegionInput.vue`, relevant integration tests.

- [ ] Replace only the map/yindian button group with `TabsContainer`, `mode="segmented" size="compact" variant="solid" navigation-only :use-router="false"`, computed `{name,label}` options, existing `onTabClick` callback. Remove obsolete `.region-tabs` styling. Retain the adjacent information button and RegionInputMode select.
- [ ] Verify arrows do not activate; confirming a different source clears selection via the existing handler; clicking the current source retains selection.
- [ ] Run tabs/Auth/Praat/location regression tests, lint changed components and `./node_modules/.bin/vite build` (avoid the sitemap-generating build script because sitemap has user changes).
- [ ] Check desktop/portrait, light/dark appearance and keyboard interaction in browser; inspect final diff and full Auth callers. CR, commit only this scope, then report commits and evidence.

## Scope and review

Preserve unrelated dirty sitemap/API/router files. No changes to login validation, auth routes, partition resolution, input-mode select, other maps or modal tab designs. Width breakpoints are forbidden. All component styles stay scoped SCSS with shared mixins. Plans and implementation are committed separately.
