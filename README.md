# 方音圖鑑 (Chinese Dialect Atlas)

> 中文方言查詢、地理可視化、音系分析、Praat 聲學處理與 VillagesML 自然村機器學習分析平台前端

[![Vue 3](https://img.shields.io/badge/Vue-3.5.20-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.1.3-646CFF?logo=vite)](https://vitejs.dev/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre%20GL-5.16-396CB2)](https://maplibre.org/)

**線上演示：** [https://dialects.yzup.top](https://dialects.yzup.top)

**文檔語言：** [English](./docs/README.en.md) | 中文

---

## 項目概覽

**方音圖鑑**是一個面向語言學研究、中文方言資料整理與地理分析的前端平台。當前倉庫不再是單一 Vue 頁面，而是以 `project/` 為實際前端工程目錄，運行時由以下三部分共同構成：

- `project/src/main`：主站應用，承載查詢、結果、地圖、音系、詞彙、工具、說明等主要功能。
- `project/src/VillagesML`：VillagesML 子應用，承載自然村資料分析與機器學習工作台。
- `project/src/api`、`project/src/components`、`project/src/composables`、`project/src/i18n`、`project/src/layouts`、`project/src/styles`、`project/src/utils`：兩個入口共用的基礎設施層。

這份根 README 是倉庫入口文檔，重點說明當前真實結構、啟動方式、路由語義與文檔入口。更細的架構、API、設計與協作規範分別維護在 `docs/` 中。

---

## 當前功能版圖

### 主站功能

主站主要對應 `/menu/*` 路由族，包含以下能力：

- **音韻查詢**：查字、查中古、查音位、查調。
- **結果展示**：列表、表格與查詢結果整合視圖。
- **地圖可視化**：方言點地理分布、自定義標註、分區查看。支持「補充單點資料」與「製作特徵分布」雙模式的用戶自定義數據錄入，整合小地圖選點定位與地名模糊補全。
- **音系分析**：音系矩陣、自定義音素表、音節統計、音變 / 演化相關頁面。
- **詞彙與語法資料**：語保詞彙、語保語法、陽春口語資料入口。
- **自然村資料入口**：主站中的自然村資料總入口與導航。
- **方言聚類**：面向方言點的聚類分析頁面（包含聚類參數輸入、分析工作流面板與 ECharts 樹狀圖聚類結果展示）。
- **個人中心與頭像自定義**：全新個人中心，支持設置磨砂玻璃、液態玻璃等多種特效與圓形、圓角矩形、水滴形等形狀的自定義頭像，並在全站導航欄自動同步展示。
- **說明與支持**：資料來源、隱私、建議、鳴謝、設置等頁面。支持更新公告彈窗與版本管理。

### Explore 工具區

`/explore/*` 路由族主要承載工具型或資料型頁面，目前包括：

- `check`：字表檢查工具。
- `jyut2ipa`：粵拼轉 IPA 工具。
- `merge`：字表合併工具。
- `praat`：Praat 音頻處理與聲學分析頁面。
- `manage`：表格 / 數據管理頁面。
- `yubao`：語保相關資料頁。
- `char-class`：字符分類與統計分析頁。
- `yc-spoken`：陽春口語資料頁。
- `villages/gd`、`villages/table`、`villages/yc`：自然村樹、表格與陽春自然村相關頁。
- `villages/ml`：主站中的 VillagesML 入口殼頁。

### VillagesML 子應用

`/villagesML/*` 是 VillagesML 子應用的 canonical path。它對應獨立 HTML 入口、獨立 router，以及自己的 workspace 模塊系統。當前主要承載：

- 搜尋探索
- 字符分析
- 語義分析
- 空間分析
- 模式分析
- 區域分析
- ML 計算與聚類工作流

VillagesML 的詳細功能說明請直接閱讀 [VillagesML 功能總覽](./docs/VillagesML/FEATURE_OVERVIEW.md) 與 [VillagesML 使用指南](./docs/VillagesML/USER_GUIDE.md)。

---

## 當前入口與路由語義

### HTML 入口

`project/vite.config.js` 目前定義了 6 個 HTML build input：

| 路徑 | HTML 入口 | 作用 |
| --- | --- | --- |
| `/` | `project/index.html` | 倉庫前端根入口 |
| `/auth` | `project/auth/index.html` | 認證相關入口 |
| `/menu` | `project/menu/index.html` | 主站核心功能入口 |
| `/intro` | `project/intro/index.html` | 介紹 / 說明頁入口 |
| `/explore` | `project/explore/index.html` | Explore 工具入口 |
| `/villagesML` | `project/villagesML/index.html` | VillagesML 子應用入口 |

### 路由語義

當前前端以 path 路由作為頁面身份，推薦按下表理解：

| 路由族 | 當前語義 |
| --- | --- |
| `/` | 首頁 / 根入口 |
| `/menu/*` | 主站核心功能頁 |
| `/explore/*` | 工具頁與資料頁 |
| `/explore/villages/ml` | 主站中的 VillagesML 入口殼頁 / gateway |
| `/villagesML/*` | VillagesML 子應用工作台的 canonical path |
| `/auth*` | 登錄、用戶數據、用戶分區等認證相關頁 |
| `/intro` | 介紹、建議、鳴謝等內容頁 |
| `/praat` | 兼容重定向到 `/explore/tools/praat` |

### Legacy 兼容入口

雖然當前主要頁面身份已經使用 path 路由，但仍保留部分 query 形式入口作為兼容層：

- `/menu?tab=...`
- `/explore?page=...`
- `/villagesML?module=...`

這些 query 形式主要用於 legacy 書籤、舊鏈接或入口轉譯。新增文檔、路由說明或對外引用時，應優先使用 path 形式，而不是再把 query 形式寫成主入口。

---

## 技術棧

### 前端核心

- **Vue 3.5.20**
- **Vue Router 4.5.1**
- **Vite 7.1.x**

### 可視化與交互

- **MapLibre GL 5.16.0**
- **ECharts 5.6.0**
- **wavesurfer.js 7.12.1**

### 數據與工具鏈

- **opencc-js**：繁簡轉換
- **xlsx**：Excel 導入 / 導出
- **@vueuse/core**：組合式工具集
- **Vue I18n 11**：繁中、簡中、英文三語支持

### 驗證與工程化

- **ESLint 9**
- **Prettier 3**
- **Vitest 3**

### 構建與運行時特點

- 多入口 MPA 構建
- `dev-mpa-rewrite` 開發期子路徑重寫
- `manualChunks` 對 `i18n`、`echarts`、`maplibre`、`xlsx`、`wavesurfer`、`logs`、`vue-vendor` 等顯式拆包
- 主站與 VillagesML 共用 API、i18n、layout、樣式與工具層

---

## 倉庫與目錄結構

### 倉庫根目錄

```text
repo-root/
├── README.md                  # 倉庫入口文檔（本文件）
├── docs/                      # 文檔中心
└── project/                   # 實際前端工程
```

### 前端工程主結構

```text
project/
├── index.html
├── auth/index.html
├── menu/index.html
├── intro/index.html
├── explore/index.html
├── villagesML/index.html
├── package.json
├── vite.config.js
└── src/
    ├── main/                  # 主站應用
    ├── VillagesML/            # VillagesML 子應用
    ├── api/                   # 共用 API 層
    ├── components/            # 共用 UI 組件
    ├── composables/           # 共用組合式邏輯
    ├── i18n/                  # 國際化資源
    ├── layouts/               # 共用布局殼
    ├── styles/                # global / main / villagesml 三層樣式
    └── utils/                 # 共用工具函數
```

### `project/src/main` 當前結構

```text
project/src/main/
├── components/
│   ├── geo/
│   ├── map/
│   │   └── custom-entry/   # 用戶自定義數據錄入組件群
│   ├── pho/
│   │   └── PhoneticCompare.vue # 獨立音值比較結果展示組件
│   ├── popup/
│   │   └── SupportPopup.vue    # 贊助支持彈窗
│   ├── praat/
│   ├── query/
│   ├── result/
│   ├── tutorial/
│   ├── user/
│   │   └── auth/               # 頭像自定義與用戶資訊組件
│   └── TableAndTree/
├── config/
│   ├── BarAndTabs/
│   └── chars_positions/
├── router/
├── store/
├── utils/
└── views/
    ├── entry/
    ├── explore/
    ├── intro/
    └── menu/
        └── cluster/            # 方言聚類模組工作台與 Workspace 邏輯
```

### `project/src/VillagesML` 當前結構

```text
project/src/VillagesML/
├── app/
├── components/
├── config/
├── dashboard/
├── store/
└── workspace/
    └── modules/
```

### API 與樣式分層

```text
project/src/api/
├── auth/
├── logs/
├── main/
│   ├── core/
│   ├── geo/
│   ├── sql/
│   ├── tools/
│   └── user/
└── villagesML/

project/src/styles/
├── global/
├── main/
└── villagesml/
```

這代表當前代碼庫已經不是早期那種把全部頁面與共用邏輯平鋪在 `src/views` 或單一 `router.js` 下面的結構。閱讀或修改代碼時，應先判斷自己是在改：

- 主站私有層
- VillagesML 私有層
- 兩邊共用的共享層

---

## 快速開始

### 環境要求

- `Node.js >= 18`
- `npm >= 9`

### 安裝依賴

所有日常命令都應在 `project/` 目錄下執行：

```bash
git clone <repository-url>
cd dialects-vue-frontend/project
npm install
```

### 本地開發

```bash
# 默認開發模式
npm run dev

# 使用 web 模式啟動
npm run dev:web
```

說明：

- `npm run dev` 走 Vite development 模式，`VITE_WEB_BASE` 默認回退到 `http://127.0.0.1:5000`。
- `npm run dev:web` 使用 `web` mode，`WEB_BASE` 走空字串配置，更接近線上部署方式。
- 開發服務啟動後，默認訪問地址為 `http://localhost:5173`。

### 構建與預覽

```bash
npm run build
npm run preview
```

### 代碼檢查與測試

```bash
npm run lint
npm test
npm run format
npm run i18n:extract
```

說明：

- `npm run lint`：檢查 `src` 下的 `.js` / `.vue` 文件。
- `npm test`：運行 Vitest。
- `npm run format`：用 Prettier 檢查格式。
- `npm run i18n:extract`：檢測多語文案缺失或未使用 key。

### 部署命令

```bash
npm run deploy
npm run deploy:ps
```

部署細節、服務器同步策略與環境要求請閱讀 [部署說明](./project/DEPLOY.md)。

---

## 當前開發與維護要點

### 1. 所有命令在 `project/` 下執行

倉庫根目錄主要承載 README、docs 與協作資料，不是前端工程根。安裝、啟動、構建、測試、部署都應在 `project/` 目錄下進行。

### 2. path 路由優先於 query 路由

當前頁面身份應優先使用：

- `/menu/query/zhonggu`
- `/explore/tools/praat`
- `/explore/villages/ml`
- `/villagesML/...`

而不是把 `/menu?tab=...` 或 `/explore?page=...` 當作新的主文檔入口。

### 3. 主站接線與 VillagesML 接線是兩層事情

如果修改 VillagesML 相關功能，需要分清楚：

- 主站 Explore 中的入口頁
- 主站 router 的橋接層
- VillagesML 子應用自己的 router / workspace

不要把“主站能跳過去”誤認為“子應用本身的 canonical path 定義”。

### 4. 共享層修改需要特別謹慎

以下目錄通常同時服務主站與 VillagesML：

- `project/src/api`
- `project/src/components`
- `project/src/composables`
- `project/src/i18n`
- `project/src/layouts`
- `project/src/styles`
- `project/src/utils`

修改這些目錄前，應先確認影響面，避免把主站私有需求誤寫進共享層。

### 5. 文檔維護以中文版本為主

當前文檔維護策略是：

- 中文文檔作為主要維護版本
- 英文文檔跟隨中文同步
- 結構變更時，優先更新 `README / ARCHITECTURE / CONTRIBUTING`

---

## 更新日誌

### v1.x 时期（原生 JavaScript，2025-09 ~ 2026-01）

#### v1.0.0 (2025-09-01)
- 項目初始化
- 基於原生 JavaScript 的基礎查詢功能
- 登錄、鳴謝頁面

#### v1.1.0 (2025-09-02 ~ 2025-09-04)
- 新查詢界面
- 地點分區輸入重構

#### v1.2.0 (2025-12-25 ~ 2026-01-11)
- 輸入地點分區優化
- 中古、音位查詢界面

---

### v2.x 时期（Vue 框架重構，2026-01-13 ~ 2026-01-25）

#### v2.0.0 (2026-01-13 ~ 2026-01-16)
- 完全遷移到 Vue 3 框架
- 中古、音位結果顯示界面
- 底圖設置
- 地圖顯示功能
- 陽春自然村顯示

#### v2.1.0 (2026-01-16 ~ 2026-01-22)
- 表格組件（UniversalTable）
- 表格添加、編輯、刪除功能
- 自定義添加右側面板

#### v2.2.0 (2026-01-23)
- 批量編輯功能
- SimpleLayout 佈局
- 工具頁面

---

### v3.x 时期（功能擴展期，2026-01-26 ~ 2026-02）

#### v3.0.0 (2026-01-26 ~ 2026-01-27)
- 引入工具、詞句、音系等多種功能
- 字表工具：
  - 字表檢查
  - 字表合併
  - 粵拼轉 IPA

#### v3.1.0 (2026-01-30)
- 自然村數據展示
- 中古漢字樹狀圖
- 地圖彈窗功能
- 資料來源、隱私界面

#### v3.2.0 (2026-02-01 ~ 2026-02-03)
- 語保卡片、表格模式
- 當前字表總數顯示
- 頁面可見性在線時長記錄

#### v3.3.0 (2026-02-04 ~ 2026-02-05)
- 音系查詢功能
- 音節統計功能
- 音素統計功能
- 用戶批量數據管理
- 地名彈窗

#### v3.4.0 (2026-02-06)
- 語保地圖（支持 10,000+ 標記）
- 地圖點聚類優化
- 用戶統計增加「查音系」

#### v3.5.0 (2026-02-07 ~ 2026-02-08)
- Praat 前端初步
- 語保緩存機制
- 全局狀態管理
- 音系音素界面參數查詢

#### v3.6.0 (2026-02-09)
- API 接口統一管理
- Praat 功能擴展：
  - 元音空間圖
  - 元音點圖
  - 手動分段支持
  - 頻譜圖
  - 石峰 T 值法
- Check 工具性能優化

#### v3.7.0 (2026-02-10 ~ 2026-02-12)
- 石峰 T 值法導出 Excel
- 元音空間提示
- 排行榜功能
- HelpIcon 組件
- 用戶與遊客對比提示

#### v3.8.0 (2026-02-14)
- 組件架構重構（tabsConfig 抽離）
- ExploreBar 功能
- 每行查聲韻調功能

#### v3.9.0 (2026-02-15 ~ 2026-02-17)
- 音頻預覽交互優化
- 元音空間界面改進（開關和 toggle）
- 用戶選擇地點填入功能
- 選擇數量顯示（sessionStorage）
- 雙向綁定完善（彈窗刪除輸入框內容）
- Auth 組件重構

#### v3.10.0 (2026-02-18)
- 分區管理頁面

#### v3.11.0 (2026-02-19)
- 完整的中英文文檔系統
- 詳細的功能介紹和使用指南
- 架構文檔、API 文檔、設計系統文檔

---

### v4.x 时期（VillagesML 系統上線，2026-03 ~ 至今）

#### v4.0.0 (2026-03-01)
- VillagesML 自然村機器學習分析系統上線
- 7 大分析模組：
  - 搜尋探索
  - 字符分析
  - 語義分析
  - 空間分析
  - 模式分析
  - 區域分析
  - ML 計算
- 285,860 條自然村地名數據
- Mock 數據重構（移除所有 mock，使用真實 API）
- API 架構完善（14 個 VillagesML API 模塊）
- 區域向量比較功能（支持跨層級）

#### v4.0.5 (2026-03-03)
- 合併 master 分支，統一版本歷史
- 補充部署文檔與 VillagesML 功能總覽
- 持續整理組件、store、views 與工具目錄，為後續結構重整鋪路

#### v4.1.0 (2026-03-06)
- 增加首頁
- 新增漢字、中古、調類比較功能
- 補充更新提示、導航與比較頁相關基礎組件

#### v4.2.0 (2026-03-24)
- 後端重構對接
- 重整目錄結構
- 新增多語言支持（繁中、簡中、英文）
- 補上 ESLint、Vitest、i18n 相關工程能力

#### v4.4.0 (2026-04-03)
- 新增單點演變分析
- 新增漢字地位樹狀圖
- 正式拆分 `main` 主站與 `VillagesML` 子應用入口
- 重構 API、router、styles 與主站 / 子應用目錄版圖

#### v4.4.2 (2026-04-11)
- 完善路由與彈窗體系
- 增強認證恢復、查詢限制與分區選擇邏輯
- 持續優化音系演變頁體驗
- 補充 OpenSpec 與自動化測試基線

#### v4.4.3 (2026-04-14)
- 修復已知 Bug
- 抽取 composables
- 深化文檔體系，重寫 README、ARCHITECTURE、USER_GUIDE、API、DESIGN_SYSTEM、CONTRIBUTING
- 進一步清理共享樣式、路由兼容與 VillagesML 開發入口問題

#### v4.5.0 (2026-04-16)
- 支持中古、上古、洪武正韻等 6 份字集切換
- 統一支持彈窗與致謝入口
- 持續修復 Praat、音系演變、語義 / 空間 / 區域分析等已知問題
- 補充字符表切換、任務進度與風險控制相關測試

#### v4.6.0 (2026-06-07 / 當前開發中)
- **方言聚類分析工作流**：新增可視化聚類分析工作台，支持聚類參數輸入、任務狀態監控與 ECharts 樹狀圖聚類結果展示。
- **用戶自定義數據錄入**：上線全新錄入系統，支持「補充單點資料」與「製作特徵分布」雙模式，集成小地圖選點與地名模糊搜索補全。
- **個人中心與頭像自定義**：支持設置磨砂玻璃、液態玻璃等多種特效與圓形、圓角矩形、水滴形等形狀的自定義頭像，並在全站導航欄自動同步展示。
- **音值比較重構**：重構音值比較功能，拆分出獨立的結果展示組件，優化桑基圖（Sankey）渲染與多地點對比。
- **更新提示機制**：新增首頁更新公告彈窗與版本管理，第一時間向用戶推送更新日誌。
- **測試體系建設**：為聚類分析等模組補全了單元測試基線。

### 版本階段概覽

- **v1.x**：原生 JavaScript 實現（2025-09 ~ 2026-01）
- **v2.x**：Vue 3 框架重構（2026-01-13 ~ 2026-01-25）
- **v3.x**：功能擴展期，引入工具、詞句、音系、Praat 等核心能力（2026-01-26 ~ 2026-02）
- **v4.x**：VillagesML 系統上線，並逐步演進為主站 + 子應用 + 共享基礎層的多入口結構（2026-03 ~ 至今）

### 主要功能里程碑

1. **v2.0.0**：Vue 3 框架重構
2. **v3.0.0**：工具系統（字表檢查、合併、粵拼轉 IPA）
3. **v3.3.0**：音系分析系統（音系查詢、音節統計、音素統計）
4. **v3.4.0**：語保地圖（10,000+ 標記支持）
5. **v3.5.0**：Praat 音頻分析
6. **v3.6.0**：API 統一管理與 Praat 功能完善
7. **v3.8.0**：ExploreBar 與每行查聲韻調
8. **v3.11.0**：完整文檔系統
9. **v4.0.0**：VillagesML 自然村機器學習分析系統
10. **v4.2.0**：目錄重整與多語言支持
11. **v4.4.0**：單點演變分析、漢字地位樹狀圖與主站 / 子應用結構拆分
12. **v4.5.0**：多字集切換與當前一輪穩定性修復
13. **v4.6.0**：方言聚類工作流、用戶自定義數據錄入、頭像自定義與音值比較重構

---

## 文檔導航

### 倉庫入口文檔

- [根 README](./README.md)
- [文檔中心](./docs/README.md)
- [Documentation Center](./docs/README.en.md)

### 核心技術文檔

- [架構文檔](./docs/ARCHITECTURE.md)
- [API 文檔](./docs/API.md)
- [用戶指南](./docs/USER_GUIDE.md)
- [設計系統](./docs/DESIGN_SYSTEM.md)
- [貢獻指南](./docs/CONTRIBUTING.md)

### VillagesML 專題文檔

- [VillagesML 功能總覽](./docs/VillagesML/FEATURE_OVERVIEW.md)
- [VillagesML 使用指南](./docs/VillagesML/USER_GUIDE.md)

### 其他重要文檔

- [部署說明](./project/DEPLOY.md)
- [i18n 說明](./project/src/i18n/README.md)

---

## 相關倉庫

- 前端：[https://github.com/jengzang/dialects-vue-frontend](https://github.com/jengzang/dialects-vue-frontend)
- 後端：[https://github.com/jengzang/dialects-backend](https://github.com/jengzang/dialects-backend)
- 數據預處理：[https://github.com/jengzang/dialects-build](https://github.com/jengzang/dialects-build)

---

## 貢獻與協作

當前倉庫對文檔、結構與變更邊界的要求比較嚴格。開始修改前，建議至少閱讀：

- [貢獻指南](./docs/CONTRIBUTING.md)
- 根目錄 `AGENTS.md`

協作時尤其要注意：

- 優先做最小、必要、可審查的修改
- 不要把舊路由語義或舊目錄假設寫回現狀
- 路由、文檔、配置與中文文本修改後要做 diff 自查

---

## 許可證與支持

**許可證：** ISC License

**問題反饋：** [GitHub Issues](https://github.com/jengzang/dialects-vue-frontend/issues)

**聯繫方式：**

- 電子郵件：jengzang@outlook.com
- 知乎：[https://www.zhihu.com/people/da-shu-18-11](https://www.zhihu.com/people/da-shu-18-11)
