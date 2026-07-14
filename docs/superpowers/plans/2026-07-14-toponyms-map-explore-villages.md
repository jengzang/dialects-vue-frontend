# Toponyms Map Explore Villages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the natural-village toponyms map as a first-class Explore villages page, placed above Guangdong natural villages, with full-map point visualization, local search, and official Ministry of Civil Affairs detail lookup.

**Architecture:** Implement this as a main-site Explore page under `/explore/villages/toponyms`, not as a new top-level `/toponyms/map` app. Keep the page self-contained but split clear responsibilities: a small API module for toponyms requests, one route-level page for orchestration, focused child components for the MapLibre map, search panel, and detail panel, and tests that lock route/navigation/API/detail behavior. Reuse existing main-site glass surfaces, buttons, inputs, loading, scrollbar, MapLibre patterns, i18n structure, and CSS design tokens.

**Tech Stack:** Vue 3 `<script setup>`, Vue Router path routes, Vue I18n JSON locale files, MapLibre GL layers with clustering, existing `api` HTTP client, `fetch` for the external official detail endpoint, scoped SCSS with nested selectors, Vitest.

---

## 0. Requirements And Decisions

### Source Documents

- `docs/plans/自然村地名地图查询系统_PRD.md`
- `docs/plans/自然村地名地图系统_前端Agent开发文档.md`
- User constraint from this task:
  - Implement `toponyms` related content.
  - Put it in Explore's villages section.
  - It should be a sibling of Guangdong natural villages.
  - It should appear above Guangdong natural villages.
  - Prefer reusing existing components and styles.
  - Do not hardcode colors; use existing tokens.
  - Use real nested SCSS.
  - Keep changes minimal and targeted.

### Route Decision

The PRD names `/toponyms/map`, but repository conventions and the user's explicit placement request override that. Implement the page at:

```text
/explore/villages/toponyms
```

Do not add a new MPA entry, new top-level `/toponyms` route, or query-parameter page identity.

### UX Scope

MVP includes:

- Load all toponym points from `GET /api/toponyms/map`.
- Render them using MapLibre source/layers, not DOM markers.
- Cluster dense points.
- Search loaded points locally by name.
- Click a point to select it.
- Call `POST https://dmfw.mca.gov.cn/9095/stname/detailsPub` directly from the frontend.
- Show detail fields: name, city, county/area, historical name.
- Provide loading, empty, error, retry, and detail-error states.

MVP does not include:

- Backend search.
- Backend detail proxy.
- bbox paging.
- vector tiles.
- heatmaps.
- category or cultural analysis.
- editing or importing toponyms.
- modifying VillagesML internals.

### Existing Worktree Warning

At plan-writing time, these unrelated files are already modified:

```text
project/src/VillagesML/app/router.js
project/src/VillagesML/utils/routeDataset.js
project/src/api/villagesML/request.js
project/src/main/router.js
project/tests/villagesMLApiRequest.test.js
project/tests/villagesMLRouteDataset.test.js
project/src/VillagesML/utils/currentDataset.js
```

Implementation workers must re-run `git status --short` before every task and must not stage, revert, or rewrite these unrelated changes unless the user explicitly asks.

---

## 1. File Structure

### Create

- `project/src/api/main/toponyms.js`
  - Fetches the map GeoJSON from `/api/toponyms/map`.
  - Calls the external Ministry of Civil Affairs detail endpoint.
  - Normalizes detail response shape enough for the UI.

- `project/src/main/views/explore/villages/toponyms/ToponymsMapPage.vue`
  - Route-level orchestration component.
  - Owns loaded GeoJSON, search keyword, selected feature, detail loading/error state.
  - Passes filtered GeoJSON to the map child.

- `project/src/main/views/explore/villages/toponyms/ToponymMap.vue`
  - MapLibre rendering component.
  - Owns map initialization and source/layer updates.
  - Emits point-selection events.

- `project/src/main/views/explore/villages/toponyms/ToponymSearch.vue`
  - Search input and result count summary.
  - Uses existing glass input/button patterns.

- `project/src/main/views/explore/villages/toponyms/ToponymDetail.vue`
  - Detail side panel / floating panel.
  - Displays selected point, official detail fields, loading, error, and empty state.

- `project/tests/toponymsApiContracts.test.js`
  - Locks API path and external detail request shape by source inspection or mocked fetch.

- `project/tests/toponymsRouteExposure.test.js`
  - Locks route exposure and navigation ordering.

- `project/tests/toponymsMapData.test.js`
  - Tests pure helpers for GeoJSON filtering/normalization if helpers are extracted from the page.

### Modify

- `project/src/api/index.js`
  - Re-export `getToponymsMap` and `getToponymOfficialDetail`.

- `project/src/main/router/exploreRoutes.js`
  - Add route `explore/villages/toponyms`.

- `project/src/main/config/BarAndTabs/ExploreBarConfig.js`
  - Add the villages submenu item above Guangdong natural villages.
  - Include the new page key in `matchPages`.

- `project/src/main/config/BarAndTabs/SideBarConfig.js`
  - Add the same submenu item above Guangdong natural villages in both dynamic and static config sections.

- `project/src/main/views/menu/portals/VillagesPage.vue`
  - Add a portal card above Guangdong natural villages.
  - Reuse the existing button/card structure; no new visual system.

- `project/src/i18n/locales/zh-Hant/villages.json`
- `project/src/i18n/locales/zh-CN/villages.json`
- `project/src/i18n/locales/en/villages.json`
  - Add card labels and page strings.

- `project/src/i18n/locales/zh-Hant/navigation.json`
- `project/src/i18n/locales/zh-CN/navigation.json`
- `project/src/i18n/locales/en/navigation.json`
  - Add submenu labels.

- `project/src/main/router/legacyRouteMap.js`
  - Optional compatibility only if the repository already maps old path aliases in the same style.
  - If added, map `/toponyms/map` to `/explore/villages/toponyms`.
  - Do not add query-based identity.

---

## 2. Data Contracts

### Map Endpoint

Frontend expects:

```http
GET /api/toponyms/map
```

Preferred response:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [113.1, 23.2]
      },
      "properties": {
        "id": "123",
        "name": "黄村"
      }
    }
  ]
}
```

The API layer should also tolerate an array fallback if the backend returns rows instead of GeoJSON during early integration:

```json
[
  { "id": "123", "name": "黄村", "longitude": 113.1, "latitude": 23.2 }
]
```

Rows with invalid coordinates must be dropped before map rendering.

### Official Detail Endpoint

Frontend calls directly:

```http
POST https://dmfw.mca.gov.cn/9095/stname/detailsPub
Content-Type: application/json

{ "id": "123" }
```

Expected useful response fields:

```json
{
  "area_name": "天河区",
  "city_name": "广州市",
  "old_name": "旧称"
}
```

Detail handling must tolerate:

- Request blocked by CORS.
- Network timeout.
- HTTP non-2xx.
- Response body not JSON.
- Empty object.
- Missing `old_name`.
- Detail endpoint requiring a different casing or returning nested `data` later.

For MVP, show a friendly detail error while keeping the selected point visible.

---

## 3. Edge Cases

### Data Loading

- Empty `features` array: show empty map state and keep search usable but disabled-looking.
- Backend returns non-GeoJSON: normalize array rows if possible; otherwise show load error.
- Duplicated ids: MapLibre feature ids should not rely on uniqueness unless normalized.
- Missing id: render point but disable official detail lookup for that point.
- Missing name: display fallback from id or localized unknown label.
- Invalid longitude/latitude:
  - Drop points where longitude or latitude is empty, `NaN`, outside longitude `[-180, 180]`, or outside latitude `[-90, 90]`.
  - Count dropped rows in a debug-only or UI hint if feasible.
- Very large dataset:
  - Use `cluster: true`.
  - Do not instantiate one Vue component or DOM marker per point.
  - Do not store duplicate heavy copies beyond raw and filtered GeoJSON.

### Search

- Trim keyword.
- Empty keyword returns all valid points.
- Case-insensitive matching for Latin names.
- Chinese matching is simple substring matching.
- Search should match `properties.name`; optionally include `properties.id` only if useful.
- If search returns zero results, keep the map alive and show a localized no-results state.
- Search must not call the backend.
- Debounce is optional for MVP; if added, use a short local debounce only.

### Map Interaction

- Click cluster:
  - Zoom into cluster using MapLibre cluster expansion zoom.
- Click unclustered point:
  - Emit `{ id, name, coordinates, properties }`.
  - Open detail panel.
- Source update during search:
  - Preserve map instance.
  - Update `setData()` on the existing source.
  - Clear selected detail if the selected point is no longer in filtered results, or show a small warning that the selected point is outside the current filter. Prefer clearing for MVP.
- Map unmount:
  - Remove event listeners and map instance.
- Locale route changes:
  - Route remains path-based and locale-aware via existing route system.

### Official Detail

- Abort stale request when a new point is clicked before the old detail request finishes.
- If browser does not support `AbortController`, ignore stale responses using a request sequence id.
- If detail fetch fails:
  - Show selected point name.
  - Show localized error.
  - Offer retry.
- If id is missing:
  - Do not call external endpoint.
  - Show localized "no official id" message.

### Styling

- No hardcoded colors such as `#fff`, `#333`, `rgba(0,0,0,...)` in new SCSS unless already tokenized through existing variables. Prefer:
  - `var(--text-deep)`
  - `var(--text-secondary)`
  - `var(--glass-*)`
  - `var(--color-primary)`
  - `rgba(var(--color-primary-rgb), alpha)`
  - `rgba(var(--color-shadow-rgb), alpha)`
  - `var(--border-glass)`
  - `var(--radius-*)`
- Reuse:
  - `glass-container glass-container-shell`
  - `main-glass-panel`
  - `main-glass-panel-inner`
  - `main-glass-button`
  - `glass-input`
  - `ui-scrollbar`
  - `ui-loading--page` and `ui-loading--inline`
- Use scoped nested SCSS:

```scss
.toponyms-map-page {
  .toponyms-map-page__header {
    .toponyms-map-page__title {
      color: var(--text-deep);
    }
  }
}
```

Do not create a new broad global SCSS entry for this feature.

### Chinese And Emoji Safety

- Use `apply_patch` with narrow edits.
- Do not rewrite whole locale files unless necessary.
- Keep existing Chinese and emoji unchanged.
- After editing locale files, inspect `git diff -- project/src/i18n/locales/...` for mojibake, escaped emoji, or unintended wording changes.

---

## 4. Task Plan

### Task 1: Lock Existing State And Add API Contract Tests

**Files:**

- Create: `project/tests/toponymsApiContracts.test.js`
- Later modify: `project/src/api/main/toponyms.js`
- Later modify: `project/src/api/index.js`

- [ ] **Step 1: Re-check workspace state**

Run:

```bash
git status --short
```

Expected:

- Existing unrelated VillagesML changes may still appear.
- No implementation files for this task should be staged.

- [ ] **Step 2: Write failing API contract tests**

Create `project/tests/toponymsApiContracts.test.js`:

```js
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('toponyms API contracts', () => {
  it('uses the required map endpoint and direct official detail endpoint', () => {
    const source = readSource('src/api/main/toponyms.js')

    expect(source).toContain('/api/toponyms/map')
    expect(source).toContain('https://dmfw.mca.gov.cn/9095/stname/detailsPub')
    expect(source).toContain('method: \'POST\'')
    expect(source).toContain('JSON.stringify({ id')
  })

  it('exports toponyms APIs from the shared API surface', () => {
    const source = readSource('src/api/index.js')

    expect(source).toContain('getToponymsMap')
    expect(source).toContain('getToponymOfficialDetail')
    expect(source).toContain('./main/toponyms.js')
  })
})
```

- [ ] **Step 3: Run the new test and verify it fails**

Run:

```bash
cd project
npm test -- tests/toponymsApiContracts.test.js
```

Expected:

- FAIL because `src/api/main/toponyms.js` does not exist yet.

- [ ] **Step 4: Implement the API module**

Create `project/src/api/main/toponyms.js`:

```js
import { api } from '@/api/auth/httpClient.js'

const OFFICIAL_DETAIL_URL = 'https://dmfw.mca.gov.cn/9095/stname/detailsPub'

function isFiniteNumber(value) {
  return Number.isFinite(Number(value))
}

function isValidCoordinate(longitude, latitude) {
  const lng = Number(longitude)
  const lat = Number(latitude)
  return Number.isFinite(lng)
    && Number.isFinite(lat)
    && lng >= -180
    && lng <= 180
    && lat >= -90
    && lat <= 90
}

function normalizeFeatureFromRow(row) {
  const longitude = row?.longitude ?? row?.lng ?? row?.lon
  const latitude = row?.latitude ?? row?.lat

  if (!isValidCoordinate(longitude, latitude)) {
    return null
  }

  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [Number(longitude), Number(latitude)],
    },
    properties: {
      ...row,
      id: row?.id == null ? '' : String(row.id),
      name: row?.name == null ? '' : String(row.name),
    },
  }
}

export function normalizeToponymsMapResponse(payload) {
  if (payload?.type === 'FeatureCollection' && Array.isArray(payload.features)) {
    return {
      type: 'FeatureCollection',
      features: payload.features.filter((feature) => {
        const coordinates = feature?.geometry?.coordinates
        return feature?.geometry?.type === 'Point'
          && Array.isArray(coordinates)
          && isValidCoordinate(coordinates[0], coordinates[1])
      }),
    }
  }

  if (Array.isArray(payload)) {
    return {
      type: 'FeatureCollection',
      features: payload.map(normalizeFeatureFromRow).filter(Boolean),
    }
  }

  return {
    type: 'FeatureCollection',
    features: [],
  }
}

export async function getToponymsMap() {
  const payload = await api('/api/toponyms/map')
  return normalizeToponymsMapResponse(payload)
}

export async function getToponymOfficialDetail(id, options = {}) {
  const response = await fetch(OFFICIAL_DETAIL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id }),
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error(`Official detail request failed: ${response.status}`)
  }

  const payload = await response.json()
  const detail = payload?.data && typeof payload.data === 'object' ? payload.data : payload

  return {
    areaName: detail?.area_name || '',
    cityName: detail?.city_name || '',
    oldName: detail?.old_name || '',
    raw: detail || {},
  }
}
```

Notes:

- If the repository's path alias rules complain about `@/api/auth/httpClient.js`, switch to the local relative import pattern used by sibling files: `import { api } from '../auth/httpClient.js'` is incorrect from this location; the correct relative path from `src/api/main/toponyms.js` is `../auth/httpClient.js` only if `auth` is sibling of `main`. Verify before changing.
- Remove the unused `isFiniteNumber` helper if ESLint flags it. If removed, update tests only if necessary.

- [ ] **Step 5: Re-export from `project/src/api/index.js`**

Add near the geo or main business exports:

```js
export {
  getToponymsMap,
  getToponymOfficialDetail,
  normalizeToponymsMapResponse,
} from './main/toponyms.js';
```

- [ ] **Step 6: Run API tests**

Run:

```bash
cd project
npm test -- tests/toponymsApiContracts.test.js
```

Expected:

- PASS.

- [ ] **Step 7: Inspect diff**

Run:

```bash
git diff -- project/src/api/main/toponyms.js project/src/api/index.js project/tests/toponymsApiContracts.test.js
```

Check:

- Only the API module, index export, and test changed.
- No Chinese or emoji text changed.

- [ ] **Step 8: Commit Task 1 only**

Run:

```bash
git add project/src/api/main/toponyms.js project/src/api/index.js project/tests/toponymsApiContracts.test.js
git diff --cached
git commit -m "feat: add toponyms API contracts"
```

---

### Task 2: Add Route And Navigation Exposure

**Files:**

- Modify: `project/src/main/router/exploreRoutes.js`
- Modify: `project/src/main/config/BarAndTabs/ExploreBarConfig.js`
- Modify: `project/src/main/config/BarAndTabs/SideBarConfig.js`
- Modify: `project/src/main/views/menu/portals/VillagesPage.vue`
- Modify: `project/src/i18n/locales/zh-Hant/navigation.json`
- Modify: `project/src/i18n/locales/zh-CN/navigation.json`
- Modify: `project/src/i18n/locales/en/navigation.json`
- Modify: `project/src/i18n/locales/zh-Hant/villages.json`
- Modify: `project/src/i18n/locales/zh-CN/villages.json`
- Modify: `project/src/i18n/locales/en/villages.json`
- Create: `project/tests/toponymsRouteExposure.test.js`

- [ ] **Step 1: Write failing route/navigation test**

Create `project/tests/toponymsRouteExposure.test.js`:

```js
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readSource(relativePath) {
  return readFileSync(resolve(projectRoot, relativePath), 'utf8')
}

describe('toponyms map route exposure', () => {
  it('registers toponyms as an Explore villages path route', () => {
    const source = readSource('src/main/router/exploreRoutes.js')

    expect(source).toContain('explore/villages/toponyms')
    expect(source).toContain('ToponymsMapPage')
    expect(source).not.toContain('/toponyms/map')
  })

  it('places toponyms above Guangdong villages in ExploreBar villages children', () => {
    const source = readSource('src/main/config/BarAndTabs/ExploreBarConfig.js')
    const toponymsIndex = source.indexOf('/explore/villages/toponyms')
    const gdIndex = source.indexOf('/explore/villages/gd')

    expect(toponymsIndex).toBeGreaterThan(-1)
    expect(gdIndex).toBeGreaterThan(-1)
    expect(toponymsIndex).toBeLessThan(gdIndex)
    expect(source).toContain('navigation.submenu.villages.toponyms')
  })

  it('places toponyms above Guangdong villages in SideBar villages children', () => {
    const source = readSource('src/main/config/BarAndTabs/SideBarConfig.js')
    const toponymsIndex = source.indexOf('/explore/villages/toponyms')
    const gdIndex = source.indexOf('/explore/villages/gd')

    expect(toponymsIndex).toBeGreaterThan(-1)
    expect(gdIndex).toBeGreaterThan(-1)
    expect(toponymsIndex).toBeLessThan(gdIndex)
    expect(source).toContain('navigation.submenu.villages.toponyms')
  })

  it('adds the villages portal card above Guangdong villages', () => {
    const source = readSource('src/main/views/menu/portals/VillagesPage.vue')
    const toponymsIndex = source.indexOf('handleToponymsMap')
    const gdIndex = source.indexOf('handleGdVillages')

    expect(toponymsIndex).toBeGreaterThan(-1)
    expect(gdIndex).toBeGreaterThan(-1)
    expect(toponymsIndex).toBeLessThan(gdIndex)
    expect(source).toContain('/explore/villages/toponyms')
  })
})
```

- [ ] **Step 2: Run the route/navigation test and verify it fails**

Run:

```bash
cd project
npm test -- tests/toponymsRouteExposure.test.js
```

Expected:

- FAIL because route and navigation entries are not added yet.

- [ ] **Step 3: Add lazy route**

Modify `project/src/main/router/exploreRoutes.js`:

```js
const ToponymsMapPage = () => import('@/main/views/explore/villages/toponyms/ToponymsMapPage.vue')
```

Add route above `explore/villages/gd`:

```js
{
  path: 'explore/villages/toponyms',
  component: ToponymsMapPage
},
```

- [ ] **Step 4: Add ExploreBar submenu entry**

Modify the villages tab in `project/src/main/config/BarAndTabs/ExploreBarConfig.js`.

Update `matchPages`:

```js
matchPages: ['toponymsMap', 'gdVillages', 'gdVillagesTable', 'ycVillages', 'VillagesML'],
```

Add the child above Guangdong natural villages:

```js
{ label: t('navigation.submenu.villages.toponyms'), icon: '🗺️', path: withRouteLocale(route, '/explore/villages/toponyms') },
```

Do not move unrelated children except as needed to satisfy "above Guangdong natural villages".

- [ ] **Step 5: Add SideBar submenu entry**

Modify both relevant villages children lists in `project/src/main/config/BarAndTabs/SideBarConfig.js`:

Dynamic/i18n list:

```js
{ label: t('navigation.submenu.villages.toponyms'), icon: '🗺️', path: withRouteLocale(route, '/explore/villages/toponyms') },
```

Static fallback list:

```js
{ label: '自然村地名地圖', icon: '🗺️', path: buildLocalePath('zh-Hant', '/explore/villages/toponyms') },
```

Place each above the Guangdong natural villages item.

- [ ] **Step 6: Add portal card**

Modify `project/src/main/views/menu/portals/VillagesPage.vue`.

Add the card above `handleGdVillages`:

```vue
<button class="village-btn" @click="handleToponymsMap">
  <div class="village-icon">🗺️</div>
  <div class="village-name">{{ $t('villages.toponyms.name') }}</div>
  <div class="village-desc">{{ $t('villages.toponyms.desc') }}</div>
</button>
```

Add handler:

```js
const handleToponymsMap = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/explore/villages/toponyms'))
}
```

Do not change the existing card styling.

- [ ] **Step 7: Add i18n keys**

Add to each `navigation.json` under `submenu.villages`:

Traditional:

```json
"toponyms": "自然村地名地圖"
```

Simplified:

```json
"toponyms": "自然村地名地图"
```

English:

```json
"toponyms": "Village Toponyms Map"
```

Add to each `villages.json` root:

Traditional:

```json
"toponyms": {
  "name": "自然村地名地圖",
  "desc": "自然村空間分佈、搜索與官方地名詳情"
}
```

Simplified:

```json
"toponyms": {
  "name": "自然村地名地图",
  "desc": "自然村空间分布、搜索与官方地名详情"
}
```

English:

```json
"toponyms": {
  "name": "Village Toponyms Map",
  "desc": "Spatial distribution, search, and official place-name details"
}
```

- [ ] **Step 8: Run route/navigation tests**

Run:

```bash
cd project
npm test -- tests/toponymsRouteExposure.test.js
```

Expected:

- PASS.

- [ ] **Step 9: Inspect Chinese/emoji diff**

Run:

```bash
git diff -- project/src/main/router/exploreRoutes.js project/src/main/config/BarAndTabs/ExploreBarConfig.js project/src/main/config/BarAndTabs/SideBarConfig.js project/src/main/views/menu/portals/VillagesPage.vue project/src/i18n/locales/zh-Hant/navigation.json project/src/i18n/locales/zh-CN/navigation.json project/src/i18n/locales/en/navigation.json project/src/i18n/locales/zh-Hant/villages.json project/src/i18n/locales/zh-CN/villages.json project/src/i18n/locales/en/villages.json project/tests/toponymsRouteExposure.test.js
```

Check:

- New Chinese strings are literal characters.
- Emoji remains literal `🗺️`.
- No existing Chinese text was rewritten.
- No unrelated order changes beyond requested toponyms placement.

- [ ] **Step 10: Commit Task 2 only**

Run:

```bash
git add project/src/main/router/exploreRoutes.js project/src/main/config/BarAndTabs/ExploreBarConfig.js project/src/main/config/BarAndTabs/SideBarConfig.js project/src/main/views/menu/portals/VillagesPage.vue project/src/i18n/locales/zh-Hant/navigation.json project/src/i18n/locales/zh-CN/navigation.json project/src/i18n/locales/en/navigation.json project/src/i18n/locales/zh-Hant/villages.json project/src/i18n/locales/zh-CN/villages.json project/src/i18n/locales/en/villages.json project/tests/toponymsRouteExposure.test.js
git diff --cached
git commit -m "feat: expose toponyms map in villages navigation"
```

---

### Task 3: Add Pure Toponyms Map Helpers

**Files:**

- Create: `project/src/main/views/explore/villages/toponyms/toponymsMapData.js`
- Create: `project/tests/toponymsMapData.test.js`

- [ ] **Step 1: Write failing helper tests**

Create `project/tests/toponymsMapData.test.js`:

```js
import { describe, expect, it } from 'vitest'

import {
  buildEmptyToponymsFeatureCollection,
  filterToponymsFeatureCollection,
  getToponymFeatureIdentity,
} from '../src/main/views/explore/villages/toponyms/toponymsMapData.js'

describe('toponyms map data helpers', () => {
  it('builds an empty FeatureCollection', () => {
    expect(buildEmptyToponymsFeatureCollection()).toEqual({
      type: 'FeatureCollection',
      features: [],
    })
  })

  it('filters features by trimmed village name keyword', () => {
    const collection = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', properties: { id: '1', name: '黄村' }, geometry: { type: 'Point', coordinates: [113, 23] } },
        { type: 'Feature', properties: { id: '2', name: '白塘' }, geometry: { type: 'Point', coordinates: [114, 24] } },
      ],
    }

    expect(filterToponymsFeatureCollection(collection, ' 黄 ').features).toHaveLength(1)
    expect(filterToponymsFeatureCollection(collection, ' 黄 ').features[0].properties.name).toBe('黄村')
    expect(filterToponymsFeatureCollection(collection, '').features).toHaveLength(2)
  })

  it('returns stable selected feature identity values', () => {
    const feature = {
      type: 'Feature',
      properties: { id: 123, name: '黄村' },
      geometry: { type: 'Point', coordinates: [113.1, 23.2] },
    }

    expect(getToponymFeatureIdentity(feature)).toEqual({
      id: '123',
      name: '黄村',
      coordinates: [113.1, 23.2],
      properties: { id: 123, name: '黄村' },
    })
  })
})
```

- [ ] **Step 2: Run helper tests and verify failure**

Run:

```bash
cd project
npm test -- tests/toponymsMapData.test.js
```

Expected:

- FAIL because helper file does not exist.

- [ ] **Step 3: Implement helpers**

Create `project/src/main/views/explore/villages/toponyms/toponymsMapData.js`:

```js
export function buildEmptyToponymsFeatureCollection() {
  return {
    type: 'FeatureCollection',
    features: [],
  }
}

export function filterToponymsFeatureCollection(collection, keyword) {
  const normalizedKeyword = String(keyword || '').trim().toLowerCase()
  const features = Array.isArray(collection?.features) ? collection.features : []

  if (!normalizedKeyword) {
    return {
      type: 'FeatureCollection',
      features,
    }
  }

  return {
    type: 'FeatureCollection',
    features: features.filter((feature) => {
      const name = String(feature?.properties?.name || '').toLowerCase()
      return name.includes(normalizedKeyword)
    }),
  }
}

export function getToponymFeatureIdentity(feature) {
  const coordinates = feature?.geometry?.coordinates
  return {
    id: feature?.properties?.id == null ? '' : String(feature.properties.id),
    name: feature?.properties?.name == null ? '' : String(feature.properties.name),
    coordinates: Array.isArray(coordinates) ? coordinates : [],
    properties: feature?.properties || {},
  }
}
```

- [ ] **Step 4: Run helper tests**

Run:

```bash
cd project
npm test -- tests/toponymsMapData.test.js
```

Expected:

- PASS.

- [ ] **Step 5: Commit Task 3 only**

Run:

```bash
git add project/src/main/views/explore/villages/toponyms/toponymsMapData.js project/tests/toponymsMapData.test.js
git diff --cached
git commit -m "feat: add toponyms map data helpers"
```

---

### Task 4: Build Toponyms Route Page Shell

**Files:**

- Create: `project/src/main/views/explore/villages/toponyms/ToponymsMapPage.vue`
- Create: `project/src/main/views/explore/villages/toponyms/ToponymSearch.vue`
- Create: `project/src/main/views/explore/villages/toponyms/ToponymDetail.vue`

- [ ] **Step 1: Create the search component**

Create `project/src/main/views/explore/villages/toponyms/ToponymSearch.vue`:

```vue
<template>
  <section class="toponym-search main-glass-panel-inner">
    <label class="toponym-search__field">
      <span class="toponym-search__label">{{ t('villages.pages.toponyms.searchLabel') }}</span>
      <input
        class="toponym-search__input glass-input"
        type="search"
        :value="modelValue"
        :placeholder="t('villages.pages.toponyms.searchPlaceholder')"
        @input="$emit('update:modelValue', $event.target.value)"
      />
    </label>
    <div class="toponym-search__summary">
      {{ t('villages.pages.toponyms.resultSummary', { shown: resultCount, total: totalCount }) }}
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  modelValue: { type: String, default: '' },
  resultCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
})

defineEmits(['update:modelValue'])

const { t } = useI18n()
</script>

<style scoped lang="scss">
.toponym-search {
  display: grid;
  gap: 0.75rem;

  &__field {
    display: grid;
    gap: 0.35rem;
  }

  &__label {
    color: var(--text-deep);
    font-size: 0.9rem;
    font-weight: 700;
  }

  &__input {
    width: 100%;
    box-sizing: border-box;
  }

  &__summary {
    color: var(--text-secondary);
    font-size: 0.85rem;
  }
}
</style>
```

- [ ] **Step 2: Create the detail component**

Create `project/src/main/views/explore/villages/toponyms/ToponymDetail.vue`:

```vue
<template>
  <aside class="toponym-detail main-glass-panel-inner">
    <div class="toponym-detail__header">
      <h3 class="toponym-detail__title">{{ selectedName || t('villages.pages.toponyms.detail.emptyTitle') }}</h3>
      <button
        v-if="selected"
        class="main-glass-button"
        data-variant="secondary"
        type="button"
        @click="$emit('retry')"
      >
        {{ t('villages.pages.toponyms.detail.retry') }}
      </button>
    </div>

    <div v-if="!selected" class="toponym-detail__state">
      {{ t('villages.pages.toponyms.detail.emptyHint') }}
    </div>

    <div v-else-if="loading" class="toponym-detail__state">
      <div class="ui-loading--inline" aria-hidden="true"></div>
      <span>{{ t('villages.pages.toponyms.detail.loading') }}</span>
    </div>

    <div v-else-if="error" class="toponym-detail__state" data-state="error">
      {{ error }}
    </div>

    <dl v-else class="toponym-detail__list">
      <div class="toponym-detail__row">
        <dt>{{ t('villages.pages.toponyms.detail.name') }}</dt>
        <dd>{{ selectedName || t('villages.pages.toponyms.unknownName') }}</dd>
      </div>
      <div class="toponym-detail__row">
        <dt>{{ t('villages.pages.toponyms.detail.city') }}</dt>
        <dd>{{ detail?.cityName || t('villages.pages.toponyms.detail.emptyValue') }}</dd>
      </div>
      <div class="toponym-detail__row">
        <dt>{{ t('villages.pages.toponyms.detail.area') }}</dt>
        <dd>{{ detail?.areaName || t('villages.pages.toponyms.detail.emptyValue') }}</dd>
      </div>
      <div class="toponym-detail__row">
        <dt>{{ t('villages.pages.toponyms.detail.oldName') }}</dt>
        <dd>{{ detail?.oldName || t('villages.pages.toponyms.detail.emptyValue') }}</dd>
      </div>
    </dl>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps({
  selected: { type: Object, default: null },
  detail: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

defineEmits(['retry'])

const { t } = useI18n()

const selectedName = computed(() => props.selected?.name || '')
</script>

<style scoped lang="scss">
.toponym-detail {
  display: grid;
  gap: 0.9rem;
  min-height: 10rem;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
  }

  &__title {
    margin: 0;
    color: var(--text-deep);
    font-size: 1rem;
  }

  &__state {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--text-secondary);
    font-size: 0.9rem;

    &[data-state='error'] {
      color: var(--color-error);
    }
  }

  &__list {
    display: grid;
    gap: 0.65rem;
    margin: 0;
  }

  &__row {
    display: grid;
    grid-template-columns: minmax(5rem, auto) 1fr;
    gap: 0.75rem;

    dt {
      color: var(--text-secondary);
      font-size: 0.85rem;
    }

    dd {
      margin: 0;
      color: var(--text-deep);
      font-weight: 600;
      word-break: break-word;
    }
  }
}
</style>
```

- [ ] **Step 3: Create the route page shell**

Create `project/src/main/views/explore/villages/toponyms/ToponymsMapPage.vue`:

```vue
<template>
  <div class="toponyms-map-page glass-container glass-container-shell">
    <header class="toponyms-map-page__header">
      <div class="toponyms-map-page__heading">
        <h2 class="toponyms-map-page__title">{{ t('villages.pages.toponyms.title') }}</h2>
        <p class="toponyms-map-page__subtitle">{{ t('villages.pages.toponyms.subtitle') }}</p>
      </div>
      <button class="main-glass-button" data-variant="secondary" type="button" @click="loadToponyms">
        {{ t('villages.pages.toponyms.reload') }}
      </button>
    </header>

    <div class="toponyms-map-page__layout">
      <aside class="toponyms-map-page__sidebar ui-scrollbar">
        <ToponymSearch
          v-model="searchKeyword"
          :result-count="filteredFeatureCount"
          :total-count="totalFeatureCount"
        />
        <ToponymDetail
          :selected="selectedToponym"
          :detail="selectedDetail"
          :loading="isDetailLoading"
          :error="detailError"
          @retry="loadSelectedDetail"
        />
      </aside>

      <main class="toponyms-map-page__map main-glass-panel-inner">
        <div v-if="isLoading" class="toponyms-map-page__state">
          <div class="ui-loading--page" aria-hidden="true"></div>
          <p>{{ t('villages.pages.toponyms.loading') }}</p>
        </div>
        <div v-else-if="loadError" class="toponyms-map-page__state" data-state="error">
          <p>{{ loadError }}</p>
          <button class="main-glass-button" data-variant="secondary" type="button" @click="loadToponyms">
            {{ t('villages.pages.toponyms.retry') }}
          </button>
        </div>
        <div v-else-if="!filteredFeatureCount" class="toponyms-map-page__state">
          <p>{{ searchKeyword ? t('villages.pages.toponyms.noResults') : t('villages.pages.toponyms.noData') }}</p>
        </div>
        <div v-else class="toponyms-map-page__map-placeholder">
          {{ t('villages.pages.toponyms.mapPending') }}
        </div>
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { getToponymOfficialDetail, getToponymsMap } from '@/api/index.js'
import ToponymDetail from './ToponymDetail.vue'
import ToponymSearch from './ToponymSearch.vue'
import {
  buildEmptyToponymsFeatureCollection,
  filterToponymsFeatureCollection,
} from './toponymsMapData.js'

const { t } = useI18n()

const toponyms = ref(buildEmptyToponymsFeatureCollection())
const searchKeyword = ref('')
const selectedToponym = ref(null)
const selectedDetail = ref(null)
const isLoading = ref(false)
const loadError = ref('')
const isDetailLoading = ref(false)
const detailError = ref('')

const filteredToponyms = computed(() => filterToponymsFeatureCollection(toponyms.value, searchKeyword.value))
const totalFeatureCount = computed(() => toponyms.value.features.length)
const filteredFeatureCount = computed(() => filteredToponyms.value.features.length)

async function loadToponyms() {
  isLoading.value = true
  loadError.value = ''
  try {
    toponyms.value = await getToponymsMap()
  } catch (error) {
    loadError.value = error?.message || t('villages.pages.toponyms.errors.loadFailed')
  } finally {
    isLoading.value = false
  }
}

async function loadSelectedDetail() {
  const id = selectedToponym.value?.id
  if (!id) {
    detailError.value = t('villages.pages.toponyms.errors.missingId')
    selectedDetail.value = null
    return
  }

  isDetailLoading.value = true
  detailError.value = ''
  try {
    selectedDetail.value = await getToponymOfficialDetail(id)
  } catch (error) {
    detailError.value = error?.message || t('villages.pages.toponyms.errors.detailFailed')
    selectedDetail.value = null
  } finally {
    isDetailLoading.value = false
  }
}

onMounted(() => {
  loadToponyms()
})
</script>

<style scoped lang="scss">
.toponyms-map-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: min(98dvw, 1600px);
  height: 92dvh;
  margin: 0 auto;
  padding: 1rem;
  box-sizing: border-box;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  &__heading {
    display: grid;
    gap: 0.35rem;
  }

  &__title {
    margin: 0;
    color: var(--text-deep);
    font-size: 1.45rem;
  }

  &__subtitle {
    margin: 0;
    color: var(--text-secondary);
    font-size: 0.95rem;
  }

  &__layout {
    display: grid;
    grid-template-columns: minmax(18rem, 24rem) minmax(0, 1fr);
    gap: 1rem;
    min-height: 0;
    flex: 1;
  }

  &__sidebar {
    display: grid;
    align-content: start;
    gap: 1rem;
    min-height: 0;
    overflow: auto;
  }

  &__map {
    position: relative;
    min-height: 28rem;
    overflow: hidden;
  }

  &__state,
  &__map-placeholder {
    display: grid;
    place-items: center;
    gap: 0.75rem;
    height: 100%;
    color: var(--text-secondary);
    text-align: center;

    &[data-state='error'] {
      color: var(--color-error);
    }
  }

  @media (max-width: 900px) {
    height: auto;
    min-height: 92dvh;

    &__header {
      flex-direction: column;
    }

    &__layout {
      grid-template-columns: 1fr;
    }

    &__map {
      min-height: 65dvh;
    }
  }
}
</style>
```

- [ ] **Step 4: Add i18n page strings**

Add under `villages.pages.toponyms` in all three `villages.json` locale files.

Traditional:

```json
"toponyms": {
  "title": "自然村地名地圖",
  "subtitle": "瀏覽自然村空間分佈，搜索地名並查看官方地名詳情。",
  "searchLabel": "搜索地名",
  "searchPlaceholder": "輸入自然村名稱...",
  "resultSummary": "顯示 {shown} / {total} 個地名",
  "loading": "正在加載自然村地名...",
  "reload": "重載",
  "retry": "重試",
  "noResults": "沒有找到匹配的地名",
  "noData": "暫無地名數據",
  "mapPending": "地圖組件將在下一步接入",
  "unknownName": "未命名地名",
  "detail": {
    "emptyTitle": "地名詳情",
    "emptyHint": "點擊地圖上的自然村查看詳情。",
    "loading": "正在查詢官方地名詳情...",
    "retry": "重試詳情",
    "name": "名稱",
    "city": "所在地市",
    "area": "所在區縣",
    "oldName": "歷史地名",
    "emptyValue": "暫無"
  },
  "errors": {
    "loadFailed": "無法加載自然村地名，請稍後重試",
    "detailFailed": "無法獲取官方地名詳情",
    "missingId": "此地名缺少官方 ID，無法查詢詳情"
  }
}
```

Simplified: convert only these new strings to simplified Chinese. Do not rewrite existing text.

English:

```json
"toponyms": {
  "title": "Village Toponyms Map",
  "subtitle": "Browse natural-village locations, search place names, and view official details.",
  "searchLabel": "Search place names",
  "searchPlaceholder": "Enter a village name...",
  "resultSummary": "Showing {shown} / {total} place names",
  "loading": "Loading village toponyms...",
  "reload": "Reload",
  "retry": "Retry",
  "noResults": "No matching place names",
  "noData": "No toponym data available",
  "mapPending": "The map component will be connected in the next step",
  "unknownName": "Unnamed place",
  "detail": {
    "emptyTitle": "Place Detail",
    "emptyHint": "Click a village on the map to view details.",
    "loading": "Loading official place-name details...",
    "retry": "Retry Detail",
    "name": "Name",
    "city": "City",
    "area": "County / Area",
    "oldName": "Historical Name",
    "emptyValue": "Not available"
  },
  "errors": {
    "loadFailed": "Could not load village toponyms. Please try again later.",
    "detailFailed": "Could not load official place-name details.",
    "missingId": "This place name has no official ID, so details cannot be queried."
  }
}
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
cd project
npm test -- tests/toponymsRouteExposure.test.js tests/toponymsMapData.test.js
```

Expected:

- PASS.

- [ ] **Step 6: Run lint for new files**

Run:

```bash
cd project
npm run lint -- src/main/views/explore/villages/toponyms src/i18n/locales/zh-Hant/villages.json src/i18n/locales/zh-CN/villages.json src/i18n/locales/en/villages.json
```

Expected:

- PASS. If ESLint does not accept JSON path arguments in this project, rerun only the Vue/JS directory and manually inspect JSON with `npm run build` in final verification.

- [ ] **Step 7: Inspect diff and commit**

Run:

```bash
git diff -- project/src/main/views/explore/villages/toponyms project/src/i18n/locales/zh-Hant/villages.json project/src/i18n/locales/zh-CN/villages.json project/src/i18n/locales/en/villages.json
git add project/src/main/views/explore/villages/toponyms/ToponymsMapPage.vue project/src/main/views/explore/villages/toponyms/ToponymSearch.vue project/src/main/views/explore/villages/toponyms/ToponymDetail.vue project/src/i18n/locales/zh-Hant/villages.json project/src/i18n/locales/zh-CN/villages.json project/src/i18n/locales/en/villages.json
git diff --cached
git commit -m "feat: add toponyms map page shell"
```

---

### Task 5: Implement MapLibre Rendering

**Files:**

- Create: `project/src/main/views/explore/villages/toponyms/ToponymMap.vue`
- Modify: `project/src/main/views/explore/villages/toponyms/ToponymsMapPage.vue`

- [ ] **Step 1: Create the MapLibre component**

Create `project/src/main/views/explore/villages/toponyms/ToponymMap.vue`:

```vue
<template>
  <div ref="mapContainer" class="toponym-map" />
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { mapStyleConfig } from '@/utils/map/MapSource.js'
import { getToponymFeatureIdentity } from './toponymsMapData.js'

const props = defineProps({
  featureCollection: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['select-feature'])

const mapContainer = ref(null)
let map = null

const sourceId = 'toponyms-source'
const clustersLayerId = 'toponyms-clusters'
const clusterCountLayerId = 'toponyms-cluster-count'
const pointLayerId = 'toponyms-points'
const labelLayerId = 'toponyms-labels'

function getMapData() {
  return props.featureCollection || { type: 'FeatureCollection', features: [] }
}

function addToponymsLayers() {
  if (!map || map.getSource(sourceId)) return

  map.addSource(sourceId, {
    type: 'geojson',
    data: getMapData(),
    cluster: true,
    clusterRadius: 48,
    clusterMaxZoom: 13,
  })

  map.addLayer({
    id: clustersLayerId,
    type: 'circle',
    source: sourceId,
    filter: ['has', 'point_count'],
    paint: {
      'circle-color': [
        'step',
        ['get', 'point_count'],
        'rgba(0, 122, 255, 0.36)',
        100,
        'rgba(0, 122, 255, 0.5)',
        1000,
        'rgba(0, 81, 213, 0.58)',
      ],
      'circle-radius': [
        'step',
        ['get', 'point_count'],
        18,
        100,
        24,
        1000,
        32,
      ],
      'circle-stroke-color': 'rgba(255, 255, 255, 0.82)',
      'circle-stroke-width': 1,
    },
  })

  map.addLayer({
    id: clusterCountLayerId,
    type: 'symbol',
    source: sourceId,
    filter: ['has', 'point_count'],
    layout: {
      'text-field': ['get', 'point_count_abbreviated'],
      'text-size': 12,
    },
    paint: {
      'text-color': '#ffffff',
    },
  })

  map.addLayer({
    id: pointLayerId,
    type: 'circle',
    source: sourceId,
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': 'rgba(0, 122, 255, 0.72)',
      'circle-radius': 5,
      'circle-stroke-color': 'rgba(255, 255, 255, 0.88)',
      'circle-stroke-width': 1,
    },
  })

  map.addLayer({
    id: labelLayerId,
    type: 'symbol',
    source: sourceId,
    filter: ['!', ['has', 'point_count']],
    minzoom: 11,
    layout: {
      'text-field': ['coalesce', ['get', 'name'], ''],
      'text-size': 12,
      'text-offset': [0, 1.1],
      'text-anchor': 'top',
    },
    paint: {
      'text-color': '#0b2540',
      'text-halo-color': 'rgba(255, 255, 255, 0.82)',
      'text-halo-width': 1,
    },
  })

  map.on('click', clustersLayerId, handleClusterClick)
  map.on('click', pointLayerId, handlePointClick)
  map.on('mouseenter', clustersLayerId, setPointerCursor)
  map.on('mouseenter', pointLayerId, setPointerCursor)
  map.on('mouseleave', clustersLayerId, clearPointerCursor)
  map.on('mouseleave', pointLayerId, clearPointerCursor)
}

function updateSourceData() {
  const source = map?.getSource(sourceId)
  if (source?.setData) {
    source.setData(getMapData())
  }
}

function handleClusterClick(event) {
  const features = map.queryRenderedFeatures(event.point, { layers: [clustersLayerId] })
  const clusterId = features[0]?.properties?.cluster_id
  const source = map.getSource(sourceId)
  if (clusterId == null || !source?.getClusterExpansionZoom) return

  source.getClusterExpansionZoom(clusterId, (error, zoom) => {
    if (error) return
    map.easeTo({
      center: features[0].geometry.coordinates,
      zoom,
    })
  })
}

function handlePointClick(event) {
  const feature = event.features?.[0]
  if (!feature) return
  emit('select-feature', getToponymFeatureIdentity(feature))
}

function setPointerCursor() {
  if (map) map.getCanvas().style.cursor = 'pointer'
}

function clearPointerCursor() {
  if (map) map.getCanvas().style.cursor = ''
}

onMounted(() => {
  map = new maplibregl.Map({
    container: mapContainer.value,
    style: mapStyleConfig.gaode,
    center: [113.5, 23.2],
    zoom: 6,
  })

  map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right')
  map.on('load', addToponymsLayers)
})

watch(
  () => props.featureCollection,
  () => updateSourceData(),
  { deep: true }
)

onBeforeUnmount(() => {
  if (map) {
    map.remove()
    map = null
  }
})
</script>

<style scoped lang="scss">
.toponym-map {
  width: 100%;
  height: 100%;
  min-height: inherit;
}
</style>
```

Before finalizing this component, replace hardcoded paint colors with token-derived constants if MapLibre accepts CSS variables in runtime style values. If MapLibre does not reliably resolve CSS variables in layer paint properties, use a tiny helper that reads computed CSS variables from `document.documentElement`:

```js
function token(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
```

Then set paint values using `token('--color-primary')`, `token('--text-deep')`, and token-derived RGBA values. Do not leave raw hex values in the final component unless MapLibre limitations are documented in a code comment and no token-based path works.

- [ ] **Step 2: Replace page placeholder with map component**

Modify `ToponymsMapPage.vue`:

```vue
<ToponymMap
  class="toponyms-map-page__map-view"
  :feature-collection="filteredToponyms"
  @select-feature="handleToponymSelected"
/>
```

Import:

```js
import ToponymMap from './ToponymMap.vue'
```

Add selection handler:

```js
function handleToponymSelected(toponym) {
  selectedToponym.value = toponym
  selectedDetail.value = null
  loadSelectedDetail()
}
```

Add CSS:

```scss
&__map-view {
  height: 100%;
  min-height: inherit;
}
```

- [ ] **Step 3: Handle stale detail requests**

In `ToponymsMapPage.vue`, add:

```js
let detailRequestController = null
let detailRequestSequence = 0
```

Update `loadSelectedDetail`:

```js
async function loadSelectedDetail() {
  const id = selectedToponym.value?.id
  if (!id) {
    detailError.value = t('villages.pages.toponyms.errors.missingId')
    selectedDetail.value = null
    return
  }

  if (detailRequestController) {
    detailRequestController.abort()
  }

  detailRequestController = typeof AbortController === 'function' ? new AbortController() : null
  const requestId = detailRequestSequence + 1
  detailRequestSequence = requestId
  isDetailLoading.value = true
  detailError.value = ''

  try {
    const detail = await getToponymOfficialDetail(id, {
      signal: detailRequestController?.signal,
    })
    if (requestId === detailRequestSequence) {
      selectedDetail.value = detail
    }
  } catch (error) {
    if (error?.name === 'AbortError') return
    if (requestId === detailRequestSequence) {
      detailError.value = error?.message || t('villages.pages.toponyms.errors.detailFailed')
      selectedDetail.value = null
    }
  } finally {
    if (requestId === detailRequestSequence) {
      isDetailLoading.value = false
    }
  }
}
```

- [ ] **Step 4: Clear stale selection when search excludes selected feature**

Add a watcher:

```js
watch(filteredToponyms, (collection) => {
  if (!selectedToponym.value?.id) return
  const stillVisible = collection.features.some((feature) => String(feature?.properties?.id || '') === selectedToponym.value.id)
  if (!stillVisible) {
    selectedToponym.value = null
    selectedDetail.value = null
    detailError.value = ''
  }
})
```

Import `watch`.

- [ ] **Step 5: Verify MapLibre color token usage**

Run:

```bash
rg -n "#[0-9a-fA-F]{3,8}|rgba\\(|rgb\\(" project/src/main/views/explore/villages/toponyms/ToponymMap.vue
```

Expected:

- No hardcoded hex colors.
- Any `rgba(...)` usage is either token-derived or explained by a local helper that reads CSS variables.

- [ ] **Step 6: Run focused tests and lint**

Run:

```bash
cd project
npm test -- tests/toponymsMapData.test.js tests/toponymsRouteExposure.test.js tests/toponymsApiContracts.test.js
npm run lint -- src/main/views/explore/villages/toponyms src/api/main/toponyms.js
```

Expected:

- PASS.

- [ ] **Step 7: Commit Task 5 only**

Run:

```bash
git add project/src/main/views/explore/villages/toponyms/ToponymMap.vue project/src/main/views/explore/villages/toponyms/ToponymsMapPage.vue
git diff --cached
git commit -m "feat: render toponyms map with clusters"
```

---

### Task 6: Add Optional Legacy Redirect

**Files:**

- Modify: `project/src/main/router/legacyRouteMap.js`
- Modify: existing tests for legacy routes if present, likely `project/tests/legacyRouteMap.test.js`

- [ ] **Step 1: Inspect existing legacy route style**

Run:

```bash
sed -n '1,220p' project/src/main/router/legacyRouteMap.js
sed -n '1,220p' project/tests/legacyRouteMap.test.js
```

Only proceed if the file already contains straightforward path alias mappings. If it would require a new compatibility mechanism, skip this task and document that `/toponyms/map` is not implemented because the user requested Explore villages placement.

- [ ] **Step 2: Add failing test for optional alias**

Add a test matching the existing test style:

```js
expect(resolveLegacyRoute('/toponyms/map')).toEqual({
  path: '/explore/villages/toponyms',
  replace: true,
})
```

Use the actual helper/function names already present in `legacyRouteMap.test.js`.

- [ ] **Step 3: Implement alias**

Add `/toponyms/map` -> `/explore/villages/toponyms` using the existing pattern.

- [ ] **Step 4: Run legacy tests**

Run:

```bash
cd project
npm test -- tests/legacyRouteMap.test.js
```

Expected:

- PASS.

- [ ] **Step 5: Commit Task 6 only**

Run:

```bash
git add project/src/main/router/legacyRouteMap.js project/tests/legacyRouteMap.test.js
git diff --cached
git commit -m "feat: redirect legacy toponyms map path"
```

---

### Task 7: Final Verification And Review

**Files:**

- All touched files from Tasks 1-6.

- [ ] **Step 1: Run focused toponyms tests**

Run:

```bash
cd project
npm test -- tests/toponymsApiContracts.test.js tests/toponymsRouteExposure.test.js tests/toponymsMapData.test.js
```

Expected:

- PASS.

- [ ] **Step 2: Run relevant existing route tests**

Run:

```bash
cd project
npm test -- tests/legacyRouteMap.test.js tests/entryRedirects.test.js
```

Expected:

- PASS, or if unrelated existing worktree changes cause failure, document exact failure and do not claim global route health.

- [ ] **Step 3: Run lint**

Run:

```bash
cd project
npm run lint
```

Expected:

- PASS.

- [ ] **Step 4: Run build**

Run:

```bash
cd project
npm run build
```

Expected:

- PASS.

- [ ] **Step 5: Manual browser smoke test**

Start dev server:

```bash
cd project
npm run dev:web
```

Open:

```text
http://localhost:5173/explore/villages/toponyms
```

Manual checks:

- Page renders inside Explore shell.
- Villages submenu contains the new entry above Guangdong natural villages.
- Reload button works.
- Map loads with clustered points if backend endpoint is available.
- If backend endpoint is unavailable, error state appears and page does not crash.
- Search filters points.
- Clicking a point opens detail panel.
- Official detail failure shows error without clearing selected point.
- Mobile viewport stacks sidebar above map without overlap.

- [ ] **Step 6: CSS and token review**

Run:

```bash
rg -n "#[0-9a-fA-F]{3,8}|color:\\s*(red|blue|white|black)|background:\\s*(red|blue|white|black)" project/src/main/views/explore/villages/toponyms
```

Expected:

- No raw hardcoded visual colors in SCSS.
- Any MapLibre paint fallback using raw colors has a written comment explaining why CSS variables could not be used, and should be converted to token-derived values if possible.

- [ ] **Step 7: Chinese/emoji encoding review**

Run:

```bash
git diff -- project/src/i18n/locales/zh-Hant project/src/i18n/locales/zh-CN project/src/main/config/BarAndTabs/ExploreBarConfig.js project/src/main/config/BarAndTabs/SideBarConfig.js project/src/main/views/menu/portals/VillagesPage.vue
```

Check:

- No mojibake.
- Existing Chinese text unchanged.
- `🗺️` remains a literal emoji.
- No Unicode escape replacement.

- [ ] **Step 8: Full diff review**

Run:

```bash
git status --short
git diff
```

Review:

- Every changed file is required by this plan.
- No unrelated VillagesML changes were touched, staged, reverted, or committed.
- No behavior outside Explore villages, route exposure, API, and toponyms map was changed.

---

## 5. Implementation Notes

### AppModal vs Inline Detail

Use inline detail panel for MVP. The PRD diagram places details beside the map. Existing modal components are strong, but an always-visible side panel better supports click-to-inspect map workflows and avoids modal header scroll concerns.

### Toponyms Page Location

Use:

```text
project/src/main/views/explore/villages/toponyms/
```

Do not put this inside `project/src/VillagesML`, because this is a main-site Explore page, not the VillagesML analytical workspace.

### API Placement

Use:

```text
project/src/api/main/toponyms.js
```

Do not put this under `project/src/api/villagesML`, because the `toponyms` endpoint is a main-site natural-village map page, not VillagesML's ML/NLP analysis API.

### If Official Detail CORS Blocks Browser Requests

Keep the frontend code direct as required by the PRD. Show an error in the detail panel. Do not implement a backend proxy unless the user explicitly approves a scope change.

### If `/api/toponyms/map` Is Not Ready

The page should still be mergeable:

- route works;
- loading transitions to error;
- retry button remains available;
- no crash;
- tests can still pass using source contracts and pure helpers.

Do not invent mock data in production code. If visual testing needs data, use devtools or a temporary local test fixture outside committed production code.

---

## 6. Completion Criteria

The implementation is complete only when:

- `/explore/villages/toponyms` is registered as a path route.
- Explore villages navigation and sidebar place it above Guangdong natural villages.
- The villages portal card places it above Guangdong natural villages.
- The page loads `/api/toponyms/map`.
- Valid points render through MapLibre clustered source/layers.
- Search is local and updates rendered points.
- Point clicks select a toponym and attempt direct official detail lookup.
- Detail panel handles loading, success, missing id, network error, and empty fields.
- New styles use existing tokens and nested scoped SCSS.
- Chinese/emoji diff is clean.
- Focused tests pass.
- Lint passes.
- Build passes, unless blocked by unrelated existing changes; if blocked, exact failure is documented.
