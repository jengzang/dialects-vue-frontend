# Vocabulary Page Tab Navigation Positioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the vocabulary page tabs at their initial screen position in landscape and make them stick to the viewport top in portrait.

**Architecture:** Keep the navigation in document flow with `position: sticky`, so the page layout retains its space. In landscape, use the navigation's initial screen coordinate as its sticky inset; in portrait, use `top: 0`. Scope `overflow-x: clip` to vocabulary routes because the layout's current `overflow-x: hidden` creates a scroll container that prevents the navigation from sticking to the viewport.

**Tech Stack:** Vue 3, Vue Router, scoped SCSS, CSS sticky positioning and aspect-ratio media queries.

---

### Task 1: Scope sticky positioning to vocabulary routes

**Files:**
- Modify: `project/src/layouts/MenuLayout.vue`
- Modify: `project/src/main/views/explore/word/vocabulary/vocabulary.scss`

- [x] **Step 1: Mark vocabulary routes in the layout and allow viewport sticky positioning**

In `MenuLayout.vue`, import `useRoute`, initialize `const route = useRoute()` in `<script setup>`, and add a route-specific class to the content wrapper:

```vue
<div
  class="glass-content"
  :class="{ 'glass-content--vocabulary': route.path.includes('/menu/vocabulary') }"
>
```

Add this rule inside its existing scoped SCSS block. Keep the default overflow behavior unchanged for other routes:

```scss
.glass-content--vocabulary {
  overflow-x: clip;
}
```

- [x] **Step 2: Pin the vocabulary tabs at the requested offsets**

In `vocabulary.scss`, change the base `.page-tab-navigation` sticky inset from `top: 0` to the initial landscape position:

```scss
top: calc(max(16px, env(safe-area-inset-top)) + 7dvh + 6px);
```

In the existing `@media (max-aspect-ratio: 1 / 1)` block, change `.page-tab-navigation` from `position: static` to `position: sticky` and add `top: 0`. Keep its current alignment and margins.

- [x] **Step 3: Review the scoped diff**

Run `git diff -- project/src/layouts/MenuLayout.vue project/src/main/views/explore/word/vocabulary/vocabulary.scss` and confirm the only behavior changes are the vocabulary route's scroll context and the two orientation-specific sticky offsets. Do not run or add tests for this request.

- [x] **Step 4: Commit only the implementation files**

```bash
git commit --only project/src/layouts/MenuLayout.vue project/src/main/views/explore/word/vocabulary/vocabulary.scss -m "fix(vocabulary): keep page tabs visible while scrolling"
```

This path-limited commit preserves unrelated staged and unstaged workspace changes.
