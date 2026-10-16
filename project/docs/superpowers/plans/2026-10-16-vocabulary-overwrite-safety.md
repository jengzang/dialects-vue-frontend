# Vocabulary overwrite safety implementation plan

**Goal:** Correct import feedback, preserve unfilled location metadata, and select editable existing locations beside Yindian autofill.

**Approved scope:** Keep whole-location replacement and partial imports after preview. Do not add version locking, rollback, export changes, or general location identity changes. Selecting another owner's location as a manager must preserve that owner and enforce server permissions.

**Architecture:** Reuse VocabularyImportPage, LocationEditorModal, SimpleSelectDropdown and the permission-filtered locations endpoint. Preserve skipped_count's existing blank-row contract; add error counts to UI totals. Preserve existing nonempty metadata when uploads supply blanks. Add optional target_user_id to preview/import for explicit existing-location selection; default remains the current user.

**Tech stack:** Vue 3, Vitest/jsdom, FastAPI, SQLAlchemy, pytest. Existing dependencies only.

## Step 1 — Import feedback

- [x] Add runtime regressions for preview skipped totals and partial import warning.
- [x] Verify failures, then count skipped_count plus error-row details in the page. Adjust only relevant translations.
- [x] Run targeted Vitest, inspect staged/unstaged diff and encoding, CR, commit this step only.

## Step 2 — Server metadata and selected owner

- [x] Add service regressions for blank metadata preservation, nonblank updates, manager-selected owner, forbidden cross-owner import, missing target, and partial import compatibility.
- [x] Run red tests against an isolated database.
- [x] Preserve stored values for blank metadata on location upsert. Resolve optional target_user_id for existing locations; allow other owners only to manage permission. Apply the same scope to preview and import; keep actor identity in logs.
- [x] Forward optional target_user_id through both routes; test route forwarding. Do not change parsing or overwrite policy.
- [x] Run service/parser/route tests, inspect diff and encoding, CR, commit exact backend files.

## Step 3 — Existing location selector

- [x] Add runtime/API tests for full pagination, owner-aware selection, populated drafts, cancel behavior, preview/import forwarding and permission changes.
- [x] Load locations through getVocabularyLocations, page_size=200 until all pages have been read. Use user_id and location_name as option identity and include username in labels.
- [x] Add an optional helper slot beside YindianLocationMatch in LocationEditorModal. Supply the existing SimpleSelectDropdown only from the import page, titled 覆盖已有地点.
- [x] Keep selection draft-local until modal confirmation. Forward confirmed owner for preview/import; clear selected target when switching to a new location.
- [x] Add translations in zh-CN, zh-Hant and en; reuse shared visual primitives and aspect-ratio conventions.
- [x] Run affected Vitest tests, build directly with existing Vite (avoid sitemap script), inspect diff/encoding, CR, commit exact frontend files.

## Verification constraints

Never install dependencies. Backend tests must use temporary/in-memory data, not business databases. Backend checkout is outside writable roots, so apply its prepared patch with explicit tool escalation. Preserve pre-existing frontend and backend work and staged state. After each step recheck git status.

## Validation results

- Frontend: 43 tests passed across six relevant files; direct production Vite build passed. Targeted ESLint reported zero errors; existing formatting warnings remain.
- Backend: 63 targeted checks passed, including multipart target-owner forwarding. The five broader service failures were reproduced against the unchanged baseline (Word whitespace parsing and query display/order expectations); no new failures.
- Independent CR passed for all three implementation steps. A delayed-list rename edge case found in CR was reproduced with a failing test and fixed before commit.
- UTF-8/JSON and git diff checks passed. Pre-existing user changes were excluded from commits.
