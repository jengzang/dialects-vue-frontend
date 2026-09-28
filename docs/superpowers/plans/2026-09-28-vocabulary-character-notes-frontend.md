# Vocabulary Character-Note Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a default-on `词表` switch to the vocabulary card view; when switched off, search and render raw `dialects_user.db` `notes` rows by IPA and/or annotation, while preserving the existing vocabulary experience unchanged.

**Architecture:** The route owns the source selection: no `source` query selects the existing vocabulary experience, and `source=character-notes` selects the new card-only character-note experience. The backend adds one public, rate-limited read endpoint that queries the existing `notes` FTS5 index in `dialects_user.db`. The frontend keeps both sources' result, pagination, errors, request tokens, and field preferences independent, so an in-flight response cannot overwrite the currently displayed source.

**Tech Stack:** FastAPI, Pydantic, SQLite/FTS5, `run_in_threadpool`, Vue 3 `<script setup>`, Vue Router, Vue I18n, the existing `api()` client, Vitest, pytest, scoped SCSS and project style mixins.

---

## Scope and confirmed decisions

- The switch defaults to on: `词表`. Switching off selects `字表注释` and writes `source=character-notes` to the current route.
- Character-note mode is card-only. It always uses `tab=card`, hides the parent `page-tab-navigation`, and normalizes malformed `source=character-notes&tab=map` or `tab=table` deep links with `router.replace`.
- Existing vocabulary cards, table, map, filters, location navigation, contribution navigation, and data requests must retain their current behavior when `source` is absent or unknown.
- A character-note card maps `簡稱` to a non-clickable location label, `漢字` to the main word text, `音節` to IPA, and `註釋` to the existing notes area. It has no standard-word/definition row. IPA is mandatory whenever the raw value exists.
- The source is specifically `dialects_user.db` table `notes`, not `dialects`, `vocabulary.db`, or a client-selected database. Source row identity is `notes.rowid`.
- Source rows are never deduplicated. A row that matches both configured fields appears once; two different rows with the same displayed values both appear.
- Character-note mode keeps the search gear. It contains only `音标` (`pronunciation`) and `注释` (`detail`), and persists its independent selection in `localStorage` under `vocabulary_notes_search_fields`. `[]` retains the existing meaning “all available fields”.
- A malformed or obsolete saved note-field value is discarded and falls back to `[]` (both fields); it must never be sent to the API as an unsupported field.
- In this mode hide only the location-detail action, region filter mode, standard-word selector, and the whole external location/province/city filter strip. Do not clear the vocabulary source's filters or field selection.
- Entering character-note mode closes the vocabulary location/map detail modals and any open field selector, then forces card mode. It does not erase the query or either source's saved filters.
- A blank query causes no frontend request and displays a dedicated “enter a query” state. Direct API requests with a blank query are rejected with HTTP 400.
- One- and two-character annotation queries must work. For annotations, `文白` must match literal stored `文 白`; the rendered annotation text remains unchanged.

## One-endpoint backend contract

Exactly one new public HTTP endpoint is required. Existing `/api/vocabulary/search/*` queries `vocabulary.db`; `/api/search_chars/` needs location context and has the wrong response shape; `/sql/query` is not a stable public FTS contract. No count, map, autocomplete, filter-option, FTS-rebuild, or database-selector endpoint is needed.

```http
GET /api/vocabulary/notes?q=文白&search_fields=detail&page=1&page_size=50
```

```json
{
  "items": [
    {
      "id": 519,
      "location_name": "1883廈門",
      "character": "□",
      "ipa": "lo3",
      "notes": "高,原文作“高”白读,应为训读"
    }
  ],
  "total": 1,
  "page": 1,
  "page_size": 50
}
```

Request rules:

| Parameter | Rules |
| --- | --- |
| `q` | Required after outer trimming; blank is 400. `pronunciation` retains internal whitespace and uses literal escaped `LIKE`; `detail` removes every Unicode whitespace character and uses a quoted character-token FTS phrase. |
| `search_fields` | Omitted, empty, or `all` means both fields. Valid values are repeated or comma-separated `pronunciation` and `detail`. Any other value is 400. |
| `page` | One-based integer, at least 1. |
| `page_size` | Integer 1–200, default 50. |

Response rules:

- Search only rows whose `註釋` is nonblank and not the sentinel `_` or `-`, even if an IPA query would otherwise match them.
- For `detail`, turn a whitespace-normalized query such as `文白` into the FTS phrase `"文 白"`, since `rebuild_notes_fts` indexed every annotation as space-separated characters. Escape a literal double quote before constructing the phrase.
- For `pronunciation`, escape `\\`, `%`, and `_` before `LIKE '%' || :ipa || '%' ESCAPE '\\'`; do not interpret user input as a wildcard.
- When both fields are searched, use `UNION` of matched `notes.rowid` values, not `UNION ALL` and not a display-column `DISTINCT`. This prevents one source row from appearing twice while retaining different raw rows.
- Return source order deterministically with `ORDER BY notes.rowid ASC`; compute `total` from the same matched-row CTE; return that `rowid` as `id`.

## File map

Backend repository: `/Users/jengzang/CodeProject/dialects/dialects-backend`

- Create `app/service/vocabulary/notes.py` — isolated parameter validation, FTS/IPA SQL, and data mapping against `DIALECTS_DB_USER`.
- Modify `app/schemas/vocabulary.py` — response item/list Pydantic models for the endpoint.
- Modify `app/routes/vocabulary.py` — async `/notes` route using `run_in_threadpool` and the new service.
- Modify `app/common/api_config.py` — exact public, rate-limited rule before generic `/api/vocabulary/*` policy.
- Create `tests/test_vocabulary_notes.py` — temporary SQLite FTS fixture plus service behavior tests.
- Modify `tests/test_vocabulary_routes.py` — route signature/registration and public-policy tests.

Frontend repository: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend`

- Modify `project/src/api/main/vocabulary.js` — `/api/vocabulary/notes` query builder and client helper.
- Modify `project/src/api/index.js` — helper re-export.
- Modify `project/src/main/router/menuRoutes.js` — permit `source` on vocabulary route.
- Modify `project/src/main/views/menu/VocabularyPage.vue` — hide only the parent tab navigation in note mode.
- Modify `project/src/main/views/explore/word/vocabulary/VocabularyTopControls.vue` — source switch and source-specific search-field modal/filter visibility.
- Modify `project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue` — source routing, isolated request state, card data mapping, and pagination.
- Modify `project/src/main/views/explore/word/vocabulary/vocabulary.scss` — only the location-only card layout modifier.
- Modify `project/src/i18n/locales/zh-CN/words.json`, `project/src/i18n/locales/zh-Hant/words.json`, and `project/src/i18n/locales/en/words.json` — new source and blank-query strings.
- Modify `project/tests/vocabularyApi.test.js` and create or extend `project/tests/vocabularyCharacterNotesMode.test.js` — helper and source-mode contracts.

## Task 1: Add and test the backend note-query service

**Files:**

- Create: `/Users/jengzang/CodeProject/dialects/dialects-backend/app/service/vocabulary/notes.py`
- Create: `/Users/jengzang/CodeProject/dialects/dialects-backend/tests/test_vocabulary_notes.py`

- [ ] **Step 1: Write a temporary SQLite FTS5 fixture and failing service tests.**

  In `tests/test_vocabulary_notes.py`, create a temporary `notes` table with the raw source column names and a contentless `notes_fts` table. Insert rows that deliberately cover source duplicates, whitespace annotations, an IPA-only match, `_`/`-` annotations, and a literal `%` IPA. Populate FTS with the same build invariant: `" ".join(note)`.

  ```python
  @pytest.fixture
  def notes_db(tmp_path: Path) -> Path:
      path = tmp_path / "dialects_user.db"
      conn = sqlite3.connect(path)
      conn.executescript("""
          CREATE TABLE notes (簡稱 TEXT, 漢字 TEXT, 音節 TEXT, 註釋 TEXT);
          CREATE VIRTUAL TABLE notes_fts USING fts5(註釋, content='', columnsize=0, tokenize='unicode61');
      """)
      rows = [
          ("1883廈門", "□", "lo3", "文 白"),
          ("1884廈門", "□", "lo3", "文 白"),
          ("1901福州", "□", "pa%", "IPA only"),
          ("skip-1", "□", "lo3", "_"),
          ("skip-2", "□", "lo3", "-"),
      ]
      conn.executemany("INSERT INTO notes VALUES (?, ?, ?, ?)", rows)
      for rowid, note in conn.execute("SELECT rowid, 註釋 FROM notes"):
          conn.execute("INSERT INTO notes_fts(rowid, 註釋) VALUES (?, ?)", (rowid, " ".join(note)))
      conn.commit()
      conn.close()
      return path
  ```

  Write exact assertions for: `文白` and `文 白` both finding the first two literal `文 白` records; `pronunciation=lo3` excluding `_` and `-`; `pronunciation=pa%` not matching values merely containing `paX`; `all` returning one row when one row matches both fields; two identical-display source rows staying distinct; page 2 returning the stable next `rowid`; blank query and invalid fields raising `ValueError`.

- [ ] **Step 2: Run the new tests and confirm they fail because the service module does not exist.**

  ```bash
  cd /Users/jengzang/CodeProject/dialects/dialects-backend
  pytest tests/test_vocabulary_notes.py -q
  ```

  Expected: collection fails with `ModuleNotFoundError` for `app.service.vocabulary.notes`.

- [ ] **Step 3: Implement the standalone query service.**

  Define the supported fields, normalizers, response mapper, and public function in `notes.py`. Keep `DIALECTS_DB_USER` as a server-side argument/default resolved from the backend configuration; never accept a database name from the request.

  ```python
  SEARCH_FIELDS = frozenset({"pronunciation", "detail"})

  def parse_search_fields(values: list[str] | None) -> set[str]:
      parts = {part.strip() for value in values or [] for part in value.split(",") if part.strip()}
      if not parts or parts == {"all"}:
          return set(SEARCH_FIELDS)
      if "all" in parts or not parts <= SEARCH_FIELDS:
          raise ValueError("search_fields 仅支持 pronunciation、detail 或 all")
      return parts

  def normalize_detail_query(value: str) -> str:
      normalized = "".join(char for char in value if not char.isspace())
      if not normalized:
          raise ValueError("q 不能为空")
      return '"' + " ".join(normalized.replace('"', '""')) + '"'

  def escape_like(value: str) -> str:
      return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
  ```

  Build a `matched` CTE from selected branches. The detail branch must use `notes_fts MATCH :detail_phrase`; the IPA branch must use the escaped `LIKE`. Both must include the annotation validity predicate. Use `UNION` between branches. Execute a count query against `matched`, then retrieve the requested page by joining `notes` on `rowid`, ordered ascending. Return raw values with `or ""` only at response mapping time.

  ```sql
  WITH matched AS (
      SELECT notes.rowid AS rowid FROM notes
      JOIN notes_fts ON notes_fts.rowid = notes.rowid
      WHERE notes_fts MATCH :detail_phrase
        AND TRIM(COALESCE(notes.註釋, '')) NOT IN ('', '_', '-')
      UNION
      SELECT notes.rowid AS rowid FROM notes
      WHERE notes.音節 LIKE '%' || :ipa || '%' ESCAPE '\\'
        AND TRIM(COALESCE(notes.註釋, '')) NOT IN ('', '_', '-')
  )
  SELECT notes.rowid, notes.簡稱, notes.漢字, notes.音節, notes.註釋
  FROM matched JOIN notes ON notes.rowid = matched.rowid
  ORDER BY notes.rowid ASC LIMIT :limit OFFSET :offset
  ```

  Construct only the active branch/parameters rather than passing unused bindings. Use the same CTE text for `SELECT COUNT(*) FROM matched`, with no invalid unrestricted scan of the contentless FTS table.

- [ ] **Step 4: Run focused backend service tests, inspect the query behavior, and review the change.**

  ```bash
  cd /Users/jengzang/CodeProject/dialects/dialects-backend
  pytest tests/test_vocabulary_notes.py -q
  git diff --check
  git diff -- app/service/vocabulary/notes.py tests/test_vocabulary_notes.py
  ```

  Expected: all fixture tests pass, and the diff contains no schema migration or FTS rebuild work.

- [ ] **Step 5: Commit the isolated service step.**

  ```bash
  cd /Users/jengzang/CodeProject/dialects/dialects-backend
  git add app/service/vocabulary/notes.py tests/test_vocabulary_notes.py
  git commit -m "feat: query vocabulary character notes"
  ```

## Task 2: Expose the one public backend endpoint

**Files:**

- Modify: `/Users/jengzang/CodeProject/dialects/dialects-backend/app/schemas/vocabulary.py`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-backend/app/routes/vocabulary.py`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-backend/app/common/api_config.py`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-backend/tests/test_vocabulary_routes.py`

- [ ] **Step 1: Add failing endpoint registration, contract, and policy tests.**

  Extend `tests/test_vocabulary_routes.py` to assert the route is registered, its signature contains `q`, `search_fields`, `page`, and `page_size`, and `match_route_config("/api/vocabulary/notes")` is rate-limited but does not require login. Test a `TestClient` request with a blank `q` and with `search_fields=unknown` returns 400; override the service/database dependency or monkeypatch the service for the success-shape assertion.

  ```python
  def test_notes_api_config_is_public_but_rate_limited() -> None:
      from app.service.logging.utils.route_matcher import match_route_config
      config = match_route_config("/api/vocabulary/notes")
      assert config["rate_limit"] is True
      assert config["require_login"] is False

  def test_main_routes_registers_notes_endpoint() -> None:
      from app.main import app
      assert "/api/vocabulary/notes" in {route.path for route in app.routes if getattr(route, "path", None)}
  ```

- [ ] **Step 2: Run the route tests and confirm the new assertions fail.**

  ```bash
  cd /Users/jengzang/CodeProject/dialects/dialects-backend
  pytest tests/test_vocabulary_routes.py -q
  ```

  Expected: failures show the absent route and that generic `/api/vocabulary/*` still requires login.

- [ ] **Step 3: Add Pydantic response models and the async route.**

  Add models that exactly match the frontend contract:

  ```python
  class VocabularyNoteItemResponse(BaseModel):
      id: int
      location_name: str
      character: str
      ipa: str
      notes: str

  class VocabularyNotesResponse(BaseModel):
      items: list[VocabularyNoteItemResponse]
      total: int
      page: int
      page_size: int
  ```

  Import `run_in_threadpool`, `get_db_pool`, `DIALECTS_DB_USER`, `query_vocabulary_notes`, and `VocabularyNotesResponse`. Add this route outside `/search/*` using the exact endpoint name:

  ```python
  @router.get("/notes", response_model=VocabularyNotesResponse)
  async def get_vocabulary_notes(
      q: str = Query(...),
      search_fields: list[str] | None = Query(default=None),
      page: int = Query(1, ge=1),
      page_size: int = Query(50, ge=1, le=200),
  ):
      try:
          return await run_in_threadpool(
              query_vocabulary_notes,
              db_pool=get_db_pool(DIALECTS_DB_USER),
              q=q,
              search_fields=search_fields,
              page=page,
              page_size=page_size,
          )
      except ValueError as exc:
          raise HTTPException(status_code=400, detail=str(exc)) from exc
  ```

  Add the exact-policy entry before the generic `/api/vocabulary/*` match in `api_config.py`:

  ```python
  "/api/vocabulary/notes": {
      "rate_limit": True,
      "require_login": False,
      "log_params": True,
      "log_body": False,
  },
  ```

  Preserve the existing generic policy and all existing routes. The endpoint does not expose an admin/user database selector.

- [ ] **Step 4: Run backend endpoint tests and inspect the complete backend diff.**

  ```bash
  cd /Users/jengzang/CodeProject/dialects/dialects-backend
  pytest tests/test_vocabulary_notes.py tests/test_vocabulary_routes.py -q
  git diff --check
  git diff -- app/schemas/vocabulary.py app/routes/vocabulary.py app/common/api_config.py tests/test_vocabulary_routes.py
  ```

  Expected: contract/policy tests pass; `/api/vocabulary/notes` is public and rate limited while private vocabulary APIs retain their existing policy.

- [ ] **Step 5: Commit the endpoint step with only its listed files.**

  ```bash
  cd /Users/jengzang/CodeProject/dialects/dialects-backend
  git add app/schemas/vocabulary.py app/routes/vocabulary.py app/common/api_config.py tests/test_vocabulary_routes.py
  git commit -m "feat: expose vocabulary notes search"
  ```

## Task 3: Add the frontend API client contract

**Files:**

- Modify: `project/src/api/main/vocabulary.js`
- Modify: `project/src/api/index.js`
- Modify: `project/tests/vocabularyApi.test.js`

- [ ] **Step 1: Write failing URL/client tests.**

  Add tests that request a one-character annotation query, a two-character IPA query, and a `search_fields` list. Assert the builder uses `/api/vocabulary/notes`, serializes only `q`, `search_fields`, `page`, and `page_size`, and does not serialize locations, province, city, or standard words.

  ```js
  it('builds notes requests without vocabulary-only filters', async () => {
    const path = buildVocabularyNotesPath({
      q: '文白', search_fields: ['detail'], page: 2, page_size: 50,
      locations: ['广州'], standard_words: ['白'],
    })
    const params = paramsFromPath(path)
    expect(path).toContain('/api/vocabulary/notes?')
    expect(params.get('q')).toBe('文白')
    expect(params.getAll('search_fields')).toEqual(['detail'])
    expect(params.has('locations')).toBe(false)
    expect(params.has('standard_words')).toBe(false)
  })
  ```

- [ ] **Step 2: Run the focused frontend API test and confirm it fails.**

  ```bash
  cd project
  npm test -- vocabularyApi.test.js
  ```

  Expected: failure because `buildVocabularyNotesPath` and `getVocabularyNotes` do not exist.

- [ ] **Step 3: Implement the smallest helper/export surface.**

  Add `VOCABULARY_NOTES_ENDPOINT = '/api/vocabulary/notes'`, JSDoc response types, and the following builder/client alongside the existing vocabulary helpers. Reuse the repository's existing repeated-query serialization utility so `search_fields` follows the established vocabulary-search convention.

  ```js
  export function buildVocabularyNotesPath(params = {}) {
    return VOCABULARY_NOTES_ENDPOINT + appendQueryParams({
      q: params.q,
      search_fields: params.search_fields,
      page: params.page,
      page_size: params.page_size,
    })
  }

  export async function getVocabularyNotes(params = {}) {
    try {
      return await api(buildVocabularyNotesPath(params))
    } catch (error) {
      showError(error.message || '获取字表注释失败')
      throw error
    }
  }
  ```

  Re-export both functions from `project/src/api/index.js`. Do not modify an existing path builder.

- [ ] **Step 4: Verify and review the frontend API-only diff.**

  ```bash
  cd project
  npm test -- vocabularyApi.test.js
  git diff --check
  git diff -- src/api/main/vocabulary.js src/api/index.js tests/vocabularyApi.test.js
  ```

  Expected: test passes and the output contains no change to existing vocabulary request URLs.

- [ ] **Step 5: Commit the frontend API client step.**

  ```bash
  git add project/src/api/main/vocabulary.js project/src/api/index.js project/tests/vocabularyApi.test.js
  git commit -m "feat: add vocabulary notes API client"
  ```

## Task 4: Make character-note mode routable and card-only

**Files:**

- Modify: `project/src/main/router/menuRoutes.js`
- Modify: `project/src/main/views/menu/VocabularyPage.vue`
- Modify: `project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue`
- Create or modify: `project/tests/vocabularyCharacterNotesMode.test.js`

- [ ] **Step 1: Write failing route-mode contract tests.**

  Assert the router allowlist includes exactly both `tab` and `source`; the parent page derives `route.query.source === 'character-notes'` and conditionally hides only `page-tab-navigation`; and the view page resolves character-note mode to `card` before normal `tab` logic.

  ```js
  expect(menuRoutes).toContain("queryAllowlist: ['tab', 'source']")
  expect(vocabularyPage).toContain("route.query.source === 'character-notes'")
  expect(vocabularyPage).toContain('v-if="!isCharacterNotesMode"')
  expect(vocabularyViewPage).toContain("if (isCharacterNotesMode.value) return 'card'")
  ```

- [ ] **Step 2: Run the source-mode test and confirm it fails.**

  ```bash
  cd project
  npm test -- vocabularyCharacterNotesMode.test.js
  ```

  Expected: assertions fail before the new route state exists.

- [ ] **Step 3: Implement the strict, backward-compatible route behavior.**

  In `menuRoutes.js`, change only the vocabulary child allowlist to `['tab', 'source']`. In `VocabularyPage.vue`, add:

  ```js
  const isCharacterNotesMode = computed(() => route.query.source === 'character-notes')
  ```

  Add `v-if="!isCharacterNotesMode"` to the existing `.page-tab-navigation` element only. Do not move the title, router view, permission loading, or existing tab metadata.

  In `VocabularyViewPage.vue`, define the same computed source test. Make `resolveViewModeFromRoute()` return `'card'` before reading `route.query.tab` when it is true. The source-switch handler uses `router.push` to set/remove `source` and set `tab=card`; a route watcher uses `router.replace` only to normalize malformed `source=character-notes&tab=map` or `table`, retaining every unrelated allowlisted query. Unknown `source` values retain existing behavior.

- [ ] **Step 4: Verify, inspect, and commit this routing-only step.**

  ```bash
  cd project
  npm test -- vocabularyCharacterNotesMode.test.js
  git diff --check
  git diff -- src/main/router/menuRoutes.js src/main/views/menu/VocabularyPage.vue src/main/views/explore/word/vocabulary/VocabularyViewPage.vue tests/vocabularyCharacterNotesMode.test.js
  git add project/src/main/router/menuRoutes.js project/src/main/views/menu/VocabularyPage.vue project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue project/tests/vocabularyCharacterNotesMode.test.js
  git commit -m "feat: add vocabulary character notes route mode"
  ```

## Task 5: Add the source switch and split the search-field controls

**Files:**

- Modify: `project/src/main/views/explore/word/vocabulary/VocabularyTopControls.vue`
- Modify: `project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue`
- Modify: `project/tests/vocabularyCharacterNotesMode.test.js`

- [ ] **Step 1: Write failing top-control contracts.**

  Cover an explicit default-on `showVocabularySource` prop/emitter bridge, the two source-specific field option arrays, and vocabulary-only conditional controls. Assert the character-note options are `pronunciation` and `detail`, while the current vocabulary options remain present.

  ```js
  expect(topControls).toContain('showVocabularySource: { type: Boolean, default: true }')
  expect(topControls).toContain("'update:showVocabularySource'")
  expect(topControls).toContain('v-model="showVocabularySourceModel"')
  expect(topControls).toContain("value: 'pronunciation'")
  expect(topControls).toContain("value: 'detail'")
  expect(topControls).toContain('v-if="showVocabularySource"')
  ```

- [ ] **Step 2: Run the focused test and confirm the switch/field contracts fail.**

  ```bash
  cd project
  npm test -- vocabularyCharacterNotesMode.test.js
  ```

  Expected: source prop, note field list, and source-specific visibility do not yet exist.

- [ ] **Step 3: Implement the UI behavior without resetting vocabulary state.**

  Add `showVocabularySource` prop/default and an `update:showVocabularySource` computed bridge in `VocabularyTopControls.vue`. Keep the gear visible. Make its model/options source-aware:

  ```js
  const noteSearchFieldOptions = computed(() => [
    { value: 'pronunciation', label: t('words.wordList.search.fields.pronunciation') },
    { value: 'detail', label: t('words.wordList.search.fields.notes') },
  ])
  const displayedSearchFieldOptions = computed(() =>
    props.showVocabularySource ? searchFieldOptions.value : noteSearchFieldOptions.value,
  )
  ```

  Bind the gear to a source-specific `selectedCharacterNoteSearchFields` model when off. Reuse the existing final-uncheck behavior that emits `[]` to mean all fields. Retain a separate `vocabulary_notes_search_fields` local-storage value; do not overwrite the existing vocabulary search-fields key. On read, filter saved values against `noteSearchFieldOptions`; malformed, unknown, or non-array storage falls back to `[]`.

  Conditionalize only the location-details button, region-mode section, standard-word section, and external filter strip on `showVocabularySource`. The search input and gear remain visible in both modes. The parent passes `showVocabularySource="!isCharacterNotesMode"`; when its value changes, close the field selector and location/map detail modals, then update only `source`/`tab=card`, preserving existing vocabulary filters in memory.

- [ ] **Step 4: Verify controls and inspect source-scoped template/style changes.**

  ```bash
  cd project
  npm test -- vocabularyCharacterNotesMode.test.js
  git diff --check
  git diff -- src/main/views/explore/word/vocabulary/VocabularyTopControls.vue src/main/views/explore/word/vocabulary/VocabularyViewPage.vue tests/vocabularyCharacterNotesMode.test.js
  ```

  Expected: only requested controls hide; the modal still exposes two selectable note fields when source is off.

- [ ] **Step 5: Commit the source-control step.**

  ```bash
  git add project/src/main/views/explore/word/vocabulary/VocabularyTopControls.vue project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue project/tests/vocabularyCharacterNotesMode.test.js
  git commit -m "feat: add character notes source controls"
  ```

## Task 6: Add isolated character-note requests, cards, and pagination

**Files:**

- Modify: `project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue`
- Modify: `project/src/main/views/explore/word/vocabulary/vocabulary.scss`
- Modify: `project/tests/vocabularyCharacterNotesMode.test.js`

- [ ] **Step 1: Write failing source-state/card contracts.**

  Add tests that assert a dedicated `characterNoteEntries`, `characterNoteTotal`, `characterNotePage`, `characterNoteLoadError`, `characterNoteActiveRequestKey`, and `characterNotePendingRequestMap`; a `getVocabularyNotes` call with only API-supported parameters; the static location label in note mode; IPA rendering; no definition row; and the location-only layout modifier.

  ```js
  expect(vocabularyViewPage).toContain('const characterNoteEntries = ref([])')
  expect(vocabularyViewPage).toContain('getVocabularyNotes({')
  expect(vocabularyViewPage).toContain('search_fields: selectedCharacterNoteSearchFields.value')
  expect(vocabularyViewPage).toContain('class="card-location pill-btn card-location-pill"')
  expect(vocabularyViewPage).toContain('card-location-definition-pair--location-only')
  expect(vocabularyScss).toContain('.card-location-definition-pair--location-only')
  ```

- [ ] **Step 2: Run the test and confirm it fails before request isolation exists.**

  ```bash
  cd project
  npm test -- vocabularyCharacterNotesMode.test.js
  ```

  Expected: assertions for dedicated note state, API call, and card modifier fail.

- [ ] **Step 3: Implement isolated note state and stale-response protection.**

  Keep all existing vocabulary refs and map/table predicates intact. Add independent note refs plus a request key and a pending-request map. The request function must trim only outer whitespace, skip if blank, set page 1 for query/field changes, and call exactly:

  ```js
  await getVocabularyNotes({
    q: normalizedQuery,
    search_fields: selectedCharacterNoteSearchFields.value,
    page: requestedPage,
    page_size: PAGE_SIZE,
  })
  ```

  Do not send locations, province, city, or standard words. Before committing a response, check both `characterNoteActiveRequestKey.value === requestKey` and `isCharacterNotesMode.value`; otherwise discard it. On source switch or blank query, invalidate the active key and clear only note entries/total/page/error. A load-more request appends returned `items` exactly as received; it must not use a `Set`, keyed data merge, or display-value deduplication.

  Ensure every existing `shouldUseVocabulary*Api` predicate includes `!isCharacterNotesMode.value`. Also guard the initial and source-change calls to `loadVocabularyLocationOptions`, so a direct character-note deep link does not fetch vocabulary filter data. This prevents vocabulary card/map/table/location-option requests from running in note mode or updating its UI. Keep note load-more visible only when `entries.length < total`, disabled while its own request is pending.

  Render raw rows through the existing card primitives. In note mode, use a static `<span class="card-location pill-btn card-location-pill">` instead of the vocabulary location button; render `item.character`, `item.ipa`, and the existing expandable note area; conditionally omit the definition row. Vue keys use `item.id ?? `${page}-${index}`` only as a malformed-response fallback, never as a dedupe key.

  Add only this scoped SCSS layout correction (with the required mixin import left in place):

  ```scss
  .card-location-definition-pair--location-only {
    grid-template-rows: auto;
  }
  ```

  Preserve all existing shared card visuals, long-note expansion, Chinese strings, emojis, and aspect-ratio-based responsive styling.

- [ ] **Step 4: Verify logic contracts, run the build, and review encoding/style scope.**

  ```bash
  cd project
  npm test -- vocabularyCharacterNotesMode.test.js vocabularyApi.test.js
  npm run build
  git diff --check
  git diff -- src/main/views/explore/word/vocabulary/VocabularyViewPage.vue src/main/views/explore/word/vocabulary/vocabulary.scss tests/vocabularyCharacterNotesMode.test.js
  ```

  Expected: tests and build pass. Review confirms raw duplicate preservation, IPA display, no location click in note mode, and no width-based media query or unrelated visual change.

- [ ] **Step 5: Commit the cards/request step.**

  ```bash
  git add project/src/main/views/explore/word/vocabulary/VocabularyViewPage.vue project/src/main/views/explore/word/vocabulary/vocabulary.scss project/tests/vocabularyCharacterNotesMode.test.js
  git commit -m "feat: render vocabulary character note cards"
  ```

## Task 7: Add translations and perform end-to-end verification

**Files:**

- Modify: `project/src/i18n/locales/zh-CN/words.json`
- Modify: `project/src/i18n/locales/zh-Hant/words.json`
- Modify: `project/src/i18n/locales/en/words.json`
- Modify: `project/tests/vocabularyCharacterNotesMode.test.js`

- [ ] **Step 1: Add failing locale-key tests.**

  Assert each locale contains the same keys under `words.wordList.sourceMode` for `vocabulary`, `characterNotes`, and `enterCharacterNoteQuery`. Include a test that selecting the two note fields creates an API request containing only `pronunciation` and `detail` values rather than vocabulary field names.

- [ ] **Step 2: Run locale/source tests and confirm they fail.**

  ```bash
  cd project
  npm test -- vocabularyCharacterNotesMode.test.js
  ```

  Expected: new locale keys and source-mode behavior are not yet fully covered.

- [ ] **Step 3: Add literal translations without rewriting existing copy.**

  Add only these source-mode values in the three locale files:

  ```json
  {
    "sourceMode": {
      "vocabulary": "词表",
      "characterNotes": "字表注释",
      "enterCharacterNoteQuery": "请输入音标或注释进行搜索"
    }
  }
  ```

  Use the established Traditional Chinese and English equivalents in their respective files. Keep all current locale content byte-for-byte unchanged outside the inserted keys.

- [ ] **Step 4: Run complete automated verification and inspect every changed file.**

  ```bash
  cd /Users/jengzang/CodeProject/dialects/dialects-backend
  pytest tests/test_vocabulary_notes.py tests/test_vocabulary_routes.py -q
  cd /Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project
  npm test -- vocabularyApi.test.js vocabularyCharacterNotesMode.test.js
  npm run build
  cd /Users/jengzang/CodeProject/dialects/dialects-vue-frontend
  git diff --check
  git diff -- project/src/i18n/locales/zh-CN/words.json project/src/i18n/locales/zh-Hant/words.json project/src/i18n/locales/en/words.json project/tests/vocabularyCharacterNotesMode.test.js
  ```

  Then manually verify these URLs and interactions against a backend containing the `notes` endpoint:

  1. `/vocabulary/view?tab=card` opens unchanged with the switch on.
  2. Switching off changes to `?tab=card&source=character-notes`, hides parent tabs and vocabulary-only filters, and leaves the gear with only IPA/annotation fields.
  3. Direct `/vocabulary/view?source=character-notes&tab=map` settles to card mode without a map flash.
  4. `文白` and `文 白` both return the stored `文 白` annotation; result cards show location, character, IPA, and literal note text.
  5. IPA-only search works; `_` and `-` source annotations do not appear.
  6. A page with duplicate display values renders every raw source row; a new query/source switch while a request is pending cannot show stale results.
  7. A blank query sends no request and shows the prompt; switching back restores the untouched vocabulary filters and field selection.

- [ ] **Step 5: Commit the translations and final test contracts.**

  ```bash
  git add project/src/i18n/locales/zh-CN/words.json project/src/i18n/locales/zh-Hant/words.json project/src/i18n/locales/en/words.json project/tests/vocabularyCharacterNotesMode.test.js
  git commit -m "feat: localize vocabulary character notes mode"
  ```

## Final review checklist

- [ ] The only new public backend route is `GET /api/vocabulary/notes`; it is public/rate-limited by an exact rule and never selects the database from client input.
- [ ] Annotation search uses existing `notes_fts`, including one- and two-character queries and Unicode-whitespace normalization; IPA search is literal and escaped.
- [ ] Both configured fields use a rowid `UNION`, raw duplicate records are retained, pagination and total derive from the same matched CTE, and output order is stable.
- [ ] In character-note mode IPA is displayed, the definition row is absent, location is non-clickable, the parent tab navigation is hidden, and map/table are impossible.
- [ ] The notes source's state and `localStorage` fields are isolated from the existing vocabulary source; all current vocabulary APIs are excluded while character-note mode is active.
- [ ] The final diff contains no unrelated router, sitemap, toponym API, locale, style, Chinese-text, emoji, or encoding changes. Inspect both staged and unstaged work before every commit so pre-existing user modifications remain outside this work.
