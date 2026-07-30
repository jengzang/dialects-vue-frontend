# Toponyms Map Explore Villages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the natural-village toponyms map as a first-class Explore villages page at `/explore/villages/toponyms`, using the backend toponyms API to explore place-name distribution patterns and query one or a few place-name records, with Ministry of Civil Affairs detail lookup available for a specific selected id.

**Architecture:** This is a main-site Explore villages page, not a VillagesML page and not a new top-level `/toponyms/map` app. The page has two primary user workflows: a distribution workflow where users input a character/string and match mode to see where matching place names cluster geographically, and an information workflow where users query names/points and inspect selected local records. The Ministry `detailsPub` endpoint is not the main data source; it is used only for a concrete selected id when the user wants official detailed information.

**Tech Stack:** Vue 3 `<script setup>`, Vue Router path routes, Vue I18n JSON locale files, MapLibre GL source/layers with clustering, existing `api` HTTP client and `/api` proxy, browser `fetch` for the official detail service, scoped SCSS with design tokens, Vitest.

---

## 0. Current Backend Contract

The backend explicitly does **not** provide `GET /api/toponyms/map`, and does not recommend any public endpoint that returns full `{ id, name, longitude, latitude }` for all points. The implementation must use these real endpoints:

### `GET /api/toponyms/names`

Purpose: search name suggestions. Returns names only, no ids and no coordinates.

Supported parameters:

| Parameter | Required | Default | Notes |
| --- | --- | --- | --- |
| `q` | yes | none | non-empty query text |
| `match_mode` | no | `prefix` | `prefix`, `suffix`, `exact`, `contains` |
| `limit` | no | `20` | backend upper bound 2,000,000, but frontend must keep small default |
| `place_type_code` | no | `22200` | default natural village / rural settlement |
| `include_division_tree` | no | `false` | if true, response shape changes to tree |

Normal response:

```json
{
  "items": ["黄村", "黄泥村"]
}
```

Tree response exists but is not part of MVP unless the user asks for administrative tree browsing.

### `GET /api/toponyms/points`

Purpose: search matching map points. Returns id + coordinates only, no name.

Supported parameters:

| Parameter | Required | Default | Notes |
| --- | --- | --- | --- |
| `q` | yes | none | non-empty query text |
| `match_mode` | no | `prefix` | `prefix`, `suffix`, `exact`, `contains` |
| `limit` | no | `5000` | backend upper bound 2,000,000; frontend must not default to huge values |
| `bbox` | no | none | `minLng,minLat,maxLng,maxLat` |
| `zoom` | no | none | 0..24, currently only validated |
| `place_type_code` | no | `22200` | default natural village / rural settlement |

Response:

```json
{
  "items": [
    {
      "id": "5746d76b8d5150589460729e1a28e3e3",
      "longitude": 114.6352764,
      "latitude": 36.2320834
    }
  ],
  "count": 1,
  "truncated": false,
  "next": null
}
```

### Official Ministry Detail Service

Used only for official detail lookup of a specific selected id:

```http
POST https://dmfw.mca.gov.cn/9095/stname/detailsPub
Content-Type: application/json

{ "id": "5746d76b8d5150589460729e1a28e3e3" }
```

Original product intent includes using the Ministry of Civil Affairs for detailed information on a specific selected place. The backend reports direct local testing currently receives `403 Forbidden`, so the frontend must treat official lookup as best-effort and keep local `/api/toponyms/details` as the reliable record source.

Expected useful official fields from the original PRD:

```json
{
  "area_name": "临漳县",
  "city_name": "邯郸市",
  "old_name": "历史地名"
}
```

The exact official response shape must be handled defensively because the service may return nested data, empty data, non-JSON, 403, or CORS/network failures.

### `GET /api/toponyms/details`

Purpose: local record lookup for one or a few known ids. This is the backend endpoint for the "query single/few place-name information" workflow, and it is the only local endpoint that returns id + name + coordinates together.

Supported parameters:

| Parameter | Required | Notes |
| --- | --- | --- |
| `ids` | yes | comma-separated ids or repeated `ids`; at most 10 unique ids |

Response:

```json
{
  "items": [
    {
      "id": "5746d76b8d5150589460729e1a28e3e3",
      "name": "黄村",
      "place_type": "农村居民点",
      "place_type_code": "22200",
      "longitude": 114.6352764,
      "latitude": 36.2320834,
      "division_path": [
        { "name": "河北省", "level": 1 },
        { "name": "邯郸市", "level": 2 },
        { "name": "临漳县", "level": 3 },
        { "name": "称勾集镇", "level": 4 }
      ]
    }
  ],
  "count": 1
}
```

Error if more than 10 ids:

```json
{
  "detail": "ids cannot contain more than 10 values"
}
```

### `GET /api/toponyms/divisions`

Purpose: administrative division list. Not required for MVP.

Example:

```http
GET /api/toponyms/divisions?parent_code=44
```

Response:

```json
{
  "items": [
    {
      "code": "4401",
      "name": "广州市",
      "level": 2,
      "single_count": 35365
    }
  ]
}
```

This endpoint does not return center coordinates.

---

## 1. Product Decisions

### Route

Implement only:

```text
/explore/villages/toponyms
```

Do not implement `/toponyms/map`. Do not add a legacy redirect. The feature has not shipped yet, so there is no legacy user traffic.

### First Screen

No full-data auto-load. First screen should show:

- title and short subtitle;
- search input;
- match mode control;
- place type control if useful but keep natural village as default;
- result limit control or compact preset;
- empty map/workspace state saying to search first.

### Primary Workflows

#### Workflow A: Distribution Pattern Exploration

1. User enters a character/string such as `黄`, `塘`, or `村`.
2. User chooses `match_mode`: prefix, suffix, exact, or contains.
3. User keeps or changes `place_type_code`, defaulting to natural villages (`22200`).
4. Frontend calls `/api/toponyms/points`.
5. The map renders id-only point results with clustering.
6. The page summarizes returned count and `truncated` state.
7. User visually inspects where that character/string is concentrated.

This is the main map value: showing distribution patterns of place names matching the user's input.

#### Workflow B: Single Or Small-Set Place-Name Information Query

1. User enters a name/string.
2. Frontend calls `/api/toponyms/names` for suggestions and/or `/api/toponyms/points` for matching points.
3. User selects a suggestion or clicks a point.
4. For a selected point id, frontend calls `/api/toponyms/details?ids=<id>`.
5. The detail panel shows the local record: `name`, `place_type`, `division_path`, longitude, latitude.

If multiple ids are explicitly selected later, local details must respect the backend limit of 10 unique ids.

#### Workflow C: Official Detail Lookup For One Selected Id

1. User has selected a local record or map point with an id.
2. User opens or triggers official detail lookup.
3. Frontend calls Ministry `detailsPub` with the selected id.
4. If official lookup succeeds, show official fields and mark the source as official.
5. If official lookup fails, keep the local record visible and show a non-blocking official-detail error.

### Important UI Copy Constraint

Because `/points` results do not include names, do not promise map labels during distribution exploration. Map points can show:

- count summaries;
- selected id;
- "click point to view local record";
- official detail as an additional action for a selected id.

If labels are desired later, they require detail batching and must respect the 10-id limit.

---

## 2. File Structure

### Create

- `project/src/api/main/toponyms.js`
  - `getToponymNames(params)`
  - `getToponymPoints(params)`
  - `getToponymOfficialDetail(id, options)`
  - `getToponymDetails(ids)`
  - query param builders and response normalization helpers

- `project/src/main/views/explore/villages/toponyms/toponymsMapData.js`
  - empty FeatureCollection helper
  - `normalizeToponymPointsResponse`
  - `buildToponymPointFeatureCollection`
  - selected feature identity helper
  - point bounds helper

- `project/src/main/views/explore/villages/toponyms/ToponymsMapPage.vue`
  - route-level orchestration: active workflow, query state, suggestions, points, selected id, local details, official details, errors

- `project/src/main/views/explore/villages/toponyms/ToponymModeTabs.vue`
  - switches between distribution exploration and information query copy/state

- `project/src/main/views/explore/villages/toponyms/ToponymSearch.vue`
  - input, match mode, place type, limit, search button, suggestions list, truncated notice

- `project/src/main/views/explore/villages/toponyms/ToponymMap.vue`
  - MapLibre initialization, cluster rendering, source updates, point click emits id

- `project/src/main/views/explore/villages/toponyms/ToponymDetail.vue`
  - selected point local record and optional official-detail panel

- `project/tests/toponymsApiContracts.test.js`
  - API contract tests for endpoint paths and max-10 details guard

- `project/tests/toponymsMapData.test.js`
  - pure helper tests for point normalization and invalid coordinate filtering

- `project/tests/toponymsRouteExposure.test.js`
  - route/navigation/portal placement tests

### Modify

- `project/src/api/index.js`
  - export toponyms API functions

- `project/src/main/router/exploreRoutes.js`
  - add `explore/villages/toponyms`

- `project/src/main/config/BarAndTabs/ExploreBarConfig.js`
  - add villages child above Guangdong natural villages

- `project/src/main/config/BarAndTabs/SideBarConfig.js`
  - add villages child above Guangdong natural villages in all relevant lists

- `project/src/main/views/menu/portals/VillagesPage.vue`
  - add portal card above Guangdong natural villages

- `project/src/i18n/locales/zh-Hant/navigation.json`
- `project/src/i18n/locales/zh-CN/navigation.json`
- `project/src/i18n/locales/en/navigation.json`
- `project/src/i18n/locales/zh-Hant/villages.json`
- `project/src/i18n/locales/zh-CN/villages.json`
- `project/src/i18n/locales/en/villages.json`
  - add navigation, portal, page, error, detail, and search strings

---

## 3. Edge Cases

### Query And Limits

- Empty `q`: do not call backend. Show "enter a keyword".
- Whitespace-only `q`: trim and treat as empty.
- `limit`: default to a safe UI value, recommended `5000`; do not default to `0`.
- `limit=0`: do not expose in MVP.
- Backend `truncated: true`: show warning to narrow keyword, lower match breadth, or reduce area later.
- `match_mode=contains`: likely expensive and broad; allow only if UI warns it may return many points, or keep it as an explicit option after `prefix`, `suffix`, `exact`.
- `place_type_code`: default `22200`; if UI exposes other options, keep labels clear:
  - `22200`: natural village / rural settlement
  - `21610`: administrative village
  - `27610`: village committee

### Response Shapes

- `/names` normal response is string array.
- `/names` tree response is object array; MVP should not request tree mode.
- `/points` never returns names.
- `/details` returns `items` array and `count`.
- FastAPI errors usually use `{"detail": "message"}` or 422 detail arrays. API helper should convert them into readable errors.

### Point Data

Backend reports real natural-village data has:

- total `place_type_code=22200`: 4,343,313;
- missing id: 0;
- empty coordinates: 0;
- out-of-range coordinates: 0;
- zero coordinates: 0;
- duplicate id: 0;
- empty name: 0.

Still keep frontend coordinate validation because it is cheap and protects against future changes.

### Map Interaction

- Before search: no map points; show empty workbench state.
- Search returns 0 points: keep map shell; show no-results.
- Search returns many points: render cluster source/layers only, never DOM markers.
- Click cluster: zoom into cluster.
- Click point: emit id and coordinates; details fetch happens in parent.
- Selected point has no loaded name until `/details` returns.
- If user searches again, clear selected detail and stale errors.

### Detail Lookup

- Local details endpoint accepts at most 10 unique ids. MVP fetches 1 id per point click.
- Clicking a map point should fetch local `/api/toponyms/details` first so the user gets the known record promptly.
- Ministry `detailsPub` is an official-detail action for the selected id, not the primary map/distribution data source.
- Official failure modes include 403, CORS, timeout, non-JSON body, empty detail, and response shape drift.
- If official lookup fails, keep local details visible and show a warning.
- If local details returns empty `items`, show "no detail found".
- If local request returns 401, show login/permission message.
- If local request returns 422, show parameter error message.
- If local details response coordinates differ from point coordinates, display details values but keep map point unchanged.
- The detail panel must expose the source state:
  - local record loaded
  - official detail loaded
  - official detail unavailable

### Styling

- Use existing classes:
  - `glass-container glass-container-shell`
  - `main-glass-panel`
  - `main-glass-panel-inner`
  - `main-glass-button`
  - `glass-input`
  - `ui-scrollbar`
  - `ui-loading--page`
  - `ui-loading--inline`
- Use CSS variables/tokens:
  - `var(--text-deep)`
  - `var(--text-secondary)`
  - `var(--glass-*)`
  - `var(--color-primary)`
  - `rgba(var(--color-primary-rgb), alpha)`
  - `rgba(var(--color-shadow-rgb), alpha)`
  - `var(--border-glass)`
  - `var(--radius-*)`
- New SCSS must be `scoped lang="scss"` and nested.
- Do not add a new global SCSS entry.

### Chinese And Emoji

- Keep existing Chinese unchanged.
- Add only the new necessary i18n strings.
- Emoji must remain literal, not escaped.
- After locale edits, inspect diff for mojibake and accidental rewrites.

---

## 4. Task Plan

### Task 1: API Contract And Helpers

**Files:**

- Create: `project/src/api/main/toponyms.js`
- Modify: `project/src/api/index.js`
- Create: `project/tests/toponymsApiContracts.test.js`

- [ ] **Step 1: Re-check workspace state**

Run:

```bash
git status --short
```

Expected:

- Existing unrelated VillagesML changes may appear.
- Do not stage or revert them.

- [ ] **Step 2: Write failing API contract test**

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
  it('uses the real split toponyms endpoints', () => {
    const source = readSource('src/api/main/toponyms.js')

    expect(source).toContain('/api/toponyms/names')
    expect(source).toContain('/api/toponyms/points')
    expect(source).toContain('/api/toponyms/details')
    expect(source).toContain('https://dmfw.mca.gov.cn/9095/stname/detailsPub')
    expect(source).toContain('getToponymOfficialDetail')
    expect(source).not.toContain('/api/toponyms/map')
  })

  it('guards details requests to the backend maximum of 10 ids', () => {
    const source = readSource('src/api/main/toponyms.js')

    expect(source).toContain('TOPONYM_DETAILS_ID_LIMIT')
    expect(source).toContain('ids cannot contain more than 10 values')
  })

  it('exports toponyms APIs from the shared API surface', () => {
    const source = readSource('src/api/index.js')

    expect(source).toContain('getToponymNames')
    expect(source).toContain('getToponymPoints')
    expect(source).toContain('getToponymOfficialDetail')
    expect(source).toContain('getToponymDetails')
    expect(source).toContain('./main/toponyms.js')
  })
})
```

- [ ] **Step 3: Run test and verify failure**

Run:

```bash
cd project
npm test -- tests/toponymsApiContracts.test.js
```

Expected: FAIL because API module does not exist.

- [ ] **Step 4: Implement `project/src/api/main/toponyms.js`**

```js
import { api } from '../auth/httpClient.js'

export const TOPONYM_DEFAULT_PLACE_TYPE_CODE = '22200'
export const TOPONYM_DEFAULT_POINT_LIMIT = 5000
export const TOPONYM_DEFAULT_NAME_LIMIT = 20
export const TOPONYM_DETAILS_ID_LIMIT = 10

const OFFICIAL_DETAIL_URL = 'https://dmfw.mca.gov.cn/9095/stname/detailsPub'

const MATCH_MODES = new Set(['prefix', 'suffix', 'exact', 'contains'])

function normalizeMatchMode(value) {
  return MATCH_MODES.has(value) ? value : 'prefix'
}

function appendCommonSearchParams(query, params = {}, defaultLimit) {
  const keyword = String(params.q || '').trim()
  if (!keyword) {
    throw new Error('toponyms query cannot be empty')
  }

  query.set('q', keyword)
  query.set('match_mode', normalizeMatchMode(params.match_mode))
  query.set('limit', String(Number.isFinite(Number(params.limit)) ? Number(params.limit) : defaultLimit))
  query.set('place_type_code', String(params.place_type_code || TOPONYM_DEFAULT_PLACE_TYPE_CODE))

  if (params.bbox) query.set('bbox', String(params.bbox))
  if (params.zoom !== undefined && params.zoom !== null && params.zoom !== '') {
    query.set('zoom', String(params.zoom))
  }
}

function getFastApiErrorMessage(error, fallback) {
  const detail = error?.detail || error?.response?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((item) => item?.msg || String(item)).join('; ')
  return error?.message || fallback
}

export async function getToponymNames(params = {}) {
  const query = new URLSearchParams()
  appendCommonSearchParams(query, params, TOPONYM_DEFAULT_NAME_LIMIT)
  if (params.include_division_tree) {
    query.set('include_division_tree', 'true')
  }

  try {
    const payload = await api(`/api/toponyms/names?${query.toString()}`)
    return {
      items: Array.isArray(payload?.items) ? payload.items : [],
    }
  } catch (error) {
    throw new Error(getFastApiErrorMessage(error, 'failed to load toponym names'))
  }
}

export async function getToponymPoints(params = {}) {
  const query = new URLSearchParams()
  appendCommonSearchParams(query, params, TOPONYM_DEFAULT_POINT_LIMIT)

  try {
    const payload = await api(`/api/toponyms/points?${query.toString()}`)
    return {
      items: Array.isArray(payload?.items) ? payload.items : [],
      count: Number(payload?.count || 0),
      truncated: Boolean(payload?.truncated),
      next: payload?.next || null,
    }
  } catch (error) {
    throw new Error(getFastApiErrorMessage(error, 'failed to load toponym points'))
  }
}

function normalizeOfficialDetail(payload) {
  const detail = payload?.data && typeof payload.data === 'object' ? payload.data : payload
  if (!detail || typeof detail !== 'object') {
    return null
  }

  const areaName = detail.area_name || detail.areaName || ''
  const cityName = detail.city_name || detail.cityName || ''
  const oldName = detail.old_name || detail.oldName || ''

  if (!areaName && !cityName && !oldName) {
    return null
  }

  return {
    source: 'official',
    areaName,
    cityName,
    oldName,
    raw: detail,
  }
}

export async function getToponymOfficialDetail(id, options = {}) {
  const normalizedId = String(id || '').trim()
  if (!normalizedId) {
    throw new Error('toponym id cannot be empty')
  }

  const response = await fetch(OFFICIAL_DETAIL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: normalizedId }),
    signal: options.signal,
  })

  if (!response.ok) {
    throw new Error(`official toponym detail request failed: ${response.status}`)
  }

  const payload = await response.json()
  const detail = normalizeOfficialDetail(payload)
  if (!detail) {
    throw new Error('official toponym detail is empty')
  }
  return detail
}

export async function getToponymDetails(ids) {
  const uniqueIds = Array.from(new Set((Array.isArray(ids) ? ids : [ids])
    .map((id) => String(id || '').trim())
    .filter(Boolean)))

  if (uniqueIds.length === 0) {
    return { items: [], count: 0 }
  }

  if (uniqueIds.length > TOPONYM_DETAILS_ID_LIMIT) {
    throw new Error('ids cannot contain more than 10 values')
  }

  const query = new URLSearchParams()
  query.set('ids', uniqueIds.join(','))

  try {
    const payload = await api(`/api/toponyms/details?${query.toString()}`)
    return {
      items: Array.isArray(payload?.items) ? payload.items : [],
      count: Number(payload?.count || 0),
    }
  } catch (error) {
    throw new Error(getFastApiErrorMessage(error, 'failed to load toponym details'))
  }
}
```

- [ ] **Step 5: Export from `project/src/api/index.js`**

```js
export {
  getToponymNames,
  getToponymPoints,
  getToponymOfficialDetail,
  getToponymDetails,
  TOPONYM_DEFAULT_PLACE_TYPE_CODE,
  TOPONYM_DEFAULT_POINT_LIMIT,
  TOPONYM_DEFAULT_NAME_LIMIT,
  TOPONYM_DETAILS_ID_LIMIT,
} from './main/toponyms.js';
```

- [ ] **Step 6: Run API tests**

Run:

```bash
cd project
npm test -- tests/toponymsApiContracts.test.js
```

Expected: PASS.

- [ ] **Step 7: Diff and commit Task 1 only**

Run:

```bash
git diff -- project/src/api/main/toponyms.js project/src/api/index.js project/tests/toponymsApiContracts.test.js
git add project/src/api/main/toponyms.js project/src/api/index.js project/tests/toponymsApiContracts.test.js
git diff --cached
git commit -m "feat: add toponyms split API client"
```

---

### Task 2: Pure Point Data Helpers

**Files:**

- Create: `project/src/main/views/explore/villages/toponyms/toponymsMapData.js`
- Create: `project/tests/toponymsMapData.test.js`

- [ ] **Step 1: Write failing helper tests**

Create `project/tests/toponymsMapData.test.js`:

```js
import { describe, expect, it } from 'vitest'
import {
  buildEmptyToponymsFeatureCollection,
  buildToponymPointFeatureCollection,
  getToponymFeatureIdentity,
} from '../src/main/views/explore/villages/toponyms/toponymsMapData.js'

describe('toponyms map data helpers', () => {
  it('builds an empty FeatureCollection', () => {
    expect(buildEmptyToponymsFeatureCollection()).toEqual({
      type: 'FeatureCollection',
      features: [],
    })
  })

  it('converts id-only point responses to GeoJSON and drops invalid coordinates', () => {
    const collection = buildToponymPointFeatureCollection([
      { id: 'a', longitude: 114.1, latitude: 22.2 },
      { id: 'bad', longitude: 999, latitude: 22.2 },
      { id: 'missing', longitude: '', latitude: 22.2 },
    ])

    expect(collection.features).toHaveLength(1)
    expect(collection.features[0]).toEqual({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [114.1, 22.2] },
      properties: { id: 'a' },
    })
  })

  it('returns selected feature identity without assuming a name is available', () => {
    const feature = {
      type: 'Feature',
      properties: { id: 'abc' },
      geometry: { type: 'Point', coordinates: [114.1, 22.2] },
    }

    expect(getToponymFeatureIdentity(feature)).toEqual({
      id: 'abc',
      coordinates: [114.1, 22.2],
      properties: { id: 'abc' },
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

Expected: FAIL because helper does not exist.

- [ ] **Step 3: Implement helper**

Create `project/src/main/views/explore/villages/toponyms/toponymsMapData.js`:

```js
export function buildEmptyToponymsFeatureCollection() {
  return {
    type: 'FeatureCollection',
    features: [],
  }
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

export function buildToponymPointFeatureCollection(items = []) {
  return {
    type: 'FeatureCollection',
    features: (Array.isArray(items) ? items : [])
      .map((item) => {
        if (!item?.id || !isValidCoordinate(item.longitude, item.latitude)) {
          return null
        }

        return {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [Number(item.longitude), Number(item.latitude)],
          },
          properties: {
            id: String(item.id),
          },
        }
      })
      .filter(Boolean),
  }
}

export function getToponymFeatureIdentity(feature) {
  const coordinates = feature?.geometry?.coordinates
  return {
    id: feature?.properties?.id == null ? '' : String(feature.properties.id),
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

Expected: PASS.

- [ ] **Step 5: Commit Task 2 only**

Run:

```bash
git add project/src/main/views/explore/villages/toponyms/toponymsMapData.js project/tests/toponymsMapData.test.js
git diff --cached
git commit -m "feat: add toponyms point map helpers"
```

---

### Task 3: Route, Navigation, And Portal Entry

**Files:**

- Modify: `project/src/main/router/exploreRoutes.js`
- Modify: `project/src/main/config/BarAndTabs/ExploreBarConfig.js`
- Modify: `project/src/main/config/BarAndTabs/SideBarConfig.js`
- Modify: `project/src/main/views/menu/portals/VillagesPage.vue`
- Modify: `project/src/i18n/locales/*/navigation.json`
- Modify: `project/src/i18n/locales/*/villages.json`
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

describe('toponyms route exposure', () => {
  it('registers toponyms as an Explore villages route', () => {
    const source = readSource('src/main/router/exploreRoutes.js')

    expect(source).toContain('explore/villages/toponyms')
    expect(source).toContain('ToponymsMapPage')
    expect(source).not.toContain('/toponyms/map')
  })

  it('places toponyms above Guangdong villages in ExploreBar', () => {
    const source = readSource('src/main/config/BarAndTabs/ExploreBarConfig.js')
    const toponymsIndex = source.indexOf('/explore/villages/toponyms')
    const gdIndex = source.indexOf('/explore/villages/gd')

    expect(toponymsIndex).toBeGreaterThan(-1)
    expect(gdIndex).toBeGreaterThan(-1)
    expect(toponymsIndex).toBeLessThan(gdIndex)
  })

  it('places toponyms above Guangdong villages in SideBar', () => {
    const source = readSource('src/main/config/BarAndTabs/SideBarConfig.js')
    const toponymsIndex = source.indexOf('/explore/villages/toponyms')
    const gdIndex = source.indexOf('/explore/villages/gd')

    expect(toponymsIndex).toBeGreaterThan(-1)
    expect(gdIndex).toBeGreaterThan(-1)
    expect(toponymsIndex).toBeLessThan(gdIndex)
  })

  it('adds the villages portal entry above Guangdong villages', () => {
    const source = readSource('src/main/views/menu/portals/VillagesPage.vue')
    const toponymsIndex = source.indexOf('handleToponymsMap')
    const gdIndex = source.indexOf('handleGdVillages')

    expect(toponymsIndex).toBeGreaterThan(-1)
    expect(gdIndex).toBeGreaterThan(-1)
    expect(toponymsIndex).toBeLessThan(gdIndex)
  })
})
```

- [ ] **Step 2: Implement route**

In `project/src/main/router/exploreRoutes.js`, add:

```js
const ToponymsMapPage = () => import('@/main/views/explore/villages/toponyms/ToponymsMapPage.vue')
```

Add route above Guangdong natural villages:

```js
{
  path: 'explore/villages/toponyms',
  component: ToponymsMapPage
},
```

- [ ] **Step 3: Add navigation entries above Guangdong natural villages**

`ExploreBarConfig.js`:

```js
{ label: t('navigation.submenu.villages.toponyms'), icon: '🗺️', path: withRouteLocale(route, '/explore/villages/toponyms') },
```

Also include the page key in `matchPages` if that array is still used for tab matching:

```js
matchPages: ['toponymsMap', 'gdVillages', 'gdVillagesTable', 'ycVillages', 'VillagesML'],
```

`SideBarConfig.js`: add the same dynamic entry and the static fallback entry:

```js
{ label: '自然村地名地圖', icon: '🗺️', path: buildLocalePath('zh-Hant', '/explore/villages/toponyms') },
```

- [ ] **Step 4: Add portal card above Guangdong natural villages**

In `VillagesPage.vue`, add:

```vue
<button class="village-btn" @click="handleToponymsMap">
  <div class="village-icon">🗺️</div>
  <div class="village-name">{{ $t('villages.toponyms.name') }}</div>
  <div class="village-desc">{{ $t('villages.toponyms.desc') }}</div>
</button>
```

Handler:

```js
const handleToponymsMap = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/explore/villages/toponyms'))
}
```

- [ ] **Step 5: Add i18n labels**

Add navigation labels:

```json
"toponyms": "自然村地名地圖"
```

```json
"toponyms": "自然村地名地图"
```

```json
"toponyms": "Village Toponyms Map"
```

Add portal labels:

```json
"toponyms": {
  "name": "自然村地名地圖",
  "desc": "按關鍵詞查詢自然村點位與官方地名詳情"
}
```

Simplified and English equivalents:

```json
"toponyms": {
  "name": "自然村地名地图",
  "desc": "按关键词查询自然村点位与官方地名详情"
}
```

```json
"toponyms": {
  "name": "Village Toponyms Map",
  "desc": "Search natural-village points and official place-name details"
}
```

- [ ] **Step 6: Run tests and inspect Chinese/emoji diff**

Run:

```bash
cd project
npm test -- tests/toponymsRouteExposure.test.js
git diff -- project/src/i18n/locales/zh-Hant project/src/i18n/locales/zh-CN project/src/main/config/BarAndTabs project/src/main/views/menu/portals/VillagesPage.vue
```

Check:

- New entry is above Guangdong natural villages.
- Existing Chinese was not rewritten.
- `🗺️` remains literal.

- [ ] **Step 7: Commit Task 3 only**

Run:

```bash
git add project/src/main/router/exploreRoutes.js project/src/main/config/BarAndTabs/ExploreBarConfig.js project/src/main/config/BarAndTabs/SideBarConfig.js project/src/main/views/menu/portals/VillagesPage.vue project/src/i18n/locales/zh-Hant/navigation.json project/src/i18n/locales/zh-CN/navigation.json project/src/i18n/locales/en/navigation.json project/src/i18n/locales/zh-Hant/villages.json project/src/i18n/locales/zh-CN/villages.json project/src/i18n/locales/en/villages.json project/tests/toponymsRouteExposure.test.js
git diff --cached
git commit -m "feat: expose toponyms map in villages navigation"
```

---

### Task 4: Page Shell, Search UI, And Detail Panel

**Files:**

- Create: `project/src/main/views/explore/villages/toponyms/ToponymsMapPage.vue`
- Create: `project/src/main/views/explore/villages/toponyms/ToponymModeTabs.vue`
- Create: `project/src/main/views/explore/villages/toponyms/ToponymSearch.vue`
- Create: `project/src/main/views/explore/villages/toponyms/ToponymDetail.vue`

- [ ] **Step 1: Create `ToponymModeTabs.vue`**

Responsibilities:

- Shows the two primary workflows:
  - distribution exploration
  - place-name information query
- Uses a segmented-control style with existing tokens.
- Does not change route identity; this is internal page state.

- [ ] **Step 2: Create `ToponymSearch.vue`**

Responsibilities:

- `v-model` for query text.
- emits `submit-search`.
- optional suggestions list from `/names`.
- match mode selector.
- place type selector or fixed default label.
- limit input or select.
- shows truncated warning from last `/points` response.
- copy changes by workflow:
  - distribution mode: "enter a character or string to see geographic distribution"
  - query mode: "search one or a few place names, then inspect records"

Use existing `SimpleSelectDropdown` for match mode if available in this part of the app. Use `main-glass-button`, `glass-input`, and nested token SCSS.

- [ ] **Step 3: Create `ToponymDetail.vue`**

Display:

- empty state: "click a point to view details";
- selected point id and coordinates before details load;
- local detail loading state;
- local detail error state;
- official detail loading state;
- official detail error/warning state;
- source badge:
  - local record
  - official detail
  - official unavailable
- details:
  - local fields: name, place type, division path, longitude / latitude
  - official fields when requested and available: city, area/county, historical name
  - selected point id and coordinates in all states
- action button: "query official details" for selected ids

The component should not perform API calls itself; the parent passes local and official detail states into it and handles the official-detail action.

- [ ] **Step 4: Create `ToponymsMapPage.vue` orchestration**

State:

```js
const activeMode = ref('distribution')
const query = ref('')
const matchMode = ref('prefix')
const pointLimit = ref(5000)
const suggestions = ref([])
const pointCollection = ref(buildEmptyToponymsFeatureCollection())
const pointMeta = ref({ count: 0, truncated: false, next: null })
const selectedPoint = ref(null)
const selectedLocalDetail = ref(null)
const selectedOfficialDetail = ref(null)
const isLoadingNames = ref(false)
const isLoadingPoints = ref(false)
const isLoadingLocalDetail = ref(false)
const isLoadingOfficialDetail = ref(false)
const namesError = ref('')
const pointsError = ref('')
const localDetailError = ref('')
const officialDetailError = ref('')
```

Core functions:

```js
async function loadNameSuggestions() {
  if (!query.value.trim()) return
  isLoadingNames.value = true
  namesError.value = ''
  try {
    const result = await getToponymNames({
      q: query.value,
      match_mode: matchMode.value,
      limit: 20,
    })
    suggestions.value = result.items.filter((item) => typeof item === 'string')
  } catch (error) {
    namesError.value = error?.message || t('villages.pages.toponyms.errors.namesFailed')
  } finally {
    isLoadingNames.value = false
  }
}

async function searchPoints(searchText = query.value) {
  const q = String(searchText || '').trim()
  if (!q) {
    pointsError.value = t('villages.pages.toponyms.errors.emptyQuery')
    return
  }

  isLoadingPoints.value = true
  pointsError.value = ''
  selectedPoint.value = null
  selectedLocalDetail.value = null
  selectedOfficialDetail.value = null
  localDetailError.value = ''
  officialDetailError.value = ''

  try {
    const result = await getToponymPoints({
      q,
      match_mode: matchMode.value,
      limit: pointLimit.value,
    })
    pointCollection.value = buildToponymPointFeatureCollection(result.items)
    pointMeta.value = {
      count: result.count,
      truncated: result.truncated,
      next: result.next,
    }
  } catch (error) {
    pointsError.value = error?.message || t('villages.pages.toponyms.errors.pointsFailed')
    pointCollection.value = buildEmptyToponymsFeatureCollection()
  } finally {
    isLoadingPoints.value = false
  }
}

async function loadLocalDetail(point) {
  selectedPoint.value = point
  selectedLocalDetail.value = null
  selectedOfficialDetail.value = null
  localDetailError.value = ''
  officialDetailError.value = ''
  if (!point?.id) {
    localDetailError.value = t('villages.pages.toponyms.errors.missingId')
    return
  }

  isLoadingLocalDetail.value = true
  try {
    const result = await getToponymDetails(point.id)
    selectedLocalDetail.value = result.items[0] || null
    if (!selectedLocalDetail.value) {
      localDetailError.value = t('villages.pages.toponyms.errors.detailEmpty')
    }
  } catch (error) {
    localDetailError.value = error?.message || t('villages.pages.toponyms.errors.detailFailed')
  } finally {
    isLoadingLocalDetail.value = false
  }
}

async function loadOfficialDetail() {
  const id = selectedPoint.value?.id || selectedLocalDetail.value?.id
  if (!id) {
    officialDetailError.value = t('villages.pages.toponyms.errors.missingId')
    return
  }

  isLoadingOfficialDetail.value = true
  officialDetailError.value = ''
  try {
    selectedOfficialDetail.value = await getToponymOfficialDetail(id)
  } catch (error) {
    officialDetailError.value = error?.message || t('villages.pages.toponyms.errors.officialFailed')
    selectedOfficialDetail.value = null
  } finally {
    isLoadingOfficialDetail.value = false
  }
}
```

Add stale request guards with request sequence ids before implementation is considered complete.

- [ ] **Step 5: Add full page i18n strings**

Add under `villages.pages.toponyms`:

Traditional:

```json
"toponyms": {
  "title": "自然村地名地圖",
  "subtitle": "輸入漢字或地名片段，查看自然村地名分佈；點擊點位可查本地記錄與官方詳情。",
  "modes": {
    "distribution": "分佈規律",
    "lookup": "地名查詢"
  },
  "search": "搜索",
  "queryLabel": "地名關鍵詞",
  "queryPlaceholder": "例如：黃、黃村、塘",
  "matchMode": "匹配方式",
  "limit": "點位上限",
  "searchFirst": "請先輸入地名關鍵詞並搜索。",
  "distributionHint": "查看包含或匹配某個漢字、詞段的自然村地名在哪些區域更集中。",
  "lookupHint": "查詢單個或少量地名，點擊點位後查看本地記錄。",
  "loadingNames": "正在查詢地名建議...",
  "loadingPoints": "正在加載點位...",
  "noPoints": "沒有找到匹配點位",
  "pointSummary": "返回 {count} 個點位",
  "truncated": "結果已截斷，請縮小關鍵詞或調整匹配方式。",
  "unknownPoint": "待查詢地名",
  "matchModes": {
    "prefix": "前綴匹配",
    "suffix": "後綴匹配",
    "exact": "精確匹配",
    "contains": "包含匹配"
  },
  "detail": {
    "title": "地名詳情",
    "empty": "點擊地圖上的點位查看詳情。",
    "loadingLocal": "正在加載本地記錄...",
    "loadingOfficial": "正在查詢官方詳情...",
    "sourceOfficial": "官方詳情",
    "sourceLocal": "本地記錄",
    "queryOfficial": "查詢官方詳情",
    "id": "ID",
    "name": "標準地名",
    "city": "所在地市",
    "area": "所在區縣",
    "oldName": "歷史地名",
    "placeType": "地名類型",
    "divisionPath": "行政區劃",
    "coordinates": "經緯度",
    "emptyValue": "暫無"
  },
  "errors": {
    "emptyQuery": "請輸入地名關鍵詞",
    "namesFailed": "無法加載地名建議",
    "pointsFailed": "無法加載點位",
    "missingId": "此點位缺少 ID，無法查詢詳情",
    "detailEmpty": "未找到此點位的詳情",
    "officialFailed": "官方詳情暫不可用",
    "detailFailed": "無法加載地名詳情"
  }
}
```

Add Simplified and English equivalents without rewriting existing keys.

- [ ] **Step 6: Run focused lint/tests**

Run:

```bash
cd project
npm test -- tests/toponymsApiContracts.test.js tests/toponymsMapData.test.js tests/toponymsRouteExposure.test.js
npm run lint -- src/main/views/explore/villages/toponyms src/api/main/toponyms.js
```

- [ ] **Step 7: Commit Task 4 only**

Run:

```bash
git add project/src/main/views/explore/villages/toponyms/ToponymsMapPage.vue project/src/main/views/explore/villages/toponyms/ToponymModeTabs.vue project/src/main/views/explore/villages/toponyms/ToponymSearch.vue project/src/main/views/explore/villages/toponyms/ToponymDetail.vue project/src/i18n/locales/zh-Hant/villages.json project/src/i18n/locales/zh-CN/villages.json project/src/i18n/locales/en/villages.json
git diff --cached
git commit -m "feat: add toponyms search page shell"
```

---

### Task 5: MapLibre Point Rendering

**Files:**

- Create: `project/src/main/views/explore/villages/toponyms/ToponymMap.vue`
- Modify: `project/src/main/views/explore/villages/toponyms/ToponymsMapPage.vue`

- [ ] **Step 1: Implement `ToponymMap.vue`**

Requirements:

- Accepts `featureCollection`.
- Initializes MapLibre once.
- Adds clustered GeoJSON source.
- Adds cluster circle layer, cluster count layer, unclustered point layer.
- Does not add name label layer because point results do not include names.
- Emits `select-point` with `{ id, coordinates, properties }`.
- Updates source with `source.setData(...)` when props change.
- Removes map on unmount.

Use token-derived colors. If MapLibre paint cannot consume CSS variables directly, read tokens:

```js
function cssToken(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}
```

Use this instead of raw hardcoded colors.

- [ ] **Step 2: Wire map into page**

In `ToponymsMapPage.vue`, render `ToponymMap` after a search has data:

```vue
<ToponymMap
  :feature-collection="pointCollection"
  @select-point="loadLocalDetail"
/>
```

Keep empty/search-first/error states outside map.

- [ ] **Step 3: Fit map to search results**

Add optional behavior:

- When new point collection has features, compute bounds and call a public method on `ToponymMap` or let `ToponymMap` watch data and fit bounds.
- If only one point, center and zoom to a reasonable level.
- If many points, fit bounds with padding.

This should not block basic functionality if MapLibre fit fails.

- [ ] **Step 4: Run token scan**

Run:

```bash
rg -n "#[0-9a-fA-F]{3,8}|color:\\s*(red|blue|white|black)|background:\\s*(red|blue|white|black)" project/src/main/views/explore/villages/toponyms
```

Expected:

- No hardcoded SCSS colors.
- Map paint values are token-derived or documented as MapLibre runtime limitations.

- [ ] **Step 5: Run focused tests and lint**

Run:

```bash
cd project
npm test -- tests/toponymsApiContracts.test.js tests/toponymsMapData.test.js tests/toponymsRouteExposure.test.js
npm run lint -- src/main/views/explore/villages/toponyms src/api/main/toponyms.js
```

- [ ] **Step 6: Commit Task 5 only**

Run:

```bash
git add project/src/main/views/explore/villages/toponyms/ToponymMap.vue project/src/main/views/explore/villages/toponyms/ToponymsMapPage.vue
git diff --cached
git commit -m "feat: render queried toponyms points"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run focused tests**

```bash
cd project
npm test -- tests/toponymsApiContracts.test.js tests/toponymsMapData.test.js tests/toponymsRouteExposure.test.js
```

- [ ] **Step 2: Run route-related existing tests**

```bash
cd project
npm test -- tests/legacyRouteMap.test.js tests/entryRedirects.test.js
```

Do not add `/toponyms/map` expectations.

- [ ] **Step 3: Run lint**

```bash
cd project
npm run lint
```

- [ ] **Step 4: Run build**

```bash
cd project
npm run build
```

- [ ] **Step 5: Manual smoke test**

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

- Page loads without initial points request.
- Empty state asks for a keyword.
- Distribution mode explains that the map shows where matching place names are geographically concentrated.
- Lookup mode explains that the user can inspect single or small-set local records.
- Search `黄` with `prefix` calls `/api/toponyms/names` and `/api/toponyms/points`.
- Points render without labels.
- If `truncated` is true, warning appears.
- Cluster click zooms.
- Point click calls `/api/toponyms/details?ids=<id>` and shows the local record.
- Detail panel has a separate official-detail action for the selected id.
- Official-detail action calls `https://dmfw.mca.gov.cn/9095/stname/detailsPub`.
- If official detail succeeds, details panel marks the source as official.
- If official detail fails, local record remains visible and an official-detail warning appears.
- Details panel shows local name, place type, division path, and coordinates.
- Details panel shows official city/area/old-name fields when official detail is requested and available.
- 401/422/FastAPI `detail` errors show readable messages.
- Mobile layout stacks without overlap.

- [ ] **Step 6: Diff review**

```bash
git status --short
git diff
```

Check:

- No unrelated VillagesML files are staged.
- No `/api/toponyms/map`.
- `detailsPub` exists only in the official-detail API helper and is not part of initial search/point loading.
- No `/toponyms/map` redirect.
- Chinese and emoji are intact.

---

## 5. Completion Criteria

Implementation is complete only when:

- `/explore/villages/toponyms` exists and is reachable.
- Explore villages nav, sidebar, and portal place the new entry above Guangdong natural villages.
- The page does not load all toponyms on first paint.
- The page supports distribution-pattern exploration for a user-entered character/string and match mode.
- The page supports single/small-set place-name information lookup through local details.
- Search uses `/api/toponyms/names` and `/api/toponyms/points`.
- Map renders id-only point results using MapLibre layers and clustering.
- Clicking a point loads local `/api/toponyms/details` and respects the 10-id backend limit.
- A selected local record/point can request Ministry `detailsPub` for official detail.
- If Ministry detail fails, the local record remains visible and the failure is non-blocking.
- No `/api/toponyms/map` usage exists.
- No `/toponyms/map` route or redirect exists.
- Styles use existing component classes and tokens with nested scoped SCSS.
- Focused tests pass.
- Lint passes.
- Build passes, unless blocked by unrelated existing worktree changes; exact failure must be reported if so.
