# UniversalTable Pagination Debounce Implementation Plan

> **For agentic workers:** Follow this plan in order, review the diff, and commit the pagination change before the API audit.

**Goal:** Collapse rapid pagination changes into one table query sent 800 ms after the latest page action.

**Architecture:** Keep `currentPage` responsive while scheduling the page query with a trailing debounce shared by previous/next controls and direct page jumps. Add a monotonically increasing request identity so an earlier response cannot replace the latest requested page, and clear pending work when the component unmounts or another immediate table query supersedes it.

**Tech Stack:** Vue 3 `<script setup>`, JavaScript timers, existing `tableApi.query` adapter.

---

### Task 1: Debounce page-driven table queries

**Files:**
- Modify: `project/src/main/components/TableAndTree/UniversalTable.vue`

- [ ] Add an 800 ms page-query timer and latest-request identity in the component.
- [ ] Route previous/next clicks and direct page jumps through the same trailing debounce; update the displayed page immediately and clamp arrow navigation to valid pages.
- [ ] Invalidate stale responses and clear the timer/request identity during teardown. Immediate non-pagination `fetchData()` calls should supersede a pending page timer.
- [ ] Review `git diff` for scope and run `git diff --check`.
- [ ] Commit only the pagination implementation and its plan.

### Task 2: Audit other component API calls

**Files:**
- Read: `project/src/main/components/TableAndTree/UniversalTable.vue`

- [ ] Inventory API calls, their triggers, and existing debounce/coalescing behavior after Task 1 is committed.
- [ ] Recommend which calls benefit from debounce for reducing request volume; do not change unrelated API behavior without a separate user decision.
