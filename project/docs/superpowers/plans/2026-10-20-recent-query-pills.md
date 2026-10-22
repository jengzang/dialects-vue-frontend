# Recent query pills implementation plan

**Goal:** Add local recent query snapshots to the nine approved query, compare and phonology entry points.

**Approved behavior:** Preserve existing quick-start/fill buttons. Store three snapshots per entry point, show three in landscape and two at aspect ratio <= 1/1. Display history as teal pill buttons without a dropdown. Restore complete conditions without querying or adding a history entry. Record validated submissions, deduplicate complete snapshots and move repeated submissions to the front. Storage errors must not interrupt searches. Do not connect to the backend or gate history behind tutorial settings.

**Architecture:** Add a bounded local-storage composable and a shared pill row with a slot for existing quick-fill buttons. Pages capture their own editable state and restore it through existing state/ref interfaces. Restore table and input mode first, wait for current reset watchers, then apply the saved conditions. No existing page is extracted or reorganized.

**Tech stack:** Vue 3, existing SCSS tokens/shared pill classes, localStorage, Vitest/jsdom, existing Playwright runtime.

## 1. Shared history and pill presentation

- [x] Add `tests/recentQueryHistory.test.js`: bounded persistence across remounts, independent contexts, canonical deduplication, detached snapshots, malformed/unavailable storage, unsupported contexts.
- [x] Run the test before adding `src/composables/core/useRecentQueryHistory.js` and confirm missing implementation fails.
- [x] Implement the nine-context history API `useRecentQueryHistory(context)` returning `entries` and `record(snapshot, summary)`; JSON snapshots, stable object-key identities, newest three only, safe storage access.
- [x] Add `src/components/common/RecentQueryPills.vue` with existing-button default slot and `restore` event carrying a detached snapshot. Disable restoration while submitting; hide the third history pill in portrait using aspect ratio.
- [x] Define teal appearance in `src/styles/main/_buttons.scss` using tokens from `src/styles/global/_tokens.scss`; add accessible history labels in the three `common.json` locales.
- [x] Test real component event behavior; inspect diff, review encoding and scope, CR, commit only this step.

## 2. Query: char, zhonggu, yinwei, tone

- [x] Re-check workspace. Add behavioral tests mounting `QueryPage.vue` with existing inputs stubbed at their public interfaces; verify capture/restoration for all four tabs, both zhonggu modes, no request during restore, and quick-start presence with history independent of tutorials.
- [x] In `QueryPage.vue`, wrap the current quick-start pill in the shared row. Capture the current table, location model, editable tab state and direct/component input values only after validation and before navigation. Save the effective fallback location if no location is entered.
- [x] Restore table/mode with existing setters and `nextTick`, then restore fields, exclusion lists and location model without changing `globalPayload` or navigating.
- [x] Run new tests and existing query/tutorial contracts, inspect diff and encoding, CR and scoped commit.

## 3. Compare: char, zhonggu, tone

- [x] Re-check workspace. Add mounted behavioral tests for the three tabs including both zhonggu modes, two complete groups and card reset watchers. Confirm phonetic comparison receives no history feature.
- [x] In `ComparePage.vue`, add the same row for supported contexts only. Capture state after branch-specific validation and immediately before the API call, preserving submitted state even if the request fails.
- [x] Restore table/mode first, current card next, wait for list-clearing watchers, then restore both groups, exclusions, direct draft input and location model. Never invoke compare APIs while restoring.
- [x] Run relevant tests, inspect diff/encoding, CR and scoped commit.

## 4. Phonology: matrix and custom classification

- [x] Re-check workspace. Add mounted tests for location restoration and classification feature/columns/table, verifying reset watchers do not replace restored columns and no request occurs on restore.
- [x] Wrap `LocationQuickFillPill` at its two callers in the shared row. Save resolved submitted locations; custom also saves table, feature and horizontal/vertical/cell-row columns. Restore input state without changing route state or triggering a query.
- [x] Run all new and relevant existing tests. Verify all nine contexts globally, landscape/portrait visibility and persistence in a browser fixture using actual components. Run production Vite compilation without sitemap generation to preserve the user's sitemap edits.
- [x] Inspect staged and unstaged diffs, check UTF-8 and existing Chinese/emoji, CR and scoped commit. Report verification and any remaining limitations.

## 5. Approved portrait quick-fill adjustment

- [x] Keep all four phonology quick-fill locations in landscape; hide Beijing and Chengdu in portrait with the aspect-ratio breakpoint. Preserve Shanghai and Guangzhou and existing click behavior.
- [x] Verify both callers globally and run focused CR before the scoped commit.

## Verification record

- Shared infrastructure: `6add0fbf`; query entries: `5c46b33e`; comparison entries: `a9092b76`; phonology entries: `9c27a4d0`; portrait quick fills: `e159275b`.
- 42 tests passed across nine relevant suites. Includes actual YinweiSelector blur, card and delayed location metadata regression coverage.
- Actual browser checks passed for all nine paths: three visible history pills in landscape, two in portrait, no overflow or navigation on restore, and no page errors. Phonetic comparison has no history pills. Both phonology paths show four quick-fill locations in landscape and two in portrait.
- Production Vite compilation passed without running sitemap generation. Scoped ESLint and git diff checks passed.
- Broader pre-existing suites remain blocked by a stale queryLimits import and older tutorial mocks missing matchMedia/configuration; unrelated files were preserved.
