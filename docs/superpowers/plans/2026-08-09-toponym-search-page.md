# Toponym Search Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independent natural-village toponym catalog search page at `/explore/villages/search`, keeping it parallel to, not a replacement for, the existing distribution page at `/explore/villages/toponyms`.

**Architecture:** The new page follows the current main Explore/Villages page organization: route entry in `project/src/main/router/exploreRoutes.js`, navigation entries in the existing bar/sidebar configs, localized copy in `project/src/i18n/locales/*/villages.json` and `navigation.json`, API helpers in `project/src/api/main/toponyms.js`, and a Vue page under `project/src/main/views/explore/villages/toponyms/`. It reuses the existing glass container/panel/button/input/select style system and the detail-copy logic from the current toponym page, but it keeps its data flow separate from the map distribution workflow.

**Tech Stack:** Vue 3 `<script setup>`, Vue Router path routes, Vue I18n JSON locale files, existing `api` HTTP client, scoped SCSS using `@use '@/styles/global/mixins' as *;`, design tokens from `project/src/styles/global/_tokens.scss`, existing `SimpleSelectDropdown`, existing `MultiSelectDropdown`, existing `HoverDetailCard`, and project test/build commands.

---

## 1. Product Boundary

### Existing Page: `/explore/villages/toponyms`

Purpose: view national point distribution for a character or name fragment.

Keep these endpoints and behavior unchanged:

- `GET /api/toponyms/points`
- `GET /api/toponyms/names`
- Manual local detail lookup through `GET /api/toponyms/details`
- Optional official detail lookup through the existing Ministry detail flow

Do not change the distribution page's map behavior, GIS layer behavior, name-tree behavior, point loading, chart settings, or visual layout while implementing the new search page.

### New Page: `/explore/villages/search`

Purpose: query concrete toponym catalog entries.

Use these endpoints:

- `GET /api/toponyms/search`
- `GET /api/toponyms/details`

The search endpoint is a list lookup only. It returns `id + name` by default. It must not be treated as a point-distribution endpoint.

### Hard Data Boundary

The new page must not automatically join `/api/toponyms/search` results with `/api/toponyms/points` results to create a table containing `id + name + longitude + latitude`.

Allowed flow:

1. User submits the search form.
2. Page calls `/api/toponyms/search`.
3. Result list shows `name` and `id`.
4. User clicks a result row.
5. Page calls `/api/toponyms/details?ids=<id>`.
6. Detail panel shows local details, including coordinates if the detail payload has them.

Disallowed flow:

1. User submits the search form.
2. Page calls `/api/toponyms/search`.
3. Page also calls `/api/toponyms/points`.
4. Page tries to merge the two responses by id/name/coordinates.

The “查看分布” action is only a router navigation to `/explore/villages/toponyms` with `q` and `match_mode`. It does not prefetch `/points` inside the new search page.

---

## 2. Current Project Organization To Follow

### Existing Toponym Page Shape

The existing distribution page is `project/src/main/views/explore/villages/toponyms/ToponymsPage.vue`.

Its page-level conventions should be copied:

- outer shell: `glass-container glass-container-shell`;
- top control panel: `main-glass-panel` with `main-glass-panel-inner`;
- page copy block with compact `h1` and `p`;
- landscape layout as a grid;
- portrait/mobile layout with `@media (max-aspect-ratio: 1 / 1)`;
- no width-based responsive breakpoints;
- detail overlay via `Teleport to="body"` and `HoverDetailCard`;
- scoped style block with `lang="scss"`;
- `@use '@/styles/global/mixins' as *;` at the top of the style block;
- token-based colors, spacing surfaces, borders, and states.

The new page should feel like a sibling tool, not a new product surface.

### Existing Component Patterns

Use:

- `SimpleSelectDropdown` for single-select fields: `match_mode`, `area_scope`, and `limit` if limit is implemented as presets.
- `MultiSelectDropdown` for `place_type_code`, following the existing trigger + Teleport panel usage in `project/src/main/views/explore/word/vocabulary/VocabularyTopControls.vue` and `project/src/main/components/geo/RegionSelector.vue`.
- `main-search-field` for `q` and `area_code`.
- `main-glass-button` for search, reset, detail, and distribution navigation actions.
- `main-glass-panel` and `main-glass-panel-inner` for page surfaces.
- `HoverDetailCard` for the detail panel, matching the existing `ToponymDetailPanel` behavior.
- `InlineIcon` only if an existing icon-style button is needed.

Do not introduce a new visual system, a marketing layout, a hero section, new color palette, or page-level card nesting.

### Multi-Select Type Control

`project/src/components/selector/MultiSelectDropdown.vue` already exists and must be reused for `place_type_code`.

Important usage detail: `MultiSelectDropdown` is the dropdown panel only. It does not render its own trigger. Existing pages create a trigger button with `select-trigger global-select-trigger`, keep a trigger `ref`, and render `MultiSelectDropdown` only while the dropdown is open.

Recommended implementation:

- add `const placeTypeTriggerEl = ref(null)` and `const placeTypeDropdownOpen = ref(false)`;
- render a trigger button using `class="select-trigger global-select-trigger"`;
- compute the trigger label with the same compact style used by `VocabularyTopControls.vue`: placeholder when empty, single selected label when one item is selected, and `firstLabel +N` for multiple selections;
- render `MultiSelectDropdown` with `:model-value="selectedPlaceTypeCodes"`, `:options="placeTypeOptions"`, `:trigger-el="placeTypeTriggerEl"`, `align="left"`, `direction="down"`;
- update `selectedPlaceTypeCodes` through `@update:model-value`;
- close by setting `placeTypeDropdownOpen = false` on `@close`;
- default selected values remain `22200`, `21610`, `27610`.

Do not change `SimpleSelectDropdown` to support multi-select. Do not add a new local chip implementation for this field unless `MultiSelectDropdown` is proven unusable during implementation.

---

## 3. New Page Layout

### Desktop / Landscape

The page uses a two-band layout:

1. Top search controls panel:
   - left: title and subtitle;
   - right: compact form with keyword, match mode, place type multi-select, area code, area scope, limit, and submit button.

2. Workspace grid:
   - main column: search result list;
   - right column: selected result summary / detail status panel.

Suggested grid:

```scss
.toponym-search-page__workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
  align-items: stretch;
}
```

This mirrors the existing distribution page's `minmax(0, 1fr) 360px` pattern, but replaces the chart with a list.

### Portrait / Mobile

Use only:

```scss
@media (max-aspect-ratio: 1 / 1) {
  .toponym-search-page {
    padding: 14px;
  }

  .toponym-search-page__controls-inner,
  .toponym-search-page__workspace {
    grid-template-columns: 1fr;
  }
}
```

Do not use `max-width`, `min-width`, pixel width breakpoints, or viewport-width font scaling.

### Result List

The result list is a tool surface:

- header shows result count and truncated state;
- list rows show `name` as primary text;
- `id` is secondary text in monospace style or small muted text;
- optional `place_type_code` and `area_code` are not shown by default;
- selected row gets a token-based selected state;
- list uses `ui-scrollbar` if scrollable.

Suggested row data displayed by default:

```text
樊家村
92e4878410adb6ebacfc245f2589bc4d
```

### Detail Panel

Use a detail panel on the right in landscape and inside `HoverDetailCard` or stacked panel on portrait. The safest initial implementation is:

- keep a right-side panel in the workspace for the selected detail;
- optionally use `HoverDetailCard` only if the implementation can match the current `ToponymsPage.vue` interaction cleanly.

Because search results are list rows rather than map points, a persistent right-side detail panel is easier to understand than a pointer-positioned floating card. If a floating detail is used, set a fixed card position rather than relying on chart event coordinates.

Detail fields:

- selected result name;
- selected result id;
- local detail source label;
- standard name;
- place type or place type code;
- coordinates formatted as `longitude, latitude`;
- administrative division path;
- error/loading/empty states.

Reuse the current `ToponymDetailPanel.vue` text and formatting ideas, but do not force the existing component if its `selectedPoint` mental model makes the search page awkward. A small dedicated local detail renderer inside `ToponymSearchPage.vue` is acceptable and lower risk than reshaping the existing map component.

---

## 4. API Contract

### Add `getToponymSearch(params = {})`

File: `project/src/api/main/toponyms.js`

The helper should:

- require non-empty `q`;
- normalize `match_mode` with existing `normalizeMatchMode`;
- default `limit` to `50`;
- support repeated `place_type_code`;
- support `area_code`;
- support `area_scope` as `descendants` or `exact`;
- support `include_place_type_code`;
- support `include_area_code`;
- return normalized `{ items, count, truncated }`;
- use `getFastApiErrorMessage(error, 'failed to search toponyms')`.

Expected request example:

```http
GET /api/toponyms/search?q=樊家&match_mode=prefix&place_type_code=22200&limit=50
```

Expected response:

```json
{
  "items": [
    {
      "id": "92e4878410adb6ebacfc245f2589bc4d",
      "name": "樊家村"
    }
  ],
  "count": 1,
  "truncated": false
}
```

### Preserve Existing Helpers

Do not change the semantics of:

- `getToponymNames`;
- `getToponymPoints`;
- `getToponymDetails`;
- `getToponymOfficialDetail`.

The existing `appendCommonSearchParams` includes `bbox` and `zoom` for point distribution. The new search helper may reuse the safe parts of that function if doing so does not add point-only parameters to `/search`. If reuse would blur the endpoint boundary, write a separate append function for catalog search.

### Export API

File: `project/src/api/index.js`

Export:

```js
getToponymSearch
```

from `./main/toponyms.js`.

---

## 5. Route, Navigation, Portal, and SEO

### Route

File: `project/src/main/router/exploreRoutes.js`

Add a lazy import:

```js
const ToponymSearchPage = () => import('@/main/views/explore/villages/toponyms/ToponymSearchPage.vue')
```

Add route:

```js
{
  path: 'explore/villages/search',
  component: ToponymSearchPage
}
```

Do not remove or redirect `explore/villages/toponyms`.

### Explore Route Query Allowlist

File: `project/src/main/router.js`

If the search page is reachable through the `ExploreEntry` `page` query compatibility layer, add a `toponymSearch` variant with:

```js
toponymSearch: ['q', 'match_mode', 'place_type_code', 'area_code', 'area_scope', 'limit']
```

If direct path routing is sufficient, no query-allowlist change is needed for the concrete `/explore/villages/search` route.

### Top Bar and Sidebar

Files:

- `project/src/main/config/BarAndTabs/ExploreBarConfig.js`
- `project/src/main/config/BarAndTabs/SideBarConfig.js`

Add a child entry under `villages`:

```js
{ label: t('navigation.submenu.villages.toponymSearch'), icon: '🔎', path: withRouteLocale(route, '/explore/villages/search') }
```

Also update villages tab matching so the villages tab stays active on `/explore/villages/search`.

Do not remove the existing `toponyms` entry. The new order should keep both visible. Recommended order:

1. `VillagesML`
2. `地名查询`
3. `地名分布`
4. `广东自然村`
5. admin-only `全部自然村`

### Villages Portal Page

File: `project/src/main/views/menu/portals/VillagesPage.vue`

Add one entry button for “地名查询” only if the product wants the portal to expose both search and distribution. Because this is a visible portal structure change, confirm before implementing if the user has not explicitly asked for a portal entry.

If confirmed, add:

- `handleToponymSearch`;
- a new button using existing `entry-button` classes;
- i18n copy under top-level `villages.toponymSearch`.

### SEO and Sitemap

File: `project/src/seo/config.js`

Add:

```js
'/explore/villages/search'
```

with localized title and description. Keep `/explore/villages/toponyms` unchanged.

---

## 6. I18n Plan

Files:

- `project/src/i18n/locales/zh-CN/navigation.json`
- `project/src/i18n/locales/zh-Hant/navigation.json`
- `project/src/i18n/locales/en/navigation.json`
- `project/src/i18n/locales/zh-CN/villages.json`
- `project/src/i18n/locales/zh-Hant/villages.json`
- `project/src/i18n/locales/en/villages.json`

Add navigation key:

```json
"toponymSearch": "地名查询"
```

Use Traditional Chinese in `zh-Hant`, preserving literal characters:

```json
"toponymSearch": "地名查詢"
```

Add page copy under:

```json
"villages": {
  "pages": {
    "toponymSearch": {}
  }
}
```

Recommended zh-CN keys:

```json
{
  "title": "地名查询",
  "subtitle": "查询具体自然村地名条目，点击结果后查看本地详情。",
  "search": {
    "keyword": "关键词",
    "placeholder": "例如：樊家、黄、村",
    "matchMode": "匹配方式",
    "placeType": "地名类型",
    "areaCode": "行政区 code",
    "areaCodePlaceholder": "例如：44",
    "areaScope": "行政区范围",
    "limit": "返回数量",
    "submit": "搜索地名",
    "searching": "搜索中...",
    "reset": "重置"
  },
  "areaScopes": {
    "descendants": "包含下级",
    "exact": "仅当前行政区"
  },
  "limits": {
    "50": "50 条",
    "100": "100 条",
    "200": "200 条"
  },
  "results": {
    "title": "查询结果",
    "idle": "输入关键词后点击搜索。",
    "loading": "正在查询地名...",
    "empty": "没有找到匹配条目。",
    "count": "找到 {count} 条，当前显示 {shown} 条。",
    "truncated": "结果已截断，请缩小范围或使用更严格的匹配方式。",
    "selected": "已选条目"
  },
  "detail": {
    "title": "条目详情",
    "empty": "点击左侧结果后查看详情。",
    "loading": "正在加载详情...",
    "source": "来源",
    "sourceName": "本地地名库",
    "id": "ID",
    "name": "标准地名",
    "placeType": "类型",
    "coordinates": "经纬度",
    "divisionPath": "行政区划",
    "unknown": "未知",
    "viewDistribution": "查看分布"
  },
  "placeTypes": {
    "22200": "自然村/农村居民点",
    "21610": "行政村",
    "27610": "村委会"
  },
  "errors": {
    "emptyQuery": "请输入关键词后再搜索。",
    "search": "无法查询地名。",
    "details": "无法加载本地详情。"
  }
}
```

When editing Chinese-heavy JSON files, use the smallest possible patch and inspect the diff immediately for Chinese, Traditional Chinese, and emoji integrity.

---

## 7. State and Data Flow

### Page State

Use local refs in `ToponymSearchPage.vue`:

```js
const query = ref('');
const matchMode = ref('prefix');
const selectedPlaceTypeCodes = ref(['22200', '21610', '27610']);
const placeTypeTriggerEl = ref(null);
const placeTypeDropdownOpen = ref(false);
const areaCode = ref('');
const areaScope = ref('descendants');
const limit = ref(50);
const hasSearched = ref(false);
const searchItems = ref([]);
const searchCount = ref(0);
const searchTruncated = ref(false);
const searchLoading = ref(false);
const searchError = ref('');
const searchRequestId = ref(0);
const selectedItem = ref(null);
const selectedDetail = ref(null);
const detailLoading = ref(false);
const detailError = ref('');
const detailRequestId = ref(0);
```

This mirrors the request-id protection style already used in `ToponymsPage.vue`.

Add a local label helper for the multi-select trigger, following `VocabularyTopControls.vue`:

```js
function formatMultiSelectLabel(selectedValues, options, placeholder) {
  const selectedLabels = selectedValues
    .map((value) => options.find((option) => option.value === value)?.label || value)
    .filter(Boolean);

  if (!selectedLabels.length) return placeholder;
  if (selectedLabels.length === 1) return selectedLabels[0];
  return `${selectedLabels[0]} +${selectedLabels.length - 1}`;
}

const placeTypeTriggerLabel = computed(() => formatMultiSelectLabel(
  selectedPlaceTypeCodes.value,
  placeTypeOptions.value,
  t('villages.pages.toponymSearch.search.placeType'),
));
```

### Search Flow

1. Trim `query`.
2. Set `hasSearched = true`.
3. Reset selected item/detail.
4. If query is empty, set localized empty-query error and do not call API.
5. Build params:
   - `q`;
   - `match_mode`;
   - `place_type_code` from `selectedPlaceTypeCodes`;
   - `area_code` only when non-empty;
   - `area_scope` only when `area_code` is non-empty;
   - `limit`.
6. Increment `searchRequestId`.
7. Call `getToponymSearch`.
8. Ignore stale responses.
9. Normalize items to array and update count/truncated.

### Detail Flow

1. User clicks a result item.
2. Store `selectedItem`.
3. Reset previous detail.
4. Increment `detailRequestId`.
5. Call `getToponymDetails(selectedItem.id)`.
6. Ignore stale responses.
7. Set `selectedDetail = payload.items[0] || null`.

Do not call details for all search results. Details endpoint has a 10-id limit; this page should request one id at a time.

### Distribution Navigation Flow

Use:

```js
router.push({
  path: buildLocalePath(resolveRouteLocale(route), '/explore/villages/toponyms'),
  query: {
    q: query.value.trim(),
    match_mode: matchMode.value,
  },
});
```

Only include non-empty `q`. Do not include `place_type_code`, `area_code`, `area_scope`, or `limit` unless the existing distribution page explicitly supports and consumes them.

The current distribution page does not read initial `q` and `match_mode` from route query. If implementing this navigation, either:

- add route-query hydration to `ToponymsPage.vue` in a separate reviewed step; or
- keep the navigation query for future compatibility and do not claim the destination auto-searches.

Because adding query hydration changes existing distribution page behavior, treat it as a separate explicit step and review carefully.

---

## 8. Edge Cases

### Empty Query

No request. Show localized error. Keep previous results only if that is consistent with the existing page style; recommended behavior is clearing previous search results to avoid confusing stale data.

### Contains Query

`contains` can be slow, especially single-character searches. Do not perform input-triggered requests. Button-submit only.

Optional non-blocking hint:

- show muted text near match mode when `matchMode === 'contains'`;
- do not block the request unless the backend returns an error.

### Limit

Default `50`. Allow `50`, `100`, and `200` as presets unless the user asks for free numeric input.

Rationale: this is a catalog lookup UI, not a data export page.

### Type Selection

If all type values are deselected, recommended behavior is to omit `place_type_code` and search all backend-supported types. If product wants village-only by default, keep the three default values selected and allow the user to reselect after clearing.

Do not silently re-add types after the user clears them.

### Area Filter

If `area_code` is empty:

- do not send `area_scope`;
- keep the UI scope dropdown enabled or disabled based on clarity. Recommended: keep enabled but send it only with `area_code`, so the form is predictable.

If `area_code` has whitespace:

- trim before sending.

### Optional Include Flags

Do not send `include_area_code=true` or `include_place_type_code=true` in the first implementation unless the result row actually renders those fields.

If adding result chips for type/area later, implement it as a separate reviewed change.

### Search Response Shape

Handle defensively:

- `items` missing or non-array -> `[]`;
- `count` missing -> `items.length`;
- `truncated` missing -> `false`;
- item missing `id` -> render disabled row and do not request detail;
- item missing `name` -> display localized unknown.

### Detail Response Shape

Handle defensively:

- no `items[0]` -> show no-detail state;
- missing `longitude` or `latitude` -> coordinates show unknown;
- missing `division_path` or malformed division path -> administrative path shows unknown;
- `place_type` missing -> fall back to `place_type_code`;
- both missing -> unknown.

### Request Races

Use request ids for search and detail, matching `ToponymsPage.vue`. Stale responses must not overwrite newer state.

### Existing Dirty Workspace

Before each implementation step, run:

```bash
git status --short
```

There are currently unrelated modified/untracked files under map draw and GIS Voronoi work. Do not stage, commit, revert, or modify those files for this feature.

---

## 9. Implementation Tasks

### Task 1: API Helper

**Files:**

- Modify: `project/src/api/main/toponyms.js`
- Modify: `project/src/api/index.js`

- [ ] Inspect current diff:

```bash
git status --short
git diff -- project/src/api/main/toponyms.js project/src/api/index.js
```

- [ ] Add `TOPONYM_DEFAULT_SEARCH_LIMIT = 50`.

- [ ] Add a small helper for catalog-search-only params so `/search` does not inherit `bbox` or `zoom`.

- [ ] Add `getToponymSearch(params = {})`.

- [ ] Export `getToponymSearch` from `project/src/api/index.js`.

- [ ] Run targeted checks:

```bash
npm --prefix project test
```

The test script is defined in `project/package.json` as `vitest run`.

- [ ] CR:

```bash
git diff -- project/src/api/main/toponyms.js project/src/api/index.js
```

Confirm:

- existing `points`, `names`, `details`, and official detail helpers are unchanged except shared safe helpers if needed;
- no point-only params are sent to `/search`;
- repeated `place_type_code` is supported.

- [ ] Commit only these files:

```bash
git add project/src/api/main/toponyms.js project/src/api/index.js
git commit -m "feat: add toponym catalog search api"
```

### Task 2: Route, Navigation, SEO, and I18n Skeleton

**Files:**

- Modify: `project/src/main/router/exploreRoutes.js`
- Modify: `project/src/main/config/BarAndTabs/ExploreBarConfig.js`
- Modify: `project/src/main/config/BarAndTabs/SideBarConfig.js`
- Modify: `project/src/seo/config.js`
- Modify: `project/src/i18n/locales/zh-CN/navigation.json`
- Modify: `project/src/i18n/locales/zh-Hant/navigation.json`
- Modify: `project/src/i18n/locales/en/navigation.json`
- Modify: `project/src/i18n/locales/zh-CN/villages.json`
- Modify: `project/src/i18n/locales/zh-Hant/villages.json`
- Modify: `project/src/i18n/locales/en/villages.json`

- [ ] Inspect current diff:

```bash
git status --short
git diff -- project/src/main/router/exploreRoutes.js project/src/main/config/BarAndTabs/ExploreBarConfig.js project/src/main/config/BarAndTabs/SideBarConfig.js project/src/seo/config.js project/src/i18n/locales/zh-CN/navigation.json project/src/i18n/locales/zh-Hant/navigation.json project/src/i18n/locales/en/navigation.json project/src/i18n/locales/zh-CN/villages.json project/src/i18n/locales/zh-Hant/villages.json project/src/i18n/locales/en/villages.json
```

- [ ] Add the lazy route import and `/explore/villages/search` route.

- [ ] Add navigation labels for `toponymSearch`.

- [ ] Add the new navigation child under villages in both top bar and sidebar.

- [ ] Add localized page copy under `villages.pages.toponymSearch`.

- [ ] Add SEO config and sitemap path for `/explore/villages/search`.

- [ ] CR:

```bash
git diff -- project/src/main/router/exploreRoutes.js project/src/main/config/BarAndTabs/ExploreBarConfig.js project/src/main/config/BarAndTabs/SideBarConfig.js project/src/seo/config.js project/src/i18n/locales/zh-CN/navigation.json project/src/i18n/locales/zh-Hant/navigation.json project/src/i18n/locales/en/navigation.json project/src/i18n/locales/zh-CN/villages.json project/src/i18n/locales/zh-Hant/villages.json project/src/i18n/locales/en/villages.json
```

Confirm:

- Chinese and Traditional Chinese text is intact;
- literal emoji in nav config remains literal emoji;
- existing `toponyms` labels and copy are not rewritten;
- no route replaces `/explore/villages/toponyms`.

- [ ] Commit only these files:

```bash
git add project/src/main/router/exploreRoutes.js project/src/main/config/BarAndTabs/ExploreBarConfig.js project/src/main/config/BarAndTabs/SideBarConfig.js project/src/seo/config.js project/src/i18n/locales/zh-CN/navigation.json project/src/i18n/locales/zh-Hant/navigation.json project/src/i18n/locales/en/navigation.json project/src/i18n/locales/zh-CN/villages.json project/src/i18n/locales/zh-Hant/villages.json project/src/i18n/locales/en/villages.json
git commit -m "feat: route toponym search page"
```

### Task 3: Search Page UI and Search Flow

**Files:**

- Create: `project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue`

- [ ] Inspect current directory:

```bash
rg --files project/src/main/views/explore/villages/toponyms
git status --short
```

- [ ] Create `ToponymSearchPage.vue` using `<script setup>`.

- [ ] Template structure:

```vue
<main class="toponym-search-page glass-container glass-container-shell">
  <section class="toponym-search-page__controls main-glass-panel">
    <div class="toponym-search-page__controls-inner main-glass-panel-inner">
      <div class="toponym-search-page__toolbar-copy">
        <h1>{{ t('villages.pages.toponymSearch.title') }}</h1>
        <p>{{ t('villages.pages.toponymSearch.subtitle') }}</p>
      </div>
      <form class="toponym-search-page__form" @submit.prevent="handleSearch">
        <label class="toponym-search-page__field toponym-search-page__field--query">
          <span>{{ t('villages.pages.toponymSearch.search.keyword') }}</span>
          <input
            class="main-search-field"
            :value="query"
            :placeholder="t('villages.pages.toponymSearch.search.placeholder')"
            autocomplete="off"
            @input="query = $event.target.value"
          >
        </label>
        <label class="toponym-search-page__field">
          <span>{{ t('villages.pages.toponymSearch.search.matchMode') }}</span>
          <SimpleSelectDropdown v-model="matchMode" :options="matchModeOptions" match-trigger-width />
        </label>
        <div class="toponym-search-page__field">
          <span>{{ t('villages.pages.toponymSearch.search.placeType') }}</span>
          <button
            ref="placeTypeTriggerEl"
            class="select-trigger global-select-trigger"
            :class="{ 'is-open': placeTypeDropdownOpen }"
            type="button"
            @click="placeTypeDropdownOpen = !placeTypeDropdownOpen"
          >
            <span class="select-label">{{ placeTypeTriggerLabel }}</span>
            <span class="select-arrow" aria-hidden="true">⌄</span>
          </button>
          <MultiSelectDropdown
            v-if="placeTypeDropdownOpen"
            :model-value="selectedPlaceTypeCodes"
            :options="placeTypeOptions"
            :trigger-el="placeTypeTriggerEl"
            align="left"
            direction="down"
            @update:model-value="selectedPlaceTypeCodes = $event"
            @close="placeTypeDropdownOpen = false"
          />
        </div>
        <label class="toponym-search-page__field">
          <span>{{ t('villages.pages.toponymSearch.search.areaCode') }}</span>
          <input
            class="main-search-field"
            :value="areaCode"
            :placeholder="t('villages.pages.toponymSearch.search.areaCodePlaceholder')"
            autocomplete="off"
            @input="areaCode = $event.target.value"
          >
        </label>
        <label class="toponym-search-page__field">
          <span>{{ t('villages.pages.toponymSearch.search.areaScope') }}</span>
          <SimpleSelectDropdown v-model="areaScope" :options="areaScopeOptions" match-trigger-width />
        </label>
        <label class="toponym-search-page__field">
          <span>{{ t('villages.pages.toponymSearch.search.limit') }}</span>
          <SimpleSelectDropdown v-model="limit" :options="limitOptions" match-trigger-width />
        </label>
        <button class="main-glass-button" type="submit" :disabled="searchLoading">
          {{ searchLoading ? t('villages.pages.toponymSearch.search.searching') : t('villages.pages.toponymSearch.search.submit') }}
        </button>
      </form>
    </div>
  </section>

  <section class="toponym-search-page__workspace">
    <section class="toponym-search-page__results main-glass-panel">
      <div class="toponym-search-page__results-inner main-glass-panel-inner">
        <header class="toponym-search-page__section-header">
          <h2>{{ t('villages.pages.toponymSearch.results.title') }}</h2>
          <span v-if="hasSearched">
            {{ t('villages.pages.toponymSearch.results.count', { count: searchCount, shown: searchItems.length }) }}
          </span>
        </header>
        <p v-if="!hasSearched">{{ t('villages.pages.toponymSearch.results.idle') }}</p>
        <p v-else-if="searchLoading">{{ t('villages.pages.toponymSearch.results.loading') }}</p>
        <p v-else-if="searchError" class="toponym-search-page__error">{{ searchError }}</p>
        <p v-else-if="!searchItems.length">{{ t('villages.pages.toponymSearch.results.empty') }}</p>
        <ol v-else class="toponym-search-page__result-list ui-scrollbar">
          <li v-for="item in searchItems" :key="item.id || item.name">
            <button type="button" :disabled="!item.id" @click="handleDetailRequest(item)">
              <strong>{{ item.name || t('villages.pages.toponymSearch.detail.unknown') }}</strong>
              <span>{{ item.id || t('villages.pages.toponymSearch.detail.unknown') }}</span>
            </button>
          </li>
        </ol>
      </div>
    </section>
    <aside class="toponym-search-page__detail main-glass-panel">
      <div class="toponym-search-page__detail-inner main-glass-panel-inner">
        <header class="toponym-search-page__section-header">
          <h2>{{ t('villages.pages.toponymSearch.detail.title') }}</h2>
        </header>
        <p v-if="!selectedItem">{{ t('villages.pages.toponymSearch.detail.empty') }}</p>
        <p v-else-if="detailLoading">{{ t('villages.pages.toponymSearch.detail.loading') }}</p>
        <p v-else-if="detailError" class="toponym-search-page__error">{{ detailError }}</p>
        <dl v-else class="toponym-search-page__detail-list">
          <div>
            <dt>{{ t('villages.pages.toponymSearch.detail.id') }}</dt>
            <dd>{{ selectedItem.id }}</dd>
          </div>
          <div>
            <dt>{{ t('villages.pages.toponymSearch.detail.name') }}</dt>
            <dd>{{ selectedDetail?.name || selectedItem.name || t('villages.pages.toponymSearch.detail.unknown') }}</dd>
          </div>
        </dl>
      </div>
    </aside>
  </section>
</main>
```

- [ ] Script imports:

```js
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { getToponymDetails, getToponymSearch } from '@/api';
import MultiSelectDropdown from '@/components/selector/MultiSelectDropdown.vue';
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue';
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js';
```

- [ ] Add state from Section 7.

- [ ] Add computed options for match mode, area scope, limit, and place type multi-select.

- [ ] Implement `handleSearch`.

- [ ] Implement selected-row and empty/loading/error states.

- [ ] Add scoped SCSS:

```vue
<style scoped lang="scss">
@use '@/styles/global/mixins' as *;

.toponym-search-page {
  @include flex-col;
  gap: 16px;
  width: 100%;
  min-height: 70dvh;
  padding: 20px;
}

@media (max-aspect-ratio: 1 / 1) {
  .toponym-search-page {
    padding: 14px;
  }
}
</style>
```

Expand styles only with token-based values and existing mixins.

- [ ] Run:

```bash
npm --prefix project test
```

- [ ] CR:

```bash
git diff -- project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
```

Confirm:

- no `/api/toponyms/points` import or call exists;
- no automatic join exists;
- no width media query exists;
- style block uses `scoped lang="scss"` and imports mixins;
- raw `display: flex; flex-direction: column` is not used where `@include flex-col` should be used;
- raw text truncation triple is not used where `@include text-truncate` should be used.

- [ ] Commit only this file:

```bash
git add project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
git commit -m "feat: add toponym search page"
```

### Task 4: Detail Flow and Distribution Navigation

**Files:**

- Modify: `project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue`

- [ ] Add click handling for result rows.

- [ ] Add `handleDetailRequest(item)` that calls `getToponymDetails(item.id)`.

- [ ] Add detail rendering for:

  - id;
  - name;
  - place type;
  - coordinates;
  - division path.

- [ ] Add `formatCoordinates` and `formatDivisionPath` helpers inside the page.

- [ ] Add “查看分布” button using router push to `/explore/villages/toponyms` with `q` and `match_mode`.

- [ ] Do not add query hydration to `ToponymsPage.vue` in this task unless explicitly approved.

- [ ] Run:

```bash
npm --prefix project test
```

- [ ] CR:

```bash
git diff -- project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
```

Confirm:

- details are requested only after a row click;
- only one id is sent to `getToponymDetails`;
- coordinates come only from detail payload;
- distribution navigation does not request points in the search page.

- [ ] Commit:

```bash
git add project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
git commit -m "feat: show toponym search details"
```

### Task 5: Verification

**Files:**

- No planned source changes unless verification reveals a defect.

- [ ] Run project tests from the correct package directory:

```bash
npm --prefix project test
```

- [ ] Run build or type check if available in `project/package.json`:

```bash
npm --prefix project run build
```

- [ ] Search for forbidden boundary violations:

```bash
rg -n "getToponymPoints|/api/toponyms/points|toponyms/points" project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
```

Expected: no matches.

- [ ] Search for width-based media queries in the new page:

```bash
rg -n "max-width|min-width" project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
```

Expected: no matches.

- [ ] Search for raw CSS patterns disallowed by AGENTS:

```bash
rg -n "display:\\s*flex;\\s*flex-direction:\\s*column|overflow:\\s*hidden;\\s*text-overflow:\\s*ellipsis;\\s*white-space:\\s*nowrap" project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
```

Expected: no matches.

- [ ] Inspect full scoped diff:

```bash
git diff
```

Confirm:

- no unrelated map draw or Voronoi changes are staged;
- existing Chinese and Traditional Chinese copy is preserved except newly added keys;
- existing emoji remain literal;
- `/explore/villages/toponyms` remains available;
- `/explore/villages/search` is the only new page route.

---

## 10. Decisions That Need Explicit Confirmation Before Implementation

These are intentionally not included as default implementation work:

1. Adding a new card to `project/src/main/views/menu/portals/VillagesPage.vue`.
2. Extracting shared search form, detail panel, multi-select trigger helper, or result list components.
3. Making `SimpleSelectDropdown` support multi-select.
4. Hydrating `/explore/villages/toponyms` from route query and auto-filling `q` / `match_mode`.
5. Auto-searching on page mount when `/explore/villages/search?q=...` is opened.
6. Showing `area_code` or `place_type_code` columns by default via include flags.
7. Batch detail lookup for multiple selected ids.

Default implementation should avoid all seven unless the user confirms them.

---

## 11. Self-Review Checklist

- This plan keeps `/explore/villages/search` parallel to `/explore/villages/toponyms`.
- The new page never calls `/api/toponyms/points`.
- The new page never joins search results with point data.
- Details are fetched only after selecting an item.
- Detail requests use one id at a time, within the 10-id backend limit.
- The page layout follows current Explore/Villages glass-panel conventions.
- Responsive behavior uses only `@media (max-aspect-ratio: 1 / 1)`.
- SCSS uses project mixins and design tokens.
- The plan avoids structural component extraction unless confirmed.
- The plan includes CR and commit boundaries for each step.
- The plan explicitly protects unrelated dirty workspace changes.
