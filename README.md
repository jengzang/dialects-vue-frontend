# 方音圖鑑 (Chinese Dialect Atlas)

> 中文方言查詢與對比、音系探索、詞表協作、聲學分析及自然村資料研究平台前端

[![Vue 3](https://img.shields.io/badge/Vue-3-4FC08D?logo=vue.js)](https://vuejs.org/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?logo=vite)](https://vite.dev/)
[![MapLibre GL](https://img.shields.io/badge/MapLibre%20GL-5-396CB2)](https://maplibre.org/)

**線上使用：** [dialects.yzup.top](https://dialects.yzup.top)

方音圖鑑面向中文方言資料查詢、整理與研究。可以從漢字、韻書地位、音值或調類出發，查看各地方言的讀音與地理分佈，對比音類分合；也可以深入整理單點音系、協作維護詞表、分析錄音，或探索廣東自然村的方言與村名資料。

本倉庫是前端工程，實際工程目錄為 `project/`。查詢、賬戶、資料存取及聲學計算等功能需要配合[後端](https://github.com/jengzang/dialects-backend)使用。

## 文檔與相關倉庫

- [站內教程原文](./project/src/main/components/tutorial/content/zh-Hant) · [簡體中文教程](./project/src/main/components/tutorial/content/zh-CN)
- [文檔中心](./docs/README.md) · [英文文檔中心](./docs/README.en.md)
- [架構文檔](./docs/ARCHITECTURE.md) · [API 文檔](./docs/API.md) · [設計系統](./docs/DESIGN_SYSTEM.md)
- [VillagesML 功能總覽](./docs/VillagesML/FEATURE_OVERVIEW.md) · [VillagesML 使用指南](./docs/VillagesML/USER_GUIDE.md)
- [部署說明](./docs/DEPLOY.md) · [i18n 說明](./project/src/i18n/README.md)
- [貢獻指南](./docs/CONTRIBUTING.md) · [倉庫協作規範](./AGENTS.md)
- [前端倉庫](https://github.com/jengzang/dialects-vue-frontend) · [後端倉庫](https://github.com/jengzang/dialects-backend) · [數據預處理倉庫](https://github.com/jengzang/dialects-build)

## 功能與教程

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

## 更新歷史

各版本以一句話概括主要更新，版本號與日期完整保留；點擊版本號可查看來源。v4.2.0 起以 [`updateNoticeConfig.js`](./project/src/utils/user/updateNoticeConfig.js) 及其 Git 歷史公告為準（包含舊配置路徑），最新版本採用當前配置；公告沿用的內容保留在對應版本概述中。更早版本依據 `main` 的版本提交整理，日期採對應提交日期。

| 版本與來源 | 日期 | 更新概述 |
| --- | --- | --- |
| [v5.2.1](./project/src/utils/user/updateNoticeConfig.js) | 2026-10-01 | 新增注釋與音標檢索、詞表詳情與 Excel 導出，並完善頁腳導航、反饋、功能檢索與快速分享。 |
| [v5.2.0](https://github.com/jengzang/dialects-vue-frontend/blob/b45a714a32f2dd0b647f5c8b070ba06aefb6338f/project/src/utils/user/updateNoticeConfig.js) | 2026-09-30 | 新增注釋與音標檢索、詞表詳情與 Excel 導出，並完善頁腳導航、反饋、功能檢索與快速分享。 |
| [v5.1.6](https://github.com/jengzang/dialects-vue-frontend/blob/780de82de4f9957aa74f05dba8c0700e60cfd055/project/src/utils/user/updateNoticeConfig.js) | 2026-09-11 | 優化詞表詳情與 Excel 導出，將資料庫擴充至 3126 個方言點、933 萬條記錄，並完善導航、反饋與分享。 |
| [v5.1.5](https://github.com/jengzang/dialects-vue-frontend/blob/ae06bed68a0bbaa2d131607ebe1a54e53c6131c8/project/src/utils/user/updateNoticeConfig.js) | 2026-09-07 | 擴充方言資料庫，新增同音字匯及查詢複製／導出，並完善頁腳導航、功能檢索與分享。 |
| [v5.1.2](https://github.com/jengzang/dialects-vue-frontend/blob/e95f74a667572b299332ea01451c895ecb9499d1/project/src/utils/user/updateNoticeConfig.js) | 2026-08-17 | 新增同音字匯及查詢複製／導出，完善音節統計、熱力圖、等值線圖與操作教程。 |
| [v5.1.0](https://github.com/jengzang/dialects-vue-frontend/blob/9e16b08d31fc494114758bfa1035ff3288d20e68/project/src/utils/user/updateNoticeConfig.js) | 2026-08-13 | 完善音節統計、熱力圖、等值線圖與教程，新增詞表的地圖／卡片／表格展示及線上貢獻。 |
| [v5.0.8](https://github.com/jengzang/dialects-vue-frontend/blob/0644eefaa138e896b37bd6b028ae39e9049dc814/project/src/utils/user/updateNoticeConfig.js) | 2026-08-09 | 完善操作教程與首頁、導航體驗，新增詞表展示、編輯權限申請及線上貢獻。 |
| [v5.0.5](https://github.com/jengzang/dialects-vue-frontend/blob/1c3c97e9a3736642d431f7f0ef643adfe9bff1e1/project/src/utils/user/updateNoticeConfig.js) | 2026-08-08 | 優化首頁燈箱與導航，新增詞表展示及線上貢獻，完善泰森多邊形篩選與自然村資料繪圖。 |
| [v5.0.0](https://github.com/jengzang/dialects-vue-frontend/blob/02f415f4531b56cc3df8881507af3a3d32bf0314/project/src/utils/user/updateNoticeConfig.js) | 2026-07-31 | 新增詞表展示與線上貢獻，完善泰森多邊形繪圖，增加導航橫向滾動與主題切換。 |
| [v4.7.0](https://github.com/jengzang/dialects-vue-frontend/blob/0d1cf195628bd040ba634aae814c74b5ff49a245/project/src/utils/user/updateNoticeConfig.js) | 2026-07-18 | 完善泰森多邊形繪圖與自然村資料導入，增加導航滾動、主題切換及文白讀／多音字展示。 |
| [v4.6.8](https://github.com/jengzang/dialects-vue-frontend/blob/8f537bb763242654d395e613fc747a840badfbb4/project/src/utils/user/updateNoticeConfig.js) | 2026-07-15 | 更新廣東自然村語義分類與機器學習分析，優化導航及主題，增加文白讀／多音字展示。 |
| [v4.6.5](https://github.com/jengzang/dialects-vue-frontend/blob/b36b5dde4d8d093f101c9078156a554f3cd55b6f/project/src/main/config/updateNoticeConfig.js) | 2026-07-13 | 更新自然村機器學習分析，中古模式支援手動輸入，增加文白讀／多音字展示。 |
| [v4.6.0](https://github.com/jengzang/dialects-vue-frontend/blob/866fe68ed6dfb859cc2f147a25b8934ad400a1a7/project/src/main/config/updateNoticeConfig.js) | 2026-07-02 | 中古模式支援手動輸入，增加文白讀／多音字展示，完善查音位匹配及音值統計圖表。 |
| [v4.5.2](https://github.com/jengzang/dialects-vue-frontend/blob/ea04bd91576ceb3a14f0c7176540e37dcc1fb9d2/project/src/main/config/updateNoticeConfig.js) | 2026-06-24 | 更新資料與文白讀展示，完善查音位及音值統計，新增桑基圖音值比較。 |
| [v4.5.0](https://github.com/jengzang/dialects-vue-frontend/blob/786b17ad01f01a0a8070720de1978f61a5c48091/project/src/main/config/updateNoticeConfig.js) | 2026-06-17 | 新增桑基圖音值比較與點線面／泰森多邊形繪圖，優化個人自訂資料管理。 |
| [v4.4.8](https://github.com/jengzang/dialects-vue-frontend/blob/5e48915a230b618a9ec38c57aa50249df7aa3d7a/project/src/main/config/updateNoticeConfig.js) | 2026-06-15 | 新增桑基圖音值比較與地圖繪製、導出，優化個人自訂資料管理。 |
| [v4.4.7](https://github.com/jengzang/dialects-vue-frontend/blob/2eb0a76bf7d8e850603ac89c1d2b29160ef109ab/project/src/main/config/updateNoticeConfig.js) | 2026-06-09 | 新增桑基圖音值比較，升級個人中心與頭像功能，優化自訂地圖資料管理。 |
| [v4.4.6](https://github.com/jengzang/dialects-vue-frontend/blob/a0cd8f80b0d0481a039e48057782f6ebd7e2b492/project/src/main/config/updateNoticeConfig.js) | 2026-06-07 | 新增桑基圖音值比較及個人頭像，優化仍在測試中的自訂地圖資料配置。 |
| [v4.4.5](https://github.com/jengzang/dialects-vue-frontend/blob/d02274f9d8b5db50d332b99107ecdbb7b6e0a33e/project/src/main/config/updateNoticeConfig.js) | 2026-04-16 | 新增多套音韻字集切換與捐贈者致謝名錄，修復問題並提升載入與互動穩定性。 |
| [v4.4.0](https://github.com/jengzang/dialects-vue-frontend/blob/15d92d8d8229ed67322cad90d304290787fe8d6a/project/src/main/config/updateNoticeConfig.js) | 2026-04-03 | 新增單點演變查詢，擴充漢字音韻分類，整理路由、彈窗與共用元件。 |
| [v4.3.0](https://github.com/jengzang/dialects-vue-frontend/blob/81307f6cc97b1e0a27970b535f72d6674de55f79/project/src/main/config/updateNoticeConfig.js) | 2026-04-03 | 提升後端 API 效能、重整導航與漢字分類入口，新增繁中、簡中及英文介面。 |
| [v4.2.0](https://github.com/jengzang/dialects-vue-frontend/blob/45191d1e514cab2e349ac53d0286d2771af3140f/project/src/main/config/updateNoticeConfig.js) | 2026-03-19 | 提升後端 API 效能、重整導航與漢字分類入口，新增繁中、簡中及英文介面。 |
| [v4.1.0](https://github.com/jengzang/dialects-vue-frontend/commit/8acc84c085328541a29cd5b93df2bcaedc3e84c7) | 2026-03-06 | 新增首頁與更新公告，以及漢字、中古條件、調類比較和地圖展示。 |
| [v4.0.5](https://github.com/jengzang/dialects-vue-frontend/commit/e831ad6bea12e1c682e6a6b67684ecdf57049f08) | 2026-03-03 | 合併 master 分支並統一倉庫結構，補充部署文檔及 VillagesML 分析模組。 |
| [v4.0.0](https://github.com/jengzang/dialects-vue-frontend/commit/659fe7c1dc968dc94359cb8e13c725aae0a33294) | 2026-03-01 | 上線 VillagesML 自然村機器學習，提供字頻、語義、空間、區域、聚類與子集分析。 |
| [v3.5.0](https://github.com/jengzang/dialects-vue-frontend/commit/e467686ba887af6491582303e896bfb601fddd9b) | 2026-02-19 | 建立中英文架構、API、設計系統與使用文檔，完善賬戶、個人資料及共用交互。 |
| [v3.4.0](https://github.com/jengzang/dialects-vue-frontend/commit/78ca5f49d5d6e6a780ffd909d867bcebfb29c8df) | 2026-02-15 | 結果頁可直接查看對應聲韻調統計，新增 Explore 布局與排行榜，完善提示及詳情彈窗。 |
| [v3.3.0](https://github.com/jengzang/dialects-vue-frontend/commit/6a7fbe01045f649546f451a23855e9ec0f89a043) | 2026-02-11 | 新增 Praat 網頁聲學分析、母音空間、T 值五度曲線與 Excel 導出，整理統一 API 層。 |
| [v3.2.0](https://github.com/jengzang/dialects-vue-frontend/commit/a35aa4f71cbd17321bf4852a592e7fdadf77260f) | 2026-02-06 | 新增語保地圖、音系查詢及音節統計，完善地點詳情與個人資料管理。 |
| [v3.1.0](https://github.com/jengzang/dialects-vue-frontend/commit/eb3579697c1a5736ed971c5c27618f71eede016f) | 2026-02-01 | 新增語保詞彙／語法例句查詢，完善自然村樹表、村落地圖及漢字分類。 |
| [v3.0.0](https://github.com/jengzang/dialects-vue-frontend/commit/70471b776aaeb1b98415205800db518459749c2b) | 2026-01-27 | 完成字表檢查、粵拼轉 IPA 與字表合併，完善工具導航及陽春資料頁。 |
| [v2.1.0](https://github.com/jengzang/dialects-vue-frontend/commit/ec794d334f33a02d4916da629ed4f86f5af6b59d) | 2026-01-22 | 完成支援搜尋、排序、篩選與權限編輯的通用表格，完善自訂地圖與陽春自然村資料。 |
| [v2.0.0](https://github.com/jengzang/dialects-vue-frontend/commit/92f52366769b7667fc6e8cc1afeb510ae6b1d2f0) | 2026-01-16 | 主查詢、結果與地圖全面遷移至 Vue，重整布局、路由及共享狀態。 |
| [v1.1.0](https://github.com/jengzang/dialects-vue-frontend/commit/c61fab703160fb577b74875df73a7e010103d358) | 2026-01-11 | 建立查詢、結果、地圖與說明頁基礎界面，完善地點、分區及查詢條件輸入。 |
| [v1.0.0](https://github.com/jengzang/dialects-vue-frontend/commit/6e431e76ad4e87fed390a95455bf414be129f01a) | 2025-09-01 | 建立原生 JavaScript 查詢、結果與地圖，以及登入、建議、支持和鳴謝頁面。 |

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


## 許可證與支持

程式碼採用 [MIT License](./LICENSE)。

問題反饋：[GitHub Issues](https://github.com/jengzang/dialects-vue-frontend/issues)

聯繫方式：jengzang@outlook.com · [知乎](https://www.zhihu.com/people/da-shu-18-11)

## SEO 邏輯與策略分析

目前的 SEO 以「品牌首頁 + 專業功能頁 + 三種語言入口」為核心：首頁承接「方音圖鑑／Dialects Atlas」等品牌搜尋，查字、查中古、方言比較、音系分析、Praat 與村名資料等功能頁承接具體使用需求。功能使用獨立 path，查詢條件與工作區狀態放在 query；搜尋引擎主要接觸穩定的功能入口，而不是每一組查詢結果。

以下依據倉庫當前實作分析，並非線上收錄、排名或流量審計；服務器 HTTP 狀態、實際爬取結果與搜尋曝光仍需另外驗證。

### 實作位置與責任

| 檔案 | SEO 責任 |
| --- | --- |
| [`project/src/seo/config.js`](./project/src/seo/config.js) | 站點名稱、逐頁三語 title／description、sitemap 白名單與 noindex 清單 |
| [`project/src/seo/index.js`](./project/src/seo/index.js) | 初次載入、路由切換及語言切換時更新 metadata、canonical、hreflang、社交分享標籤與 JSON-LD |
| [`project/src/i18n/localeRouting.js`](./project/src/i18n/localeRouting.js) | 統一語言前綴、語言路徑生成與移除前綴的規則 |
| [`project/index.html`](./project/index.html) 等 5 個 HTML 入口 | 提供初始 title／description；以內嵌 JavaScript 補上入口級語言資訊與連結，等待 Vue 更新到具體功能頁 |
| [`project/scripts/generate-sitemap.mjs`](./project/scripts/generate-sitemap.mjs) | 將白名單路徑展開為三種語言的 sitemap URL |
| [`project/public/robots.txt`](./project/public/robots.txt) | 通用爬蟲路徑限制、AI 爬蟲許可與 sitemap 地址 |

### 頁面 metadata 的更新流程

主站與 VillagesML 都呼叫 `initSeo`。載入時先更新當前路徑，之後透過 `router.afterEach` 跟隨頁面切換；語言改變時也會重新套用當前頁面的 SEO 資料。

1. 移除語言前綴與結尾斜線，取得功能路徑，例如 `/en/menu/query/char` 對應 `/menu/query/char`。
2. 從 `SEO_CONFIG.routes` 選取該頁的 title／description，再取目前語言版本；未配置的路徑使用全站預設文案。
3. 更新 `document.title`、description 與 robots。一般功能標題採「主標題 - 補充說明｜方音圖鑑」，英文使用 ` | Dialects Atlas`；首頁保留完整的自訂標題。
4. 同步 canonical、三語 hreflang、Open Graph、Twitter Card 與 JSON-LD，避免站內切換後仍沿用上一頁的標籤。

標題與描述以功能語義為主，有助於覆蓋「方言查字」「中古音」「聲韻調比較」「Praat 聲學分析」等不同搜尋意圖。描述也會交代登入限制或開發狀態；這些文案需要隨功能演進維護，不能只更新路由而保留過時介紹。

### canonical 與多語 URL

主站的繁中、簡中、英文版本分別使用 `/zh-Hant`、`/zh-CN`、`/en`。每種語言都指向自己的 canonical，並透過 hreflang 互相標示等價頁面；`x-default` 指向繁中版本。這保留各語言的獨立收錄機會，也讓搜尋引擎辨識語言關係。

canonical 固定使用 `https://dialects.yzup.top`，保留語言與功能 path，移除尾斜線。SEO 呼叫傳入 `to.path`，因此 query 與 hash 不進入 canonical。例如 `/zh-Hant/menu/query/char?字=山` 的 canonical 是 `https://dialects.yzup.top/zh-Hant/menu/query/char`。

這種策略可歸併大量篩選、查詢與分頁 URL，適合互動工具。不過，它也表示目前沒有為每個漢字、方言點或查詢結果建立獨立的可索引內容頁；若未來希望承接這類資料搜尋，需要另行設計具有固定 URL、獨立描述與可讀正文的公開資料頁。

### sitemap 與索引邊界

`SITEMAP_PATHS` 目前有 **44 個功能路徑**，生成腳本乘以 3 種語言，產生 **132 個 URL**。這是腳本生成規則的數量；已部署的 sitemap 是否同步，需以線上檔案為準。XML 使用與 runtime canonical 相同的無尾斜線路徑；語言關係目前放在 HTML hreflang，XML 未另外輸出 hreflang。

| 路徑分類 | priority | changefreq |
| --- | --- | --- |
| 首頁 | 1.0 | daily |
| `/menu/query/*` | 0.9 | daily |
| `/menu/compare/*`、`/menu/pho/*`、`/menu/cluster`、Praat | 0.8 | weekly |
| `/menu/map/*` | 0.7 | weekly |
| 其餘 `/explore/tools/*` | 0.6 | monthly |
| 其餘 `/explore/*`（包括 GIS） | 0.5 | monthly |
| `/menu/tools`、`/menu/villages` | 0.2 | yearly |
| 其餘白名單頁面 | 0.4 | monthly |

這些值表達站內功能的相對重要性與預期更新頻率，不代表搜尋排名，也不保證爬蟲依此安排抓取。目前所有 `lastmod` 都寫成生成當天的 UTC 日期，表示檔案重新生成時間，並非各頁內容實際更新時間。

索引控制採「sitemap 白名單 + noindex 排除清單」兩套規則。以下路徑輸出 `noindex,nofollow`，且不列入 sitemap：`/intro`、`/auth/data`、`/auth/regions`、`/menu/result`、`/explore/manage`、`/explore/villages/all`、`/explore/features`、`/explore/history`。其他路徑預設為 `index,follow`，因此**未列入 sitemap 不等於禁止索引**。

這能排除個人資料、結果容器與部分低價值入口，將搜尋入口集中到功能頁。但公開介紹與實際使用權限仍需分開判斷：例如 `/menu/map/custom` 需要登入，卻列入 sitemap；`/auth` 沒有列入 sitemap，也沒有 noindex。應依頁面是否提供足夠的公開介紹決定是否索引，而不是只按是否需要登入一概處理。

### 爬蟲、分享預覽與結構化資料

`robots.txt` 的通用規則允許抓取網站，並禁止 `/api/`、`/logs/`、`/sql/`、`/upload/`、`/download/`、`/files/`，同時提供 sitemap 地址。它還為 GPTBot、ChatGPT-User、Claude-Web、anthropic-ai、Google-Extended 與 CCBot 分別配置 `Allow: /`，表達允許 AI 相關抓取的策略。這些指定群組通常不繼承通用群組的 Disallow，因此兩者的路徑限制並不相同。

robots 管理爬取許可，noindex 管理索引意圖；兩者都不能代替登入與服務器權限控制。AI 爬蟲許可也不代表內容必然被引用、納入訓練或帶來搜尋曝光。

社交分享使用 Open Graph 與 Twitter `summary` Card，title／description 跟隨路由語言，圖片統一為 `/brand/title.webp`。這有助於保持品牌一致，但目前標籤由 JavaScript 寫入；不執行 JavaScript 的分享抓取器可能無法取得具體功能頁的預覽資訊。

JSON-LD 依路徑分配類型：首頁為 `WebSite`，資料來源為 `CollectionPage`，查詢／比較／音系頁為 `SoftwareApplication`，`/explore/villages/*` 為 `Dataset`，其餘為 `WebPage`。現有資料主要包含站點名稱、語言、URL 與描述；類型分類只是基礎語義，不能保證豐富搜尋結果。資料集入口也不一定等於具體 Dataset，仍需依實際內容補充或調整語義。

### 策略優勢與目前缺口

目前的優勢是功能頁路徑穩定、三語 metadata 集中管理、canonical 與 sitemap 共用語言路徑工具，且已有標題、配置一致性與 H1 語義測試。首頁原始 HTML 提供 H1、功能介紹、實際 `<a href>` 連結與 noscript 文案，在 Vue 啟動前已有可讀內容；這些內容會在掛載後被應用替換。

後續改善可按以下順序處理；本節記錄分析，尚未修改這些實作：

| 優先方向 | 倉庫中可確認的現況 | 建議 |
| --- | --- | --- |
| 深層功能頁的初始內容 | 5 個 HTML 入口是入口殼層；除首頁外主要是載入提示，沒有逐路由預渲染正文，精確 metadata 也依賴 runtime | 優先為重要公開功能頁提供可直接取得的介紹、H1 與 metadata，再評估預渲染或 SSR；多 HTML 入口本身不等於逐頁靜態化 |
| VillagesML 的 URL 一致性 | `/villagesML/gd` 未配置獨立 SEO 文案，也未列入 sitemap；共用算法會生成 `/zh-Hant/villagesML/gd` 等 canonical／hreflang，但獨立工作區路由使用無語言前綴的 `/villagesML/*` | 明確決定獨立應用的語言 URL 與索引策略，令 metadata、canonical、hreflang、路由保持一致，並驗證實際 HTTP 回應 |
| 部署產物一致性 | Bash 白名單包含 `robots.txt`、`sitemap.xml`、`brand/`；PowerShell 白名單未包含這三項 | 同步部署清單，避免換用部署腳本後 SEO 檔案或分享圖片沒有更新；是否已有舊檔需查服務器 |
| 公開頁與開發中頁面的選擇 | sitemap 包含推導工具 `/explore/tools/derive` 與仍受開發限制的 `/explore/villages/toponyms`，也包含需登入的自訂地圖 | 按可讀公開內容逐頁決定索引，排除只有佔位內容的入口，為有價值的工具提供公開介紹 |
| `lastmod` 的可信度 | 每次生成將全部 URL 更新為同一天 | 改用各頁內容或資料的實際修改日期；若無可靠日期，可不提供 `lastmod` |
| 結構化資料一致性 | 首頁已有未標記的靜態 `WebSite` JSON-LD，runtime 另建一個帶標記的 script；各頁 schema 欄位較少 | 統一靜態與動態資料來源，核對重複實體及 Dataset／SoftwareApplication 語義，再補充與可見內容一致的資訊 |
| 爬蟲政策一致性 | 指定 AI 群組只有 `Allow: /`，沒有通用群組的目錄限制 | 確認這是否符合預期；若希望相同限制，需在相應群組明確配置 |

還需在線上核對語言入口與舊路徑的 HTTP 跳轉、深層路徑重新整理是否返回正確 HTML，以及不存在的路徑是否返回合適狀態。Vue Router 的前端跳轉不能直接視為 HTTP 301／308。可配合搜尋站長工具檢查 sitemap 處理、canonical 選擇、渲染後內容與各語言曝光，驗證策略是否真正生效。

### 維護與驗證

新增公開功能頁時，應同步核對實際路由、三語 title／description、頁面 H1、內部連結，再決定加入 `SITEMAP_PATHS` 或 `NOINDEX_PATHS`。功能重命名、合併或下線時，也需檢查舊入口跳轉與上述配置，避免 metadata、教程分類與當前功能不一致。

在 `project/` 目錄可執行現有 SEO 測試：

```bash
npm test -- tests/seoConfigConsistency.test.js tests/seoTitles.test.js tests/seoHeadingSemantics.test.js
```

這些測試檢查白名單與 noindex／redirect 的一致性、標題格式與語言、分享標題及頁面標題語義，不能替代線上爬取驗證。`npm run seo:sitemap` 會寫入 `public/sitemap.xml`，`npm run build` 會先生成 sitemap 再打包；執行前應確認工作區中的 sitemap 修改是否需要保留，部署後再核對線上產物。
