# VillagesML 自然村機器學習分析系統 — 功能總覽

> **數據規模：** 廣東省 285,860 條自然村地名
> **分析維度：** 字符、語義、空間、模式、區域、ML聚類

---

## 目錄

1. [系統架構](#系統架構)
2. [Module 1 — 搜尋探索](#module-1--搜尋探索)
3. [Module 2 — 字符分析](#module-2--字符分析)
4. [Module 3 — 語義分析](#module-3--語義分析)
5. [Module 4 — 空間分析](#module-4--空間分析)
6. [Module 5 — 模式分析](#module-5--模式分析)
7. [Module 6 — 區域分析](#module-6--區域分析)
8. [Module 7 — ML計算](#module-7--ml計算)
9. [系統信息 Dashboard](#系統信息-dashboard)
10. [語義類別完整清單](#語義類別完整清單)
11. [通用 API 參數規範](#通用-api-參數規範)

---

## 系統架構

### 前端技術棧

| 層次 | 技術 | 說明 |
|------|------|------|
| UI 框架 | Vue 3.5 + Composition API | `<script setup>` 語法 |
| 構建工具 | Vite 7.1 (MPA) | 多入口點構建 |
| 狀態管理 | 自研響應式 Store | `villagesMLStore.js` |
| 地圖渲染 | MapLibre GL 5.16 | GPU 加速，零 DOM 標記 |
| 圖表庫 | ECharts 5.6 | 熱圖、柱狀、網絡圖 |
| API 中心 | `src/api/villagesML/` | 14 個子模組統一管理 |

### 模組/子頁面統計

| 模組 | 子頁面數 | 主要技術 |
|------|----------|----------|
| 搜尋探索 | 1 | 分頁搜尋、三級行政區過濾 |
| 字符分析 | 4 | 嵌入向量、卡方檢驗、共現網絡 |
| 語義分析 | 6 | VTF、PMI、Z-score 傾向性 |
| 空間分析 | 4 | 地理聚類、熱點識別、MapLibre |
| 模式分析 | 5 | N-gram、結構解析、通配符匹配 |
| 區域分析 | 3 | 三級聚合、Cosine/Jaccard 相似度 |
| ML計算 | 5 | K-means/DBSCAN/GMM、PCA、層次聚類 |
| 系統信息 | 1 | Dashboard、統計概覽 |

---

## Module 1 — 搜尋探索

**路由：** `/villagesML?module=search`
**組件：** `SearchPanel.vue` + `VillageListPanel.vue` + `VillageDeepAnalysisModal.vue`

### 功能說明

提供關鍵詞搜尋入口，支持三級行政區（市/縣/鎮）逐層過濾，搜尋結果分頁展示，可點入查看單個自然村的完整多維分析。

### 交互能力

- 關鍵詞輸入（支持漢字/拼音）
- 市 → 縣 → 鎮 三級聯動下拉選擇器（`FilterableSelect`）
- 分頁瀏覽（默認每頁 20 條）
- 點擊村莊條目進入深度分析 Modal

### 深度分析 Modal（`VillageDeepAnalysisModal.vue`）

對單個自然村展示：

| 分析維度 | 組件 | 說明 |
|----------|------|------|
| 基本信息 | `VillageInfoPanel.vue` | 村名、行政區、坐標 |
| 特徵向量 | `FeatureVectorPanel.vue` | 語義/形態/多樣性三組特徵 |
| 空間特徵 | `SpatialFeaturesPanel.vue` | 所屬空間聚類和熱點 |
| 語義結構 | `SemanticStructurePanel.vue` | 語義類別組合方式 |
| N-gram 分解 | `NgramPanel.vue` | 一元/二元/三元切分結果 |

### API 端點

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `searchVillages` | `GET /api/villages/village/search` | `keyword`, `city`, `county`, `township`, `limit`, `offset` |
| `getVillageDetail` | `GET /api/villages/village/search/detail` | `village_id` |
| `getRegionList` | `GET /api/villages/metadata/stats/regions` | `level` (city/county/township), `parent_*` |
| `getVillageComplete` | `GET /api/villages/village/complete/{villageId}` | — |
| `getVillageFeatures` | `GET /api/villages/village/features/{villageId}` | — |
| `getVillageSpatialFeatures` | `GET /api/villages/village/spatial-features/{villageId}` | — |
| `getVillageSemanticStructure` | `GET /api/villages/village/semantic-structure/{villageId}` | — |
| `getVillageNgrams` | `GET /api/villages/village/ngrams/{villageId}` | — |

> **後端說明：** 搜尋端點返回結果請包含分頁元信息（`total`、`page`、`limit`）。特徵向量端點（`/features`）需返回三組向量：`semantic`（語義類別分佈）、`morphology`（形態學特徵）、`diversity`（字符多樣性指標）。

---

## Module 2 — 字符分析

**路由：** `/villagesML?module=character`
**組件目錄：** `src/components/villagesML/character/`

---

### 2.1 頻率傾向 `frequency`

**功能：** 統計全局及各地區字符使用頻率，以 Z-score 衡量某字符在某地區的傾向性偏差（高於/低於預期），可視化為熱圖。

**可視化：** `TendencyHeatmapPanel.vue` — ECharts 熱圖，X 軸為字符，Y 軸為地區，顏色深淺表示傾向強度；支持切換指標（Z-Score / Log Odds / Lift）。

**交互：**
- 地區層級切換（市/縣/鎮）
- 字符 Top-K 數量調節
- 指標類型切換（Z-Score、Log Odds、Lift）

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getGlobalCharFrequency` | `GET /api/villages/character/frequency/global` | `top_k` |
| `getRegionalCharFrequency` | `GET /api/villages/character/frequency/regional` | `region_level`, `city`, `county`, `township`, `top_k` |
| `getCharTendency` | `GET /api/villages/character/tendency/by-region` | `region_level`, `top_k` |
| `getCharTendencyByChar` | `GET /api/villages/character/tendency/by-char` | `char`, `region_level` |

> **後端說明：** `tendency/by-region` 返回結果應包含每個字符在每個地區的 `z_score`、`log_odds`、`lift` 三個指標，供前端熱圖直接使用。

---

### 2.2 嵌入相似 `embeddings`

**功能：** 查詢某字符的 Embedding 向量，並搜尋語義最相似的字符（Cosine 相似度），可用於探索地名中字符的語義關聯。

**可視化：** `CharacterEmbeddings.vue` — 相似字符列表，可擴展展示 t-SNE 散點圖。

**交互：**
- 字符輸入框
- Top-K 相似字符數量（默認 10）
- 最小相似度門檻（`min_similarity`）
- 嵌入列表分頁瀏覽

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getCharEmbeddingsList` | `GET /api/villages/character/embeddings/list` | `limit`, `offset` |
| `getCharEmbeddingVector` | `GET /api/villages/character/embeddings/vector` | `char` |
| `getCharSimilarities` | `GET /api/villages/character/embeddings/similarities` | `char`, `top_k`, `min_similarity` |

> **後端說明：** `embeddings/vector` 需返回字符的完整向量（`vector: number[]`，維度 `dim`）。Embedding 模型使用何種預訓練或自訓練方式（如 Word2Vec/FastText/GloVe）請在此補充。

---

### 2.3 字符網絡 `network`

**功能：** 計算字符共現矩陣，構建字符共現語義網絡圖，支持社群識別（Community Detection）和中心性分析。

**可視化：** `CharacterNetwork.vue` — ECharts 力導向網絡圖，節點大小反映中心性，邊粗細反映共現強度，顏色表示社群。

**交互：**
- 最小共現次數過濾（`min_cooccurrence`）
- 最小邊權重（`min_edge_weight` 0–10）
- 中心性指標選擇（度中心性/介數中心性/接近中心性/特徵向量中心性）
- 地區過濾
- 異步任務進度追蹤

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getCooccurrence` | `GET /api/villages/compute/semantic/cooccurrence` | `min_cooccurrence`, `alpha`（顯著性水平） |
| `getSemanticNetwork` | `POST /api/villages/compute/semantic/network` | `region_level`, `city/county/township`, `min_edge_weight`, `centrality_metrics[]` |
| `getSemanticNetworkStatus` | `GET /api/villages/compute/semantic/network/status/{taskId}` | — |

> **後端說明：** 網絡構建為異步任務，需返回 `task_id` 供輪詢進度。返回格式為 `{ nodes: [{ id, label, centrality }], edges: [{ source, target, weight }], communities: [] }`。社群識別算法（Louvain/Girvan-Newman 等）請補充說明。

---

### 2.4 顯著性 `significance`

**功能：** 對字符在各地區分佈進行卡方檢驗，判斷字符偏好是否統計顯著，輸出 p 值和效應量（Effect Size）。

**可視化：** `CharacterSignificance.vue` — 顯著性熱圖，標記 `***`（p<0.001）、`**`（p<0.01）、`*`（p<0.05）、`n.s.`。

**交互：**
- 字符查詢（某字在哪些地區顯著）
- 地區查詢（某地區哪些字符顯著）
- 地區層級切換
- Top-K 結果數量

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getCharSignificanceByChar` | `GET /api/villages/character/significance/by-character` | `char`, `region_level` |
| `getCharSignificanceByRegion` | `GET /api/villages/character/significance/by-region` | `region_level`, `city/county/township`, `top_k` |
| `getCharSignificanceSummary` | `GET /api/villages/character/significance/summary` | `region_level` |

> **後端說明：** 返回字段應包含 `chi_square`、`p_value`、`effect_size`（Cramér's V 或 Cohen's w）、`region_name`。卡方檢驗的自由度設定請補充。

---

## Module 3 — 語義分析

**路由：** `/villagesML?module=semantic`
**組件目錄：** `src/components/villagesML/semantic/`

語義分析體系以 **9 大語義類別 + 40+ 精細子類** 為核心（見 [語義類別完整清單](#語義類別完整清單)）。

---

### 3.1 類別標籤 `categories`

**功能：** 展示 9 大語義類別的全局分佈（Virtual Term Frequency），並支持按地區查詢各類別的 Z-score 傾向偏差。

**可視化：** 9 個分類卡片，每張卡片含 VTF 柱狀圖（全局）+ 區域 VTF 對比；傾向排行榜（地區 × 類別 Z-score 熱圖）。

**交互：**
- 地區層級 + 地區名稱選擇
- VTF Top-K 數量調節
- 類別詳情展開

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getSemanticCategoryList` | `GET /api/villages/semantic/category/list` | — |
| `getSemanticVTFGlobal` | `GET /api/villages/semantic/category/vtf/global` | `top_k` |
| `getSemanticVTFRegional` | `GET /api/villages/semantic/category/vtf/regional` | `region_level`, `city/county/township`, `top_k` |
| `getSemanticCategoryTendency` | `GET /api/villages/semantic/category/tendency` | `region_level`, `city/county/township` |
| `getSemanticLabelCategories` | `GET /api/villages/semantic/labels/categories` | — |
| `getSemanticLabelsByCategory` | `GET /api/villages/semantic/labels/by-category` | `category` |
| `getSemanticLabelsByChar` | `GET /api/villages/semantic/labels/by-character` | `char` |

> **後端說明：** VTF（Virtual Term Frequency）的計算方式請補充（是否為加權頻率？是否對語義類別詞典做了字符映射？）

---

### 3.2 組合模式 `composition`

**功能：** 分析村名在語義類別層面的構詞組合規律，使用 Bigram/Trigram 統計相鄰類別的共現頻率，並以 PMI（逐點互信息）量化類別間的組合關聯強度。

**可視化：** Bigram 表格（頻率 + 百分比 + PMI 分數）+ Trigram 表格；支持細緻模式（40+ 子類）和粗略模式（9 大類）切換。

**交互：**
- 最小頻率過濾（`min_frequency`）
- 分類粒度切換（細緻 / 粗略）
- 詞典參考 Modal

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getSemanticCompositionPatterns` | `GET /api/villages/semantic/composition/patterns` | `min_frequency`, `limit` |
| `getSemanticBigrams` | `GET /api/villages/semantic/composition/bigrams` | `min_frequency`, `limit` |
| `getSemanticTrigrams` | `GET /api/villages/semantic/composition/trigrams` | `min_frequency`, `limit` |
| `getSemanticPMI` | `GET /api/villages/semantic/composition/pmi` | — |

> **後端說明：** PMI 計算公式為 log[P(A,B) / (P(A)·P(B))]，返回字段包含 `pattern`（如 "水系-聚落"）、`frequency`、`pmi_score`、`modifier`（修飾成分類別）、`head`（中心成分類別）。

---

### 3.3 N-gram 分析 `ngrams`

**功能：** 從村名字符層面進行 N-gram（n=2-4）切分，統計全局頻率，並按位置（前綴/中間/後綴）分析字符串規律，支持通配符模式匹配（`*`）。

**可視化：** N-gram 頻率表格（分 n 值和位置），模式搜尋結果列表。

**交互：**
- N 值選擇（2/3/4）
- 位置過濾（全部/前綴/中間/後綴）
- Top-K 數量
- 通配符搜尋（如 `*村`、`老*`）
- 地區篩選

位置標籤映射：

| 位置代碼 | 中文 |
|---------|------|
| `prefix` | 前綴 |
| `middle` | 中間 |
| `suffix` | 後綴 |
| `prefix-suffix` | 前後綴 |
| `prefix-middle` | 前中 |
| `middle-suffix` | 中後 |
| `prefix-middle-suffix` | 前中後 |

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getNgramFrequency` | `GET /api/villages/ngrams/frequency` | `n`, `top_k`, `min_frequency`, `position` |
| `getNgramPatterns` | `GET /api/villages/ngrams/patterns` | `pattern`（支持 `*`），`n` |
| `getNgramRegional` | `GET /api/villages/ngrams/regional` | `n`, `region_level`, `city/county/township`, `top_k` |
| `getNgramTendency` | `GET /api/villages/ngrams/tendency` | `ngram`, `region_level`, `city/county/township`, `min_tendency`, `limit` |
| `getNgramSignificance` | `GET /api/villages/ngrams/significance` | `ngram`, `region_level` |

> **後端說明：** `tendency` 端點返回 `tendency_score = 實際頻率 / 期望頻率`（>1 偏好，<1 迴避，≈1 中立）。`significance` 端點返回 `chi_square`、`p_value`。

---

### 3.4 語義指數 `indices`

**功能：** 計算並展示各地區的語義豐富度、偏態等宏觀指數，反映地名語義構成的整體特徵。

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getSemanticIndices` | `GET /api/villages/semantic/indices` | `region_level`, `city/county/township` |

> **後端說明：** 指數具體定義（如 Shannon Entropy、Simpson 多樣性指數、偏度等）請補充計算方式。

---

### 3.5 語義網絡 `network`

同 [2.3 字符網絡](#23-字符網絡-network)，但在語義類別層面構建共現網絡（節點為類別，邊為類別共現強度）。

---

### 3.6 子類別分析 `subcategories`

**功能：** 在 40+ 精細子類層面（如 `mountain_peak`、`water_stream`、`clan_he`）分析各地區的偏好傾向，支持子類的 VTF 全局/區域對比及 Z-score 傾向排行。

**可視化：** 父類別 → 子類別 二級選擇器，VTF 柱狀圖，傾向 Top-N 排行表，地區對比分析。

**交互：**
- 父類別過濾（9 大類）
- 子類別選擇
- 地區層級 + 地區名選擇
- 多地區對比模式

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getSemanticSubcategoryList` | `GET /api/villages/semantic/subcategory/list` | `parent_category` |
| `getSemanticSubcategoryChars` | `GET /api/villages/semantic/subcategory/chars/{subcategory}` | — |
| `getSemanticSubcategoryVTFGlobal` | `GET /api/villages/semantic/subcategory/vtf/global` | `subcategory`, `top_k` |
| `getSemanticSubcategoryVTFRegional` | `GET /api/villages/semantic/subcategory/vtf/regional` | `subcategory`, `region_level`, `city/county/township` |
| `getSemanticSubcategoryTendencyTop` | `GET /api/villages/semantic/subcategory/tendency/top` | `subcategory`, `region_level`, `top_k` |
| `getSemanticSubcategoryComparison` | `GET /api/villages/semantic/subcategory/comparison` | `subcategory`, `region_level`, `regions[]` |

---

## Module 4 — 空間分析

**路由：** `/villagesML?module=spatial`
**組件目錄：** `src/components/villagesML/spatial/`
**地圖技術：** MapLibre GL 5.16（GPU Symbol Layer，零 DOM 標記）

---

### 4.1 空間熱點 `hotspots`

**功能：** 識別村莊地理分佈中的高密度聚集熱點，展示各熱點的中心坐標、半徑、包含村莊數，並可查看熱點內村莊列表。

**可視化：** `HotspotMap.vue` — MapLibre 地圖，熱點以圓形標記顯示；熱點列表卡片（中心坐標、半徑 km、村莊數）。

**交互：**
- 地圖縮放/拖動
- 點擊熱點查看村莊列表
- 地圖樣式切換（高德 / OSM）

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getSpatialHotspots` | `GET /api/villages/spatial/hotspots` | — |
| `getSpatialHotspotDetail` | `GET /api/villages/spatial/hotspots/{hotspotId}` | — |

> **後端說明：** 熱點識別算法（KDE 核密度估計 / DBSCAN / HDBSCAN 等）請補充。返回字段包含 `hotspot_id`、`center_lat`、`center_lng`、`radius_km`、`village_count`。

---

### 4.2 空間聚類 `clusters`

**功能：** 展示預計算的地理空間聚類結果，支持多輪次（run_id）切換，以地圖和表格雙視圖呈現各聚類的地理範圍、規模、噪聲點情況。

**可視化：** `SpatialMap.vue` — 聚類著色地圖；聚類摘要表（聚類 ID、大小、質心坐標、平均半徑 km）。

**支持的預計算聚類方案：**

| run_id | 中文標籤 | 說明 |
|--------|---------|------|
| `spatial_eps_05` | 超密集核心聚類 | 小半徑 DBSCAN |
| `spatial_hdbscan_v1` | 自動多密度聚類 | **默認**，HDBSCAN |
| `spatial_eps_10` | 標準密度聚類 | 中等半徑 DBSCAN |
| `spatial_eps_20` | 全域覆蓋聚類 | 大半徑 DBSCAN |

**交互：**
- 聚類方案（run_id）切換
- 地圖聚類著色
- 點擊聚類查看詳情

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getSpatialClusters` | `GET /api/villages/spatial/clusters` | `run_id`, `limit` |
| `getSpatialClustersAvailableRuns` | `GET /api/villages/spatial/clusters/available-runs` | — |
| `getSpatialClustersSummary` | `GET /api/villages/spatial/clusters/summary` | `run_id` |

> **後端說明：** `available-runs` 端點返回每個 run 的元信息：`total_records`、`unique_clusters`、`avg_cluster_size`、`noise_count`、`is_active`。

---

### 4.3 空間可視化 `visualization`

**功能：** 基於空間聚類數據渲染全省地圖，支持按聚類著色、點密度顯示、全屏切換。

**可視化：** `SpatialMap.vue` — 使用 MapLibre GeoJSON Source + Symbol Layer，支持高德底圖和 OSM 底圖。

> **後端說明：** 可視化數據源複用空間聚類端點，無額外端點。

---

### 4.4 空間整合 `integration`

**功能：** 交叉分析「字符」與「地理空間聚類」的關聯：
- 查詢某字符在哪些地理聚類中高發（字符 → 聚類）
- 查詢某地理聚類有哪些特征字符（聚類 → 字符）
- 計算「空間相干性」（Spatial Coherence）指標，衡量字符分佈的地理集中度

**可視化：** 雙向查詢結果表格；空間相干性分佈圖；聚類 × 字符傾向矩陣。

**交互：**
- 查詢模式切換（按字符 / 按聚類 / 總覽）
- 最小聚類規模過濾（`min_cluster_size`）
- 最小空間相干性門檻（`min_spatial_coherence`，0–1）
- 統計顯著性過濾開關

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getSpatialIntegration` | `GET /api/villages/spatial/integration` | `run_id`, `character`, `cluster_id`, `min_cluster_size`, `min_spatial_coherence`, `is_significant`, `limit` |
| `getSpatialIntegrationByChar` | `GET /api/villages/spatial/integration/by-character/{char}` | `run_id` |
| `getSpatialIntegrationByCluster` | `GET /api/villages/spatial/integration/by-cluster/{clusterId}` | `run_id` |
| `getSpatialIntegrationAvailableCharacters` | `GET /api/villages/spatial/integration/available-characters` | — |
| `getSpatialIntegrationClusterList` | `GET /api/villages/spatial/integration/clusterlist` | `run_id` |
| `getSpatialIntegrationSummary` | `GET /api/villages/spatial/integration/summary` | `run_id` |

> **後端說明：** `spatial_coherence` 取值範圍 [0, 1]，表示字符在地理上的集中程度（1 為完全集中在單一聚類，0 為完全分散）。具體計算方式（如 Moran's I / 聚類佔比）請補充。返回字段包含 `cluster_tendency_mean`、`spatial_coherence`、`avg_p_value`、`dominant_city`。

---

## Module 5 — 模式分析

**路由：** `/villagesML?module=pattern`
**組件目錄：** `src/components/villagesML/pattern/`

---

### 5.1 頻率分析 `frequency`

**功能：** 統計全局及區域命名模式的出現頻率，模式以結構標記表示（如「修飾-中心」、「中心-方位」）。

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getPatternFrequencyGlobal` | `GET /api/villages/patterns/frequency/global` | `top_k`, `min_frequency` |
| `getPatternFrequencyRegional` | `GET /api/villages/patterns/frequency/regional` | `region_level`, `city/county/township`, `top_k` |

---

### 5.2 結構分析 `structural`

**功能：** 解析村名的語法結構，按角色（中心詞/修飾語/並列/動賓等）分類統計，並給出例子。

命名結構角色映射：

| 代碼 | 中文 | 說明 |
|------|------|------|
| `head` | 中心 | 核心語義成分（如 "村"、"坑"） |
| `modifier` | 修飾 | 限定修飾成分（如 "老"、"大"） |
| `coordinate` | 並列 | 並列結構（如 "東西"） |
| `verb` | 動 | 動詞成分 |
| `object` | 賓 | 賓語成分 |
| `subject` | 主 | 主語成分 |
| `predicate` | 謂 | 謂語成分 |
| `other` | 其他 | — |

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getPatternStructural` | `GET /api/villages/patterns/structural` | `pattern_type` |

---

### 5.3 傾向性分析 `tendency`

**功能：** 分析各地區對某命名模式的偏好強度（Z-score），揭示不同地區的命名風格差異。

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getPatternTendency` | `GET /api/villages/patterns/tendency` | `pattern`, `region_level`, `city/county/township` |

---

### 5.4 N-gram 探索 `ngram-explore`

**功能：** 交互式探索特定 N-gram 在各地區的分佈，支持通配符匹配（如 `*塘`），發現地域性命名習慣。

複用 [3.3 N-gram 分析](#33-n-gram-分析-ngrams) 的端點，側重交互式探索。

---

### 5.5 N-gram 統計 `ngram-stats`

**功能：** 展示全局 N-gram 顯著性統計彙總。

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getNgramStatistics` | `GET /api/villages/statistics/ngrams` | — |

---

## Module 6 — 區域分析

**路由：** `/villagesML?module=regional`
**組件目錄：** `src/components/villagesML/regional/`

---

### 6.1 聚合統計 `aggregates`

**功能：** 按市/縣/鎮三級行政區統計各地區的村莊數量、語義類別分佈、字符使用情況等彙總指標；同時支持基於 GeoJSON 的空間聚合展示（可疊加到地圖）。

**可視化：** 統計卡片（村莊總數、字符種類、語義分佈）；ECharts 柱狀圖對比；MapLibre 地圖空間聚合層。

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getRegionalAggregatesCity` | `GET /api/villages/regional/aggregates/city` | `city_name` |
| `getRegionalAggregatesCounty` | `GET /api/villages/regional/aggregates/county` | `city_name`, `county_name` |
| `getRegionalAggregatesTown` | `GET /api/villages/regional/aggregates/town` | `town_name`, `county_name`, `limit` |
| `getRegionalSpatialAggregates` | `GET /api/villages/regional/spatial-aggregates` | `region_level`, `region_name`, `limit` |
| `getRegionalVectors` | `GET /api/villages/regional/vectors` | `region_name`, `limit` |

> **後端說明：** `aggregates` 端點返回 `semantic_categories: {}` 字典（各類別計數）和 `statistics: {}`（字符多樣性、平均村名長度等）。

---

### 6.2 類別傾向性 `tendency`

**功能：** 計算各地區在 9 大語義類別的偏態（Z-score），識別地區的語義命名風格（如珠三角地區偏好「宗族」類，山區偏好「山地」類）。

複用 `getSemanticCategoryTendency` 端點，見 [3.1 類別標籤](#31-類別標籤-categories)。

---

### 6.3 相似度分析 `similarity`

**功能：** 三種查詢模式對地區進行語義相似度比較，基於各地區的語義特征向量計算 Cosine 或 Jaccard 距離。

**三種模式：**

**① Search 模式（找最相似地區）**
```
輸入：一個地區 + Top-K + 相似度指標
輸出：最相似的 K 個地區，含公共字符和差異字符
```

**② Pair 模式（兩地區對比）**
```
輸入：兩個地區
輸出：Cosine 相似度、Jaccard 相似度、歐氏距離、
      公共字符列表、各自特色字符列表
```

**③ Matrix 模式（多地區相似矩陣）**
```
輸入：多個地區列表 + 指標
輸出：N×N 相似度矩陣，ECharts 熱圖展示
```

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getRegionSimilaritySearch` | `GET /api/villages/regions/similarity/search` | `region_level`, `city/county/township`, `top_k`, `metric` (cosine\|jaccard), `min_similarity` |
| `getRegionSimilarityPair` | `GET /api/villages/regions/similarity/pair` | `region_level`, `city1/county1/township1`, `city2/county2/township2` |
| `getRegionSimilarityMatrix` | `GET /api/villages/regions/similarity/matrix` | `region_level`, `regions[]` ({city, county, township}), `metric` |

> **後端說明：** 相似度計算的特征向量構成（是語義類別分佈向量、字符頻率向量，還是組合向量）請補充說明。Pair 模式需同時返回 Cosine 和 Jaccard 兩種指標。

---

## Module 7 — ML計算

**路由：** `/villagesML?module=compute`
**組件目錄：** `src/components/villagesML/ml/clustering/`
**訪問限制：** 需登錄（`ensureAuthenticated`）

---

### 通用聚類參數

所有聚類類型共享以下前端設置面板：

**算法選擇（`AlgorithmSelector.vue`）：**

| 算法 | 參數 | 說明 |
|------|------|------|
| K-Means | `k`（默認 5，範圍 2–20） | 質心聚類 |
| DBSCAN | `eps` + `min_samples` | 密度聚類，可識別噪聲點 |
| GMM | `k`（默認 5） | 高斯混合模型 |

**特征選擇（`FeatureToggles.vue`）：**

| 特征組 | 參數 | 說明 |
|--------|------|------|
| 語義特征 | `use_semantic: true` | 9 類語義分佈向量 |
| 形態特征 | `use_morphology: true` + `top_n_suffix2/3` | 後綴 N-gram（二元/三元，10–500 個） |
| 多樣性特征 | `use_diversity: true` | 字符種類多樣性指標 |

**預處理（`PreprocessingSettings.vue`）：**
- PCA 降維（默認 50 個主成分）
- 標準化（Standardization）

---

### 7.1 基礎聚類 `clustering`

**功能：** 以自然村為單位，基於可配置特征向量進行聚類（K-means/DBSCAN/GMM）。支持 k 值掃描（自動找最優 k）、異步任務進度追蹤、結果緩存管理。

**可視化：** `ClusteringResultsPanel.vue` — ECharts 散點圖（PCA 降維後 2D 可視化）；輪廓係數（Silhouette Score）折線圖（k 值掃描）；各聚類統計表。

**交互：**
- 算法 + 特征 + 預處理完整配置
- 單次聚類 vs k 值掃描模式
- 任務進度輪詢
- 緩存清理

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `runClustering` | `POST /api/villages/compute/clustering/run` | `algorithm`, `k/eps/min_samples`, `use_semantic/morphology/diversity`, `pca_n_components`, `standardize`, `top_n_suffix2/3` |
| `scanClustering` | `POST /api/villages/compute/clustering/scan` | 同上 + `k_min`, `k_max` |
| `getClusteringStatus` | `GET /api/villages/compute/clustering/status/{taskId}` | — |
| `getClusteringCacheStats` | `GET /api/villages/compute/clustering/cache-stats` | — |
| `clearClusteringCache` | `DELETE /api/villages/compute/clustering/cache` | — |

> **後端說明：** 請補充聚類評估指標（輪廓係數、Calinski-Harabasz 指數、Davies-Bouldin 指數）的計算和返回。任務超時設置：基礎聚類 60 秒。

---

### 7.2 字符傾向聚類 `char-tendency`

**功能：** 以**地區**為分析單位（而非村莊），以各地區的字符使用傾向向量進行聚類，識別命名風格相近的地理區域群組。傾向向量支持三種構建方式（Z-score / TFIDF / PMI）。

**可視化：** 地區聚類結果地圖（MapLibre）；聚類中各地區代表性字符雷達圖。

**特有參數：**
- `top_n_chars`：選取傾向最強的前 N 個字符作為特征維度（默認 50）
- `tendency_metric`：傾向向量計算指標（z_score / tfidf / pmi）

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `runCharacterTendencyClustering` | `POST /api/villages/compute/clustering/character-tendency` | `algorithm`, `k`, `top_n_chars`, `tendency_metric`, `region_level`, `pca_n_components`, `standardize` |

> **後端說明：** 請說明三種傾向指標的差異：Z-score（標準化頻率偏差）、TFIDF（逆文檔頻率加權）、PMI（字符-地區聯合概率與邊際概率之比）。

---

### 7.3 採樣村莊聚類 `sampled-villages`

**功能：** 對完整數據集進行子集採樣後再聚類，適用於探索性分析和算法調參（降低計算量）。支持三種採樣策略。

**採樣策略：**

| 策略 | 說明 |
|------|------|
| `stratified` | 分層採樣（按行政區比例） |
| `random` | 隨機採樣 |
| `systematic` | 系統採樣（等間隔） |

**特有參數：**
- `sample_size`：採樣數量（最大 5000）
- `sampling_strategy`：採樣策略

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `runSampledVillagesClustering` | `POST /api/villages/compute/clustering/sampled-villages` | `algorithm`, `k`, `sample_size`, `sampling_strategy`, `use_semantic/morphology/diversity`, `pca_n_components` |

> **後端說明：** 任務超時 120 秒（較基礎聚類更長）。

---

### 7.4 空間感知聚類 `spatial-aware`

**功能：** 以預計算的空間聚類結果（`spatial_run_id`）為輸入，在空間聚類標籤基礎上疊加語義特征進行二次聚類（Double Clustering），識別「地理位置相近且命名風格相似」的村莊群組。

**特有參數：**
- `spatial_run_id`：關聯的空間聚類方案（從 4 個預計算方案中選擇）
- 空間特征集：`semantic_profile`、`naming_patterns`、`geographic`、`cluster_size`

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `runSpatialAwareClustering` | `POST /api/villages/compute/clustering/spatial-aware` | `algorithm`, `k`, `spatial_run_id`, `features[]`, `pca_n_components` |
| `getSpatialRunIds` | `GET /api/villages/admin/run-ids` | — |

> **後端說明：** 請補充二次聚類的特征融合方式（是否將空間聚類 ID 作為 one-hot 特征加入？還是使用空間聚類質心坐標？）

---

### 7.5 層次聚類 `hierarchical`

**功能：** 按「市 → 縣 → 鎮」三個層次分別執行聚類，每級使用獨立的 k 值，實現多尺度的命名風格分析。可對比同一縣內各鎮的差異，或同一市內各縣的風格分群。

**特有參數：**
- `k_city`：市級聚類數（建議 3–8）
- `k_county`：縣級聚類數（建議 3–10）
- `k_township`：鎮級聚類數（建議 3–15）

**可視化：** `HierarchicalResultsPanel.vue` — 三級樹形結構展示；各級聚類在地圖上分別渲染。

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `runHierarchicalClustering` | `POST /api/villages/compute/clustering/hierarchical` | `algorithm`, `k_city`, `k_county`, `k_township`, `use_semantic/morphology/diversity`, `pca_n_components` |

> **後端說明：** 任務超時 180 秒（三級計算量最大）。返回格式為三層嵌套結構，每層包含各聚類的成員列表和代表性字符。

---

## 系統信息 Dashboard

**路由：** `/villagesML?module=system`
**組件：** `Dashboard.vue` + `SystemInfo.vue`

**功能：** 系統入口和總覽頁面，展示核心統計指標和功能模組快速入口。

**統計卡片（6 個 KPI）：**

| 指標 | 說明 |
|------|------|
| 自然村總數 | 285,860 條 |
| 覆蓋城市數 | 廣東省各市 |
| 覆蓋縣區數 | — |
| 覆蓋鎮街數 | — |
| 字符種類數 | 地名中不同漢字總數 |
| N-gram 種類數 | 高頻 N-gram 總量 |

| 函數 | 端點 | 主要參數 |
|------|------|---------|
| `getMetadataOverview` | `GET /api/villages/metadata/stats/overview` | — |
| `getMetadataTables` | `GET /api/villages/metadata/stats/tables` | — |
| `getDatabaseStatistics` | `GET /api/villages/statistics/database` | — |

---

## 語義類別完整清單

### 9 大父類別

| 類別 ID | 中文名 | 代表字符 |
|---------|--------|---------|
| `agriculture` | 農業 | 田、地、農、牧、果、圃 |
| `clan` | 宗族 | 何、劉、吳、張、李、梁、羅、陳、黃 |
| `direction` | 方位 | 東、南、西、北、中、上、下、左、右 |
| `infrastructure` | 基建 | 驛、站、路、橋、渡、港 |
| `mountain` | 山地 | 山、嶺、峰、岡、坑、坡、崗、崖 |
| `settlement` | 聚落 | 村、莊、城、坊、屋、寨、圍、堡 |
| `symbolic` | 象徵 | 仁、義、佛、光、興、寶、福、吉 |
| `vegetation` | 植被 | 林、樹、竹、花、草、茶、松 |
| `water` | 水系 | 井、溪、河、江、湖、塘、灣、涌 |

### 輔助類別

| 類別 ID | 說明 | 代表字符 |
|---------|------|---------|
| `number_small` | 小數字（一二三） | 一、二、三、四、五 |
| `number_large` | 大數字（六七八） | 六、七、八、九、十 |
| `number_ordinal` | 序數詞 | 初、第、老 |
| `shape` | 形狀描述 | 圓、尖、平、扁、曲 |
| `size_big` | 大尺寸 | 大、長、高、廣 |
| `size_small` | 小尺寸 | 小、矮、窄 |
| `color` | 顏色 | 青、赤、黃、白、黑 |
| `time` | 時間 | 今、冬、古、春、秋 |

### 精細子類示例（40+）

| 父類別 | 子類別代碼 | 中文 |
|--------|---------|------|
| mountain | `mountain_peak` | 山峰 |
| mountain | `mountain_valley` | 山谷 |
| mountain | `mountain_slope` | 山坡 |
| mountain | `mountain_ridge` | 山脊 |
| mountain | `mountain_rock` | 岩石 |
| mountain | `mountain_plateau` | 台地 |
| water | `water_spring` | 泉眼 |
| water | `water_stream` | 溪流 |
| water | `water_pond` | 池塘 |
| water | `water_river` | 江河 |
| water | `water_lake` | 湖泊 |
| water | `water_bay` | 海灣 |
| water | `water_port` | 港口 |
| water | `water_shore` | 海岸 |
| water | `water_island` | 島嶼 |
| clan | `clan_he` | 何姓 |
| clan | `clan_liu` | 劉姓 |
| clan | `clan_wu` | 吳姓 |
| clan | `clan_zhang` | 張姓 |
| clan | `clan_li` | 李姓 |
| clan | `clan_liang` | 梁姓 |
| clan | `clan_luo` | 羅姓 |
| clan | `clan_chen` | 陳姓 |
| clan | `clan_huang` | 黃姓 |
| settlement | `settlement_district` | 聚落區塊 |
| settlement | `settlement_market` | 集市 |
| settlement | `settlement_fort` | 堡壘 |
| settlement | `settlement_village` | 村落 |
| settlement | `settlement_building` | 建築物 |
| agriculture | `agriculture_field` | 農田 |
| agriculture | `agriculture_irrigation` | 灌溉設施 |
| agriculture | `agriculture_storage` | 倉儲 |
| symbolic | `symbolic_virtue` | 德行 |
| symbolic | `symbolic_religion` | 宗教 |
| symbolic | `symbolic_prosperity` | 興旺 |
| symbolic | `symbolic_fortune` | 吉祥 |
| symbolic | `symbolic_peace` | 平安 |
| infrastructure | `infrastructure_station` | 驛站 |
| infrastructure | `infrastructure_bridge` | 橋梁 |
| infrastructure | `infrastructure_port` | 港口 |
| infrastructure | `infrastructure_road` | 道路 |

---

## 通用 API 參數規範

### 地區層級參數（新格式，推薦）

所有涉及地區的端點均支持三級行政區的精確參數（優先於 `region_name` 模糊匹配）：

| 參數 | 類型 | 說明 |
|------|------|------|
| `region_level` | string | `city` \| `county` \| `township` |
| `city` | string | 市名（如 `廣州市`） |
| `county` | string | 縣/區名（如 `番禺區`） |
| `township` | string | 鎮/街道名（如 `石樓鎮`） |
| `region_name` | string | 遺留參數，向下兼容 |

### 分頁參數

| 參數 | 默認值 | 說明 |
|------|--------|------|
| `limit` | 20–100 | 每頁條數 |
| `offset` | 0 | 偏移量 |
| `top_k` | 10–100 | 取前 K 條結果 |

### 聚類通用參數

| 參數 | 類型 | 默認值 | 範圍 |
|------|------|--------|------|
| `algorithm` | string | `kmeans` | kmeans \| dbscan \| gmm |
| `k` | int | 5 | 2–20 |
| `eps` | float | — | 0.1–10 |
| `min_samples` | int | — | 1–20 |
| `pca_n_components` | int | 50 | 10–200 |
| `standardize` | bool | true | — |
| `top_n_suffix2` | int | 50 | 10–500 |
| `top_n_suffix3` | int | 30 | 10–500 |

### 統計顯著性標記

| 標記 | p 值範圍 | 含義 |
|------|---------|------|
| `***` | p < 0.001 | 極顯著 |
| `**` | p < 0.01 | 高度顯著 |
| `*` | p < 0.05 | 顯著 |
| `n.s.` | p ≥ 0.05 | 不顯著 |

---

*本文檔描述前端已實現功能，後端算法細節（訓練方法、超參數、技術棧）請對照各節「後端說明」補充。*
