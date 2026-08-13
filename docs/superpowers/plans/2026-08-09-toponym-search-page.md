# Toponym Search Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an independent natural-village toponym catalog search page at `/explore/villages/search`, parallel to `/explore/villages/toponyms`, for querying concrete place-name entries and loading details only after the user selects a result.

**Architecture:** The new page is a path-route Explore/Villages page. It uses existing API and route organization, but its visual implementation must follow the current shared `glass-*` foundations under `project/src/styles/global/`, not the older `ToponymsPage.vue` visual structure. `ToponymsPage.vue` is useful only for endpoint boundary, request-id stale-response handling, and detail-field semantics; it is not a visual/layout reference for this feature.

**Tech Stack:** Vue 3 `<script setup>`, Vue Router path routes, Vue I18n JSON locale files, existing `api` HTTP client, `SimpleSelectDropdown`, `MultiSelectDropdown`, shared `glass-shell`, `glass-panel`, `glass-subpanel`, `glass-card`, `glass-button`, `glass-field`, `main-card-grid`, state classes from `main/_states.scss`, scoped SCSS with project mixins, and Vitest/build verification through `project/package.json`.

---

## 1. Current Style System Assessment

The current shared style system has been reorganized. Do not base the new page on the older `main-glass-*` / `main-search-field` conventions from `ToponymsPage.vue`.

Use these shared foundations first:

- `project/src/styles/global/_surfaces.scss`
  - `glass-shell`: page/hero shell surface.
  - `glass-panel`: main section/panel surface.
  - `glass-subpanel`: secondary inset panel/state/details surface.
  - `glass-card`: repeated card/result item surface; supports `data-interactive="true"`.
  - `surface-*`: non-glass alternatives, only if the page explicitly needs a solid look.
- `project/src/styles/global/_buttons.scss`
  - `glass-button`
  - variants: `data-variant="primary"`, `secondary`, `danger`, `enter`
  - sizes: `data-size="large"`, `small`, `compact`
  - active state: `data-active="true"`
- `project/src/styles/global/_forms.scss`
  - `glass-field`
  - `data-shape="search"` for search inputs
  - `data-size="compact"` for dense inputs
  - `glass-dropdown-panel` / `glass-dropdown-item` are available for dropdown-like surfaces, though existing select components already wrap most of this.
- `project/src/styles/main/_states.scss`
  - `main-list-state`
  - `main-list-state-title`
  - `main-list-state-text`
- `project/src/components/selector/_selector.scss`
  - `select-trigger`
  - `floating-panel`

Concrete current references:

- `project/src/main/components/map/custom/feature/FeatureCardList.vue`
  - Uses `glass-field data-shape="search"`, `glass-button`, `main-card-grid`, `glass-card`, `glass-subpanel`, and `main-list-state`.
  - Use it only as a template/class-composition reference for card lists and states. Do not copy its responsive CSS because it still contains a width-based media query.
- `project/src/main/views/explore/word/vocabulary/VocabularyImportPage.vue`
  - Uses `glass-panel`, `glass-button`, modal actions, compact dense tool layout.
  - This is a good reference for tool-form density and action hierarchy.
- `project/src/components/import/TabularImportPreview.vue`
  - Uses `glass-button`, `glass-subpanel`, existing select controls, loading state, and dense structured panels.
- `project/src/main/views/explore/yangchun/YangChunOverviewPage.vue`
  - Uses `glass-shell`, `glass-panel`, `glass-subpanel`, `glass-button` in the current visual language.
  - Use it only for shell/panel composition, not for editorial/hero marketing layout.

`ToponymsPage.vue` is explicitly not a visual reference for this new page.

### Current Card / Surface Inventory

Global reusable surface classes in `project/src/styles/global/_surfaces.scss`:

- `glass-shell`: page-level shell.
- `glass-panel`: main panel/container.
- `glass-subpanel`: secondary panel, state block, or detail group.
- `glass-card`: repeated card/item surface; supports `data-interactive="true"`.
- `surface-shell`, `surface-panel`, `surface-subpanel`, `surface-card`: solid/non-glass alternatives.

So the current shared card choices are two card primitives: `glass-card` and `surface-card`. The repo also has many business-local card class names such as `feature-card`, `point-card`, `region-card`, `portal-entry-card`, and `stat-card`, but those are local layout/content classes layered on top of shared surfaces. For this page, result items should use `glass-card`, with a local class only for spacing/text layout.

---

## 2. Product Boundary

### Existing Page: `/explore/villages/toponyms`

Purpose: view national point distribution for a character or name fragment.

Keep these endpoints and behavior unchanged:

- `GET /api/toponyms/points`
- `GET /api/toponyms/names`
- manual local detail lookup through `GET /api/toponyms/details`
- optional official detail lookup through the existing Ministry detail flow

Do not change the distribution page's map behavior, GIS layer behavior, name-tree behavior, point loading, chart settings, or visual layout while implementing the new search page.

### New Page: `/explore/villages/search`

Purpose: query concrete toponym catalog entries.

Use these endpoints:

- `GET /api/toponyms/search`
- `GET /api/toponyms/details`

The search endpoint is list lookup only. It returns `id + name` by default. It must not be treated as a point-distribution endpoint.

### Hard Data Boundary

Allowed flow:

1. User submits the search form.
2. Page calls `/api/toponyms/search`.
3. Result list shows `name` and `id`.
4. User clicks a result card.
5. Page calls `/api/toponyms/details?ids=<id>`.
6. Detail panel shows local details, including coordinates if the detail payload has them.

Disallowed flow:

1. Page calls `/api/toponyms/search`.
2. Page also calls `/api/toponyms/points`.
3. Page merges responses into `id + name + longitude + latitude`.

The “查看分布” action is only a router navigation to `/explore/villages/toponyms` with `q` and `match_mode`. The new page must not prefetch `/points`.

---

## 3. File Structure

### Create

- `project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue`

Keep it as one page component for the first implementation. Do not extract a search form, result list, detail panel, composable, or shared helper unless explicitly confirmed later.

### Modify

- `project/src/api/main/toponyms.js`
  - Add `getToponymSearch`.
- `project/src/api/index.js`
  - Export `getToponymSearch`.
- `project/src/main/router/exploreRoutes.js`
  - Add the path route.
- `project/src/main/config/BarAndTabs/ExploreBarConfig.js`
  - Add the villages child navigation entry.
- `project/src/main/config/BarAndTabs/SideBarConfig.js`
  - Add the villages child navigation entry.
- `project/src/seo/config.js`
  - Add SEO config and sitemap path.
- `project/src/i18n/locales/zh-CN/navigation.json`
- `project/src/i18n/locales/zh-Hant/navigation.json`
- `project/src/i18n/locales/en/navigation.json`
- `project/src/i18n/locales/zh-CN/villages.json`
- `project/src/i18n/locales/zh-Hant/villages.json`
- `project/src/i18n/locales/en/villages.json`

### Do Not Touch By Default

- `project/src/main/views/explore/villages/toponyms/ToponymsPage.vue`
- `project/src/main/views/explore/villages/toponyms/ToponymDistributionChart.vue`
- `project/src/main/views/explore/villages/toponyms/ToponymResultsPanel.vue`
- `project/src/main/views/explore/villages/toponyms/ToponymSearchBar.vue`
- `project/src/main/views/explore/villages/toponyms/ToponymDetailPanel.vue`
- `project/src/styles/global/*`

Changing shared styles or the existing distribution page is outside this task unless explicitly requested.

---

## 4. Layout Plan

### Overall Composition

Use a compact tool layout:

```vue
<main class="toponym-search-page glass-shell">
  <section class="toponym-search-page__header glass-panel">
    <div class="toponym-search-page__copy">
      <h1>{{ t('villages.pages.toponymSearch.title') }}</h1>
      <p>{{ t('villages.pages.toponymSearch.subtitle') }}</p>
    </div>
    <form class="toponym-search-page__form" @submit.prevent="handleSearch">
      <!-- controls -->
    </form>
  </section>

  <section class="toponym-search-page__workspace">
    <section class="toponym-search-page__results glass-panel">
      <!-- result header + states + card grid/list -->
    </section>
    <aside class="toponym-search-page__detail glass-panel">
      <!-- selected detail -->
    </aside>
  </section>
</main>
```

Visual rules:

- Use `glass-shell` for the page container.
- Use `glass-panel` for the search header, results panel, and detail panel.
- Use `glass-subpanel` for empty/error/loading state blocks and detail field groups.
- Use `glass-card data-interactive="true"` for each clickable search result.
- Use `main-card-grid` if the result list is a card grid. If a denser list is required, use a local grid/list layout but keep each row as `glass-card`.
- Use `glass-button` for all actions.
- Use `glass-field data-shape="search"` for `q`.
- Use `glass-field` for `area_code`.
- Use existing selector components for dropdowns:
  - `SimpleSelectDropdown` for every single-select control.
  - `MultiSelectDropdown` for the multi-select `place_type_code` control.
  - Do not build a local select/dropdown component for this page.

### Desktop / Landscape

Use a two-band layout:

1. Search panel on top:
   - title/subtitle on the left;
   - dense form on the right;
   - controls wrap within the panel.
2. Workspace below:
   - left/main: results;
   - right: details.

Suggested component-local layout only:

```scss
.toponym-search-page {
  @include flex-col;
  gap: 16px;
  width: 100%;
  min-height: 70dvh;
  padding: 20px;
}

.toponym-search-page__header {
  display: grid;
  grid-template-columns: minmax(220px, 0.32fr) minmax(0, 1fr);
  gap: 16px;
  align-items: start;
  padding: 18px;
}

.toponym-search-page__workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
  align-items: start;
}
```

This local CSS is placement/layout only. Do not restyle panel backgrounds, card backgrounds, button colors, or field appearance locally.

### Portrait / Mobile

Use only aspect-ratio responsive rules:

```scss
@media (max-aspect-ratio: 1 / 1) {
  .toponym-search-page {
    padding: 14px;
  }

  .toponym-search-page__header,
  .toponym-search-page__workspace {
    grid-template-columns: 1fr;
  }
}
```

Do not use `max-width`, `min-width`, pixel width breakpoints, or viewport-width font scaling in the new component.

---

## 5. Controls

### Fields

- `q`
  - `input.glass-field[data-shape="search"]`
  - required at submit time only
- `match_mode`
  - use the common `SimpleSelectDropdown`
  - options: `prefix`, `suffix`, `exact`, `contains`
- `place_type_code`
  - use the common `MultiSelectDropdown`
  - defaults: `22200`, `21610`, `27610`
- `area_code`
  - `input.glass-field`
  - optional
- `area_scope`
  - use the common `SimpleSelectDropdown`
  - options: `descendants`, `exact`
  - only sent when `area_code` is non-empty
- `limit`
  - use the common `SimpleSelectDropdown`
  - presets: `50`, `100`, `200`
  - default: `50`

Single-select template pattern:

```vue
<SimpleSelectDropdown
  v-model="matchMode"
  :options="matchModeOptions"
  match-trigger-width
  width="100%"
/>
```

Use the same component pattern for `areaScope` and `limit`. Do not replace these controls with native `<select>`, local dropdown markup, or page-specific select components.

### MultiSelectDropdown Usage

`MultiSelectDropdown` is the common multi-select component currently available in this repository. Its public API is panel-style: it receives `modelValue`, `options`, and `triggerEl`, then teleports the dropdown panel to `body`. Follow existing usage in `VocabularyTopControls.vue` and `RegionSelector.vue`; do not build another multi-select.

Required state:

```js
const selectedPlaceTypeCodes = ref(['22200', '21610', '27610']);
const placeTypeTriggerEl = ref(null);
const placeTypeDropdownOpen = ref(false);
```

Required trigger wrapper:

```vue
<button
  ref="placeTypeTriggerEl"
  class="toponym-search-page__select-trigger select-trigger"
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
```

Label helper:

```js
function formatMultiSelectLabel(selectedValues, options, placeholder) {
  const selectedLabels = selectedValues
    .map((value) => options.find((option) => option.value === value)?.label || value)
    .filter(Boolean);

  if (!selectedLabels.length) return placeholder;
  if (selectedLabels.length === 1) return selectedLabels[0];
  return `${selectedLabels[0]} +${selectedLabels.length - 1}`;
}
```

Do not implement local chip buttons for `place_type_code`. Do not modify `SimpleSelectDropdown` to make it multi-select.

`global-select-trigger` is not a current shared class in this repository. The shared trigger class is `select-trigger`; any extra class on this page should be local placement glue only.

### Buttons

Use `glass-button`, not `main-glass-button`.

- Search: `class="glass-button" data-variant="primary"`
- Reset: `class="glass-button" data-variant="secondary"`
- View distribution: `class="glass-button" data-variant="secondary"`
- Retry after error: `class="glass-button"`
- Small utility buttons, if any: `data-size="small"` or `data-size="compact"`
- Selected result state: set `data-active="true"` on the result card/button where appropriate.

---

## 6. Result and Detail UI

### Result Items

Default result shape:

```json
{
  "id": "92e4878410adb6ebacfc245f2589bc4d",
  "name": "樊家村"
}
```

Render each item as:

```vue
<button
  v-for="item in searchItems"
  :key="item.id || item.name"
  class="toponym-search-page__result-card glass-card"
  data-interactive="true"
  :data-active="selectedItem?.id === item.id"
  type="button"
  :disabled="!item.id"
  @click="handleDetailRequest(item)"
>
  <strong>{{ item.name || t('villages.pages.toponymSearch.detail.unknown') }}</strong>
  <span>{{ item.id || t('villages.pages.toponymSearch.detail.unknown') }}</span>
</button>
```

Use `glass-card` here. This is the most important style correction from the previous plan.

Optional `area_code` and `place_type_code` are not shown by default. Do not send include flags unless the page actually renders those fields.

### State Blocks

Use shared state classes:

```vue
<div class="main-list-state glass-subpanel" data-state="error">
  <div class="main-list-state-title">{{ t('villages.pages.toponymSearch.results.loadFailed') }}</div>
  <p class="main-list-state-text">{{ searchError }}</p>
</div>
```

Use similar `main-list-state glass-subpanel` blocks for idle, empty, loading, and no-detail states.

### Detail Panel

Use a persistent right-side `glass-panel` on landscape and stacked panel on portrait. Do not use map-pointer `HoverDetailCard`; search results are list/card interactions, not map points.

Inside details, use `glass-subpanel` field groups:

```vue
<dl v-if="selectedDetail" class="toponym-search-page__detail-list glass-subpanel">
  <div>
    <dt>{{ t('villages.pages.toponymSearch.detail.name') }}</dt>
    <dd>{{ selectedDetail.name || selectedItem.name || unknownLabel }}</dd>
  </div>
  <div>
    <dt>{{ t('villages.pages.toponymSearch.detail.placeType') }}</dt>
    <dd>{{ selectedDetail.place_type || selectedDetail.place_type_code || unknownLabel }}</dd>
  </div>
  <div>
    <dt>{{ t('villages.pages.toponymSearch.detail.coordinates') }}</dt>
    <dd>{{ formatCoordinates(selectedDetail) }}</dd>
  </div>
  <div>
    <dt>{{ t('villages.pages.toponymSearch.detail.divisionPath') }}</dt>
    <dd>{{ formatDivisionPath(selectedDetail) }}</dd>
  </div>
</dl>
```

---

## 7. API Contract

### Add `getToponymSearch(params = {})`

File: `project/src/api/main/toponyms.js`

Add:

```js
export const TOPONYM_DEFAULT_SEARCH_LIMIT = 50;
const AREA_SCOPES = new Set(['descendants', 'exact']);

function normalizeAreaScope(value) {
  return AREA_SCOPES.has(value) ? value : 'descendants';
}
```

Add a catalog-search-specific param builder. Do not reuse `appendCommonSearchParams` if it would carry point-only params like `bbox` or `zoom` into `/search`.

Required behavior:

- require non-empty `q`;
- normalize `match_mode`;
- default `limit` to `50`;
- append repeated `place_type_code`;
- send `area_code` only when non-empty;
- send `area_scope` only when `area_code` is non-empty;
- send `include_place_type_code` and `include_area_code` only when explicitly requested;
- return `{ items, count, truncated }`;
- fallback count should be `items.length` when backend omits `count`;
- use `getFastApiErrorMessage(error, 'failed to search toponyms')`.

### Preserve Existing Helpers

Do not change the semantics of:

- `getToponymNames`;
- `getToponymPoints`;
- `getToponymDetails`;
- `getToponymOfficialDetail`.

### Export API

File: `project/src/api/index.js`

Export `getToponymSearch` from `./main/toponyms.js`.

---

## 8. Route, Navigation, Portal, and SEO

### Route

File: `project/src/main/router/exploreRoutes.js`

Add:

```js
const ToponymSearchPage = () => import('@/main/views/explore/villages/toponyms/ToponymSearchPage.vue')
```

Add:

```js
{
  path: 'explore/villages/search',
  component: ToponymSearchPage
}
```

Do not remove or redirect `explore/villages/toponyms`.

### Navigation

Files:

- `project/src/main/config/BarAndTabs/ExploreBarConfig.js`
- `project/src/main/config/BarAndTabs/SideBarConfig.js`

Add a villages child entry:

```js
{ label: t('navigation.submenu.villages.toponymSearch'), icon: '🔎', path: withRouteLocale(route, '/explore/villages/search') }
```

Also update villages active matching so `/explore/villages/search` keeps the villages tab active.

Do not remove the existing `toponyms` entry.

### Portal Page

File: `project/src/main/views/menu/portals/VillagesPage.vue`

Do not modify by default. Adding a new visible portal card changes the menu surface and should be a separate confirmed step.

### SEO and Sitemap

File: `project/src/seo/config.js`

Add `/explore/villages/search` title/description and sitemap path. Do not rewrite existing `/explore/villages/toponyms` SEO text.

---

## 9. I18n Plan

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

Traditional Chinese:

```json
"toponymSearch": "地名查詢"
```

Add page copy under `villages.pages.toponymSearch`. Keep edits minimal; do not rewrite existing Chinese copy.

Recommended zh-CN copy:

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
    "loadFailed": "查询失败",
    "count": "找到 {count} 条，当前显示 {shown} 条。",
    "truncated": "结果已截断，请缩小范围或使用更严格的匹配方式。"
  },
  "detail": {
    "title": "条目详情",
    "empty": "点击结果后查看详情。",
    "loading": "正在加载详情...",
    "loadFailed": "详情加载失败",
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

After editing Chinese-heavy JSON, immediately inspect diff for simplified/traditional Chinese integrity, literal emoji, and encoding damage.

---

## 10. Page State and Data Flow

Use local refs:

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

Search flow:

1. Trim `query`.
2. Set `hasSearched = true`.
3. Reset selected item/detail.
4. If query is empty, clear results and show localized empty-query error.
5. Build params:
   - `q`;
   - `match_mode`;
   - `place_type_code` from `selectedPlaceTypeCodes` only when non-empty;
   - `area_code` only when non-empty;
   - `area_scope` only when `area_code` is non-empty;
   - `limit`.
6. Increment `searchRequestId`.
7. Call `getToponymSearch`.
8. Ignore stale responses.
9. Update `searchItems`, `searchCount`, and `searchTruncated`.

Detail flow:

1. User clicks a result card.
2. Store `selectedItem`.
3. Reset previous detail.
4. Increment `detailRequestId`.
5. Call `getToponymDetails(selectedItem.id)`.
6. Ignore stale responses.
7. Set `selectedDetail = payload.items[0] || null`.

Distribution navigation:

```js
router.push({
  path: buildLocalePath(resolveRouteLocale(route), '/explore/villages/toponyms'),
  query: {
    q: query.value.trim(),
    match_mode: matchMode.value,
  },
});
```

Do not add query hydration or auto-search behavior to `ToponymsPage.vue` in this task.

---

## 11. Edge Cases

- Empty query: no request; clear previous results; show localized error.
- `contains`: allowed, button-submit only; no input-triggered requests.
- Limit: default `50`; preset values `50`, `100`, `200`.
- All place types deselected: omit `place_type_code`.
- Empty `area_code`: do not send `area_scope`.
- Search response missing `items`: use `[]`.
- Search response missing `count`: use `items.length`.
- Search result missing `id`: render disabled card; do not request detail.
- Detail response empty: show no-detail state.
- Missing coordinates: show unknown.
- Missing `division_path`: show unknown.
- Stale search/detail responses: ignore via request id.
- Details endpoint limit: request one id at a time.

---

## 12. Implementation Tasks

### Task 1: API Helper

**Files:**

- Modify: `project/src/api/main/toponyms.js`
- Modify: `project/src/api/index.js`

- [ ] Inspect current state:

```bash
git status --short
git diff -- project/src/api/main/toponyms.js project/src/api/index.js
```

- [ ] Add `TOPONYM_DEFAULT_SEARCH_LIMIT`, `AREA_SCOPES`, `normalizeAreaScope`, and `appendToponymSearchParams`.

- [ ] Add `getToponymSearch`.

- [ ] Export `getToponymSearch`.

- [ ] Run:

```bash
npm --prefix project test
```

- [ ] CR:

```bash
git diff -- project/src/api/main/toponyms.js project/src/api/index.js
```

Confirm:

- existing helpers keep behavior;
- `/search` does not receive `bbox` or `zoom`;
- repeated `place_type_code` is supported;
- `area_scope` is only sent when `area_code` is sent.

- [ ] Commit only these files:

```bash
git add project/src/api/main/toponyms.js project/src/api/index.js
git commit -m "feat: add toponym catalog search api"
```

### Task 2: Route, Navigation, SEO, I18n

**Files:**

- Modify: `project/src/main/router/exploreRoutes.js`
- Modify: `project/src/main/config/BarAndTabs/ExploreBarConfig.js`
- Modify: `project/src/main/config/BarAndTabs/SideBarConfig.js`
- Modify: `project/src/seo/config.js`
- Modify: locale files listed in Section 9

- [ ] Inspect current state:

```bash
git status --short
git diff -- project/src/main/router/exploreRoutes.js project/src/main/config/BarAndTabs/ExploreBarConfig.js project/src/main/config/BarAndTabs/SideBarConfig.js project/src/seo/config.js project/src/i18n/locales/zh-CN/navigation.json project/src/i18n/locales/zh-Hant/navigation.json project/src/i18n/locales/en/navigation.json project/src/i18n/locales/zh-CN/villages.json project/src/i18n/locales/zh-Hant/villages.json project/src/i18n/locales/en/villages.json
```

- [ ] Add route import and route entry.

- [ ] Add navigation labels and villages child entries.

- [ ] Add SEO and sitemap entry.

- [ ] Add i18n copy with minimal localized JSON patches.

- [ ] CR:

```bash
git diff -- project/src/main/router/exploreRoutes.js project/src/main/config/BarAndTabs/ExploreBarConfig.js project/src/main/config/BarAndTabs/SideBarConfig.js project/src/seo/config.js project/src/i18n/locales/zh-CN/navigation.json project/src/i18n/locales/zh-Hant/navigation.json project/src/i18n/locales/en/navigation.json project/src/i18n/locales/zh-CN/villages.json project/src/i18n/locales/zh-Hant/villages.json project/src/i18n/locales/en/villages.json
```

Confirm:

- existing Chinese copy is not rewritten;
- Traditional Chinese remains Traditional Chinese;
- literal emoji remain literal;
- no route replaces `/explore/villages/toponyms`;
- no portal card is added unless separately confirmed.

- [ ] Commit only these files:

```bash
git add project/src/main/router/exploreRoutes.js project/src/main/config/BarAndTabs/ExploreBarConfig.js project/src/main/config/BarAndTabs/SideBarConfig.js project/src/seo/config.js project/src/i18n/locales/zh-CN/navigation.json project/src/i18n/locales/zh-Hant/navigation.json project/src/i18n/locales/en/navigation.json project/src/i18n/locales/zh-CN/villages.json project/src/i18n/locales/zh-Hant/villages.json project/src/i18n/locales/en/villages.json
git commit -m "feat: route toponym search page"
```

### Task 3: Page UI and Search Flow

**Files:**

- Create: `project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue`

- [ ] Inspect current state:

```bash
rg --files project/src/main/views/explore/villages/toponyms
git status --short
```

- [ ] Create page with:

```js
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import { getToponymDetails, getToponymSearch } from '@/api';
import MultiSelectDropdown from '@/components/selector/MultiSelectDropdown.vue';
import SimpleSelectDropdown from '@/components/selector/SimpleSelectDropdown.vue';
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js';
```

- [ ] Use `glass-shell`, `glass-panel`, `glass-subpanel`, `glass-card`, `glass-button`, `glass-field`, `main-card-grid`, and `main-list-state` in the template.

- [ ] Implement `handleSearch`.

- [ ] Implement idle/loading/error/empty states with `main-list-state glass-subpanel`.

- [ ] Render results as `glass-card data-interactive="true"`.

- [ ] Add scoped SCSS that only handles local placement, spacing, sizing, and layout.

- [ ] Run:

```bash
npm --prefix project test
```

- [ ] CR:

```bash
git diff -- project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
```

Confirm:

- no `main-glass-*` or `main-search-field` is used;
- result items use `glass-card`;
- buttons use `glass-button`;
- inputs use `glass-field`;
- no `/api/toponyms/points` import/call exists;
- no width-based media query exists;
- style block uses `scoped lang="scss"` and imports mixins;
- visual appearance comes from shared classes first.

- [ ] Commit:

```bash
git add project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
git commit -m "feat: add toponym search page"
```

### Task 4: Detail Flow and Distribution Navigation

**Files:**

- Modify: `project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue`

- [ ] Implement result-card click detail loading.

- [ ] Render detail groups inside `glass-subpanel`.

- [ ] Add formatting helpers:

```js
function formatCoordinates(detail) {
  const lng = Number(detail?.longitude);
  const lat = Number(detail?.latitude);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return t('villages.pages.toponymSearch.detail.unknown');
  }
  return `${lng.toFixed(6)}, ${lat.toFixed(6)}`;
}

function formatDivisionPath(detail) {
  const path = Array.isArray(detail?.division_path) ? detail.division_path : [];
  const names = path.map((item) => item?.name).filter(Boolean);
  return names.length ? names.join(' / ') : t('villages.pages.toponymSearch.detail.unknown');
}
```

- [ ] Add “查看分布” as `glass-button data-variant="secondary"`.

- [ ] Run:

```bash
npm --prefix project test
```

- [ ] CR:

```bash
git diff -- project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
```

Confirm:

- details are requested only after clicking one result;
- only one id is passed to `getToponymDetails`;
- coordinates come only from details;
- search page does not request `/points`;
- no `HoverDetailCard` map-style interaction was introduced.

- [ ] Commit:

```bash
git add project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
git commit -m "feat: show toponym search details"
```

### Task 5: Verification

**Files:**

- No planned source changes.

- [ ] Run:

```bash
npm --prefix project test
npm --prefix project run build
```

- [ ] Search for boundary/style violations:

```bash
rg -n "getToponymPoints|/api/toponyms/points|toponyms/points" project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
rg -n "main-glass|main-search-field" project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
rg -n "max-width|min-width" project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
rg -n "display:\\s*flex;\\s*flex-direction:\\s*column|overflow:\\s*hidden;\\s*text-overflow:\\s*ellipsis;\\s*white-space:\\s*nowrap" project/src/main/views/explore/villages/toponyms/ToponymSearchPage.vue
```

Expected: no matches.

- [ ] Inspect full diff:

```bash
git diff
git status --short
```

Confirm:

- unrelated existing changes are not staged;
- Chinese, Traditional Chinese, and emoji are intact;
- `/explore/villages/toponyms` is unchanged;
- `/explore/villages/search` is the only new page route.

---

## 13. Current Workspace Warning

At plan time, the workspace has unrelated changes:

- `project/public/sitemap.xml`
- `project/src/main/components/map/Draw/modals/MapDrawImageExportModal.vue`
- `project/src/main/views/explore/word/vocabulary/VocabularyImportPage.vue`
- `docs/reference/`
- `docs/zhihu/阳春/`

Implementation must not stage, commit, revert, or rewrite these unless the user explicitly brings them into scope.

---

## 14. Decisions Requiring Confirmation Before Implementation

Do not include these by default:

1. Adding a new portal card in `VillagesPage.vue`.
2. Extracting reusable components or composables.
3. Modifying shared `glass-*` styles.
4. Modifying existing `ToponymsPage.vue` query hydration or auto-search behavior.
5. Auto-searching on mount when `/explore/villages/search?q=...` is opened.
6. Showing `area_code` or `place_type_code` columns by default via include flags.
7. Batch detail lookup for multiple selected ids.

---

## 15. Self-Review Checklist

- The plan uses current `glass-*` shared styles.
- The plan requires `glass-card` for result items.
- The plan does not use `ToponymsPage.vue` as a visual reference.
- The plan keeps `/explore/villages/search` independent from `/explore/villages/toponyms`.
- The new page never calls `/api/toponyms/points`.
- The new page never joins search results with point data.
- Details are fetched only after selecting one item.
- Responsive behavior uses only `@media (max-aspect-ratio: 1 / 1)`.
- Component styles only handle local layout glue.
- Chinese/Traditional Chinese/emoji CR is required before commits.
