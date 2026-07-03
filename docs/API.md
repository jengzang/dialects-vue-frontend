# API 文檔

> 以前端代碼中的實際 API 組織為準的協作文檔

**文檔語言：** [English](./API.en.md) | 中文

---

## 文檔範圍

本文檔描述的是當前前端倉庫中 `project/src/api` 的實際分層、導入方式與協作規則，而不是後端所有 HTTP 端點的完整枚舉。

如果你是在這個項目內新增功能、補接口、或新增一個獨立頁面模塊，請優先以本文件作為前端 API 組織的準則。

---

## 當前結構總覽

前端 API 代碼位於 `project/src/api/`，目前按「共享認證層 / 主站業務層 / VillagesML 專屬層 / 日誌層」分開：

```text
project/src/api/
├── auth/                  # 登錄、註冊、會話、token、HTTP client
├── main/
│   ├── core/              # 主站核心查詢與音韻分析
│   ├── geo/               # 地點、分區、坐標
│   ├── sql/               # SQL 查詢與修改
│   ├── tools/             # merge / check / jyut2ipa / praat
│   └── user/              # 自定義數據與自定義分區
├── villagesML/            # 自然村分析專屬接口
├── logs/                  # 訪問統計等日誌接口
└── index.js               # 全局統一導出入口
```

對於大部分頁面與組件，建議從 `@/api` 導入，而不是直接在視圖組件裡分散引用深層文件。

```javascript
import {
  searchChars,
  getLocations,
  loginUser,
  ensureAuthenticated,
  getSpatialHotspots
} from '@/api'
```

---

## 導入策略

### 1. 業務頁面默認使用中央導出

`project/src/api/index.js` 是當前倉庫的統一導出面。主站頁面、`VillagesML` 工作區，以及未來新增的獨立模塊，若只是消費 API，優先從這裡導入。

適用場景：

- 視圖頁面
- 業務組件
- composables
- workspace 模塊

### 2. 子入口只在少數情況下直接使用

下面這些子入口仍然存在，主要用於模塊內部整理或新 API 分組開發：

- `project/src/api/auth/index.js`
- `project/src/api/main/core/index.js`
- `project/src/api/main/geo/index.js`
- `project/src/api/main/sql/index.js`
- `project/src/api/main/tools/index.js`
- `project/src/api/main/user/index.js`
- `project/src/api/villagesML/index.js`

如果你在做的是 API 模塊內部重組、編寫新的聚合導出、或需要保持某個子系統相對獨立，才建議直接引用這些子入口。

### 3. 不要在組件裡硬編碼基礎 URL

當前請求統一經過 `project/src/api/auth/httpClient.js` 中的 `api()` 包裝器，底層會基於 `WEB_BASE` 拼接請求地址，並處理：

- token 注入
- token 刷新
- 超時與網絡錯誤
- HTTP 錯誤標準化
- rate limit 提示

因此，組件層不要直接拼 `https://.../api/...`。

---

## 認證層 `auth/`

認證與會話邏輯位於 `project/src/api/auth/`。

### 主要文件

- `auth.js`：會話初始化與 session helper 聚合
- `actions.js`：登錄、註冊、修改資料、退出等業務操作
- `httpClient.js`：統一請求客戶端與錯誤標準化
- `session.js`：token 刷新、用戶初始化、在線時長上報
- `tokenStorage.js`：token / user cache 存取
- `validation.js`：賬號表單驗證

### 主要導出

```javascript
import {
  loginUser,
  registerUser,
  logoutUser,
  updateUsername,
  updatePassword,
  getLeaderboard,
  bootstrapAuthSession,
  ensureAuthenticated,
  waitForAuthReady,
  reportOnlineTime,
  getUserRole,
  validateEmail,
  validateUsername,
  validatePassword,
  validatePasswordMatch
} from '@/api'
```

### 使用建議

- 登錄頁、註冊頁、個人資料頁直接調用 `loginUser` / `registerUser` / `updateUsername` / `updatePassword`
- 需要登錄保護的功能，優先複用既有的認證檢查邏輯，不要自行複寫一套 token 判斷
- 如果是新增子應用或新頁面模塊，需要登錄後才能使用，應複用 `src/api/auth` 與現有的路由守衛思路，而不是重新造一套 auth client

### 典型示例

```javascript
import { ensureAuthenticated, loginUser } from '@/api'

await ensureAuthenticated()

await loginUser({
  username: 'demo',
  password: 'secret'
})
```

---

## 主站業務層 `main/`

`project/src/api/main/` 服務於主站與共用查詢頁面，按能力拆成 5 個子目錄。

### `main/core/`

負責音韻查詢、比較、矩陣分析等核心能力。

常用導出包括：

- `searchChars`
- `searchZhongGu`
- `searchYinWei`
- `searchTones`
- `getCharList`
- `getFeatureCounts`
- `getFeatureStats`
- `getPhonologyMatrix`
- `getPhonologyClassificationMatrix`
- `queryPhonology`
- `postPhoPieByValue`
- `postPhoPieByStatus`
- `compareChars`
- `compareZhongGu`
- `compareTones`

### `main/geo/`

負責地點與地理相關查詢。

常用導出包括：

- `getLocations`
- `getLocationDetail`
- `getLocationPartitions`
- `batchMatch`
- `getPartitions`
- `getRegions`
- `getCoordinates`

### `main/sql/`

負責 SQL 查詢、數據修改與樹形裝載。

常用導出包括：

- `sqlQuery`
- `distinctQuery`
- `getTableColumns`
- `queryCount`
- `mutateSingleRow`
- `batchMutate`
- `batchReplacePreview`
- `batchReplaceExecute`
- `lazyLoadTree`
- `loadFullTree`

### `main/tools/`

負責主站工具頁 API，目前已按工具拆分。

- `merge.js`：字表合併
- `check.js`：字表檢查
- `jyut2ipa.js`：粵拼轉 IPA
- `Praat.js`：Praat 聲學分析

常用導出包括：

- `uploadReference`
- `uploadFiles`
- `executeMerge`
- `getMergeProgress`
- `downloadMerge`
- `uploadCheckFile`
- `analyzeFile`
- `getToneStats`
- `getTableData`
- `updateRow`
- `batchDelete`
- `executeBatchOperation`
- `downloadCheckResult`
- `uploadJyutFile`
- `processJyut2Ipa`
- `getJyut2IpaProgress`
- `downloadJyut2IpaResult`
- `praat`
- `usePraatApi`

### `main/user/`

負責主站用戶自定義數據與分區。

當前主要由以下文件組成：

- `custom-data.js`
- `custom.js`
- `custom-regions.js`

常用導出包括：

- `getAllCustomData`
- `editCustomData`
- `batchCreateCustomData`
- `batchDeleteCustomData`
- `getCustomData`
- `getCustomFeature`
- `submitCustomForm`
- `deleteCustomForm`
- `getCustomRegions`
- `createOrUpdateCustomRegion`
- `deleteCustomRegion`

---

## VillagesML 專屬層 `villagesML/`

`project/src/api/villagesML/` 是自然村機器學習工作區的獨立 API 分組。這一層已經與主站 API 明確分開，後續若新增類似的獨立分析頁面，可以參考這種拆法。

### 當前分組

- `villages.js`：村名搜索與單村詳情
- `characters.js`：字頻、字趨勢、嵌入與顯著性
- `clustering.js`：聚類任務、狀態與快取
- `clusteringTypes.js`：不同聚類算法入口
- `semantic.js`：語義網絡
- `semanticCategories.js`：語義類別與子類別
- `semanticLabels.js`：語義標籤與組合模式
- `semanticComposition.js`：組合統計與 PMI
- `spatial.js`：熱點、空間聚類、整合分析
- `ngrams.js`：N-gram 頻率與模式
- `patterns.js`：結構模式
- `regional.js`：區域聚合與向量比較
- `compute.js`：特徵提取與子集比較
- `metadata.js`：數據庫與表信息
- `regionSimilarity.js`：區域相似度

### 常見導出

```javascript
import {
  searchVillages,
  getGlobalCharFrequency,
  runClustering,
  getSemanticNetwork,
  getSpatialHotspots,
  getRegionSimilarityMatrix,
  extractFeatures,
  aggregateFeatures
} from '@/api'
```

### 分層原則

`VillagesML` 的 API 已經證明：當某個子應用有明確的功能邊界、獨立入口與大量專屬分析能力時，應把接口集中放在 `project/src/api/<ModuleName>/` 下，而不要全部塞回 `project/src/api/main/`。

這也是你未來新增獨立模塊時應優先沿用的方式。

---

## 日誌與輔助導出

### 日誌接口 `logs/`

目前提供：

- `getTodayVisits`
- `getTotalVisits`
- `getVisitHistory`

### URL 參數工具

`project/src/api/index.js` 也轉發了一組 URL 工具，來源是 `project/src/utils/urlParams.js`：

- `decodeParams`
- `buildQueryUrl`
- `copyCurrentUrl`
- `getUrlSegmentValue`

這些不是 HTTP API，但它們被放進了統一導出面，方便查詢頁與分享鏈接功能複用。

---

## 錯誤處理與請求約定

當前前端 API 層已經內建了一套請求約定，新增接口時應保持一致。

### 錯誤處理

`api()` 會把常見異常標準化為帶額外字段的 `Error` 對象，例如：

- `kind`
- `status`
- `data`
- `detail`
- `headers`
- `rawText`

因此，調用端應優先讀取標準化錯誤，而不是自己去拼接原始 `fetch` 響應。

### 認證刷新

請求層會在必要時主動檢查 token 是否接近過期，並嘗試刷新。新增受保護接口時，不需要在每個 API 函數裡重複造輪子。

### 超時與限流

請求層已處理：

- 超時中止
- JSON / text / blob 響應解析
- 429 限流提示與 notice payload 建構

新增 API 時應優先複用現有封裝，而不是直接在頁面裡寫裸 `fetch`。

---

## 新增 API 的協作規則

### 1. 先判斷它屬於哪一層

- 主站共用查詢、工具、地理、SQL、用戶數據：放 `project/src/api/main/`
- 認證、token、session：放 `project/src/api/auth/`
- `VillagesML` 專屬能力：放 `project/src/api/villagesML/`
- 新的獨立子應用：新增 `project/src/api/<ModuleName>/`

### 2. 優先複用既有 auth 能力

如果新模塊需要「登錄後才可使用」，優先複用：

- `project/src/api/auth/`
- 現有 session / token 流程
- 現有路由守衛或頁面守衛思路

不要為單個子項目再複製一套 token storage 或 refresh 邏輯。

### 3. 是否加入 `@/api` 統一導出

- 如果只是子模塊內部臨時使用，可先保留在子目錄入口
- 如果需要跨頁面、跨子系統穩定復用，再加到 `project/src/api/index.js`
- 新增導出前，先確認命名不會與既有函數衝突

### 4. 命名延續當前風格

當前倉庫 API 函數命名以 camelCase 為主，例如：

- `getSpatialHotspots`
- `getRegionSimilarityMatrix`
- `batchCompareRegionalVectors`
- `createOrUpdateCustomRegion`

新增接口時應保持這種命名風格，避免混入與現有風格不一致的命名約定。

---

## 實用示例

### 查詢頁面直接使用統一導出

```javascript
import { searchChars, getLocations } from '@/api'

const locations = await getLocations()
const rows = await searchChars({
  chars: '你好',
  locations: ['廣州'],
  regions: [],
  region_mode: 'full'
})
```

### 新子應用複用既有認證

```javascript
import { ensureAuthenticated, waitForAuthReady } from '@/api'

await waitForAuthReady()
await ensureAuthenticated()
```

### `VillagesML` 模塊使用專屬分析接口

```javascript
import {
  getSemanticNetwork,
  getSpatialHotspots,
  getRegionSimilarityPair
} from '@/api'

const network = await getSemanticNetwork(params)
const hotspots = await getSpatialHotspots(params)
const pair = await getRegionSimilarityPair(params)
```

---

## 與其他文檔的關係

- 整體項目結構：見 [README.md](./README.md) 與 [ARCHITECTURE.md](./ARCHITECTURE.md)
- `VillagesML` 模塊結構：見 `docs/VillagesML/`
- 新增獨立頁面的協作約束：見 [CONTRIBUTING.md](./CONTRIBUTING.md)

如果未來 `PhoneticToolbox` 這類新模塊落地，建議它的 API 也按照本文檔的方式，單獨放入 `project/src/api/PhoneticToolbox/`，並只在需要時接入全局統一導出。
