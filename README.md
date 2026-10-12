# 方音圖鑑 (Chinese Dialect Atlas)

> 中文方言查詢與對比、音系探索、詞表協作、聲學分析及自然村資料研究平台前端

[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vite.dev/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre%20GL-5-396CB2)](https://maplibre.org/)

**線上使用：** [dialects.yzup.top](https://dialects.yzup.top)

方音圖鑑面向中文方言資料查詢、整理與研究。可以從漢字、韻書地位、音值或調類出發，查看各地方言的讀音與地理分佈，對比音類分合；也可以深入整理單點音系、協作維護詞表、分析錄音，或探索廣東自然村的方言與村名資料。

本倉庫是前端工程，實際工程目錄為 `project/`。查詢、賬戶、資料存取及聲學計算等功能需要配合[後端](https://github.com/jengzang/dialects-backend)使用。

## 功能與教程

以下分類與順序沿用站內教程目錄。點擊功能名稱可閱讀對應教程；在線上頁面也可使用「教程」按鈕查看操作說明，部分查詢與比較頁提供骰子按鈕填入體驗示例。

### 多方言點對比分析

**查詢**

| 功能 | 用途 |
| --- | --- |
| [查字](./project/src/main/components/tutorial/content/zh-Hant/menu-query-char.md) | 輸入漢字和地點，查看各地方言的具體讀音，並在地圖上觀察分佈。 |
| [查中古](./project/src/main/components/tutorial/content/zh-Hant/menu-query-zhonggu.md) | 按韻書地位選出漢字，整理各地的聲母、韻母或聲調反映；可繼續細分條件、查看統計與字例。 |
| [查音位](./project/src/main/components/tutorial/content/zh-Hant/menu-query-yinwei.md) | 從實際音值出發，反查其中古來源分佈，探索音類合流與分化。 |
| [查調](./project/src/main/components/tutorial/content/zh-Hant/menu-query-tone.md) | 查看各地聲調系統，以表格和地圖展示調值及調類歸併情況。 |

**比較**

| 功能 | 用途 |
| --- | --- |
| [比較漢字](./project/src/main/components/tutorial/content/zh-Hant/menu-compare-char.md) | 比較兩個漢字在各地的聲母、韻母或聲調是否相同，以地圖顏色呈現異同。 |
| [比較中古](./project/src/main/components/tutorial/content/zh-Hant/menu-compare-zhonggu.md) | 比較兩組中古條件在各地的讀音分佈重疊程度，觀察歷史音類的分合。 |
| [比較調類](./project/src/main/components/tutorial/content/zh-Hant/menu-compare-tone.md) | 比較兩個調類在各地是否合流，查看區域性的調類歸併現象。 |
| [音值比較](./project/src/main/components/tutorial/content/zh-Hant/menu-compare-phonetic.md) | 以同一批漢字為錨點，比較 2 至 5 個方言點的聲母、韻母或聲調對應；桑基圖節點和連線可查看具體字例。 |

**地圖與結果**

| 功能 | 用途 |
| --- | --- |
| [方言地圖](./project/src/main/components/tutorial/content/zh-Hant/menu-map-view.md) | 承接查詢和比較結果，展示空間分佈，支持點位詳情、地名標籤、底圖切換與全屏查看。 |
| [分區繪圖](./project/src/main/components/tutorial/content/zh-Hant/menu-map-divide.md) | 直接繪製方言點或分區，以分區著色觀察地理分佈。 |
| [結果頁](./project/src/main/components/tutorial/content/zh-Hant/menu-result.md) | 承接查詢與比較結果，提供音值篩選、細分查詢、統計、字例與地點詳情。 |

此外，主站提供 `/menu/cluster` 方言聚類工作台，可配置分析參數、管理任務並查看結果；目前尚未列入教程目錄。

### 單方言點深入探索

**音系分析**

| 功能 | 用途 |
| --- | --- |
| [音系矩陣](./project/src/main/components/tutorial/content/zh-Hant/menu-pho-matrix.md) | 以完整音系表展示聲韻調拼合關係，點擊單元格查看音節字例；支持查詢多個地點。 |
| [音素查詢](./project/src/main/components/tutorial/content/zh-Hant/menu-pho-custom.md) | 自選橫向、縱向與格內三個分類維度，重新整理聲母、韻母或聲調資料。 |
| [音節統計](./project/src/main/components/tutorial/content/zh-Hant/menu-pho-count.md) | 查看聲母、韻母、聲調的頻率與分佈；既可瀏覽全量圖表，也可選擇最多 100 個地點查看匯總和逐點明細。 |
| [演化](./project/src/main/components/tutorial/content/zh-Hant/menu-pho-evolution.md) | 分析單個方言點的今音與韻書地位對應，用餅圖、桑基圖從「按今音」或「按地位」兩個方向查看來源與分化。 |

### 詞句與字集

**詞表**

| 功能 | 用途 |
| --- | --- |
| [詞表展示](./project/src/main/components/tutorial/content/zh-Hant/menu-vocabulary-view.md) | 公開瀏覽協作者提交的詞表，按標準詞、方言詞、音標、釋義、地點或行政區劃檢索，支持卡片、地圖、表格展示。 |
| [導入詞表](./project/src/main/components/tutorial/content/zh-Hant/menu-vocabulary-import.md) | 申請權限後填寫地點資訊，導入 Excel 或按指定格式整理的文檔，預覽確認後提交。 |
| [管理詞表](./project/src/main/components/tutorial/content/zh-Hant/menu-vocabulary-manage.md) | 在線增刪詞條、批量編輯與替換、更新地點資訊；編輯權限只能修改自己提交的詞條，管理權限可查看編輯日誌和回滾。 |

**語保詞句**

[語保詞句](./project/src/main/components/tutorial/content/zh-Hant/explore-yubao.md)展示中國語言資源保護工程的詞彙與語法例句，支持卡片、表格、地圖三種模式，可搜索、排序、篩選，並查看各地方言的說法、發音與注釋。

**字集**

[漢字字集](./project/src/main/components/tutorial/content/zh-Hant/explore-char-class.md)按音韻地位逐級展開漢字，可調整分類層級和順序、搜尋節點、查看廣韻注釋。設定中可切換中古、上古、近古、粵韻等字集；不同字集的可選分類不同，中古廣韻最為穩定。

### 實用工具

**Praat 聲學分析**

聲學計算由後端基於 `praat-parselmouth` 提供，網頁端支持桌面與移動端操作。

| 功能 | 用途 |
| --- | --- |
| [上傳音頻](./project/src/main/components/tutorial/content/zh-Hant/explore-praat-upload.md) | 上傳音頻或直接錄音，在波形中截取片段，選擇單音節或連續語流模式及分析模組。 |
| [分析結果](./project/src/main/components/tutorial/content/zh-Hant/explore-praat-results.md) | 查看基頻、強度、共振峰、頻譜圖、音質與音段等分析結果。 |
| [母音空間](./project/src/main/components/tutorial/content/zh-Hant/explore-praat-vowelspace.md) | 使用 F1/F2 共振峰繪製母音空間與滑動軌跡，可選擇片段並與參考母音對照。 |
| [基頻定調](./project/src/main/components/tutorial/content/zh-Hant/explore-praat-pitchtone.md) | 在音高曲線上框選樣本、按調類整理，用石鋒 T 值法進行五度制標調，並導出 Excel。 |

**字表工具**

| 功能 | 用途 |
| --- | --- |
| [字表檢查](./project/src/main/components/tutorial/content/zh-Hant/explore-check.md) | 檢查非單字、異常音標、缺聲調等問題；查看音類統計，在線修正或批量替換後下載。 |
| [粵拼轉 IPA](./project/src/main/components/tutorial/content/zh-Hant/explore-jyut2ipa.md) | 批量將 Excel 中的粵拼轉為 IPA，可自定義轉換規則，導入、導出及保存規則。 |
| [字表合併](./project/src/main/components/tutorial/content/zh-Hant/explore-merge.md) | 按默認或自定義參考表對齊多份字表，合併讀音與注釋後下載。 |

**地圖繪製**

[地圖繪製](./project/src/main/components/tutorial/content/zh-Hant/menu-map-draw.md)位於 `/explore/gis`，可在線編輯點、線、面與文字，管理圖層、屬性和資料表，編輯頂點與精確坐標，使用吸附、共享邊界、幾何運算及質量檢查工具。支持導入 GeoJSON、JSON、KML、KMZ、CSV，載入行政區劃與河流水系，利用方言點生成泰森多邊形，導出 GeoJSON 或 PNG，並保存本地草稿。

教程目錄以外，`/explore/manage` 提供管理員專用的資料表管理工具。字表推導頁 `/explore/tools/derive` 目前僅為佔位，功能尚未實現。

### 自然村

**廣東自然村**

| 功能 | 用途 |
| --- | --- |
| [廣東自然村樹狀圖](./project/src/main/components/tutorial/content/zh-Hant/explore-villages-gd.md) | 按市、區縣、鄉鎮、行政村、自然村逐級瀏覽，查看方言分佈和坐標，將節點所屬村落繪製到地圖。 |
| [廣東自然村表格](./project/src/main/components/tutorial/content/zh-Hant/explore-villages-table.md) | 搜尋、排序、篩選和分頁查看村落及方言資料；管理員另有編輯與導出能力。 |

**村名機器學習**

[村名機器學習](./project/src/main/components/tutorial/content/zh-Hant/villagesML.md)（VillagesML）目前面向廣東自然村名，提供村名搜尋、字頻分析、語義分析、空間分析、N-gram 與命名模式分析、區域比較、機器學習計算及系統資訊。主站入口為 `/explore/villages/ml`，獨立工作區使用 `/villagesML/gd`。

### 陽春相關

**陽春口語**

[陽春口語](./project/src/main/components/tutorial/content/zh-Hant/explore-yc-spoken.md)位於 `/explore/yc/words`，以表格展示本字考、IPA 讀音、粵拼、詞性、釋義及例詞例句。

另有 `/explore/yc/villages` 陽春自然村資料頁，目前尚未列入教程目錄。

### 賬戶與個人數據

**賬戶管理**

| 功能 | 用途 |
| --- | --- |
| [登入](./project/src/main/components/tutorial/content/zh-Hant/auth-login.md) | 免費註冊，使用郵箱或使用者名稱登入，使用需要賬戶的功能。 |
| [賬戶總覽](./project/src/main/components/tutorial/content/zh-Hant/auth-overview.md) | 查看賬戶資訊與查詢統計，進入資料修改、個人數據和分區管理。 |

個人資料修改頁亦提供頭像自定義，可設定文字、形狀與外觀效果。

**個人數據**

| 功能 | 用途 |
| --- | --- |
| [自定地圖](./project/src/main/components/tutorial/content/zh-Hant/menu-map-custom.md) | 補充私人方言點或特徵資料，按調查點或方言特徵整理並繪圖；資料與賬戶綁定，僅本人可見。 |
| [我的數據](./project/src/main/components/tutorial/content/zh-Hant/auth-data.md) | 統一管理自己上傳的自定義方言資料，支持批量新增、編輯、刪除。 |
| [自定義分區](./project/src/main/components/tutorial/content/zh-Hant/auth-regions.md) | 建立和管理自己的分區方案，用於地點搜尋和地圖區域篩選。 |

## 使用條件與資料來源

- **公開瀏覽**：協作詞表展示無需登入；查詢功能的地點數量等限制以頁面提示為準。
- **需要登入**：Praat、字表檢查、粵拼轉 IPA、字表合併、語保詞句、個人數據與自定義分區；VillagesML 的 ML 計算也需登入。
- **需要申請權限**：導入和編輯詞表需聯繫站長申請；編輯與管理權限的範圍不同。
- **方言字表**：各點資料來源及字表資訊可在站內資料來源頁與地點詳情中查看。文白讀標記取決於原字表是否提供相應資訊。
- **詞句資料**：包括協作者提交的詞表、中國語言資源保護工程資料及陽春口語資料。
- **廣東自然村方言資料**：來自《全粵村情》，由站長錄入，可能存在行政區劃對應、調查精確度與人工錄入誤差。

功能操作與限制詳見各篇教程；資料來源頁為 `/menu/source`。

## 最新更新

更新資訊以 [`project/src/utils/user/updateNoticeConfig.js`](./project/src/utils/user/updateNoticeConfig.js) 為準。該檔案目前保存最新一版公告，以下保留公告原文，不另行推定歷史版本。

**版本：v5.2.1 · 更新日期：2026-10-01 · 資料庫版本：2026-09-30**

- 🗂️ **增加查注釋功能**：支持通過注釋或音標檢索字表
- 📖 **詞表展示優化、支持導出**：增加詞表方言點詳情展示（包含調值、行政區劃等信息），支持導出詞表為Excel文件，方便用戶在線編輯後與本地同步。
- 👀 **優化用戶體驗**：增加頁腳導航欄、建議反饋入口、網站功能檢索、快速分享等。

## 本地開發

### 環境與啟動

- Node.js `^20.19.0 || >=22.12.0`（Vite 7 要求）。
- 日常命令均在 `project/` 下執行，並使用工程現有依賴。倉庫協作規範禁止代理自動安裝依賴，詳見 [AGENTS.md](./AGENTS.md)。

```bash
cd project
npm run dev
```

`dev` 使用 development 模式。未設定 `VITE_WEB_BASE` 時，會循環探測本機 `127.0.0.1:5000-5049` 的 `/__ping`，直到找到後端；需先啟動本地後端，或明確指定後端地址：

```bash
VITE_WEB_BASE=https://dialects.yzup.top npm run dev
```

也可使用 web 模式，將 API 基址設為空字串，由 Vite 代理指定 API 路徑到線上後端：

```bash
npm run dev:web
```

開發地址以終端輸出為準，默認為 `http://localhost:5173`。

### 構建、預覽與檢查

```bash
npm run build
npm run preview
npm test
npm run lint
npm run format
npm run i18n:extract
```

`build` 先執行 `seo:sitemap` 更新 `project/public/sitemap.xml`，再打包。`test` 運行 Vitest，`lint` 檢查 JS/Vue，`format` 使用 Prettier 檢查格式，`i18n:extract` 生成多語文案檢查報告。

部署腳本為 `npm run deploy`（Bash）與 `npm run deploy:ps`（PowerShell）。它們會構建並上傳到腳本配置的服務器；使用前需核對部署目標與 SSH 配置，參見[部署說明](./docs/DEPLOY.md)。

## 技術與工程結構

核心為 Vue 3、Vue Router 4、Vite 7 與 Vue I18n 11；地圖使用 MapLibre GL、Mapbox Draw 和 Turf，圖表使用 ECharts，音頻波形使用 wavesurfer.js，表格處理使用 xlsx。樣式採用 SCSS，測試使用 Vitest。依賴版本以 [`project/package.json`](./project/package.json) 與鎖檔為準。

```text
dialects-vue-frontend/
├── README.md
├── docs/                      # 技術文檔與專題資料
└── project/                   # 前端工程
    ├── package.json
    ├── vite.config.js
    ├── public/                # 靜態資料與教程圖片
    ├── scripts/               # sitemap 等工程腳本
    ├── tests/                 # Vitest 與瀏覽器驗證資料
    └── src/
        ├── main/              # 主站頁面、路由與站內教程
        ├── VillagesML/        # 村名分析子應用
        ├── api/               # 共用 API
        ├── components/        # 共用組件
        ├── composables/       # 共用組合式邏輯
        ├── i18n/              # 繁中、簡中與英文資源
        ├── layouts/           # 共用布局
        ├── seo/               # SEO 與站點路由配置
        ├── styles/            # global / main / villagesml 樣式
        └── utils/             # 共用工具與更新公告配置
```

### 入口與路由

Vite 目前構建 **5 個 HTML 入口**：

| HTML 入口 | 用途 |
| --- | --- |
| `project/index.html` | 首頁 |
| `project/menu/index.html` | 查詢、比較、音系、詞表等主站頁面 |
| `project/explore/index.html` | 工具與專題資料 |
| `project/auth/index.html` | 賬戶與個人數據 |
| `project/villagesML/index.html` | VillagesML 獨立工作區 |

主站頁面使用語言前綴 `/zh-Hant`、`/zh-CN`、`/en`，例如 `/zh-Hant/menu/query/char`。本文省略語言前綴的主站路徑表示功能路徑；無語言前綴的主站入口會轉到相應語言版本。

常用功能路徑包括 `/menu/query/*`、`/menu/compare/*`、`/menu/pho/*`、`/menu/vocabulary/*`、`/menu/yubao`、`/explore/tools/praat`、`/explore/gis` 與 `/explore/yc/words`。介紹頁為 `/menu/about/intro`，並無獨立 `intro/index.html` 構建入口。

VillagesML 的 `/villagesML/gd` 使用資料集路徑，`module`、`subtab` 等 query 參數保存工作區內部狀態。主站 `/explore/villages/ml` 展示其入口面板。

保留 `/menu?tab=...`、`/explore?page=...` 等舊入口轉譯，以及 `/menu/map/draw` → `/explore/gis`、`/explore/yubao` → `/menu/yubao`、`/explore/yc-spoken` → `/explore/yc/words` 等兼容跳轉；新書籤與文檔應使用當前功能路徑。

## 文檔與相關倉庫

- [站內教程原文](./project/src/main/components/tutorial/content/zh-Hant) · [簡體中文教程](./project/src/main/components/tutorial/content/zh-CN)
- [文檔中心](./docs/README.md) · [英文文檔中心](./docs/README.en.md)
- [架構文檔](./docs/ARCHITECTURE.md) · [API 文檔](./docs/API.md) · [設計系統](./docs/DESIGN_SYSTEM.md)
- [VillagesML 功能總覽](./docs/VillagesML/FEATURE_OVERVIEW.md) · [VillagesML 使用指南](./docs/VillagesML/USER_GUIDE.md)
- [部署說明](./docs/DEPLOY.md) · [i18n 說明](./project/src/i18n/README.md)
- [貢獻指南](./docs/CONTRIBUTING.md) · [倉庫協作規範](./AGENTS.md)
- [前端倉庫](https://github.com/jengzang/dialects-vue-frontend) · [後端倉庫](https://github.com/jengzang/dialects-backend) · [數據預處理倉庫](https://github.com/jengzang/dialects-build)

## 許可證與支持

程式碼採用 [MIT License](./LICENSE)。

問題反饋：[GitHub Issues](https://github.com/jengzang/dialects-vue-frontend/issues)

聯繫方式：jengzang@outlook.com · [知乎](https://www.zhihu.com/people/da-shu-18-11)
