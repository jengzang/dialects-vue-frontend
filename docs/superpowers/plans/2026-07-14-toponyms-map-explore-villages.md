# Toponyms Distribution Explore Villages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the natural-village toponyms distribution and lookup page at `/explore/villages/toponyms`, using the backend toponyms API and ECharts to show where matching place names are geographically concentrated, with local detail lookup and optional Ministry official detail lookup for a selected id.

**Architecture:** This is a main-site Explore villages page, not a VillagesML page and not a new top-level `/toponyms/map` app. The page uses ECharts with a China geographic base: default load is **country boundary only**, while province boundary, city boundary, and river levels 1-3 are optional lazy-loaded overlays. The backend remains split by anti-scraping design: `/names` returns names only, `/points` returns id + coordinates only, `/details` returns local details for known ids, and Ministry `detailsPub` is a separate best-effort action for one selected id.

**Tech Stack:** Vue 3 `<script setup>`, Vue Router path routes, Vue I18n JSON locale files, ECharts `geo` + `scatter`/overlay series, existing `api` HTTP client and `/api` proxy, browser `fetch` for the Ministry detail service, scoped SCSS with project mixins and design tokens, Vitest.

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

Tree response exists but is not part of MVP.

### `GET /api/toponyms/points`

Purpose: search matching distribution points. Returns id + coordinates only, no name.

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

### `GET /api/toponyms/details`

Purpose: local record lookup for one or a few known ids. This is the only local endpoint that returns id + name + coordinates together.

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

### Official Ministry Detail Service

Used only for official detail lookup of one selected id:

```http
POST https://dmfw.mca.gov.cn/9095/stname/detailsPub
Content-Type: application/json

{ "id": "5746d76b8d5150589460729e1a28e3e3" }
```

The backend reports direct local testing currently receives `403 Forbidden`, so the frontend must treat official lookup as best-effort. Local `/api/toponyms/details` remains the reliable record source.

Expected useful official fields from the original product intent:

```json
{
  "area_name": "临漳县",
  "city_name": "邯郸市",
  "old_name": "历史地名"
}
```

The exact official response shape must be handled defensively because the service may return nested data, empty data, non-JSON, 403, or CORS/network failures.

### `GET /api/toponyms/divisions`

Purpose: administrative division list. Not required for MVP.

---

## 1. GIS Data Contract

The frontend has GIS assets in `project/public/data/gis/`. These files are static public assets and should be loaded with `fetch('/data/gis/<file>.geojson')`.

### Available Files

| File | Raw Size | gzip Size | Features | Geometry | Use |
| --- | ---: | ---: | ---: | --- | --- |
| `china_country.geojson` | 195 KB | 74 KB | 1 | `MultiPolygon` | Default base map, loaded on first page entry |
| `china_provinces.geojson` | 646 KB | 258 KB | 34 | `Polygon` / `MultiPolygon` | Optional province boundary overlay |
| `china_cities_simplified_light.geojson` | 861 KB | 343 KB | 372 | `Polygon` / `MultiPolygon` | Optional city boundary overlay, preferred default if city layer is enabled |
| `china_cities_simplified_balanced.geojson` | 1.5 MB | 628 KB | 372 | `Polygon` / `MultiPolygon` | Optional higher-detail city boundary overlay |
| `china_rivers_l1.geojson` | 430 KB | 128 KB | 549 | `LineString` / `MultiLineString` | Optional river overlay |
| `china_rivers_l2.geojson` | 317 KB | 93 KB | 431 | `LineString` | Optional river overlay |
| `china_rivers_l3.geojson` | 482 KB | 140 KB | 683 | `LineString` | Optional river overlay |

### Loading Rule

- Initial page load must fetch only `china_country.geojson`.
- Province boundary, city boundary, and river overlays must be lazy-loaded only after the user enables each layer.
- City boundary default option should be `china_cities_simplified_light.geojson`; `balanced` can be a secondary quality option later, but MVP should not add a quality selector unless the user asks.
- River overlays are optional visual context and must not block distribution search.
- GIS fetch errors should leave the chart usable with already loaded layers and show a non-blocking message.

### ECharts Registration Rule

- Use `echarts.registerMap('china-country', countryGeoJson)` for the default country base.
- Point series use `coordinateSystem: 'geo'`.
- Province/city polygon overlays can be rendered as extra `map` series or converted boundary lines, but they must not replace the default country base unless there is a clear implementation reason documented in CR.
- River line overlays should be converted from GeoJSON `LineString` / `MultiLineString` features into ECharts `lines` series data on the same `geo` coordinate system.
- Chart colors must be derived from CSS tokens read at runtime with `getComputedStyle(document.documentElement)`.

---

## 2. Product Decisions

### Route

Implement only:

```text
/explore/villages/toponyms
```

Do not implement `/toponyms/map`. Do not add a legacy redirect. The feature has not shipped yet, so there is no legacy user traffic.

### First Screen

No toponym point auto-load. First screen should show:

- title and short subtitle;
- horizontal search control area;
- ECharts canvas with country boundary only;
- optional layer toggles, all off except country;
- empty result state saying to search first;
- names/results/detail panel in an empty state.

### Layout

Desktop / landscape:

1. Top band: title and compact subtitle.
2. Horizontal search bar: keyword input, match mode select, place type select/default label, point limit select/input, search button.
3. Body: ECharts distribution chart as the main area, with a right-side results/detail panel.
4. Optional layer controls should be compact toggles near the chart toolbar, not a separate large settings page.

Portrait / mobile:

- Use `@media (max-aspect-ratio: 1 / 1)` only.
- Search controls wrap naturally into two rows.
- Chart appears above results/detail.
- No width-based media queries.

### Primary Workflows

#### Workflow A: Distribution Pattern Exploration

1. User enters a character/string such as `黄`, `塘`, or `村`.
2. User chooses `match_mode`: `prefix`, `suffix`, `exact`, or `contains`.
3. User keeps or changes `place_type_code`, defaulting to natural villages (`22200`).
4. Frontend calls `/api/toponyms/points`.
5. ECharts renders id-only points on the China geo coordinate system.
6. The page summarizes returned count and `truncated` state.
7. User visually inspects where that character/string is concentrated.

This is the main value: showing distribution patterns of place names matching the user's input.

#### Workflow B: Name Suggestions And Result List

1. User enters a name/string.
2. Frontend calls `/api/toponyms/names` for name suggestions.
3. Suggestions appear in the results panel or search dropdown.
4. Selecting a suggestion fills the query and can trigger `/points` search with the current match mode.

Important: suggestions do not include ids or coordinates, so selecting a suggestion is a search shortcut, not a detail lookup.

#### Workflow C: Point Detail Lookup

1. User clicks an ECharts point.
2. Parent receives `{ id, coordinates }`.
3. Parent calls `/api/toponyms/details?ids=<id>`.
4. Detail panel shows the local record: `name`, `place_type`, `division_path`, longitude, latitude.

If multiple ids are explicitly selected later, local details must respect the backend limit of 10 unique ids. MVP fetches one id per point click.

#### Workflow D: Official Detail Lookup For One Selected Id

1. User has selected a local record or point with an id.
2. User clicks "query official details".
3. Frontend calls Ministry `detailsPub` with the selected id.
4. If official lookup succeeds, show official fields and mark the source as official.
5. If official lookup fails, keep the local record visible and show a non-blocking official-detail warning.

### Important UI Copy Constraint

Because `/points` results do not include names, do not promise point labels during distribution exploration. Chart points can show:

- count summaries;
- selected id;
- selected coordinates;
- "click point to view local record";
- official detail as an additional action for a selected id.

If point labels are desired later, they require `/details` batching and must respect the 10-id limit.

---

## 3. Hard Constraints And Project Rules

### API And Data

- Do not use `/api/toponyms/map`.
- Do not add `/toponyms/map` route or redirect.
- Do not load all natural-village points on first paint.
- Do not expose `limit=0` in MVP.
- Default point limit is `5000`.
- Default name suggestion limit is `20`.
- Default place type is `22200`.
- `contains` match mode is allowed, but UI copy should imply it may return broad results.
- Frontend must validate coordinates even though backend reports real data is clean.

### ECharts

- Use ECharts, not MapLibre, for this page.
- Default first-page GIS fetch is only `/data/gis/china_country.geojson`.
- Province/city/river layers are optional lazy-loaded overlays.
- Dispose chart instances in `onBeforeUnmount`.
- Use `ResizeObserver` or established project resize pattern to call `chart.resize()`.
- Do not use DOM markers.
- Do not assume points have names.
- Token-derived chart palette is required. If an ECharts option needs a concrete color string, read CSS variables at runtime and use that value.

### Styling

- Every component style block must be `<style scoped lang="scss">`.
- Every component style block must start with `@use '@/styles/global/mixins' as *;`.
- Use nested SCSS selectors.
- Do not add a new global SCSS entry.
- Do not hardcode colors in component SCSS.
- Use CSS custom properties from `src/styles/global/_tokens.scss`.
- Use existing classes where practical:
  - `glass-container`
  - `glass-container-shell`
  - `main-glass-panel`
  - `main-glass-panel-inner`
  - `main-glass-button`
  - `main-input-field`
  - `main-search-field`
  - `ui-scrollbar`
  - `ui-loading--page`
  - `ui-loading--inline`
- Use existing components where practical:
  - `SimpleSelectDropdown` for match mode and fixed option selects.
- Use mixins instead of raw equivalents:
  - `@include flex-center`
  - `@include flex-col`
  - `@include text-truncate`
  - `@include disabled-state`
  - `@include glass-blur($blur, $saturation)`
- Do not write width-based media queries. Use `@media (max-aspect-ratio: 1 / 1)` for portrait/mobile layout.

### Chinese, Emoji, And i18n

- Keep existing Chinese unchanged.
- Add only new necessary i18n keys.
- Preserve literal emoji.
- After locale edits, inspect diff for mojibake and accidental rewrites.
- Do not rewrite existing Traditional/Simplified copy casually.

### Step And Commit Discipline

- Before each task, run `git status --short`.
- After each task, inspect `git diff`.
- Commit each task separately.
- Do not stage or commit unrelated files.
- If other worker changes appear, leave them alone unless they block this task.

---

## 4. File Structure

### Already Created In Earlier Commits

- `project/src/api/main/toponyms.js`
  - `getToponymNames(params)`
  - `getToponymPoints(params)`
  - `getToponymOfficialDetail(id, options)`
  - `getToponymDetails(ids)`

- `project/tests/toponymsApiContracts.test.js`

- `project/src/main/views/explore/villages/toponyms/toponymsMapData.js`
  - This file was created under the earlier MapLibre-oriented plan.
  - It must be replaced or renamed in the ECharts plan because `MapData` and GeoJSON feature helpers no longer describe the intended implementation.

- `project/tests/toponymsMapData.test.js`
  - This test should be replaced with chart-data tests.

### Create / Replace

- Create: `project/src/main/views/explore/villages/toponyms/toponymsChartData.js`
  - validates id-only point rows;
  - builds ECharts scatter data;
  - extracts selected point identity from ECharts click params;
  - converts river GeoJSON features to ECharts `lines` data;
  - computes point extent for optional chart zoom helpers.

- Create: `project/src/main/views/explore/villages/toponyms/toponymsGisAssets.js`
  - GIS asset path constants;
  - GIS fetch helper;
  - in-memory promise cache so optional layer toggles do not re-fetch the same file.

- Create: `project/src/main/views/explore/villages/toponyms/ToponymsPage.vue`
  - route-level orchestration: query state, suggestions, points, selected id, local details, official details, optional layer state, errors.

- Create: `project/src/main/views/explore/villages/toponyms/ToponymSearchBar.vue`
  - horizontal search controls.

- Create: `project/src/main/views/explore/villages/toponyms/ToponymLayerControls.vue`
  - compact layer toggles for province, city, river L1, river L2, river L3.

- Create: `project/src/main/views/explore/villages/toponyms/ToponymDistributionChart.vue`
  - ECharts initialization;
  - default country map registration;
  - point scatter rendering;
  - optional province/city/river overlay rendering;
  - point click emits selected id + coordinates.

- Create: `project/src/main/views/explore/villages/toponyms/ToponymResultsPanel.vue`
  - name suggestions;
  - point count/truncated/no-results states;
  - selected point summary;
  - wraps detail panel.

- Create: `project/src/main/views/explore/villages/toponyms/ToponymDetailPanel.vue`
  - local detail display;
  - official detail action and display;
  - local/official error states.

- Create: `project/tests/toponymsChartData.test.js`

- Create: `project/tests/toponymsGisAssets.test.js`

- Create: `project/tests/toponymsRouteExposure.test.js`

### Modify

- `project/src/api/index.js`
  - already exports toponyms API functions.

- `project/src/main/router/exploreRoutes.js`
  - add `explore/villages/toponyms`.

- `project/src/main/config/BarAndTabs/ExploreBarConfig.js`
  - add villages child above Guangdong natural villages.

- `project/src/main/config/BarAndTabs/SideBarConfig.js`
  - add villages child above Guangdong natural villages in dynamic and static configs.

- `project/src/main/views/menu/portals/VillagesPage.vue`
  - add portal entry above Guangdong natural villages.

- `project/src/i18n/locales/zh-Hant/navigation.json`
- `project/src/i18n/locales/zh-CN/navigation.json`
- `project/src/i18n/locales/en/navigation.json`
- `project/src/i18n/locales/zh-Hant/villages.json`
- `project/src/i18n/locales/zh-CN/villages.json`
- `project/src/i18n/locales/en/villages.json`
  - add navigation, portal, page, error, detail, layer, and search strings.

---

## 5. Edge Cases

### Query And Limits

- Empty `q`: do not call backend. Show "enter a keyword".
- Whitespace-only `q`: trim and treat as empty.
- `limit`: default to `5000`; reject or normalize invalid UI values.
- `limit=0`: do not expose in MVP.
- Backend `truncated: true`: show warning to narrow keyword, use stricter match mode, or reduce result breadth.
- `match_mode=contains`: likely broad; keep it available but make it an explicit option after `prefix`, `suffix`, `exact`.

### Response Shapes

- `/names` normal response is string array.
- `/names` tree response is object array; MVP should not request tree mode.
- `/points` never returns names.
- `/details` returns `items` array and `count`.
- FastAPI errors usually use `{"detail": "message"}` or 422 detail arrays. API helper should convert them into readable errors.

### Point Data

- Drop rows with missing id.
- Drop rows with missing, empty, non-finite, or out-of-range coordinates.
- Treat `longitude === ''` or `latitude === ''` as invalid; do not let `Number('')` become `0`.
- ECharts scatter data should carry id in object form:

```js
{
  name: id,
  value: [longitude, latitude],
  id
}
```

### GIS Layers

- Country boundary fetch failure: chart should show a chart-level error because no geo base can be registered.
- Optional layer fetch failure: keep country base and point layer visible; show non-blocking layer warning.
- Optional layer toggled off before fetch completes: do not render stale layer when the request resolves.
- Province/city overlays should not be required for point plotting.
- River overlays must not steal point click behavior.
- Re-toggling a loaded layer should use cache, not re-fetch.

### Detail Lookup

- Local details endpoint accepts at most 10 unique ids. MVP fetches 1 id per chart point click.
- Clicking a point should fetch local `/api/toponyms/details` first.
- Ministry `detailsPub` is an official-detail action for the selected id, not the primary distribution data source.
- Official failure modes include 403, CORS, timeout, non-JSON body, empty detail, and response shape drift.
- If official lookup fails, keep local details visible and show a warning.
- If local details returns empty `items`, show "no detail found".
- If local request returns 401, show login/permission message.
- If local request returns 422, show parameter error message.
- If local details response coordinates differ from clicked point coordinates, display details values but keep selected point coordinates visible.

---

## 6. Task Plan

### Task 1: API Contract And Helpers

Status: completed in commit `510b88d5 feat: add toponyms api contracts`.

Keep the implementation. Do not reintroduce `/api/toponyms/map`.

Verification:

```bash
cd project
npm test -- tests/toponymsApiContracts.test.js
```

Expected: PASS.

---

### Task 2: Replace Map Data Helpers With ECharts Data Helpers

**Files:**

- Delete: `project/src/main/views/explore/villages/toponyms/toponymsMapData.js`
- Delete: `project/tests/toponymsMapData.test.js`
- Create: `project/src/main/views/explore/villages/toponyms/toponymsChartData.js`
- Create: `project/tests/toponymsChartData.test.js`

- [ ] **Step 1: Re-check workspace state**

Run:

```bash
git status --short
```

Expected:

- Unrelated worker changes may exist.
- Do not stage or revert unrelated files.

- [ ] **Step 2: Write failing chart-data tests**

Create `project/tests/toponymsChartData.test.js`:

```js
import { describe, expect, it } from 'vitest'
import {
  buildToponymScatterData,
  extractToponymPointFromChartParams,
  buildRiverLineSeriesData,
  getToponymPointExtent,
} from '../src/main/views/explore/villages/toponyms/toponymsChartData.js'

describe('toponyms ECharts data helpers', () => {
  it('converts id-only points to ECharts scatter data and drops invalid coordinates', () => {
    const data = buildToponymScatterData([
      { id: 'a', longitude: 114.1, latitude: 22.2 },
      { id: 'bad-lng', longitude: 999, latitude: 22.2 },
      { id: 'empty-lng', longitude: '', latitude: 22.2 },
      { id: '', longitude: 114.1, latitude: 22.2 },
    ])

    expect(data).toEqual([
      {
        id: 'a',
        name: 'a',
        value: [114.1, 22.2],
      },
    ])
  })

  it('extracts selected point identity from ECharts click params without assuming a name', () => {
    expect(extractToponymPointFromChartParams({
      componentType: 'series',
      seriesType: 'scatter',
      data: { id: 'abc', value: [114.1, 22.2] },
    })).toEqual({
      id: 'abc',
      coordinates: [114.1, 22.2],
    })
  })

  it('converts river GeoJSON lines into ECharts line segments', () => {
    const data = buildRiverLineSeriesData({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { name: '河流', level: 'river_l1' },
          geometry: { type: 'LineString', coordinates: [[110, 20], [111, 21], [112, 22]] },
        },
      ],
    })

    expect(data).toEqual([
      {
        name: '河流',
        coords: [[110, 20], [111, 21], [112, 22]],
        level: 'river_l1',
      },
    ])
  })

  it('computes extent for valid scatter data', () => {
    expect(getToponymPointExtent([
      { id: 'a', value: [110, 20] },
      { id: 'b', value: [120, 30] },
    ])).toEqual({
      minLng: 110,
      minLat: 20,
      maxLng: 120,
      maxLat: 30,
    })
  })
})
```

- [ ] **Step 3: Run chart-data tests and verify failure**

Run:

```bash
cd project
npm test -- tests/toponymsChartData.test.js
```

Expected: FAIL because helper does not exist.

- [ ] **Step 4: Implement `toponymsChartData.js`**

Create `project/src/main/views/explore/villages/toponyms/toponymsChartData.js`:

```js
function isPresentCoordinate(value) {
  return value !== '' && value !== null && value !== undefined
}

function toCoordinatePair(longitude, latitude) {
  if (!isPresentCoordinate(longitude) || !isPresentCoordinate(latitude)) {
    return null
  }

  const lng = Number(longitude)
  const lat = Number(latitude)
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null
  if (lng < -180 || lng > 180 || lat < -90 || lat > 90) return null
  return [lng, lat]
}

export function buildToponymScatterData(items = []) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const id = String(item?.id || '').trim()
      const value = toCoordinatePair(item?.longitude, item?.latitude)
      if (!id || !value) return null

      return {
        id,
        name: id,
        value,
      }
    })
    .filter(Boolean)
}

export function extractToponymPointFromChartParams(params) {
  const data = params?.data || {}
  const id = String(data.id || data.name || '').trim()
  const coordinates = Array.isArray(data.value) ? data.value.slice(0, 2) : []

  if (!id || coordinates.length !== 2) {
    return null
  }

  return { id, coordinates }
}

function pushLineString(lines, feature, coordinates) {
  const cleanCoords = (Array.isArray(coordinates) ? coordinates : [])
    .map((coord) => toCoordinatePair(coord?.[0], coord?.[1]))
    .filter(Boolean)

  if (cleanCoords.length < 2) return

  lines.push({
    name: feature?.properties?.name || '',
    coords: cleanCoords,
    level: feature?.properties?.level || '',
  })
}

export function buildRiverLineSeriesData(geoJson) {
  const lines = []
  const features = Array.isArray(geoJson?.features) ? geoJson.features : []

  features.forEach((feature) => {
    const geometry = feature?.geometry
    if (geometry?.type === 'LineString') {
      pushLineString(lines, feature, geometry.coordinates)
    }
    if (geometry?.type === 'MultiLineString') {
      ;(geometry.coordinates || []).forEach((coordinates) => {
        pushLineString(lines, feature, coordinates)
      })
    }
  })

  return lines
}

export function getToponymPointExtent(scatterData = []) {
  const coordinates = (Array.isArray(scatterData) ? scatterData : [])
    .map((item) => Array.isArray(item?.value) ? item.value.slice(0, 2) : null)
    .filter(Boolean)

  if (!coordinates.length) {
    return null
  }

  return coordinates.reduce((extent, [lng, lat]) => ({
    minLng: Math.min(extent.minLng, lng),
    minLat: Math.min(extent.minLat, lat),
    maxLng: Math.max(extent.maxLng, lng),
    maxLat: Math.max(extent.maxLat, lat),
  }), {
    minLng: coordinates[0][0],
    minLat: coordinates[0][1],
    maxLng: coordinates[0][0],
    maxLat: coordinates[0][1],
  })
}
```

- [ ] **Step 5: Remove old MapLibre-oriented helper and test**

Delete:

```text
project/src/main/views/explore/villages/toponyms/toponymsMapData.js
project/tests/toponymsMapData.test.js
```

No imports should reference `toponymsMapData.js`.

- [ ] **Step 6: Run tests**

Run:

```bash
cd project
npm test -- tests/toponymsChartData.test.js tests/toponymsApiContracts.test.js
```

Expected: PASS.

- [ ] **Step 7: Diff and commit Task 2 only**

Run:

```bash
git diff -- project/src/main/views/explore/villages/toponyms project/tests/toponymsChartData.test.js project/tests/toponymsMapData.test.js
git add project/src/main/views/explore/villages/toponyms/toponymsChartData.js project/tests/toponymsChartData.test.js
git add -u project/src/main/views/explore/villages/toponyms/toponymsMapData.js project/tests/toponymsMapData.test.js
git diff --cached
git commit -m "feat: add toponyms ECharts data helpers"
```

---

### Task 3: GIS Asset Loader And Contract Tests

**Files:**

- Create: `project/src/main/views/explore/villages/toponyms/toponymsGisAssets.js`
- Create: `project/tests/toponymsGisAssets.test.js`

- [ ] **Step 1: Write failing GIS asset tests**

Create `project/tests/toponymsGisAssets.test.js`:

```js
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const testsDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(testsDir, '..')

function readJson(relativePath) {
  return JSON.parse(readFileSync(resolve(projectRoot, relativePath), 'utf8'))
}

function countGeometryTypes(geoJson) {
  return (geoJson.features || []).reduce((counts, feature) => {
    const type = feature.geometry?.type || 'null'
    counts[type] = (counts[type] || 0) + 1
    return counts
  }, {})
}

describe('toponyms GIS assets', () => {
  it('keeps country boundary as the only default GIS asset', () => {
    const source = readFileSync(resolve(projectRoot, 'src/main/views/explore/villages/toponyms/toponymsGisAssets.js'), 'utf8')

    expect(source).toContain(\"defaultBase: 'country'\")
    expect(source).toContain('/data/gis/china_country.geojson')
    expect(source).toContain('/data/gis/china_provinces.geojson')
    expect(source).toContain('/data/gis/china_cities_simplified_light.geojson')
    expect(source).toContain('/data/gis/china_rivers_l1.geojson')
  })

  it('ships valid country, province, city, and river GeoJSON assets', () => {
    const country = readJson('public/data/gis/china_country.geojson')
    const provinces = readJson('public/data/gis/china_provinces.geojson')
    const cities = readJson('public/data/gis/china_cities_simplified_light.geojson')
    const rivers = readJson('public/data/gis/china_rivers_l1.geojson')

    expect(country.type).toBe('FeatureCollection')
    expect(provinces.type).toBe('FeatureCollection')
    expect(cities.type).toBe('FeatureCollection')
    expect(rivers.type).toBe('FeatureCollection')
    expect(countGeometryTypes(country)).toEqual({ MultiPolygon: 1 })
    expect(Object.keys(countGeometryTypes(provinces))).toEqual(expect.arrayContaining(['Polygon', 'MultiPolygon']))
    expect(Object.keys(countGeometryTypes(cities))).toEqual(expect.arrayContaining(['Polygon', 'MultiPolygon']))
    expect(Object.keys(countGeometryTypes(rivers))).toEqual(expect.arrayContaining(['LineString']))
  })
})
```

- [ ] **Step 2: Run GIS tests and verify failure**

Run:

```bash
cd project
npm test -- tests/toponymsGisAssets.test.js
```

Expected: FAIL because `toponymsGisAssets.js` does not exist.

- [ ] **Step 3: Implement `toponymsGisAssets.js`**

Create `project/src/main/views/explore/villages/toponyms/toponymsGisAssets.js`:

```js
export const TOPONYMS_GIS_ASSETS = {
  defaultBase: 'country',
  country: {
    key: 'country',
    labelKey: 'villages.pages.toponyms.layers.country',
    path: '/data/gis/china_country.geojson',
    kind: 'map',
    defaultVisible: true,
  },
  provinces: {
    key: 'provinces',
    labelKey: 'villages.pages.toponyms.layers.provinces',
    path: '/data/gis/china_provinces.geojson',
    kind: 'map-overlay',
    defaultVisible: false,
  },
  cities: {
    key: 'cities',
    labelKey: 'villages.pages.toponyms.layers.cities',
    path: '/data/gis/china_cities_simplified_light.geojson',
    kind: 'map-overlay',
    defaultVisible: false,
  },
  riverL1: {
    key: 'riverL1',
    labelKey: 'villages.pages.toponyms.layers.riverL1',
    path: '/data/gis/china_rivers_l1.geojson',
    kind: 'river',
    defaultVisible: false,
  },
  riverL2: {
    key: 'riverL2',
    labelKey: 'villages.pages.toponyms.layers.riverL2',
    path: '/data/gis/china_rivers_l2.geojson',
    kind: 'river',
    defaultVisible: false,
  },
  riverL3: {
    key: 'riverL3',
    labelKey: 'villages.pages.toponyms.layers.riverL3',
    path: '/data/gis/china_rivers_l3.geojson',
    kind: 'river',
    defaultVisible: false,
  },
}

const gisAssetCache = new Map()

export function getDefaultToponymsLayerState() {
  return Object.fromEntries(
    Object.values(TOPONYMS_GIS_ASSETS)
      .filter((asset) => asset.key)
      .map((asset) => [asset.key, Boolean(asset.defaultVisible)])
  )
}

export async function loadToponymsGisAsset(key) {
  const asset = TOPONYMS_GIS_ASSETS[key]
  if (!asset?.path) {
    throw new Error(`unknown toponyms GIS asset: ${key}`)
  }

  if (!gisAssetCache.has(key)) {
    gisAssetCache.set(key, fetch(asset.path).then(async (response) => {
      if (!response.ok) {
        throw new Error(`failed to load GIS asset: ${asset.path}`)
      }
      return response.json()
    }))
  }

  return gisAssetCache.get(key)
}

export function clearToponymsGisAssetCache() {
  gisAssetCache.clear()
}
```

- [ ] **Step 4: Run GIS tests**

Run:

```bash
cd project
npm test -- tests/toponymsGisAssets.test.js
```

Expected: PASS.

- [ ] **Step 5: Diff and commit Task 3 only**

Run:

```bash
git diff -- project/src/main/views/explore/villages/toponyms/toponymsGisAssets.js project/tests/toponymsGisAssets.test.js
git add project/src/main/views/explore/villages/toponyms/toponymsGisAssets.js project/tests/toponymsGisAssets.test.js
git diff --cached
git commit -m "feat: add toponyms GIS asset loader"
```

---

### Task 4: Route, Navigation, And Portal Entry

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

describe('toponyms route exposure', () => {
  it('registers toponyms as an Explore villages route', () => {
    const source = readSource('src/main/router/exploreRoutes.js')

    expect(source).toContain('explore/villages/toponyms')
    expect(source).toContain('ToponymsPage')
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
    const toponymsIndex = source.indexOf('handleToponyms')
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
const ToponymsPage = () => import('@/main/views/explore/villages/toponyms/ToponymsPage.vue')
```

Add route above Guangdong natural villages:

```js
{
  path: 'explore/villages/toponyms',
  component: ToponymsPage
},
```

- [ ] **Step 3: Add navigation entries above Guangdong natural villages**

`ExploreBarConfig.js`:

```js
{ label: t('navigation.submenu.villages.toponyms'), icon: '🗺️', path: withRouteLocale(route, '/explore/villages/toponyms') },
```

Update `matchPages`:

```js
matchPages: ['toponyms', 'gdVillages', 'gdVillagesTable', 'ycVillages', 'VillagesML'],
```

`SideBarConfig.js`: add the same dynamic entry and the static fallback entry:

```js
{ label: t('navigation.submenu.villages.toponyms'), icon: '🗺️', path: withRouteLocale(route, '/explore/villages/toponyms') },
```

```js
{ label: '自然村地名分佈', icon: '🗺️', path: buildLocalePath('zh-Hant', '/explore/villages/toponyms') },
```

- [ ] **Step 4: Add portal card above Guangdong natural villages**

In `VillagesPage.vue`, add above the Guangdong natural villages button:

```vue
<button class="entry-button" @click="handleToponyms">
  <div class="entry-button__icon">🗺️</div>
  <div class="entry-button__name">
    {{ $t('villages.toponyms.name') }}
  </div>
  <div class="entry-button__desc">
    {{ $t('villages.toponyms.desc') }}
  </div>
</button>
```

Handler:

```js
const handleToponyms = () => {
  router.push(buildLocalePath(resolveRouteLocale(route), '/explore/villages/toponyms'))
}
```

- [ ] **Step 5: Add i18n labels**

Add navigation labels:

```json
"toponyms": "自然村地名分佈"
```

```json
"toponyms": "自然村地名分布"
```

```json
"toponyms": "Village Toponym Distribution"
```

Add portal labels:

```json
"toponyms": {
  "name": "自然村地名分佈",
  "desc": "按漢字或地名片段查看自然村地名的地理分佈"
}
```

Simplified and English equivalents:

```json
"toponyms": {
  "name": "自然村地名分布",
  "desc": "按汉字或地名片段查看自然村地名的地理分布"
}
```

```json
"toponyms": {
  "name": "Village Toponym Distribution",
  "desc": "Explore where natural-village place names cluster by character or name fragment"
}
```

- [ ] **Step 6: Run tests and inspect Chinese/emoji diff**

Run:

```bash
cd project
npm test -- tests/toponymsRouteExposure.test.js
git diff -- src/i18n/locales/zh-Hant src/i18n/locales/zh-CN src/main/config/BarAndTabs src/main/views/menu/portals/VillagesPage.vue
```

Check:

- New entry is above Guangdong natural villages.
- Existing Chinese was not rewritten.
- `🗺️` remains literal.

- [ ] **Step 7: Commit Task 4 only**

Run:

```bash
git add project/src/main/router/exploreRoutes.js project/src/main/config/BarAndTabs/ExploreBarConfig.js project/src/main/config/BarAndTabs/SideBarConfig.js project/src/main/views/menu/portals/VillagesPage.vue project/src/i18n/locales/zh-Hant/navigation.json project/src/i18n/locales/zh-CN/navigation.json project/src/i18n/locales/en/navigation.json project/src/i18n/locales/zh-Hant/villages.json project/src/i18n/locales/zh-CN/villages.json project/src/i18n/locales/en/villages.json project/tests/toponymsRouteExposure.test.js
git diff --cached
git commit -m "feat: expose toponyms distribution in villages navigation"
```

---

### Task 5: Page Shell, Horizontal Search, Layer Controls, And Detail Panels

**Files:**

- Create: `project/src/main/views/explore/villages/toponyms/ToponymsPage.vue`
- Create: `project/src/main/views/explore/villages/toponyms/ToponymSearchBar.vue`
- Create: `project/src/main/views/explore/villages/toponyms/ToponymLayerControls.vue`
- Create: `project/src/main/views/explore/villages/toponyms/ToponymResultsPanel.vue`
- Create: `project/src/main/views/explore/villages/toponyms/ToponymDetailPanel.vue`
- Modify: `project/src/i18n/locales/zh-Hant/villages.json`
- Modify: `project/src/i18n/locales/zh-CN/villages.json`
- Modify: `project/src/i18n/locales/en/villages.json`

- [ ] **Step 1: Create `ToponymSearchBar.vue`**

Responsibilities:

- Horizontal control area.
- `v-model:query`.
- `v-model:matchMode`.
- `v-model:placeTypeCode`.
- `v-model:pointLimit`.
- Emits `submit-search`.
- Uses `SimpleSelectDropdown` for match mode and place type.
- Uses existing `main-input-field` or `main-search-field`.
- Search button uses `main-glass-button` with `data-variant="primary"`.
- Style block must be `<style scoped lang="scss">` and start with:

```scss
@use '@/styles/global/mixins' as *;
```

- [ ] **Step 2: Create `ToponymLayerControls.vue`**

Responsibilities:

- Shows compact toggles for:
  - province boundary;
  - city boundary;
  - river L1;
  - river L2;
  - river L3.
- Country boundary is always enabled and not user-removable in MVP.
- Emits updated layer state.
- Shows loading/error state per optional layer if parent passes it.
- Uses token styles and nested SCSS.

- [ ] **Step 3: Create `ToponymDetailPanel.vue`**

Display:

- empty state: click a point to view details;
- selected point id and coordinates before details load;
- local detail loading state;
- local detail error state;
- official detail loading state;
- official detail error/warning state;
- local fields: name, place type, division path, longitude / latitude;
- official fields when requested and available: city, area/county, historical name;
- action button: query official details for selected id.

The component must not perform API calls itself.

- [ ] **Step 4: Create `ToponymResultsPanel.vue`**

Responsibilities:

- Shows name suggestions returned by `/names`.
- Shows point count, filtered valid point count, and truncated warning.
- Selecting a suggestion emits `select-suggestion`.
- Includes `ToponymDetailPanel`.
- Must clearly say that suggestions are names only and do not imply loaded coordinates until searched.

- [ ] **Step 5: Create `ToponymsPage.vue` orchestration**

State:

```js
const query = ref('')
const matchMode = ref('prefix')
const placeTypeCode = ref('22200')
const pointLimit = ref(5000)
const suggestions = ref([])
const scatterData = ref([])
const pointMeta = ref({ count: 0, truncated: false, next: null })
const selectedPoint = ref(null)
const selectedLocalDetail = ref(null)
const selectedOfficialDetail = ref(null)
const layerState = ref(getDefaultToponymsLayerState())
const loadedLayers = shallowRef({})
const layerErrors = ref({})
const isLoadingNames = ref(false)
const isLoadingPoints = ref(false)
const isLoadingLocalDetail = ref(false)
const isLoadingOfficialDetail = ref(false)
const namesError = ref('')
const pointsError = ref('')
const localDetailError = ref('')
const officialDetailError = ref('')
```

Core behavior:

- No point request on first paint.
- Load country GIS asset for the chart shell.
- Load optional layer only when its toggle becomes true.
- On new search, clear selected point/local detail/official detail/errors.
- Use request sequence ids to avoid stale async updates.
- Use `/names` and `/points` as separate calls.
- Use `/details` only for selected point id.
- Use `detailsPub` only from official-detail action.

- [ ] **Step 6: Add page i18n strings**

Add under `villages.pages.toponyms`:

Traditional:

```json
"toponyms": {
  "title": "自然村地名分佈",
  "subtitle": "輸入漢字或地名片段，查看自然村地名在中國範圍內的分佈；點擊點位可查本地記錄與官方詳情。",
  "search": "搜索",
  "queryLabel": "地名關鍵詞",
  "queryPlaceholder": "例如：黃、黃村、塘",
  "matchMode": "匹配方式",
  "placeType": "地名類型",
  "limit": "點位上限",
  "searchFirst": "請先輸入地名關鍵詞並搜索。",
  "loadingNames": "正在查詢地名建議...",
  "loadingPoints": "正在加載點位...",
  "noPoints": "沒有找到匹配點位",
  "pointSummary": "返回 {count} 個點位",
  "validPointSummary": "可展示 {count} 個點位",
  "truncated": "結果已截斷，請縮小關鍵詞或調整匹配方式。",
  "suggestionsTitle": "地名建議",
  "suggestionsHint": "建議只包含地名；選中後會按當前匹配方式重新搜索點位。",
  "matchModes": {
    "prefix": "前綴匹配",
    "suffix": "後綴匹配",
    "exact": "精確匹配",
    "contains": "包含匹配"
  },
  "placeTypes": {
    "naturalVillage": "自然村",
    "administrativeVillage": "行政村",
    "villageCommittee": "村委會"
  },
  "layers": {
    "title": "圖層",
    "country": "國界",
    "provinces": "省界",
    "cities": "市界",
    "riverL1": "一級河流",
    "riverL2": "二級河流",
    "riverL3": "三級河流",
    "loading": "正在加載圖層",
    "failed": "圖層加載失敗"
  },
  "detail": {
    "title": "地名詳情",
    "empty": "點擊分佈圖上的點位查看詳情。",
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
    "countryLayerFailed": "無法加載中國國界底圖",
    "optionalLayerFailed": "無法加載可選圖層",
    "missingId": "此點位缺少 ID，無法查詢詳情",
    "detailEmpty": "未找到此點位的詳情",
    "officialFailed": "官方詳情暫不可用",
    "detailFailed": "無法加載地名詳情"
  }
}
```

Add Simplified and English equivalents without rewriting existing keys.

- [ ] **Step 7: Run focused tests and lint**

Run:

```bash
cd project
npm test -- tests/toponymsApiContracts.test.js tests/toponymsChartData.test.js tests/toponymsGisAssets.test.js tests/toponymsRouteExposure.test.js
npm run lint -- src/main/views/explore/villages/toponyms src/api/main/toponyms.js
```

- [ ] **Step 8: Diff and commit Task 5 only**

Run:

```bash
git add project/src/main/views/explore/villages/toponyms/ToponymsPage.vue project/src/main/views/explore/villages/toponyms/ToponymSearchBar.vue project/src/main/views/explore/villages/toponyms/ToponymLayerControls.vue project/src/main/views/explore/villages/toponyms/ToponymResultsPanel.vue project/src/main/views/explore/villages/toponyms/ToponymDetailPanel.vue project/src/i18n/locales/zh-Hant/villages.json project/src/i18n/locales/zh-CN/villages.json project/src/i18n/locales/en/villages.json
git diff --cached
git commit -m "feat: add toponyms distribution page shell"
```

---

### Task 6: ECharts Distribution Chart

**Files:**

- Create: `project/src/main/views/explore/villages/toponyms/ToponymDistributionChart.vue`
- Modify: `project/src/main/views/explore/villages/toponyms/ToponymsPage.vue`

- [ ] **Step 1: Implement token reader for ECharts options**

Inside `ToponymDistributionChart.vue`, use runtime CSS token reading:

```js
function cssToken(name, fallback = '') {
  if (typeof window === 'undefined') return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function chartTokens() {
  return {
    text: cssToken('--text-deep', '#0b2540'),
    secondaryText: cssToken('--text-secondary', '#86868b'),
    primary: cssToken('--color-primary', '#007aff'),
    primaryHover: cssToken('--color-primary-hover', '#0051d5'),
    glass: cssToken('--glass-40', 'rgba(255,255,255,0.4)'),
  }
}
```

These fallbacks are allowed only inside JS token reading for non-browser/test contexts. Component SCSS must still use tokens directly.

- [ ] **Step 2: Implement chart lifecycle**

Requirements:

- `import * as echarts from 'echarts'`.
- Initialize chart once after mount.
- Register country map when `countryGeoJson` prop is available.
- Dispose chart in `onBeforeUnmount`.
- Use `ResizeObserver` to call `chart.resize()`.
- Remove observer in `onBeforeUnmount`.

- [ ] **Step 3: Implement default country base**

Base option:

```js
geo: {
  map: 'china-country',
  roam: true,
  silent: true,
  itemStyle: {
    areaColor: 'transparent',
    borderColor: tokens.secondaryText,
    borderWidth: 1,
  },
  emphasis: {
    disabled: true,
  },
}
```

The chart must render an empty country boundary even before any point search.

- [ ] **Step 4: Implement point scatter series**

Point series:

```js
{
  id: 'toponym-points',
  name: t('villages.pages.toponyms.pointSeriesName'),
  type: 'scatter',
  coordinateSystem: 'geo',
  data: props.scatterData,
  symbolSize: (value) => {
    return props.scatterData.length > 3000 ? 4 : 6
  },
  itemStyle: {
    color: tokens.primary,
    opacity: props.scatterData.length > 3000 ? 0.45 : 0.68,
  },
}
```

Do not add labels.

- [ ] **Step 5: Implement optional overlays**

Overlay rules:

- Province and city overlays are controlled by props.
- Rivers are controlled by props and use ECharts `lines` series.
- Optional overlays must not be present when disabled.
- Country base remains the geo coordinate system.

River series example:

```js
{
  id: 'riverL1',
  type: 'lines',
  coordinateSystem: 'geo',
  data: riverLineData,
  polyline: true,
  silent: true,
  lineStyle: {
    color: tokens.primaryHover,
    opacity: 0.28,
    width: 0.8,
  },
}
```

- [ ] **Step 6: Emit selected point on click**

On chart click:

```js
const point = extractToponymPointFromChartParams(params)
if (point) emit('select-point', point)
```

- [ ] **Step 7: Wire chart into `ToponymsPage.vue`**

Render:

```vue
<ToponymDistributionChart
  :country-geo-json="loadedLayers.country"
  :province-geo-json="layerState.provinces ? loadedLayers.provinces : null"
  :city-geo-json="layerState.cities ? loadedLayers.cities : null"
  :river-l1-data="layerState.riverL1 ? loadedLayers.riverL1 : null"
  :river-l2-data="layerState.riverL2 ? loadedLayers.riverL2 : null"
  :river-l3-data="layerState.riverL3 ? loadedLayers.riverL3 : null"
  :scatter-data="scatterData"
  @select-point="loadLocalDetail"
/>
```

- [ ] **Step 8: Run token scan**

Run:

```bash
rg -n "#[0-9a-fA-F]{3,8}|color:\\s*(red|blue|white|black)|background:\\s*(red|blue|white|black)|max-width|min-width" project/src/main/views/explore/villages/toponyms
```

Expected:

- No hardcoded SCSS colors.
- No width-based media queries.
- JS token fallback colors appear only in `cssToken` fallback context.

- [ ] **Step 9: Run focused tests and lint**

Run:

```bash
cd project
npm test -- tests/toponymsApiContracts.test.js tests/toponymsChartData.test.js tests/toponymsGisAssets.test.js tests/toponymsRouteExposure.test.js
npm run lint -- src/main/views/explore/villages/toponyms src/api/main/toponyms.js
```

- [ ] **Step 10: Diff and commit Task 6 only**

Run:

```bash
git add project/src/main/views/explore/villages/toponyms/ToponymDistributionChart.vue project/src/main/views/explore/villages/toponyms/ToponymsPage.vue
git diff --cached
git commit -m "feat: render toponyms distribution chart"
```

---

### Task 7: Final Verification

- [ ] **Step 1: Run focused tests**

```bash
cd project
npm test -- tests/toponymsApiContracts.test.js tests/toponymsChartData.test.js tests/toponymsGisAssets.test.js tests/toponymsRouteExposure.test.js
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

- Page loads without initial `/api/toponyms/points` request.
- Initial GIS fetch loads only `/data/gis/china_country.geojson`.
- Empty chart shows country boundary.
- Province, city, river L1, river L2, river L3 are off by default.
- Enabling province loads `/data/gis/china_provinces.geojson` once.
- Enabling city loads `/data/gis/china_cities_simplified_light.geojson` once.
- Enabling river layers loads each river file only when toggled.
- Search control is horizontal on landscape.
- Portrait layout uses aspect-ratio media query and stacks without overlap.
- Search `黄` with `prefix` calls `/api/toponyms/names` and `/api/toponyms/points`.
- Points render on ECharts geo coordinate system without labels.
- If `truncated` is true, warning appears.
- Clicking a point calls `/api/toponyms/details?ids=<id>` and shows local record.
- Detail panel has a separate official-detail action.
- Official-detail action calls `https://dmfw.mca.gov.cn/9095/stname/detailsPub`.
- If official detail succeeds, detail panel marks source as official.
- If official detail fails, local record remains visible and official warning appears.
- 401/422/FastAPI `detail` errors show readable messages.

- [ ] **Step 6: Diff review**

```bash
git status --short
git diff
```

Check:

- No unrelated files are staged.
- No `/api/toponyms/map`.
- No `/toponyms/map` route or redirect.
- No MapLibre usage in toponyms page code.
- Default GIS load is country only.
- Optional GIS layers are lazy-loaded.
- `detailsPub` exists only in official-detail API/helper usage and is not part of initial search/point loading.
- Chinese and emoji are intact.
- Component styles use scoped SCSS, project mixins, nested selectors, and tokens.
- No width-based media queries in toponyms components.

---

## 7. Completion Criteria

Implementation is complete only when:

- `/explore/villages/toponyms` exists and is reachable.
- Explore villages nav, sidebar, and portal place the new entry above Guangdong natural villages.
- The page does not load toponym points on first paint.
- The page loads only country GIS boundary on first paint.
- Province boundary, city boundary, and river levels 1-3 are optional lazy-loaded overlays.
- The page supports distribution-pattern exploration for a user-entered character/string and match mode.
- Search uses `/api/toponyms/names` and `/api/toponyms/points`.
- ECharts renders id-only point results on the China geo coordinate system.
- The chart does not display point labels from `/points`.
- Clicking a point loads local `/api/toponyms/details` and respects the 10-id backend limit.
- A selected local record/point can request Ministry `detailsPub` for official detail.
- If Ministry detail fails, the local record remains visible and the failure is non-blocking.
- No `/api/toponyms/map` usage exists.
- No `/toponyms/map` route or redirect exists.
- No MapLibre implementation exists for this toponyms page.
- Styles use existing components/classes where practical, scoped nested SCSS, project mixins, and tokens.
- No width-based responsive breakpoints are introduced.
- Focused tests pass.
- Lint passes.
- Build passes, unless blocked by unrelated existing worktree changes; exact failure must be reported if so.
