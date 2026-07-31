# 用戶指南

> 方音圖鑑平台當前功能入口與常用操作說明

**文檔語言：** [English](./USER_GUIDE.en.md) | 中文

---

## 快速開始

### 訪問入口

當前平台建議按下面的路徑理解：

- `/`：首頁
- `/menu/*`：主站核心功能
- `/explore/*`：Explore 工具與專題入口
- `/explore/villages/ml`：VillagesML 的 Explore 入口殼頁
- `/villagesML?...`：VillagesML 工作區 canonical path

如果您還保留舊書籤，例如 `/menu?tab=...` 或 `/explore?page=...`，系統目前仍會兼容並自動跳轉到新 path 路由。

### 支持的瀏覽器

- Chrome >= 90
- Firefox >= 88
- Safari >= 14
- Edge >= 90

### 導航概覽

**主站 Menu（`/menu/*`）**
- 查詢：`/menu/query/*`
- 音系工具：`/menu/pho/*`
- 結果：`/menu/result`
- 地圖：`/menu/map/*`
- 工具門戶：`/menu/tools`
- 詞彙 / 語法門戶：`/menu/words`
- 村落數據門戶：`/menu/villages`
- 說明與語言設置：`/menu/about/*`

**Explore（`/explore/*`）**
- 工具頁：`/explore/tools/*`
- 字符分類：`/explore/char-class`
- 粵寶：`/explore/yubao`
- 陽春口語：`/explore/yc-spoken`
- 村落相關專題：`/explore/villages/*`

**賬戶（`/auth*`）**
- 登錄：`/auth?view=login`
- 註冊：`/auth?view=register`
- 個人頁：`/auth?view=profile`
- 個人數據：`/auth/data`
- 自定義分區：`/auth/regions`

---

## 主站查詢

### 四種查詢模式

| 功能 | canonical path | 說明 |
| --- | --- | --- |
| 查字 | `/menu/query/char` | 按漢字查詢不同地點的讀音與音系信息 |
| 查中古 | `/menu/query/zhonggu` | 按中古音條件查詢現代反映 |
| 查音位 | `/menu/query/yinwei` | 按音位條件反查對應字符 |
| 查調 | `/menu/query/tone` | 查詢地點或區域的聲調系統 |

### 基本流程

1. 進入對應查詢頁。
2. 填寫查詢條件與地點 / 地區。
3. 點擊運行查詢。
4. 到 [結果頁](#結果與地圖) 查看明細。
5. 如需空間展示，再切換到地圖頁。

### 常見建議

- 查多個地點時，先從少量地點開始，確認條件正確後再擴大範圍。
- 如果您習慣舊入口 `/menu?tab=query`，系統仍會幫您跳轉，但新文檔與新書籤建議直接使用 `/menu/query/*`。
- 結果頁與地圖頁依賴最近一次查詢狀態；若結果為空，請先回查詢頁確認條件是否有效。

---

## 音系工具

### 入口路徑

| 功能 | canonical path | 說明 |
| --- | --- | --- |
| 音系矩陣 | `/menu/pho/matrix` | 查看單個地點的音系矩陣 |
| 自定義分類 | `/menu/pho/custom` | 依自定維度生成音系分類表 |
| 音節統計 | `/menu/pho/count` | 對多個地點做音節 / 音類統計 |
| 音變 / 演化 | `/menu/pho/evolution` | 查看音變相關分析頁 |

### 使用方式

1. 從主站導航切到「音系」分組。
2. 在頁內 `TabsContainer` 中切換矩陣、自定義、統計、演化等子頁。
3. 如需保留當前條件，可直接收藏當前 path 路由與 query。

---

## 結果與地圖

### 結果頁

**路徑：** `/menu/result`

結果頁用於查看最近一次查詢返回的表格化結果。
如果沒有先執行查詢，結果頁通常不會有完整內容。

### 地圖頁

| 功能 | canonical path | 說明 |
| --- | --- | --- |
| 查詢地圖 | `/menu/map/view` | 把查詢結果渲染到地圖上 |
| 分區 | `/menu/map/divide` | 管理或查看分區相關操作 |
| 自定義地圖 | `/menu/map/custom` | 顯示和處理個人標註數據 |

### 地圖交互

- 支持縮放、拖動、底圖切換。
- 查詢結果會在地圖上按模式顯示點位、聚類或特徵顏色。
- 在部分模式下，頁面會把當前 `feature`、`locations`、`regions` 等信息保存在 URL query 中，方便分享或刷新後恢復狀態。

---

## Explore 工具

### 工具類頁面

您可以從 `/menu/tools` 門戶進入，也可以直接打開以下路徑：

| 功能 | 路徑 |
| --- | --- |
| 字表檢查 | `/explore/tools/check` |
| 粵拼轉 IPA | `/explore/tools/jyut2ipa` |
| 表格合併 | `/explore/tools/merge` |
| Praat 音頻分析 | `/explore/tools/praat` |
| 表格管理 | `/explore/manage` |

### 工具使用提示

- `check`、`merge`、`jyut2ipa` 這些需要處理文件或個人數據的工具，部分操作會要求先登錄。
- 若未登錄，系統會跳轉到 `/auth`，並把當前頁路徑帶入 `redirect` 參數，登錄後可回到原頁。
- Praat 工具位於 `/explore/tools/praat`，不再建議使用舊的 `/explore?tab=praat` 形式。

---

## 詞彙、分類與村落專題

### 詞彙與語法

| 功能 | 路徑 |
| --- | --- |
| 粵寶詞彙 | `/explore/yubao?tab=vocabulary` |
| 粵寶語法 | `/explore/yubao?tab=grammar` |
| 陽春口語 | `/explore/yc-spoken` |

### 字符分類

**主路徑：** `/explore/char-class`

當前頁面仍使用 query 來表示頁內子狀態，例如：

- `/explore/char-class?tab=zhonggu`
- `/explore/char-class?tab=shanggu`
- `/explore/char-class?tab=jingu`
- `/explore/char-class?tab=yueyun`

這種 query 是該頁面的內部狀態，而不是整個專題的頂級頁面身份。

### 村落專題

| 功能 | 路徑 |
| --- | --- |
| 廣東村落樹 / 地圖 | `/explore/villages/gd` |
| 廣東村落表格 | `/explore/villages/table` |
| 陽春村落 | `/explore/villages/yc` |
| VillagesML 入口頁 | `/explore/villages/ml` |

其中：

- `/explore/villages/ml` 是 VillagesML 的主站入口殼頁
- 真正的 VillagesML 工作區位於 `/villagesML?...`

---

## VillagesML 工作區

### 進入方式

1. 先從 `/explore/villages/ml` 進入 Dashboard。
2. 再從卡片或搜索跳轉進入 `/villagesML?module=...&subtab=...` 工作區頁面。

### 常見直達路徑

| 功能 | 路徑 |
| --- | --- |
| 搜索 | `/villagesML?module=search` |
| 字符頻率傾向 | `/villagesML?module=character&subtab=frequency` |
| 語義子類別 | `/villagesML?module=semantic&subtab=subcategories` |
| 空間熱點 | `/villagesML?module=spatial&subtab=hotspots` |
| 區域相似度 | `/villagesML?module=regional&subtab=similarity` |
| ML 基礎聚類 | `/villagesML?module=compute&subtab=clustering` |

更完整的模塊說明請查看 [VillagesML 使用指南](./VillagesML/USER_GUIDE.md) 與 [VillagesML 功能總覽](./VillagesML/FEATURE_OVERVIEW.md)。

---

## 賬戶與權限

### 登錄 / 註冊

- 登錄：`/auth?view=login`
- 註冊：`/auth?view=register`
- 個人資料總覽：`/auth?view=profile`

### 個人資料與自定義數據

- 個人數據：`/auth/data`
- 自定義分區：`/auth/regions`

這兩個頁面在路由守衛中會檢查登錄狀態；若未登錄，會先跳轉回 `/auth`。

### 語言設置

**路徑：** `/menu/settings`

這裡主要是站點語言與界面偏好設置，不等同於個人資料頁。

---

## 常見問題

### 為什麼我看到的還是舊 query 形式鏈接？

因為項目仍保留了 legacy 兼容入口。
新文檔一律以 path 路由為主，但舊書籤通常仍能正常跳轉。

### 為什麼某些工具會先跳到登錄頁？

因為部分頁面或操作使用了統一的 `useAuthGuard`。
未登錄時，系統會帶著 `redirect` 參數跳轉到 `/auth`，方便您登錄後回到原頁。

### VillagesML 應該從哪個入口進？

如果您想先看總覽與入口卡片，從 `/explore/villages/ml` 進。
如果您已經知道要打開哪個模塊，直接訪問 `/villagesML?module=...&subtab=...`。

### `/menu/settings` 和 `/auth?view=profile` 有什麼區別？

- `/menu/settings`：站點語言與界面設置
- `/auth?view=profile`：個人賬戶與資料總覽

---

**延伸閱讀：**

- [架構文檔](./ARCHITECTURE.md)
- [API 文檔](./API.md)
- [VillagesML 使用指南](./VillagesML/USER_GUIDE.md)
- [VillagesML 功能總覽](./VillagesML/FEATURE_OVERVIEW.md)
