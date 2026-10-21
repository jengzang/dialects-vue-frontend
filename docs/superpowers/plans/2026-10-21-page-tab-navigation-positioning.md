# Reusable Viewport Pinned Element Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep vocabulary page tabs pinned in the requested position by orientation, with the scroll behavior reusable by other components.

**Architecture:** Add `useViewportPinnedElement` under `src/composables/ui`. It receives refs for a target and its in-flow placeholder, plus orientation and scroll options. It positions the target with `position: fixed`, keeps the placeholder at the target's measured height, and cleans up styles and listeners as the component is disabled, deactivated, or unmounted. The vocabulary page supplies its landscape offset and portrait top threshold; `MenuLayout.vue` stays unchanged.

**Tech Stack:** Vue 3 Composition API, JavaScript, CSS fixed positioning, `matchMedia('(max-aspect-ratio: 1 / 1)')`.

---

### Task 1: Create the reusable pinned element composable

**Files:**
- Create: `project/src/composables/ui/useViewportPinnedElement.js`

- [ ] **Step 1: Implement the reusable positioning contract**

Export `useViewportPinnedElement({ elementRef, placeholderRef, enabled = true, landscapeTop = null, portraitTop = 0, scrollTarget = () => window })`. Return `elementStyle`, `placeholderStyle`, and `isPinned` refs.

On mount and activation, attach a passive scroll listener to `scrollTarget`, plus resize and aspect-ratio change listeners on `window`. When enabled in landscape, pin immediately at `landscapeTop`; if it is `null`, capture the element's initial `getBoundingClientRect().top` once. In portrait, pin only when the placeholder's `getBoundingClientRect().top <= portraitTop`, and return the element to normal flow when the placeholder moves below that threshold. Derive fixed `left` and `width` from the placeholder rectangle, and placeholder height from `element.offsetHeight`. Accept a numeric top as pixels or a CSS length string. Clear both style refs when disabled and remove all listeners on deactivation and unmount. Watch the two element refs and `enabled` so conditional elements are handled.

### Task 2: Integrate the composable with the vocabulary tabs

**Files:**
- Modify: `project/src/main/views/menu/VocabularyPage.vue`

- [ ] **Step 1: Add a flow placeholder and connect the refs**

Wrap the existing `.page-tab-navigation` in `.page-tab-navigation-slot`, bind refs and the two style refs, and preserve the existing `v-if="!isCharacterNotesMode"` condition. Call the composable with `enabled: () => !isCharacterNotesMode.value`, `landscapeTop: 'calc(max(16px, env(safe-area-inset-top)) + 7dvh + 6px)'`, and `portraitTop: 0`.

### Task 3: Keep presentation styles local and restore MenuLayout

**Files:**
- Modify: `project/src/main/views/explore/word/vocabulary/vocabulary.scss`
- Modify: `project/src/layouts/MenuLayout.vue`

- [ ] **Step 1: Move the navigation spacing to its placeholder**

Give `.page-tab-navigation-slot` `width: 100%` and the existing desktop `margin-bottom: 18px`; set `.page-tab-navigation` to normal flow with `margin: 0`. In the portrait aspect-ratio block, set the slot `margin-bottom: 14px` and keep the existing left alignment on `.page-tab-navigation`. Remove sticky `top` rules. Preserve all tab appearance rules and unrelated current SCSS edits.

- [ ] **Step 2: Remove the earlier layout-level change**

In `MenuLayout.vue`, remove the route class binding, `useRoute` import and initialization, and `.glass-content--vocabulary` overflow override. Leave its original `.glass-content { overflow-x: hidden; }` rule intact.

### Task 4: Review and commit the implementation

**Files:**
- Review: `project/src/composables/ui/useViewportPinnedElement.js`
- Review: `project/src/main/views/menu/VocabularyPage.vue`
- Review: `project/src/main/views/explore/word/vocabulary/vocabulary.scss`
- Review: `project/src/layouts/MenuLayout.vue`

- [ ] **Step 1: Review scope and whitespace**

Run `git diff -- project/src/composables/ui/useViewportPinnedElement.js project/src/main/views/menu/VocabularyPage.vue project/src/main/views/explore/word/vocabulary/vocabulary.scss project/src/layouts/MenuLayout.vue` and `git diff --check`. Confirm `MenuLayout.vue` has no net change relative to the state before the previous implementation commit, and preserve unrelated user edits. Do not add or run tests for this request.

- [ ] **Step 2: Commit only these implementation files**

```bash
git commit --only project/src/composables/ui/useViewportPinnedElement.js project/src/main/views/menu/VocabularyPage.vue project/src/main/views/explore/word/vocabulary/vocabulary.scss project/src/layouts/MenuLayout.vue -m "refactor(vocabulary): use reusable pinned element composable"
```
