# Syllable Count Heatmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a syllable statistics section to the existing countpho flow, with toneless/toned switching and a MapLibre syllable heatmap entry only when more than 10 dialect points are selected.

**Architecture:** Keep the mature `feature_counts` flow intact. Add one backend syllable-count API that returns toneless and toned data together, add a separate frontend API wrapper and separate countpho state, and add a dedicated `syllableHeatmap` map mode using an isolated payload instead of `mapStore.mergedData`.

**Tech Stack:** FastAPI, SQLite, Pydantic, Vue 3 Composition API, Vitest, MapLibre GL native GeoJSON + heatmap layer, existing `SwitchToggle.vue`, existing global store and route helpers.

---

## Boundaries And Decisions

- Do not replace or restructure the current countpho sound-feature statistics.
- Do not add a page-level mode switch. Add one new section inside `Countphos.vue`.
- Do not request separate APIs for toneless and toned syllables. `/api/syllable_counts` returns both in one response.
- Do not store syllable heatmap data in `mapStore.mergedData`. Add a dedicated `syllableHeatmapPayload`.
- Show the heatmap entry only when `matchedLocations.length > 10`.
- The heatmap renders one selected syllable at a time. The selected syllable and `toneMode` are part of the dedicated payload.
- Preserve Chinese and emoji text exactly. After locale or Vue text edits, inspect UTF-8 output and `git diff`.
- Use only aspect-ratio media queries in component styles.

## File Structure

Backend repository: `/Users/jengzang/CodeProject/dialects/dialects-backend`

- Modify `app/schemas/core/phonology.py`
  - Add `SyllableCountsRequest`.
  - Export it through `app/schemas/__init__.py`.
- Modify `app/service/core/feature_stats.py`
  - Add syllable aggregation helpers close to existing feature-count logic.
  - Keep existing `get_feature_counts()` behavior unchanged.
- Modify `app/routes/core/phonology.py`
  - Add `POST /api/syllable_counts`.
  - Reuse `run_in_threadpool`/`asyncio.to_thread` style used by existing phonology APIs.
- Test `tests/test_syllable_counts.py`
  - Unit-test toneless and toned aggregation with a temporary SQLite dialect DB and query DB coordinate table.

Frontend repository: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend`

Frontend npm commands in this plan must run from `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project`, because `package.json` lives in that subdirectory.

- Modify `project/src/api/main/core/query.js`
  - Add `getSyllableCounts(params)`.
- Modify `project/src/api/index.js`
  - Re-export `getSyllableCounts`.
- Modify `project/src/main/store/store.js`
  - Add `syllableHeatmapPayload` to `mapStore`, separate from `mergedData`.
- Modify `project/src/main/components/pho/Countphos.vue`
  - Fetch `feature_counts` and `syllable_counts` together for user queries.
  - Add a syllable statistics section after the existing chart/stat section and before per-location details.
  - Use `SwitchToggle.vue` to switch `toneless`/`toned` inside the section.
  - Show heatmap buttons only for more than 10 matched locations.
- Modify `project/src/main/components/map/MapLibre.vue`
  - Add a `syllableHeatmap` rendering branch with MapLibre source/layers.
  - Clear heatmap layers on rerender/style switch.
- Modify `project/src/main/views/menu/MapPage.vue`
  - Keep map tab UI quiet in heatmap mode and avoid feature dropdown assumptions.
- Modify `project/src/main/router/menuRoutes.js`
  - Allow `mode`, `toneMode`, and `syllable` query keys for `/menu/map/view`.
- Test `project/tests/syllableCountContracts.test.js`
  - Contract tests for new API wrapper, store isolation, Countphos section wiring, route allowlist, and MapLibre branch.

---

## Backend Task 1: Add Syllable Count Contract And Service

**Files:**
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-backend/app/schemas/core/phonology.py`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-backend/app/schemas/__init__.py`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-backend/app/service/core/feature_stats.py`
- Test: `/Users/jengzang/CodeProject/dialects/dialects-backend/tests/test_syllable_counts.py`

- [ ] **Step 1: Re-check workspace state**

Run:

```bash
git status --short
```

Expected: note unrelated changes and do not include them in this task's commit.

- [ ] **Step 2: Write failing backend tests**

Create `/Users/jengzang/CodeProject/dialects/dialects-backend/tests/test_syllable_counts.py`:

```python
import sqlite3

from app.service.core.feature_stats import get_syllable_counts


def _create_dialect_db(path):
    conn = sqlite3.connect(path)
    conn.execute(
        """
        CREATE TABLE dialects (
            簡稱 TEXT,
            漢字 TEXT,
            聲母 TEXT,
            韻母 TEXT,
            聲調 TEXT,
            音節 TEXT
        )
        """
    )
    conn.executemany(
        "INSERT INTO dialects (簡稱, 漢字, 聲母, 韻母, 聲調, 音節) VALUES (?, ?, ?, ?, ?, ?)",
        [
            ("廣州", "詩", "s", "i", "55", "si55"),
            ("廣州", "史", "s", "i", "35", "si35"),
            ("廣州", "開", "h", "oi", "55", "hoi55"),
            ("香港", "詩", "s", "i", "55", "si55"),
            ("香港", "史", "s", "i", "35", "si35"),
            ("香港", "時", "s", "i", "21", "si21"),
            ("香港", "開", "h", "oi", "55", "hoi55"),
            ("無音節", "空", "k", "ung", "55", None),
        ],
    )
    conn.commit()
    conn.close()


def _create_query_db(path):
    conn = sqlite3.connect(path)
    conn.execute(
        """
        CREATE TABLE dialects (
            簡稱 TEXT,
            經緯度 TEXT
        )
        """
    )
    conn.executemany(
        "INSERT INTO dialects (簡稱, 經緯度) VALUES (?, ?)",
        [
            ("廣州", "23.1291,113.2644"),
            ("香港", "22.3193,114.1694"),
            ("無音節", "22.0,114.0"),
        ],
    )
    conn.commit()
    conn.close()


def test_get_syllable_counts_returns_toneless_and_toned_together(tmp_path):
    dialect_db = tmp_path / "dialects.db"
    query_db = tmp_path / "query.db"
    _create_dialect_db(dialect_db)
    _create_query_db(query_db)

    result = get_syllable_counts(
        locations=["廣州", "香港"],
        db_path=str(dialect_db),
        query_db_path=str(query_db),
    )

    assert result["meta"] == {
        "locations_count": 2,
        "requested_locations_count": 2,
        "locations_without_coordinates": [],
    }
    assert result["toned"]["locations"]["廣州"]["unique_syllables"] == 3
    assert result["toned"]["locations"]["廣州"]["syllables"]["si55"] == 1
    assert result["toned"]["aggregated"]["syllables"]["si55"] == {
        "totalCount": 2,
        "locationCount": 2,
        "locations": ["廣州", "香港"],
    }
    assert result["toneless"]["locations"]["香港"]["unique_syllables"] == 2
    assert result["toneless"]["locations"]["香港"]["syllables"]["si"] == 3
    assert result["toneless"]["aggregated"]["syllables"]["si"] == {
        "totalCount": 5,
        "locationCount": 2,
        "locations": ["廣州", "香港"],
    }
    assert result["points"] == [
        {
            "location": "廣州",
            "coordinate": [113.2644, 23.1291],
            "toneless": {"si": 2, "hoi": 1},
            "toned": {"si55": 1, "si35": 1, "hoi55": 1},
            "total_tokens": {"toneless": 3, "toned": 3},
            "unique_syllables": {"toneless": 2, "toned": 3},
        },
        {
            "location": "香港",
            "coordinate": [114.1694, 22.3193],
            "toneless": {"si": 3, "hoi": 1},
            "toned": {"si55": 1, "si35": 1, "si21": 1, "hoi55": 1},
            "total_tokens": {"toneless": 4, "toned": 4},
            "unique_syllables": {"toneless": 2, "toned": 4},
        },
    ]


def test_get_syllable_counts_reports_locations_without_coordinates(tmp_path):
    dialect_db = tmp_path / "dialects.db"
    query_db = tmp_path / "query.db"
    _create_dialect_db(dialect_db)
    _create_query_db(query_db)

    result = get_syllable_counts(
        locations=["廣州", "無音節"],
        db_path=str(dialect_db),
        query_db_path=str(query_db),
    )

    assert result["meta"]["locations_count"] == 1
    assert result["meta"]["requested_locations_count"] == 2
    assert result["meta"]["locations_without_coordinates"] == ["無音節"]
    assert [point["location"] for point in result["points"]] == ["廣州"]
```

- [ ] **Step 3: Run the failing backend tests**

Run:

```bash
python -m pytest tests/test_syllable_counts.py -v
```

Expected: FAIL because `get_syllable_counts` is not defined.

- [ ] **Step 4: Add request schema**

In `/Users/jengzang/CodeProject/dialects/dialects-backend/app/schemas/core/phonology.py`, after `FeatureStatsRequest`, add:

```python
class SyllableCountsRequest(BaseModel):
    """
    音節統計請求模型。

    用於 /api/syllable_counts，一次返回不帶調與帶調音節統計。
    """
    locations: List[str] = Field(
        ...,
        description="地點簡稱列表（必需）",
        example=["廣州", "香港"],
        min_length=1,
        max_length=100,
    )
```

In `/Users/jengzang/CodeProject/dialects/dialects-backend/app/schemas/__init__.py`, add `SyllableCountsRequest` to both the import list and `__all__`.

The core import block should include:

```python
from .core.phonology import (
    AnalysisPayload,
    PhonologyClassificationMatrixRequest,
    PhonologyMatrixRequest,
    FeatureStatsRequest,
    SyllableCountsRequest,
    PhoPieRequest,
)
```

The `__all__` list should include:

```python
    "SyllableCountsRequest",
```

- [ ] **Step 5: Add syllable service helpers**

In `/Users/jengzang/CodeProject/dialects/dialects-backend/app/service/core/feature_stats.py`, import `Any`:

```python
from typing import Any, List, Dict, Optional, Set
```

Then add these helpers after `calculate_aggregated_feature_counts`:

```python
def _quote_identifier(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def _normalize_syllable_part(value: Any) -> str:
    return "" if value is None else str(value).strip()


def _build_toneless_syllable(initial: Any, final: Any, toned_syllable: Any) -> str:
    initial_text = _normalize_syllable_part(initial)
    final_text = _normalize_syllable_part(final)
    if initial_text or final_text:
        return f"{initial_text}{final_text}"

    syllable_text = _normalize_syllable_part(toned_syllable)
    return syllable_text.rstrip("0123456789¹²³⁴⁵⁶⁷⁸⁹⁰")


def _parse_lng_lat(value: Any) -> list[float] | None:
    text = _normalize_syllable_part(value)
    if not text:
        return None
    parts = [part.strip() for part in text.replace("，", ",").split(",")]
    if len(parts) != 2:
        return None
    try:
        lat = float(parts[0])
        lng = float(parts[1])
    except ValueError:
        return None
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        return None
    return [round(lng, 6), round(lat, 6)]


def _sort_syllable_items(syllables: Dict[str, int]) -> dict[str, int]:
    return dict(
        sorted(
            syllables.items(),
            key=lambda item: (-int(item[1] or 0), custom_phonology_sort([item[0]])[0]),
        )
    )


def _aggregate_syllable_locations(location_data: Dict[str, Dict[str, Any]]) -> Dict[str, Any]:
    aggregated = defaultdict(
        lambda: {
            "totalCount": 0,
            "locationCount": 0,
            "locations": [],
        }
    )

    for location_name, loc_data in location_data.items():
        for syllable, count in loc_data.get("syllables", {}).items():
            count_int = int(count or 0)
            if count_int <= 0:
                continue
            item = aggregated[syllable]
            item["totalCount"] += count_int
            item["locationCount"] += 1
            item["locations"].append(location_name)

    return {
        "total_tokens": sum(item.get("total_tokens", 0) for item in location_data.values()),
        "unique_syllables": len(aggregated),
        "syllables": {
            syllable: {
                "totalCount": stats["totalCount"],
                "locationCount": stats["locationCount"],
                "locations": stats["locations"],
            }
            for syllable, stats in sorted(
                aggregated.items(),
                key=lambda item: (
                    -item[1]["totalCount"],
                    -item[1]["locationCount"],
                    custom_phonology_sort([item[0]])[0],
                ),
            )
        },
    }


def _get_location_coordinates(locations: list[str], query_db_path: str) -> dict[str, list[float]]:
    if not locations or not query_db_path:
        return {}

    pool = get_db_pool(query_db_path)
    placeholders = ",".join(["?" for _ in locations])
    sql = (
        f"SELECT {_quote_identifier('簡稱')}, {_quote_identifier('經緯度')} "
        f"FROM {_quote_identifier('dialects')} "
        f"WHERE {_quote_identifier('簡稱')} IN ({placeholders})"
    )

    with pool.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, locations)
        rows = cursor.fetchall()

    coordinates = {}
    for row in rows:
        parsed = _parse_lng_lat(row[1])
        if parsed is not None:
            coordinates[row[0]] = parsed
    return coordinates


def get_syllable_counts(
    locations: List[str],
    db_path: str,
    query_db_path: str | None = None,
    table: str = "dialects",
) -> Dict[str, Any]:
    cleaned_locations = [str(location).strip() for location in locations if str(location).strip()]
    if not cleaned_locations:
        return {
            "toneless": {"locations": {}, "aggregated": {"total_tokens": 0, "unique_syllables": 0, "syllables": {}}},
            "toned": {"locations": {}, "aggregated": {"total_tokens": 0, "unique_syllables": 0, "syllables": {}}},
            "points": [],
            "meta": {"locations_count": 0, "requested_locations_count": 0, "locations_without_coordinates": []},
        }

    pool = get_db_pool(db_path)
    placeholders = ",".join(["?" for _ in cleaned_locations])
    sql = f"""
        SELECT 簡稱, 聲母, 韻母, 聲調, 音節, COUNT(DISTINCT 漢字) AS 字數
        FROM {table}
        WHERE 簡稱 IN ({placeholders})
          AND 簡稱 IS NOT NULL
          AND 漢字 IS NOT NULL
          AND 音節 IS NOT NULL
          AND TRIM(COALESCE(音節, '')) <> ''
        GROUP BY 簡稱, 聲母, 韻母, 聲調, 音節
        ORDER BY 簡稱, 音節
    """

    with pool.get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(sql, cleaned_locations)
        rows = cursor.fetchall()

    location_order = {location: index for index, location in enumerate(cleaned_locations)}
    toneless_locations = defaultdict(lambda: {"total_tokens": 0, "unique_syllables": 0, "syllables": {}})
    toned_locations = defaultdict(lambda: {"total_tokens": 0, "unique_syllables": 0, "syllables": {}})

    for row in rows:
        location = row[0]
        initial = row[1]
        final = row[2]
        toned_syllable = _normalize_syllable_part(row[4])
        count = int(row[5] or 0)
        if not location or not toned_syllable or count <= 0:
            continue

        toneless_syllable = _build_toneless_syllable(initial, final, toned_syllable)
        if not toneless_syllable:
            continue

        toned_bucket = toned_locations[location]
        toned_bucket["syllables"][toned_syllable] = toned_bucket["syllables"].get(toned_syllable, 0) + count
        toned_bucket["total_tokens"] += count

        toneless_bucket = toneless_locations[location]
        toneless_bucket["syllables"][toneless_syllable] = toneless_bucket["syllables"].get(toneless_syllable, 0) + count
        toneless_bucket["total_tokens"] += count

    def finalize_locations(data):
        finalized = {}
        for location, item in sorted(data.items(), key=lambda pair: location_order.get(pair[0], 999999)):
            syllables = _sort_syllable_items(item["syllables"])
            finalized[location] = {
                "total_tokens": item["total_tokens"],
                "unique_syllables": len(syllables),
                "syllables": syllables,
            }
        return finalized

    toneless_final = finalize_locations(toneless_locations)
    toned_final = finalize_locations(toned_locations)
    coordinates = _get_location_coordinates(cleaned_locations, query_db_path) if query_db_path else {}

    points = []
    locations_without_coordinates = []
    for location in cleaned_locations:
        if location not in toned_final and location not in toneless_final:
            continue
        coordinate = coordinates.get(location)
        if coordinate is None:
            locations_without_coordinates.append(location)
            continue
        toneless_item = toneless_final.get(location, {"total_tokens": 0, "unique_syllables": 0, "syllables": {}})
        toned_item = toned_final.get(location, {"total_tokens": 0, "unique_syllables": 0, "syllables": {}})
        points.append(
            {
                "location": location,
                "coordinate": coordinate,
                "toneless": toneless_item["syllables"],
                "toned": toned_item["syllables"],
                "total_tokens": {
                    "toneless": toneless_item["total_tokens"],
                    "toned": toned_item["total_tokens"],
                },
                "unique_syllables": {
                    "toneless": toneless_item["unique_syllables"],
                    "toned": toned_item["unique_syllables"],
                },
            }
        )

    return {
        "toneless": {
            "locations": toneless_final,
            "aggregated": _aggregate_syllable_locations(toneless_final),
        },
        "toned": {
            "locations": toned_final,
            "aggregated": _aggregate_syllable_locations(toned_final),
        },
        "points": points,
        "meta": {
            "locations_count": len(points),
            "requested_locations_count": len(cleaned_locations),
            "locations_without_coordinates": locations_without_coordinates,
        },
    }
```

- [ ] **Step 6: Run backend unit tests**

Run:

```bash
python -m pytest tests/test_syllable_counts.py -v
```

Expected: PASS.

- [ ] **Step 7: CR and commit backend service task**

Run:

```bash
git diff -- app/schemas/core/phonology.py app/schemas/__init__.py app/service/core/feature_stats.py tests/test_syllable_counts.py
python -m pytest tests/test_syllable_counts.py -v
```

CR checklist:
- Existing `get_feature_counts()` SQL and response shape are unchanged.
- Toneless syllables are derived in backend, not frontend.
- Coordinate output uses `[lng, lat]` for MapLibre.
- No Chinese text corruption in touched files.

Commit only these files:

```bash
git add app/schemas/core/phonology.py app/schemas/__init__.py app/service/core/feature_stats.py tests/test_syllable_counts.py
git commit -m "feat: add syllable count service"
```

---

## Backend Task 2: Add `/api/syllable_counts`

**Files:**
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-backend/app/routes/core/phonology.py`
- Test: `/Users/jengzang/CodeProject/dialects/dialects-backend/tests/test_syllable_counts.py`

- [ ] **Step 1: Re-check workspace state**

Run:

```bash
git status --short
```

Expected: only intentional backend task files should be touched for this task.

- [ ] **Step 2: Add failing route-level contract test**

Append to `/Users/jengzang/CodeProject/dialects/dialects-backend/tests/test_syllable_counts.py`:

```python
from fastapi.testclient import TestClient

from app.main import create_main_app
from app.sql.db_selector import get_dialects_db, get_query_db


def test_syllable_counts_route_returns_service_response(tmp_path):
    dialect_db = tmp_path / "dialects.db"
    query_db = tmp_path / "query.db"
    _create_dialect_db(dialect_db)
    _create_query_db(query_db)

    app = create_main_app()
    app.dependency_overrides[get_dialects_db] = lambda: str(dialect_db)
    app.dependency_overrides[get_query_db] = lambda: str(query_db)

    client = TestClient(app)
    response = client.post("/api/syllable_counts", json={"locations": ["廣州", "香港"]})

    assert response.status_code == 200
    body = response.json()
    assert body["toneless"]["aggregated"]["syllables"]["si"]["totalCount"] == 5
    assert body["toned"]["aggregated"]["syllables"]["si55"]["locationCount"] == 2
    assert body["points"][0]["coordinate"] == [113.2644, 23.1291]

    app.dependency_overrides.clear()
```

- [ ] **Step 3: Run route test to verify failure**

Run:

```bash
python -m pytest tests/test_syllable_counts.py::test_syllable_counts_route_returns_service_response -v
```

Expected: FAIL with 404 for `/api/syllable_counts` or import failure if `create_main_app` differs in local app setup.

- [ ] **Step 4: Add route**

In `/Users/jengzang/CodeProject/dialects/dialects-backend/app/routes/core/phonology.py`, update imports:

```python
from app.schemas import AnalysisPayload, FeatureStatsRequest, SyllableCountsRequest
from app.service.core.feature_stats import (
    get_feature_counts,
    get_feature_statistics,
    generate_cache_key,
    calculate_aggregated_feature_counts,
    get_syllable_counts,
)
```

Then add this route after `feature_counts` and before `feature_stats`:

```python
@router.post("/syllable_counts")
async def syllable_counts(
    payload: SyllableCountsRequest,
    dialects_db: str = Depends(get_dialects_db),
    query_db: str = Depends(get_query_db),
):
    try:
        result = await asyncio.to_thread(
            get_syllable_counts,
            locations=payload.locations,
            db_path=dialects_db,
            query_db_path=query_db,
        )

        if not result["toneless"]["locations"] and not result["toned"]["locations"]:
            raise HTTPException(status_code=404, detail="No syllable data found for the given locations.")

        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")
```

- [ ] **Step 5: Run backend route tests**

Run:

```bash
python -m pytest tests/test_syllable_counts.py -v
```

Expected: PASS.

- [ ] **Step 6: CR and commit backend route task**

Run:

```bash
git diff -- app/routes/core/phonology.py tests/test_syllable_counts.py
python -m pytest tests/test_syllable_counts.py -v
```

CR checklist:
- Existing `/api/feature_counts` route stays backward-compatible.
- The route accepts one request and returns both toneless and toned.
- No unrelated route registration changes.
- No Chinese text corruption.

Commit only these files:

```bash
git add app/routes/core/phonology.py tests/test_syllable_counts.py
git commit -m "feat: expose syllable count api"
```

---

## Frontend Task 3: Add API Wrapper And Isolated Heatmap Store State

**Files:**
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/api/main/core/query.js`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/api/index.js`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/main/store/store.js`
- Test: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/tests/syllableCountContracts.test.js`

- [ ] **Step 1: Re-check workspace state**

Run:

```bash
git status --short
```

Expected: note unrelated frontend changes and keep this task scoped to listed files.

- [ ] **Step 2: Add failing frontend contract test**

Create `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/tests/syllableCountContracts.test.js`:

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

describe('syllable count frontend contracts', () => {
  it('adds a dedicated syllable counts api wrapper and top-level export', () => {
    const querySource = readSource('src/api/main/core/query.js')
    const apiIndexSource = readSource('src/api/index.js')

    expect(querySource).toContain('export async function getSyllableCounts(params)')
    expect(querySource).toContain("api('/api/syllable_counts'")
    expect(querySource).toContain('method: \\'POST\\'')
    expect(apiIndexSource).toContain('getSyllableCounts')
  })

  it('keeps syllable heatmap payload separate from mergedData', () => {
    const storeSource = readSource('src/main/store/store.js')

    expect(storeSource).toContain('syllableHeatmapPayload')
    expect(storeSource).toContain("mode: 'base'")
    expect(storeSource).toContain('mergedData: []')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run:

```bash
npm test -- syllableCountContracts.test.js
```

Expected: FAIL because `getSyllableCounts` and `syllableHeatmapPayload` do not exist.

- [ ] **Step 4: Add API wrapper**

In `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/api/main/core/query.js`, add after `getFeatureCounts`:

```js
/**
 * 獲取音節統計資料，一次返回不帶調與帶調音節。
 * @param {Object} params
 * @property {string[]} params.locations - 地點列表
 * @returns {Promise<Object>} 音節統計結果
 */
export async function getSyllableCounts(params) {
  try {
    return await api('/api/syllable_counts', {
      method: 'POST',
      body: {
        locations: Array.isArray(params?.locations) ? params.locations : []
      },
      loginPromptEligible: true
    })
  } catch (error) {
    console.error('Get syllable counts error:', error)
    showError(error.message || '獲取音節統計失敗')
    throw new Error(error.message || '獲取音節統計失敗')
  }
}
```

In `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/api/index.js`, add `getSyllableCounts` beside `getFeatureCounts`.

- [ ] **Step 5: Add isolated store payload**

In `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/main/store/store.js`, extend `mapStore`:

```js
    syllableHeatmapPayload: null, // 音節熱力圖專用 payload，與 mergedData 隔離
```

Place it near `mergedData`/`mode`, not inside `resultCache`.

- [ ] **Step 6: Run frontend contract test**

Run:

```bash
npm test -- syllableCountContracts.test.js
```

Expected: PASS.

- [ ] **Step 7: CR and commit frontend API/store task**

Run:

```bash
git diff -- project/src/api/main/core/query.js project/src/api/index.js project/src/main/store/store.js project/tests/syllableCountContracts.test.js
npm test -- syllableCountContracts.test.js
```

CR checklist:
- `getFeatureCounts()` remains unchanged.
- New API uses POST and sends only `locations`.
- `syllableHeatmapPayload` does not alter `mergedData`.
- No Chinese text corruption.

Commit only these files:

```bash
git add project/src/api/main/core/query.js project/src/api/index.js project/src/main/store/store.js project/tests/syllableCountContracts.test.js
git commit -m "feat: add syllable count frontend contract"
```

---

## Frontend Task 4: Add Countphos Syllable Section

**Files:**
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/main/components/pho/Countphos.vue`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/i18n/locales/zh-CN/phonology.json`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/i18n/locales/zh-Hant/phonology.json`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/i18n/locales/en/phonology.json`
- Test: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/tests/syllableCountContracts.test.js`

- [ ] **Step 1: Re-check current `Countphos.vue` and locale state**

Run:

```bash
git status --short
sed -n '1,120p' project/src/main/components/pho/Countphos.vue
sed -n '80,180p' project/src/i18n/locales/zh-CN/phonology.json
sed -n '80,180p' project/src/i18n/locales/zh-Hant/phonology.json
sed -n '80,180p' project/src/i18n/locales/en/phonology.json
```

Expected: use current file layout; do not overwrite user edits.

- [ ] **Step 2: Add failing Countphos contract tests**

Append to `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/tests/syllableCountContracts.test.js`:

```js
  it('wires syllable counts into Countphos without replacing feature counts', () => {
    const source = readSource('src/main/components/pho/Countphos.vue')

    expect(source).toContain('getFeatureCounts')
    expect(source).toContain('getSyllableCounts')
    expect(source).toContain('Promise.all')
    expect(source).toContain('syllableData')
    expect(source).toContain('syllableMode')
    expect(source).toContain('SwitchToggle')
    expect(source).toContain('canShowSyllableHeatmap')
    expect(source).toContain('matchedLocations.value.length > 10')
    expect(source).toContain('openSyllableHeatmap')
  })
```

- [ ] **Step 3: Run test to verify failure**

Run:

```bash
npm test -- syllableCountContracts.test.js
```

Expected: FAIL because Countphos does not yet include syllable section wiring.

- [ ] **Step 4: Add Countphos imports and state**

In `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/main/components/pho/Countphos.vue`, update imports:

```js
import { useRoute, useRouter } from 'vue-router'
import { getFeatureCounts, getSyllableCounts, getLocationDetail } from '@/api'
import SwitchToggle from '@/components/common/SwitchToggle.vue'
import { pendingCountphosLocations, mapStore } from '@/main/store/store.js'
import { buildLocalePath, resolveRouteLocale } from '@/i18n/localeRouting.js'
```

Add router and state near existing route/state:

```js
const router = useRouter()
const syllableData = ref(null)
const syllableMode = ref(false)
const syllableModeKey = computed(() => (syllableMode.value ? 'toned' : 'toneless'))
const syllableModeLabel = computed(() => (
  syllableMode.value
    ? t('phonology.phonology.countphos.syllables.modes.toned')
    : t('phonology.phonology.countphos.syllables.modes.toneless')
))
const hasSyllableData = computed(() => {
  const key = syllableModeKey.value
  return Object.keys(syllableData.value?.[key]?.aggregated?.syllables || {}).length > 0
})
const canShowSyllableHeatmap = computed(() => matchedLocations.value.length > 10)
```

- [ ] **Step 5: Add syllable list helpers**

Add below `getFeatureStatsList`:

```js
const getSyllableStatsList = () => {
  const key = syllableModeKey.value
  const syllables = syllableData.value?.[key]?.aggregated?.syllables || {}

  return Object.entries(syllables)
    .map(([syllable, stats]) => ({
      syllable,
      totalCount: Number(stats?.totalCount || 0),
      locationCount: Number(stats?.locationCount || stats?.locations?.length || 0),
      locations: Array.isArray(stats?.locations) ? stats.locations : []
    }))
    .sort((a, b) => {
      if (b.totalCount !== a.totalCount) return b.totalCount - a.totalCount
      if (b.locationCount !== a.locationCount) return b.locationCount - a.locationCount
      return a.syllable.localeCompare(b.syllable, 'zh-Hant')
    })
}

const openSyllableHeatmap = async (syllable) => {
  const key = syllableModeKey.value
  const sourcePoints = Array.isArray(syllableData.value?.points) ? syllableData.value.points : []
  const points = sourcePoints
    .map((point) => ({
      location: point.location,
      coordinate: point.coordinate,
      count: Number(point?.[key]?.[syllable] || 0),
      totalTokens: Number(point?.total_tokens?.[key] || 0),
      uniqueSyllables: Number(point?.unique_syllables?.[key] || 0)
    }))
    .filter((point) => point.count > 0)

  mapStore.syllableHeatmapPayload = {
    toneMode: key,
    toneModeLabel: syllableModeLabel.value,
    syllable,
    points,
    requestedLocations: matchedLocations.value.slice()
  }
  mapStore.mode = 'syllableHeatmap'
  mapStore.fitViewKey += 1

  await router.push({
    path: buildLocalePath(resolveRouteLocale(route), '/menu/map/view'),
    query: {
      mode: 'syllableHeatmap',
      toneMode: key,
      syllable
    }
  })
}
```

- [ ] **Step 6: Fetch syllable counts with existing feature counts**

In `loadData`, replace the single `getFeatureCounts` call with:

```js
    const [featureResult, syllableResult] = await Promise.all([
      getFeatureCounts({ locations: matchedLocations.value }),
      getSyllableCounts({ locations: matchedLocations.value })
    ])

    featureData.value = featureResult || {}
    syllableData.value = syllableResult || null

    aggregatedData.value = calculateAggregatedData(featureResult || {})
```

Also reset `syllableData.value = null` where `featureData` and `aggregatedData` are reset.

- [ ] **Step 7: Add syllable section template**

Add this section after the existing aggregated feature blocks and before the locations section:

```vue
      <section v-if="hasSyllableData" class="syllable-section glass-panel">
        <div class="syllable-section__header">
          <h3 class="section-title">{{ $t('phonology.phonology.countphos.syllables.title') }}</h3>
          <SwitchToggle
            v-model="syllableMode"
            class="syllable-mode-switch"
            :active-text="$t('phonology.phonology.countphos.syllables.modes.toned')"
            :inactive-text="$t('phonology.phonology.countphos.syllables.modes.toneless')"
            :show-label="true"
            label-position="inside"
            variant="minimal"
            color="blue"
            :width="96"
            :height="30"
            :aria-label="$t('phonology.phonology.countphos.syllables.modeSwitchLabel')"
          />
        </div>

        <div class="syllable-grid">
          <div
            v-for="item in getSyllableStatsList()"
            :key="`${syllableModeKey}-${item.syllable}`"
            class="syllable-card glass-card"
          >
            <div class="syllable-top">
              <div class="syllable-name">{{ item.syllable }}</div>
              <div class="syllable-stats">
                <span class="stat-item">
                  <span class="stat-label">{{ $t('phonology.phonology.countphos.stats.total') }}:</span>
                  <span class="stat-value">{{ item.totalCount }}</span>
                </span>
                <span class="stat-item">
                  <span class="stat-label">{{ $t('phonology.phonology.countphos.stats.locationCount') }}:</span>
                  <span class="stat-value">{{ item.locationCount }}</span>
                </span>
              </div>
            </div>

            <div class="location-tags">
              <span
                v-for="loc in item.locations.slice(0, 10)"
                :key="loc"
                class="location-tag"
              >
                {{ loc }}
              </span>
              <button
                v-if="item.locations.length > 10"
                class="expand-btn"
                @click="openLocationModal(item.syllable, syllableModeLabel, item)"
              >
                {{ $t('phonology.phonology.countphos.stats.more', { count: item.locations.length - 10 }) }}
              </button>
            </div>

            <button
              v-if="canShowSyllableHeatmap"
              class="action-btn syllable-heatmap-btn"
              type="button"
              @click="openSyllableHeatmap(item.syllable)"
            >
              {{ $t('phonology.phonology.countphos.syllables.heatmap') }}
            </button>
          </div>
        </div>
      </section>
```

- [ ] **Step 8: Add narrow SCSS using existing classes**

In `Countphos.vue` style block, add:

```scss
  .syllable-section {
    padding: 12px;
  }

  .syllable-section__header {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 12px;
  }

  .syllable-mode-switch {
    :deep(.switch-toggle__button) {
      min-width: 96px;
    }
  }

  .syllable-heatmap-btn {
    width: 100%;
    margin-top: 10px;
  }
```

Do not add width-based media queries.

- [ ] **Step 9: Add locale keys**

Add these keys under `phonology.phonology.countphos` in all three locale files:

Simplified Chinese:

```json
"syllables": {
  "title": "音节统计",
  "modeSwitchLabel": "切换音节统计类型",
  "heatmap": "绘制热力图",
  "modes": {
    "toneless": "不带调",
    "toned": "带调"
  }
}
```

Traditional Chinese:

```json
"syllables": {
  "title": "音節統計",
  "modeSwitchLabel": "切換音節統計類型",
  "heatmap": "繪製熱力圖",
  "modes": {
    "toneless": "不帶調",
    "toned": "帶調"
  }
}
```

English:

```json
"syllables": {
  "title": "Syllable Statistics",
  "modeSwitchLabel": "Switch syllable statistic type",
  "heatmap": "Draw Heatmap",
  "modes": {
    "toneless": "Toneless",
    "toned": "Toned"
  }
}
```

- [ ] **Step 10: Run Countphos contract test**

Run:

```bash
npm test -- syllableCountContracts.test.js
```

Expected: PASS.

- [ ] **Step 11: CR and commit Countphos section**

Run:

```bash
git diff -- project/src/main/components/pho/Countphos.vue project/src/i18n/locales/zh-CN/phonology.json project/src/i18n/locales/zh-Hant/phonology.json project/src/i18n/locales/en/phonology.json project/tests/syllableCountContracts.test.js
npm test -- syllableCountContracts.test.js colorThemeTokens.test.js
```

CR checklist:
- Existing feature-count charts and cards are still present.
- Syllable section is additive and placed inside current display flow.
- `SwitchToggle` only changes the syllable section mode.
- Heatmap button condition is `matchedLocations.value.length > 10`.
- Chinese and Traditional Chinese strings are intact.
- Styles use `<style scoped lang="scss">`, import mixins, and use no width media query.

Commit only these files:

```bash
git add project/src/main/components/pho/Countphos.vue project/src/i18n/locales/zh-CN/phonology.json project/src/i18n/locales/zh-Hant/phonology.json project/src/i18n/locales/en/phonology.json project/tests/syllableCountContracts.test.js
git commit -m "feat: add syllable statistics section"
```

---

## Frontend Task 5: Add MapLibre `syllableHeatmap` Mode

**Files:**
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/main/components/map/MapLibre.vue`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/main/views/menu/MapPage.vue`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/main/router/menuRoutes.js`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/i18n/locales/zh-CN/map.json`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/i18n/locales/zh-Hant/map.json`
- Modify: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/i18n/locales/en/map.json`
- Test: `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/tests/syllableCountContracts.test.js`

- [ ] **Step 1: Re-check current map files**

Run:

```bash
git status --short
sed -n '1,120p' project/src/main/components/map/MapLibre.vue
sed -n '240,360p' project/src/main/components/map/MapLibre.vue
sed -n '1,120p' project/src/main/views/menu/MapPage.vue
sed -n '60,95p' project/src/main/router/menuRoutes.js
```

Expected: preserve current user map edits and route layout.

- [ ] **Step 2: Add failing map contract tests**

Append to `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/tests/syllableCountContracts.test.js`:

```js
  it('adds a dedicated MapLibre syllable heatmap branch without using mergedData', () => {
    const mapLibreSource = readSource('src/main/components/map/MapLibre.vue')

    expect(mapLibreSource).toContain("mapStore.mode === 'syllableHeatmap'")
    expect(mapLibreSource).toContain('drawSyllableHeatmap')
    expect(mapLibreSource).toContain('clearSyllableHeatmapLayers')
    expect(mapLibreSource).toContain('syllable-heatmap-source')
    expect(mapLibreSource).toContain('heatmap-weight')
    expect(mapLibreSource).toContain('mapStore.syllableHeatmapPayload')
  })

  it('allows syllable heatmap route query keys and suppresses feature controls in heatmap mode', () => {
    const routesSource = readSource('src/main/router/menuRoutes.js')
    const mapPageSource = readSource('src/main/views/menu/MapPage.vue')

    expect(routesSource).toContain("'mode'")
    expect(routesSource).toContain("'toneMode'")
    expect(routesSource).toContain("'syllable'")
    expect(mapPageSource).toContain("mapStore.mode !== 'syllableHeatmap'")
  })
```

- [ ] **Step 3: Run test to verify failure**

Run:

```bash
npm test -- syllableCountContracts.test.js
```

Expected: FAIL because MapLibre heatmap branch and route allowlist are missing.

- [ ] **Step 4: Add heatmap constants and cleanup**

In `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/main/components/map/MapLibre.vue`, add near marker state:

```js
const SYLLABLE_HEATMAP_SOURCE_ID = 'syllable-heatmap-source'
const SYLLABLE_HEATMAP_LAYER_ID = 'syllable-heatmap-layer'
const SYLLABLE_HEATMAP_POINT_LAYER_ID = 'syllable-heatmap-point-layer'
let syllableHeatmapPopup = null
const syllableHeatmapInteractionHandlers = {
  click: null,
  mouseenter: null,
  mouseleave: null
}

const removeMapLayerIfExists = (layerId) => {
  if (map.value?.getLayer(layerId)) {
    map.value.removeLayer(layerId)
  }
}

const removeMapSourceIfExists = (sourceId) => {
  if (map.value?.getSource(sourceId)) {
    map.value.removeSource(sourceId)
  }
}

const clearSyllableHeatmapLayers = () => {
  if (syllableHeatmapPopup) {
    syllableHeatmapPopup.remove()
    syllableHeatmapPopup = null
  }

  if (map.value?.getLayer(SYLLABLE_HEATMAP_POINT_LAYER_ID)) {
    if (syllableHeatmapInteractionHandlers.click) {
      map.value.off('click', SYLLABLE_HEATMAP_POINT_LAYER_ID, syllableHeatmapInteractionHandlers.click)
    }
    if (syllableHeatmapInteractionHandlers.mouseenter) {
      map.value.off('mouseenter', SYLLABLE_HEATMAP_POINT_LAYER_ID, syllableHeatmapInteractionHandlers.mouseenter)
    }
    if (syllableHeatmapInteractionHandlers.mouseleave) {
      map.value.off('mouseleave', SYLLABLE_HEATMAP_POINT_LAYER_ID, syllableHeatmapInteractionHandlers.mouseleave)
    }
  }

  syllableHeatmapInteractionHandlers.click = null
  syllableHeatmapInteractionHandlers.mouseenter = null
  syllableHeatmapInteractionHandlers.mouseleave = null

  removeMapLayerIfExists(SYLLABLE_HEATMAP_POINT_LAYER_ID)
  removeMapLayerIfExists(SYLLABLE_HEATMAP_LAYER_ID)
  removeMapSourceIfExists(SYLLABLE_HEATMAP_SOURCE_ID)
}
```

Call `clearSyllableHeatmapLayers()` inside `clearMarkers()` before marker cleanup.

- [ ] **Step 5: Add heatmap render branch**

In `renderMapContent`, add:

```js
  } else if (mapStore.mode === 'syllableHeatmap') {
    drawSyllableHeatmap();
```

Add `drawSyllableHeatmap` before `drawCompareMap`:

```js
const resolveCssColor = (name, fallback) => {
  if (!mapContainer.value) return fallback
  const value = getComputedStyle(mapContainer.value).getPropertyValue(name).trim()
  return value || fallback
}

const drawSyllableHeatmap = () => {
  const payload = mapStore.syllableHeatmapPayload
  const points = Array.isArray(payload?.points) ? payload.points : []
  if (!points.length) return

  const maxCount = Math.max(...points.map((point) => Number(point.count || 0)), 1)
  const primaryColor = resolveCssColor('--color-primary', '#007aff')
  const geojson = {
    type: 'FeatureCollection',
    features: points
      .filter((point) => isValidCoordinatePair(point.coordinate) && Number(point.count || 0) > 0)
      .map((point) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: point.coordinate
        },
        properties: {
          location: point.location,
          count: Number(point.count || 0),
          totalTokens: Number(point.totalTokens || 0),
          uniqueSyllables: Number(point.uniqueSyllables || 0),
          weight: Number(point.count || 0) / maxCount,
          syllable: payload.syllable || '',
          toneModeLabel: payload.toneModeLabel || ''
        }
      }))
  }

  clearSyllableHeatmapLayers()

  map.value.addSource(SYLLABLE_HEATMAP_SOURCE_ID, {
    type: 'geojson',
    data: geojson
  })

  map.value.addLayer({
    id: SYLLABLE_HEATMAP_LAYER_ID,
    type: 'heatmap',
    source: SYLLABLE_HEATMAP_SOURCE_ID,
    maxzoom: 12,
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'weight'], 0, 0, 1, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 4, 0.7, 10, 1.4],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 4, 18, 10, 44],
      'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 0.86, 13, 0.42],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(0, 0, 0, 0)',
        0.16,
        'rgba(0, 80, 220, 0.3)',
        0.35,
        'rgba(0, 180, 240, 0.5)',
        0.55,
        'rgba(80, 255, 120, 0.68)',
        0.75,
        'rgba(255, 220, 0, 0.82)',
        0.9,
        'rgba(255, 80, 0, 0.9)',
        1,
        'rgba(160, 0, 0, 0.95)'
      ]
    }
  })

  map.value.addLayer({
    id: SYLLABLE_HEATMAP_POINT_LAYER_ID,
    type: 'circle',
    source: SYLLABLE_HEATMAP_SOURCE_ID,
    minzoom: 8,
    paint: {
      'circle-radius': ['interpolate', ['linear'], ['get', 'weight'], 0, 4, 1, 10],
      'circle-color': 'rgba(255, 255, 255, 0.92)',
      'circle-stroke-color': primaryColor,
      'circle-stroke-width': 1.5,
      'circle-opacity': 0.82
    }
  })

  syllableHeatmapInteractionHandlers.click = handleSyllableHeatmapPointClick
  syllableHeatmapInteractionHandlers.mouseenter = () => {
    map.value.getCanvas().style.cursor = 'pointer'
  }
  syllableHeatmapInteractionHandlers.mouseleave = () => {
    map.value.getCanvas().style.cursor = ''
  }

  map.value.on('click', SYLLABLE_HEATMAP_POINT_LAYER_ID, syllableHeatmapInteractionHandlers.click)
  map.value.on('mouseenter', SYLLABLE_HEATMAP_POINT_LAYER_ID, syllableHeatmapInteractionHandlers.mouseenter)
  map.value.on('mouseleave', SYLLABLE_HEATMAP_POINT_LAYER_ID, syllableHeatmapInteractionHandlers.mouseleave)
}
```

Add popup handler:

```js
const handleSyllableHeatmapPointClick = (event) => {
  const feature = event.features?.[0]
  if (!feature) return

  if (syllableHeatmapPopup) {
    syllableHeatmapPopup.remove()
  }

  const props = feature.properties || {}
  const html = `
    <div class="map-popup">
      <p><span class="map-popup__label">${t('map.mapLibre.syllableHeatmap.location')}</span><span class="val">${props.location || ''}</span></p>
      <p><span class="map-popup__label">${t('map.mapLibre.syllableHeatmap.syllable')}</span><span class="val">${props.syllable || ''}</span></p>
      <p><span class="map-popup__label">${t('map.mapLibre.syllableHeatmap.count')}</span><span class="val">${props.count || 0}</span></p>
      <p><span class="map-popup__label">${t('map.mapLibre.syllableHeatmap.total')}</span><span class="val">${props.totalTokens || 0}</span></p>
    </div>
  `

  syllableHeatmapPopup = new maplibregl.Popup({
    offset: 14,
    closeButton: false,
    className: 'map-popup-wrapper'
  })
    .setLngLat(feature.geometry.coordinates)
    .setHTML(html)
    .addTo(map.value)
}
```

- [ ] **Step 6: Update style switching and view reset**

In `handleStyleChange`, after `map.value.setStyle(newStyle);`, add:

```js
  map.value.once('style.load', () => {
    renderMapContent(false)
  })
```

In `collectResetViewPoints`, include heatmap mode before feature/compare:

```js
  if (mapStore.mode === 'syllableHeatmap' && mapStore.syllableHeatmapPayload?.points?.length) {
    points = mapStore.syllableHeatmapPayload.points
      .map(item => item.coordinate)
      .filter(isValidCoordinatePair);
  }
```

- [ ] **Step 7: Avoid feature dropdown in heatmap mode**

In `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/main/views/menu/MapPage.vue`, change the feature-control condition:

```vue
      <div
        v-else-if="currentTab === 'map' && mapStore.mode !== 'syllableHeatmap' && mapStore.mode === 'feature' && availableFeatures.length > 0"
        class="feature-control-area"
      >
```

No visual redesign is needed.

- [ ] **Step 8: Add route allowlist keys**

In `/Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project/src/main/router/menuRoutes.js`, update map view allowlist:

```js
          view: ['feature', 'locations', 'regions', 'regionMode', 'openPanel', 'phonology', 'mode', 'toneMode', 'syllable'],
```

- [ ] **Step 9: Add map locale keys**

Under `map.mapLibre`, add:

Simplified Chinese:

```json
"syllableHeatmap": {
  "location": "地点",
  "syllable": "音节",
  "count": "数量",
  "total": "该点音节总数"
}
```

Traditional Chinese:

```json
"syllableHeatmap": {
  "location": "地點",
  "syllable": "音節",
  "count": "數量",
  "total": "該點音節總數"
}
```

English:

```json
"syllableHeatmap": {
  "location": "Location",
  "syllable": "Syllable",
  "count": "Count",
  "total": "Total syllable tokens"
}
```

- [ ] **Step 10: Run map contract test**

Run:

```bash
npm test -- syllableCountContracts.test.js
```

Expected: PASS.

- [ ] **Step 11: CR and commit MapLibre heatmap task**

Run:

```bash
git diff -- project/src/main/components/map/MapLibre.vue project/src/main/views/menu/MapPage.vue project/src/main/router/menuRoutes.js project/src/i18n/locales/zh-CN/map.json project/src/i18n/locales/zh-Hant/map.json project/src/i18n/locales/en/map.json project/tests/syllableCountContracts.test.js
npm test -- syllableCountContracts.test.js mapLifecycleReviewFix.test.js colorThemeTokens.test.js
```

CR checklist:
- `mergedData` remains used only by existing feature/compare/custom flows.
- Heatmap cleanup removes source/layers and popup.
- Style switch redraws heatmap after `style.load`.
- Route query allowlist preserves heatmap keys.
- Chinese and Traditional Chinese locale text is intact.

Commit only these files:

```bash
git add project/src/main/components/map/MapLibre.vue project/src/main/views/menu/MapPage.vue project/src/main/router/menuRoutes.js project/src/i18n/locales/zh-CN/map.json project/src/i18n/locales/zh-Hant/map.json project/src/i18n/locales/en/map.json project/tests/syllableCountContracts.test.js
git commit -m "feat: add syllable heatmap map mode"
```

---

## Frontend Task 6: Integration Verification And Polish

**Files:**
- Modify only if verification exposes a real bug in files from Tasks 3-5.
- Test: existing focused tests plus one manual browser check.

- [ ] **Step 1: Run focused frontend tests**

Run:

```bash
npm test -- syllableCountContracts.test.js colorThemeTokens.test.js mapLifecycleReviewFix.test.js
```

Expected: PASS.

- [ ] **Step 2: Run backend syllable tests**

In `/Users/jengzang/CodeProject/dialects/dialects-backend`, run:

```bash
python -m pytest tests/test_syllable_counts.py -v
```

Expected: PASS.

- [ ] **Step 3: Run frontend lint on touched files**

Run:

```bash
cd /Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project
npx eslint src/api/main/core/query.js src/main/store/store.js src/main/components/pho/Countphos.vue src/main/components/map/MapLibre.vue src/main/views/menu/MapPage.vue src/main/router/menuRoutes.js tests/syllableCountContracts.test.js --quiet
```

Expected: no output and exit code 0.

- [ ] **Step 4: Manual browser verification**

Start the frontend dev server:

```bash
cd /Users/jengzang/CodeProject/dialects/dialects-vue-frontend/project
npm run dev -- --host 127.0.0.1
```

Manual checks:
- Open `/zh-CN/menu/pho/count`.
- Select 1 dialect point: original feature-count display works; syllable section appears; no heatmap button appears.
- Select 10 dialect points: original feature-count display works; syllable section appears; no heatmap button appears.
- Select 11 dialect points: syllable section appears; heatmap buttons appear.
- Toggle `不带调/带调`: only the syllable section changes.
- Click one heatmap button: app routes to `/zh-CN/menu/map/view?mode=syllableHeatmap&toneMode=...&syllable=...`; MapLibre shows heatmap and point popup.
- Switch map style: heatmap redraws after style load.

- [ ] **Step 5: CR final diff**

Run in both repositories:

```bash
git status --short
git diff
```

CR checklist:
- No unrelated files are included.
- No existing countpho behavior is removed.
- No existing map feature/compare/custom behavior is changed outside the `syllableHeatmap` branch.
- No Chinese, Traditional Chinese, or emoji corruption appears in diffs.

- [ ] **Step 6: Commit any verification fixes**

If verification required fixes, commit only those touched files:

```bash
git add project/src/api/main/core/query.js project/src/main/store/store.js project/src/main/components/pho/Countphos.vue project/src/main/components/map/MapLibre.vue project/src/main/views/menu/MapPage.vue project/src/main/router/menuRoutes.js project/tests/syllableCountContracts.test.js
git commit -m "fix: polish syllable count heatmap integration"
```

If verification fixes only changed a subset of those files, remove the unchanged paths from the `git add` command before running it. If no fixes were required, do not create an empty commit.

---

## Self-Review

- Spec coverage: The plan covers one additive Countphos section, `SwitchToggle` toneless/toned switching, one backend API returning both data sets, heatmap availability only for `> 10` locations, and isolated MapLibre heatmap payload/state.
- Placeholder scan: The plan contains concrete file paths, commands, expected outcomes, and code blocks for each implementation step. There are no deferred implementation placeholders.
- Type consistency: Backend uses `toneless`, `toned`, `points`, and `[lng, lat]`; frontend uses the same keys in API, Countphos, store, and MapLibre payload.
- Scope control: Existing `feature_counts`, `mergedData`, feature map, compare map, and custom data flows remain untouched except for adding a new mode branch.
